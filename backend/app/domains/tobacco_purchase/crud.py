from typing import List, Optional, Tuple
from sqlalchemy import delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select, func, col
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
        .where(col(TobaccoPurchase.invoice_num).like(f"{prefix}%"))
        .order_by(col(TobaccoPurchase.invoice_num).desc())
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


async def _update_sack_registration(db: AsyncSession, vendor: str, net_sack_change: float) -> None:
    sack_result = await db.execute(
        select(SackRegistration)
        .join(MemberFarmer, SackRegistration.member_farmer_id == MemberFarmer.mf_id)
        .where(MemberFarmer.name == vendor)
        .where(SackRegistration.status == 0)
        .order_by(col(SackRegistration.registered_at).desc())
        .limit(1)
    )
    sack_reg = sack_result.scalars().first()
    if sack_reg:
        remaining = max(0.0, round((sack_reg.sack_in_kg or 0) - net_sack_change, 3))
        sack_reg.sack_in_kg = remaining
        sack_reg.status = 1 if remaining == 0 else 0
        sack_reg.updated_at = datetime.now(CAMBODIA_TZ)
        db.add(sack_reg)


async def _sync_purchase_details(
    db: AsyncSession,
    db_obj: TobaccoPurchase,
    details: List[PurchaseDetailCreate],
    user_name: str,
    ip_address: str,
    delete_existing: bool = False,
) -> None:
    old_sack_total = 0.0
    if delete_existing:
        old_result = await db.execute(
            select(TobaccoPurchaseDetail)
            .where(TobaccoPurchaseDetail.m_id == db_obj.tp_id)
        )
        old_details = old_result.scalars().all()
        old_sack_total = sum(d.sack_in_kg or 0.0 for d in old_details)

        for d in old_details:
            db.expunge(d)

        await db.execute(
            sa_delete(TobaccoPurchaseDetail).where(col(TobaccoPurchaseDetail.m_id) == db_obj.tp_id)
        )
        await db.flush()

    total_net_weight = 0.0
    grand_total = 0.0
    new_sack_total = 0.0

    assert db_obj.tp_id is not None
    for detail_in in details:
        net = max(0.0,
            (detail_in.gross_weight or 0)
            - (detail_in.remork_in_kg or 0)
            - (detail_in.sack_in_kg or 0)
        )
        total_amount = round(net * (detail_in.price or 0), 2)

        total_net_weight += net
        grand_total += total_amount
        new_sack_total += detail_in.sack_in_kg or 0

        picture_val = None
        if detail_in.picture:
            if detail_in.picture.startswith("data:image/"):
                import base64
                import uuid
                import os
                try:
                    header, data_str = detail_in.picture.split(";base64,")
                    ext = header.split("/")[-1]
                    if ";" in ext:
                        ext = ext.split(";")[0]
                    file_data = base64.b64decode(data_str)
                    filename = f"tobacco_detail_{uuid.uuid4().hex}.{ext}"
                    filepath = os.path.join("uploads", filename)
                    with open(filepath, "wb") as f:
                        f.write(file_data)
                    picture_val = filename
                except Exception:
                    picture_val = None
            else:
                import os
                picture_val = os.path.basename(detail_in.picture)

        detail_data = detail_in.model_dump(exclude={"invoice_num", "m_id", "picture"}, exclude_none=True)
        if picture_val:
            detail_data["picture"] = picture_val

        db.add(TobaccoPurchaseDetail(
            **detail_data,
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

    net_sack_change = new_sack_total - old_sack_total
    if db_obj.vendor and net_sack_change != 0:
        await _update_sack_registration(db, db_obj.vendor, net_sack_change)


async def create_purchase(
    db: AsyncSession,
    obj_in: PurchaseCreate,
    user_name: str,
    ip_address: str,
) -> Optional[TobaccoPurchase]:
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
    assert db_obj.tp_id is not None

    await _sync_purchase_details(db, db_obj, obj_in.details, user_name, ip_address)

    await db.commit()
    return await get_purchase(db, db_obj.tp_id)


async def get_purchase(db: AsyncSession, tp_id: int) -> Optional[TobaccoPurchase]:
    result = await db.execute(
        select(TobaccoPurchase)
        .options(selectinload(TobaccoPurchase.details))  # type: ignore[arg-type]
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
            col(TobaccoPurchase.invoice_num).contains(search) | col(TobaccoPurchase.vendor).contains(search)
        )

    count_statement = select(func.count()).select_from(base.subquery())
    total = await db.scalar(count_statement)

    fetch_statement = (
        base.options(selectinload(TobaccoPurchase.details))  # type: ignore[arg-type]
        .order_by(col(TobaccoPurchase.tp_id).desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(fetch_statement)
    items = list(result.scalars().all())

    return items, total or 0


async def update_purchase(
    db: AsyncSession,
    db_obj: TobaccoPurchase,
    obj_in: PurchaseUpdate,
    user_name: str,
    ip_address: str,
) -> Optional[TobaccoPurchase]:
    assert db_obj.tp_id is not None
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
    await db.delete(db_obj)
    await db.commit()
    return True


async def get_vendors_by_buyer(db: AsyncSession, buyer_id: int) -> List[VendorItem]:
    current_year = datetime.now(CAMBODIA_TZ).year
    statement = (
        select(MemberFarmer)
        .join(Represent, col(MemberFarmer.represent) == col(Represent.represent_id))
        .join(MfConYear, col(MfConYear.mf_id) == col(MemberFarmer.mf_id))
        .where(Represent.p_id == buyer_id)
        .where(Represent.do_not_show == 0)
        .where(MemberFarmer.active == "YES")
        .where(MfConYear.year == current_year)
    )
    result = await db.execute(statement)
    rows = result.scalars().all()
    return [VendorItem(mf_id=r.mf_id, name=r.name, mf_code=r.mf_code, address=r.address) for r in rows]  # type: ignore[arg-type]


async def get_purchasers(db: AsyncSession) -> List[Purchaser]:
    result = await db.execute(
        select(Purchaser)
        .join(Represent, col(Purchaser.p_id) == col(Represent.p_id))
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


async def get_vendor_sack_kg(db: AsyncSession, vendor_name: str) -> Optional[float]:
    result = await db.execute(
        select(SackRegistration)
        .join(MemberFarmer, SackRegistration.member_farmer_id == MemberFarmer.mf_id)
        .where(MemberFarmer.name == vendor_name)
        .where(SackRegistration.status == 0)
        .order_by(col(SackRegistration.registered_at).desc())
        .limit(1)
    )
    sack = result.scalars().first()
    return sack.sack_in_kg if sack else None
