from typing import List, Optional, Tuple
from sqlmodel import Session, select, func
from .models import TobaccoPurchase, TobaccoPurchaseDetail, Purchaser, Region, Oven
from app.domains.weigh_leaf.models.tobacco import Tobacco
from app.domains.sack_registration.models.sack_registration import SackRegistration
from app.domains.sack_registration.models.represent import Represent
from app.domains.sack_registration.models.member_farmer import MemberFarmer
from app.domains.sack_registration.models.mf_con_year import MfConYear
from .schemas import PurchaseCreate, PurchaseUpdate, VendorItem, PurchaseDetailCreate
from datetime import datetime
from app.core.config import CAMBODIA_TZ

def generate_invoice_num(db: Session) -> str:
    today_str = datetime.now(CAMBODIA_TZ).strftime("%Y%m%d")
    prefix = f"{today_str}-"
    
    statement = select(TobaccoPurchase.invoice_num).where(
        TobaccoPurchase.invoice_num.like(f"{prefix}%")
    ).order_by(TobaccoPurchase.invoice_num.desc()).limit(1)
    
    last_invoice = db.exec(statement).first()
    
    if last_invoice:
        try:
            last_seq = int(last_invoice.split("-")[-1])
            new_seq = last_seq + 1
        except (ValueError, IndexError):
            new_seq = 0
    else:
        new_seq = 0
        
    return f"{prefix}{new_seq:05d}"

def _sync_purchase_details(
    db: Session,
    db_obj: TobaccoPurchase,
    details: List[PurchaseDetailCreate],
    user_name: str,
    ip_address: str,
    delete_existing: bool = False
) -> None:
    """Helper to sync details, update header summaries, and handle sack registration."""
    if delete_existing:
        statement = select(TobaccoPurchaseDetail).where(TobaccoPurchaseDetail.invoice_num == db_obj.invoice_num)
        for d in db.exec(statement).all():
            db.delete(d)
        db.flush() # Force deletion to be executed in DB before re-inserting
            
    tobacco_item_count = len(details)
    total_net_weight = 0.0
    grand_total = 0.0
    max_sack_kg = 0.0
    
    for detail_in in details:
        # Calculate net weight: Gross - Remork - Sack
        net = max(0.0, (detail_in.gross_weight or 0) - (detail_in.remork_in_kg or 0) - (detail_in.sack_in_kg or 0))
        total_amount = round(net * (detail_in.price or 0), 2)
        
        total_net_weight += net
        grand_total += total_amount
        max_sack_kg = max(max_sack_kg, detail_in.sack_in_kg or 0)
        
        db_detail = TobaccoPurchaseDetail(
            **detail_in.model_dump(exclude={"invoice_num", "m_id", "sack_in_kg"}),
            invoice_num=db_obj.invoice_num,
            m_id=db_obj.tp_id,
            qty=round(net, 3),
            user=user_name,
            ip_address=ip_address,
            do_date=datetime.now(CAMBODIA_TZ),
            total_amount=total_amount,
        )
        db.add(db_detail)
        
    # Update summary fields on header
    db_obj.tobacco_item_count = tobacco_item_count
    db_obj.total_net_weight = round(total_net_weight, 3)
    db_obj.grand_total = round(grand_total, 2)

    # Handle vendor sack registration (approve and record sack weight)
    if db_obj.vendor and max_sack_kg > 0:
        sack_reg = db.exec(
            select(SackRegistration)
            .where(SackRegistration.member_farmer_name == db_obj.vendor)
            .where(SackRegistration.status == 0)
            .order_by(SackRegistration.registered_at.desc())
        ).first()
        if sack_reg:
            sack_reg.sack_in_kg = int(max_sack_kg)
            sack_reg.status = 1
            sack_reg.updated_at = datetime.now(CAMBODIA_TZ)
            db.add(sack_reg)

def create_purchase(
    db: Session, 
    obj_in: PurchaseCreate, 
    user_name: str, 
    ip_address: str
) -> TobaccoPurchase:
    invoice_num = generate_invoice_num(db)
    db_obj = TobaccoPurchase(
        **obj_in.model_dump(exclude={"details", "invoice_num"}),
        invoice_num=invoice_num,
        user=user_name,
        ip_address=ip_address,
        do_date=datetime.now(CAMBODIA_TZ),
    )
    db.add(db_obj)
    db.flush() # Ensure tp_id is available
    
    _sync_purchase_details(db, db_obj, obj_in.details, user_name, ip_address)
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_purchase(db: Session, tp_id: int) -> Optional[TobaccoPurchase]:
    return db.get(TobaccoPurchase, tp_id)

def get_purchase_details(db: Session, invoice_num: str) -> List[TobaccoPurchaseDetail]:
    statement = select(TobaccoPurchaseDetail).where(TobaccoPurchaseDetail.invoice_num == invoice_num)
    return db.exec(statement).all()

def get_purchases(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None
) -> Tuple[List[TobaccoPurchase], int]:
    statement = select(TobaccoPurchase)
    if search:
        statement = statement.where(TobaccoPurchase.invoice_num.contains(search) | TobaccoPurchase.vendor.contains(search))
    
    # Count total
    count_statement = select(func.count()).select_from(statement.subquery())
    total = db.exec(count_statement).one()

    # Get items
    statement = statement.order_by(TobaccoPurchase.tp_id.desc()).offset(skip).limit(limit)
    items = db.exec(statement).all()
    
    return items, total

def update_purchase(
    db: Session, 
    db_obj: TobaccoPurchase, 
    obj_in: PurchaseUpdate, 
    user_name: str,
    ip_address: str
) -> TobaccoPurchase:
    update_data = obj_in.model_dump(exclude_unset=True, exclude={"details"})
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    
    # If details are provided, sync them
    if obj_in.details is not None:
        _sync_purchase_details(
            db, 
            db_obj, 
            obj_in.details, 
            user_name, 
            ip_address, 
            delete_existing=True
        )

    db_obj.edit_user = user_name
    db_obj.edit_ip_address = ip_address
    db_obj.edit_do_date = datetime.now(CAMBODIA_TZ)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_purchase(db: Session, tp_id: int) -> bool:
    db_obj = db.get(TobaccoPurchase, tp_id)
    if not db_obj:
        return False
    
    # Delete details first
    details_statement = select(TobaccoPurchaseDetail).where(TobaccoPurchaseDetail.invoice_num == db_obj.invoice_num)
    details = db.exec(details_statement).all()
    for d in details:
        db.delete(d)
        
    db.delete(db_obj)
    db.commit()
    return True

def get_vendors_by_buyer(db: Session, buyer_id: int) -> List[VendorItem]:
    current_year = datetime.now(CAMBODIA_TZ).year
    statement = (
        select(MemberFarmer)
        .join(Represent, MemberFarmer.represent == Represent.represent_id)
        .join(MfConYear, MfConYear.mf_id == MemberFarmer.mf_id)
        .where(Represent.p_id == buyer_id)
        .where(Represent.do_not_show == 0)
        .where(MemberFarmer.active == "YES")
        .where(MfConYear.year == current_year)
    )
    rows = db.exec(statement).all()
    return [VendorItem(mf_id=r.mf_id, name=r.name, mf_code=r.mf_code, address=r.address) for r in rows]

def get_purchasers(db: Session) -> List[Purchaser]:
    statement = (
        select(Purchaser)
        .join(Represent, Purchaser.p_id == Represent.p_id)
        .where(Represent.do_not_show == 0)
    )
    return db.exec(statement).all()

def get_regions(db: Session) -> List[Region]:
    # Only show regions where do_not_show is 0
    return db.exec(select(Region).where(Region.do_not_show == 0)).all()

def get_ovens(db: Session) -> List[Oven]:
    return db.exec(select(Oven).where(Oven.do_not_show == 0)).all()

def get_tobacco_types(db: Session) -> List[Tobacco]:
    return db.exec(select(Tobacco).where((Tobacco.t_cate == 2) & (Tobacco.discontinue == 0))).all()
