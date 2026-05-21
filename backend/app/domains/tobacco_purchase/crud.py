from typing import List, Literal, Optional, Tuple
from datetime import date
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
    # Format: DDMMYY (e.g. 210526 for 21 May 2026)
    today_str = datetime.now(CAMBODIA_TZ).strftime("%d%m%y")
    prefix = f"{today_str}-"

    # Fetch the absolute latest invoice created to get the last sequence
    # Since the sequence continues across days, we order by ID descending
    statement = (
        select(TobaccoPurchase.invoice_num)
        .order_by(col(TobaccoPurchase.tp_id).desc())
        .limit(1)
    )
    last_invoice = await db.scalar(statement)

    if last_invoice and "-" in last_invoice:
        try:
            last_seq = int(last_invoice.split("-")[-1])
            new_seq = last_seq + 1
        except (ValueError, IndexError):
            new_seq = 0
    else:
        new_seq = 0

    return f"{prefix}{new_seq:04d}"


async def get_vendor_total_active_sack_kg(db: AsyncSession, vendor_name: str) -> float:
    result = await db.execute(
        select(func.sum(SackRegistration.sack_in_kg))
        .join(MemberFarmer, SackRegistration.member_farmer_id == MemberFarmer.mf_id)
        .where(MemberFarmer.name == vendor_name)
        .where(SackRegistration.status == 0)
    )
    total = result.scalar()
    return float(total or 0.0)


async def _deduct_sacks(db: AsyncSession, vendor: str, to_deduct: float) -> None:
    sack_result = await db.execute(
        select(SackRegistration)
        .join(MemberFarmer, SackRegistration.member_farmer_id == MemberFarmer.mf_id)
        .where(MemberFarmer.name == vendor)
        .where(SackRegistration.status == 0)
        .order_by(col(SackRegistration.registered_at).asc())
    )
    active_sacks = sack_result.scalars().all()
    for sack_reg in active_sacks:
        if to_deduct <= 0:
            break
        current_weight = sack_reg.sack_in_kg or 0.0
        if current_weight >= to_deduct:
            # Deduct all remaining from this single registration
            sack_reg.sack_in_kg = round(current_weight - to_deduct, 3)
            sack_reg.status = 1 if sack_reg.sack_in_kg == 0 else 0
            sack_reg.updated_at = datetime.now(CAMBODIA_TZ)
            db.add(sack_reg)
            to_deduct = 0.0
        else:
            # Deplete this registration completely and carry over the remainder
            to_deduct = round(to_deduct - current_weight, 3)
            sack_reg.sack_in_kg = 0.0
            sack_reg.status = 1
            sack_reg.updated_at = datetime.now(CAMBODIA_TZ)
            db.add(sack_reg)


async def _refund_sacks(db: AsyncSession, vendor: str, to_refund: float) -> None:
    sack_result = await db.execute(
        select(SackRegistration)
        .join(MemberFarmer, SackRegistration.member_farmer_id == MemberFarmer.mf_id)
        .where(MemberFarmer.name == vendor)
        .order_by(col(SackRegistration.registered_at).desc())
        .limit(1)
    )
    sack_reg = sack_result.scalars().first()
    if sack_reg:
        sack_reg.sack_in_kg = round((sack_reg.sack_in_kg or 0.0) + to_refund, 3)
        sack_reg.status = 0  # Re-activate registration
        sack_reg.updated_at = datetime.now(CAMBODIA_TZ)
        db.add(sack_reg)


async def _update_sack_registration(db: AsyncSession, vendor: str, net_sack_change: float) -> None:
    if net_sack_change > 0:
        await _deduct_sacks(db, vendor, net_sack_change)
    elif net_sack_change < 0:
        await _refund_sacks(db, vendor, abs(net_sack_change))


async def _clear_existing_details(db: AsyncSession, tp_id: int) -> float:
    """Clear existing purchase details and return the total sack weight from those deleted details."""
    old_result = await db.execute(
        select(TobaccoPurchaseDetail)
        .where(TobaccoPurchaseDetail.m_id == tp_id)
    )
    old_details = old_result.scalars().all()
    old_sack_total = sum(d.sack_in_kg or 0.0 for d in old_details)

    for d in old_details:
        db.expunge(d)

    await db.execute(
        sa_delete(TobaccoPurchaseDetail).where(col(TobaccoPurchaseDetail.m_id) == tp_id)
    )
    await db.flush()
    return old_sack_total


def _process_detail_picture(picture: Optional[str]) -> Optional[str]:
    """Process detail picture: decode/compress Base64 into WebP, or extract path from existing URLs."""
    if not picture:
        return None

    if picture.startswith("data:image/"):
        import base64
        import uuid
        import os
        import io
        from PIL import Image, ImageOps
        from loguru import logger
        try:
            _, data_str = picture.split(";base64,")
            file_data = base64.b64decode(data_str)
            
            # Open the image using Pillow
            img = Image.open(io.BytesIO(file_data))
            
            # Fix EXIF orientation (auto-rotation from mobile cameras)
            img = ImageOps.exif_transpose(img)
            
            # Convert to RGB color space if it is in RGBA/palette modes
            if img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGB")
            
            # Crop to a perfect 1:1 square, scaling down if it exceeds 1024px
            max_dim = 1024
            size = min(img.width, img.height, max_dim)
            img = ImageOps.fit(img, (size, size), Image.Resampling.LANCZOS)
            
            # Get year and month based on Cambodia TZ to partition subdirectories
            now = datetime.now(CAMBODIA_TZ)
            year_str = now.strftime("%Y")
            month_str = now.strftime("%m")
            
            # Ensure subdirectory structure exists (e.g. uploads/2026/05)
            subfolder_path = os.path.join("uploads", year_str, month_str)
            os.makedirs(subfolder_path, exist_ok=True)
            
            # Save as WebP with 85% quality and compression optimization
            filename = f"tobacco_detail_{uuid.uuid4().hex}.webp"
            filepath = os.path.join(subfolder_path, filename)
            img.save(filepath, "WEBP", quality=85, optimize=True)
            
            # Database stores the relative path from the uploads directory
            return f"{year_str}/{month_str}/{filename}"
        except Exception as e:
            logger.error(f"Failed to process and compress uploaded image: {e}")
            return None
    else:
        # If it's an existing image, extract the relative path starting after "uploads/"
        # to support both flat legacy filenames and partitioned subdirectory paths
        if "/uploads/" in picture:
            return picture.split("/uploads/")[-1]
        else:
            return picture


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
        old_sack_total = await _clear_existing_details(db, db_obj.tp_id)

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

        picture_val = _process_detail_picture(detail_in.picture)

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
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    buyer: Optional[int] = None,
    sort_grand_total: Optional[Literal["asc", "desc"]] = None,
    sort_net_weight: Optional[Literal["asc", "desc"]] = None,
) -> Tuple[List[TobaccoPurchase], int]:
    base = select(TobaccoPurchase)
    if search:
        base = base.where(
            col(TobaccoPurchase.invoice_num).contains(search) | col(TobaccoPurchase.vendor).contains(search)
        )
    if date_from is not None:
        base = base.where(col(TobaccoPurchase.tp_date) >= date_from)
    if date_to is not None:
        base = base.where(col(TobaccoPurchase.tp_date) <= date_to)
    if buyer is not None:
        base = base.where(col(TobaccoPurchase.buyer) == buyer)

    count_statement = select(func.count()).select_from(base.subquery())
    total = await db.scalar(count_statement)

    # Determine ordering
    if sort_grand_total == "asc":
        order_col = col(TobaccoPurchase.grand_total).asc()
    elif sort_grand_total == "desc":
        order_col = col(TobaccoPurchase.grand_total).desc()
    elif sort_net_weight == "asc":
        order_col = col(TobaccoPurchase.total_net_weight).asc()
    elif sort_net_weight == "desc":
        order_col = col(TobaccoPurchase.total_net_weight).desc()
    else:
        order_col = col(TobaccoPurchase.tp_id).desc()

    fetch_statement = (
        base.options(selectinload(TobaccoPurchase.details))  # type: ignore[arg-type]
        .order_by(order_col)
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

    # Refund consumed sacks
    total_sack_to_refund = sum(d.sack_in_kg or 0.0 for d in db_obj.details)
    if db_obj.vendor and total_sack_to_refund > 0:
        await _update_sack_registration(db, db_obj.vendor, -total_sack_to_refund)

    await db.delete(db_obj)
    await db.commit()
    return True


async def get_vendors_by_buyer(db: AsyncSession, buyer_id: int) -> List[VendorItem]:
    current_year = datetime.now(CAMBODIA_TZ).year
    start_date = date(current_year, 1, 1)
    end_date = date(current_year, 12, 31)

    weight_subquery = (
        select(
            TobaccoPurchase.vendor.label("vendor_name"),
            func.sum(TobaccoPurchase.total_net_weight).label("total_weight")
        )
        .where(TobaccoPurchase.tp_date >= start_date)
        .where(TobaccoPurchase.tp_date <= end_date)
        .group_by(TobaccoPurchase.vendor)
    ).subquery()

    statement = (
        select(
            MemberFarmer,
            MfConYear.tobac_num,
            func.coalesce(weight_subquery.c.total_weight, 0.0)
        )
        .join(Represent, col(MemberFarmer.represent) == col(Represent.represent_id))
        .join(MfConYear, col(MfConYear.mf_id) == col(MemberFarmer.mf_id))
        .outerjoin(weight_subquery, col(MemberFarmer.name) == weight_subquery.c.vendor_name)
        .where(Represent.p_id == buyer_id)
        .where(Represent.do_not_show == 0)
        .where(MemberFarmer.active == "YES")
        .where(MfConYear.year == current_year)
    )
    result = await db.execute(statement)
    rows = result.all()
    return [
        VendorItem(
            mf_id=r[0].mf_id,
            name=r[0].name,
            mf_code=r[0].mf_code,
            address=r[0].address,
            tobac_num=r[1],
            purchased_weight=r[2],
        )
        for r in rows
    ]


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
        .order_by(col(SackRegistration.registered_at).asc())
        .limit(1)
    )
    sack = result.scalars().first()
    return sack.sack_in_kg if sack else None
