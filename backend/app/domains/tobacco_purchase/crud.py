from typing import List, Optional, Tuple
from sqlalchemy import delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select, func
from .models import TobaccoPurchase, TobaccoPurchaseDetail, Purchaser, Region, Oven, Tobacco
from app.domains.sack_registration.models.sack_registration import SackRegistration
from app.domains.sack_registration.models.represent import Represent
from app.domains.sack_registration.models.member_farmer import MemberFarmer
from app.domains.sack_registration.models.mf_con_year import MfConYear
from .schemas import PurchaseCreate, PurchaseUpdate, VendorItem, PurchaseDetailCreate
from datetime import datetime

from app.core.config import CAMBODIA_TZ


async def generate_invoice_num(db: AsyncSession) -> str:
    today_str = datetime.now(CAMBODIA_TZ).strftime("%Y%m%d")
    prefix = f"{today_str}-"

    statement = (
        select(TobaccoPurchase.invoice_num)
        .where(TobaccoPurchase.invoice_num.like(f"{prefix}%"))
        .order_by(TobaccoPurchase.invoice_num.desc())
        .limit(1)
    )
    last_invoice = await db.scalar(statement)

    if last_invoice:
        try:
            last_seq = int(last_invoice.split("-")[-1])
            new_seq = last_seq + 1
        except (ValueError, IndexError):
            new_seq = 0
    else:
        new_seq = 0

    return f"{prefix}{new_seq:05d}"


async def _sync_purchase_details(
    db: AsyncSession,
    db_obj: TobaccoPurchase,
    details: List[PurchaseDetailCreate],
    user_name: str,
    ip_address: str,
    delete_existing: bool = False,
) -> None:
    if delete_existing:
        await db.execute(
            sa_delete(TobaccoPurchaseDetail).where(TobaccoPurchaseDetail.m_id == db_obj.tp_id)
        )
        await db.flush()

    total_net_weight = 0.0
    grand_total = 0.0
    max_sack_kg_val = 0.0

    for detail_in in details:
        net = max(0.0, (detail_in.gross_weight or 0) - (detail_in.remork_in_kg or 0) - (detail_in.sack_in_kg or 0))
        total_amount = round(net * (detail_in.price or 0), 2)

        total_net_weight += net
        grand_total += total_amount
        max_sack_kg_val = max(max_sack_kg_val, detail_in.sack_in_kg or 0)

        db.add(TobaccoPurchaseDetail(
            **detail_in.model_dump(exclude={"invoice_num", "m_id"}, exclude_none=True),
            invoice_num=db_obj.invoice_num,
            m_id=db_obj.tp_id,
            qty=round(net, 3),
            user=user_name,
            ip_address=ip_address,
            do_date=datetime.now(CAMBODIA_TZ),
            total_amount=total_amount,
        ))

    db_obj.total_net_weight = round(total_net_weight, 3)
    db_obj.grand_total = round(grand_total, 2)

    if db_obj.vendor and max_sack_kg_val > 0:
        result = await db.execute(
            select(SackRegistration)
            .where(SackRegistration.member_farmer_name == db_obj.vendor)
            .where(SackRegistration.status == 0)
            .order_by(SackRegistration.registered_at.desc())
        )
        sack_reg = result.scalars().first()
        if sack_reg:
            sack_reg.status = 1
            sack_reg.updated_at = datetime.now(CAMBODIA_TZ)
            db.add(sack_reg)


async def create_purchase(
    db: AsyncSession,
    obj_in: PurchaseCreate,
    user_name: str,
    ip_address: str,
) -> TobaccoPurchase:
    invoice_num = await generate_invoice_num(db)
    db_obj = TobaccoPurchase(
        **obj_in.model_dump(exclude={"details", "invoice_num"}, exclude_none=True),
        invoice_num=invoice_num,
        user=user_name,
        ip_address=ip_address,
        do_date=datetime.now(CAMBODIA_TZ),
    )
    db.add(db_obj)
    await db.flush()

    await _sync_purchase_details(db, db_obj, obj_in.details, user_name, ip_address)

    await db.commit()
    return await get_purchase(db, db_obj.tp_id)


async def get_purchase(db: AsyncSession, tp_id: int) -> Optional[TobaccoPurchase]:
    result = await db.execute(
        select(TobaccoPurchase)
        .options(selectinload(TobaccoPurchase.details))
        .where(TobaccoPurchase.tp_id == tp_id)
    )
    return result.scalars().first()


async def get_purchase_details(db: AsyncSession, invoice_num: str) -> List[TobaccoPurchaseDetail]:
    result = await db.execute(
        select(TobaccoPurchaseDetail).where(TobaccoPurchaseDetail.invoice_num == invoice_num)
    )
    return list(result.scalars().all())


async def get_purchases(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
) -> Tuple[List[TobaccoPurchase], int]:
    base = select(TobaccoPurchase)
    if search:
        base = base.where(
            TobaccoPurchase.invoice_num.contains(search) | TobaccoPurchase.vendor.contains(search)
        )

    count_statement = select(func.count()).select_from(base.subquery())
    total = await db.scalar(count_statement)

    fetch_statement = (
        base.options(selectinload(TobaccoPurchase.details))
        .order_by(TobaccoPurchase.tp_id.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(fetch_statement)
    items = list(result.scalars().all())

    return items, total


async def update_purchase(
    db: AsyncSession,
    db_obj: TobaccoPurchase,
    obj_in: PurchaseUpdate,
    user_name: str,
    ip_address: str,
) -> TobaccoPurchase:
    update_data = obj_in.model_dump(exclude_unset=True, exclude={"details"}, exclude_none=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)

    if obj_in.details is not None:
        await _sync_purchase_details(db, db_obj, obj_in.details, user_name, ip_address, delete_existing=True)

    db_obj.edit_user = user_name
    db_obj.edit_ip_address = ip_address
    db_obj.edit_do_date = datetime.now(CAMBODIA_TZ)

    db.add(db_obj)
    await db.commit()
    return await get_purchase(db, db_obj.tp_id)


async def delete_purchase(db: AsyncSession, tp_id: int) -> bool:
    db_obj = await get_purchase(db, tp_id)
    if not db_obj:
        return False
    db.delete(db_obj)
    await db.commit()
    return True


async def get_vendors_by_buyer(db: AsyncSession, buyer_id: int) -> List[VendorItem]:
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
    result = await db.execute(statement)
    rows = result.scalars().all()
    return [VendorItem(mf_id=r.mf_id, name=r.name, mf_code=r.mf_code, address=r.address) for r in rows]


async def get_purchasers(db: AsyncSession) -> List[Purchaser]:
    result = await db.execute(
        select(Purchaser)
        .join(Represent, Purchaser.p_id == Represent.p_id)
        .where(Represent.do_not_show == 0)
    )
    return list(result.scalars().all())


async def get_regions(db: AsyncSession) -> List[Region]:
    result = await db.execute(select(Region).where(Region.do_not_show == 0))
    return list(result.scalars().all())


async def get_ovens(db: AsyncSession) -> List[Oven]:
    result = await db.execute(select(Oven).where(Oven.do_not_show == 0))
    return list(result.scalars().all())


async def get_tobacco_types(db: AsyncSession) -> List[Tobacco]:
    result = await db.execute(select(Tobacco).where(Tobacco.t_cate == 2, Tobacco.discontinue == 0))
    return list(result.scalars().all())
