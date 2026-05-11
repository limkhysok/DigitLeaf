from typing import List, Optional, Tuple
from sqlmodel import Session, select, func
from .models import TobaccoPurchase, TobaccoPurchaseDetail, Purchaser, Region, Oven
from app.domains.weigh_leaf.models.tobacco import Tobacco
from .schemas import PurchaseCreate, PurchaseUpdate
from datetime import datetime
from app.core.config import CAMBODIA_TZ

def generate_invoice_num(db: Session) -> str:
    today_str = datetime.now(CAMBODIA_TZ).strftime("%Y%m%d")
    prefix = f"INV-{today_str}-"
    
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

def create_purchase(
    db: Session, 
    obj_in: PurchaseCreate, 
    user_name: str, 
    ip_address: str
) -> TobaccoPurchase:
    # 1. Generate Invoice Number
    invoice_num = generate_invoice_num(db)

    # 2. Create the Header
    db_obj = TobaccoPurchase(
        **obj_in.model_dump(exclude={"details", "invoice_num"}),
        invoice_num=invoice_num,
        user=user_name,
        ip_address=ip_address,
        do_date=datetime.now(CAMBODIA_TZ)
    )
    db.add(db_obj)
    db.flush() 

    # 3. Create the Details
    for detail_in in obj_in.details:
        db_detail = TobaccoPurchaseDetail(
            **detail_in.model_dump(exclude={"invoice_num", "m_id"}),
            invoice_num=invoice_num,
            m_id=db_obj.tp_id, # Linking to tobacco_purchase.tp_id
            user=user_name,
            ip_address=ip_address,
            do_date=datetime.now(CAMBODIA_TZ)
        )
        db.add(db_detail)
    
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
    statement = statement.order_by(TobaccoPurchase.tp_date.desc()).offset(skip).limit(limit)
    items = db.exec(statement).all()
    
    return items, total

def update_purchase(
    db: Session, 
    db_obj: TobaccoPurchase, 
    obj_in: PurchaseUpdate, 
    user_name: str,
    ip_address: str
) -> TobaccoPurchase:
    update_data = obj_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    
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

def get_purchasers(db: Session) -> List[Purchaser]:
    return db.exec(select(Purchaser).where(Purchaser.do_not_show == 0)).all()

def get_regions(db: Session) -> List[Region]:
    # Only show regions where do_not_show is 0
    return db.exec(select(Region).where(Region.do_not_show == 0)).all()

def get_ovens(db: Session) -> List[Oven]:
    return db.exec(select(Oven).where(Oven.do_not_show == 0)).all()

def get_tobacco_types(db: Session) -> List[Tobacco]:
    return db.exec(select(Tobacco).where(Tobacco.discontinue == 0)).all()
