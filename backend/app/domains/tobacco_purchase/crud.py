from typing import Any, List, Literal, Optional, Tuple
from datetime import date
from sqlalchemy import delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select, func, col
from .models import TobaccoPurchase, TobaccoPurchaseDetail, Purchaser, Region, Oven, Tobacco
from app.domains.sack_registration.models import SackRegistration
from app.domains.farmers.models import Represent, MemberFarmer
from app.domains.farmer_contract.models import MfConYear
from app.domains.tobacco_repay.models.t_contract import TContract
from app.domains.tobacco_repay.models.t_contract_repay import TContractRepay
from app.domains.tobacco_repay.crud import generate_repay_num
from .schemas import PurchaseCreate, PurchaseUpdate, VendorItem, PurchaseDetailCreate, PurchaseReturnCreate
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


async def get_vendor_available_sack_kg(db: AsyncSession, vendor_id: int) -> float:
    """Available sack = SUM(all registrations) - SUM(purchase details where farmer_own_sack=0).
    Sack registration records are never mutated; quota is computed dynamically."""
    registered_result = await db.execute(
        select(func.coalesce(func.sum(SackRegistration.sack_in_kg), 0.0))
        .where(SackRegistration.farmer_id == vendor_id)
    )
    registered_total = float(registered_result.scalar() or 0.0)

    used_result = await db.execute(
        select(func.coalesce(func.sum(TobaccoPurchaseDetail.sack_in_kg), 0.0))
        .join(TobaccoPurchase, col(TobaccoPurchaseDetail.m_id) == col(TobaccoPurchase.tp_id))
        .where(col(TobaccoPurchase.vendor_id) == str(vendor_id))
        .where(col(TobaccoPurchaseDetail.farmer_own_sack) == 0)
    )
    used_total = float(used_result.scalar() or 0.0)

    return max(0.0, round(registered_total - used_total, 3))


async def _clear_existing_details(db: AsyncSession, tp_id: int) -> None:
    old_result = await db.execute(
        select(TobaccoPurchaseDetail).where(TobaccoPurchaseDetail.m_id == tp_id)
    )
    for d in old_result.scalars().all():
        db.expunge(d)
    await db.execute(
        sa_delete(TobaccoPurchaseDetail).where(col(TobaccoPurchaseDetail.m_id) == tp_id)
    )
    await db.flush()


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


def _compute_net(detail_in: PurchaseDetailCreate) -> float:
    return max(0.0,
        (detail_in.gross_weight or 0)
        - (detail_in.remork_in_kg or 0)
        - (detail_in.sack_in_kg or 0)
    )


def _compute_purchase_totals(
    details: List[PurchaseDetailCreate],
) -> Tuple[float, float, float]:
    """Returns (total_net_weight, grand_total, new_sack_total)."""
    total_net_weight = 0.0
    grand_total = 0.0
    new_sack_total = 0.0
    for detail_in in details:
        net = _compute_net(detail_in)
        total_net_weight += net
        grand_total += round(net * (detail_in.price or 0), 2)
        if not detail_in.farmer_own_sack:
            new_sack_total += detail_in.sack_in_kg or 0
    return total_net_weight, grand_total, new_sack_total


async def _validate_sack_quota(
    db: AsyncSession,
    vendor_id: Any,
    new_sack_total: float,
) -> None:
    if not (vendor_id and str(vendor_id).isdigit() and new_sack_total > 1e-9):
        return
    available = await get_vendor_available_sack_kg(db, int(vendor_id))
    if new_sack_total > available + 1e-9:
        raise ValueError(
            f"Insufficient sack stock: need {new_sack_total:.3f} kg but only "
            f"{available:.3f} kg available. "
            "Tick 'Own Sack' for items where the farmer brings their own sack."
        )


def _build_detail(
    detail_in: PurchaseDetailCreate,
    invoice_num: str,
    tp_id: int,
    user_name: str,
    ip_address: str,
) -> TobaccoPurchaseDetail:
    net = _compute_net(detail_in)
    total_amount = round(net * (detail_in.price or 0), 2)
    picture_val = _process_detail_picture(detail_in.picture)
    detail_data = detail_in.model_dump(exclude={"invoice_num", "m_id", "picture"}, exclude_none=True)
    if picture_val:
        detail_data["picture"] = picture_val
    return TobaccoPurchaseDetail(
        **detail_data,
        invoice_num=invoice_num,
        m_id=tp_id,
        qty=round(net, 3),
        user=user_name,
        ip_address=ip_address,
        do_date=datetime.now(CAMBODIA_TZ),
        total_amount=total_amount,
    )


async def _sync_purchase_details(
    db: AsyncSession,
    db_obj: TobaccoPurchase,
    details: List[PurchaseDetailCreate],
    user_name: str,
    ip_address: str,
    delete_existing: bool = False,
) -> None:
    assert db_obj.tp_id is not None
    tp_id: int = db_obj.tp_id
    if delete_existing:
        await _clear_existing_details(db, tp_id)

    # Compute totals before inserting so the validation query runs against
    # a clean DB state (old details already flushed away).
    total_net_weight, grand_total, new_sack_total = _compute_purchase_totals(details)
    await _validate_sack_quota(db, db_obj.vendor_id, new_sack_total)

    for detail_in in details:
        db.add(_build_detail(detail_in, db_obj.invoice_num, tp_id, user_name, ip_address))

    db_obj.total_net_weight = round(total_net_weight, 3)
    db_obj.grand_total = round(grand_total, 2)


async def _sync_purchase_returns(
    db: AsyncSession,
    returns: Optional[List[PurchaseReturnCreate]],
    tp_date: date,
    oven: Optional[int],
    tp_note: Optional[str],
    user_name: str,
    ip_address: str,
) -> None:
    """Persist tobacco repay entries. These are standalone t_contract_repay rows
    (no FK to tobacco_purchase) so they can be created with or without an
    accompanying purchase invoice. Each repay num must be generated and flushed
    one at a time so the next sequence read sees the row just inserted in this
    same transaction."""
    if not returns:
        return
    for return_in in returns:
        contract = await db.get(TContract, return_in.con_id)
        if not contract:
            raise ValueError(f"Contract id {return_in.con_id} not found")
        repay_num = await generate_repay_num(db)
        db.add(TContractRepay(
            con_id=return_in.con_id,
            con_num=contract.con_num,
            f_id=contract.f_id,
            repay_num=repay_num,
            repay_date=tp_date,
            qty_repay=return_in.qty_repay,
            note=tp_note,
            oven=oven,
            user=user_name,
            do_date=datetime.now(CAMBODIA_TZ),
            ip_address=ip_address,
        ))
        await db.flush()


async def create_purchase(
    db: AsyncSession,
    obj_in: PurchaseCreate,
    user_name: str,
    ip_address: str,
) -> Optional[TobaccoPurchase]:
    if not obj_in.details:
        # No purchase items were submitted — this is a repay-only invoice, so we
        # don't touch tobacco_purchase / tobacco_purchase_detail at all (and don't
        # burn an invoice number). Only t_contract_repay rows are created.
        await _sync_purchase_returns(
            db, obj_in.returns, obj_in.tp_date, obj_in.oven, obj_in.tp_note, user_name, ip_address
        )
        await db.commit()
        return None

    invoice_num = await generate_invoice_num(db)
    db_obj = TobaccoPurchase(
        **obj_in.model_dump(exclude={"details", "invoice_num", "returns"}, exclude_none=True),
        invoice_num=invoice_num,
        user=user_name,
        ip_address=ip_address,
        do_date=datetime.now(CAMBODIA_TZ),
    )
    db.add(db_obj)
    await db.flush()
    assert db_obj.tp_id is not None

    await _sync_purchase_details(db, db_obj, obj_in.details, user_name, ip_address)
    await _sync_purchase_returns(
        db, obj_in.returns, db_obj.tp_date, db_obj.oven, db_obj.tp_note, user_name, ip_address
    )

    await db.commit()
    return await get_purchase(db, db_obj.tp_id)


async def get_purchase(db: AsyncSession, tp_id: int) -> Optional[TobaccoPurchase]:
    result = await db.execute(
        select(TobaccoPurchase)
        .options(selectinload(TobaccoPurchase.details))  # type: ignore[arg-type]
        .options(selectinload(TobaccoPurchase.vendor))  # type: ignore[arg-type]
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
    limit: int = 20,
    search: Optional[str] = None,
    buyer: Optional[int] = None,
    sort_grand_total: Optional[Literal["asc", "desc"]] = None,
    sort_net_weight: Optional[Literal["asc", "desc"]] = None,
) -> Tuple[List[Any], int]:
    current_year = datetime.now(CAMBODIA_TZ).year

    # Correlated subquery replaces selectinload(details): one indexed COUNT per row
    # instead of fetching all detail columns (incl. picture paths) for the whole page.
    detail_count_subq = (
        select(func.count(col(TobaccoPurchaseDetail.tpd_id)))
        .where(col(TobaccoPurchaseDetail.m_id) == col(TobaccoPurchase.tp_id))
        .correlate(TobaccoPurchase)
        .scalar_subquery()
    )

    # A vendor can have multiple MfConYear rows for the same year (one per tobacco
    # type), so joining directly would fan out and duplicate purchase rows. Use an
    # EXISTS semi-join instead — it filters without multiplying rows.
    has_current_year_contract = (
        select(MfConYear.mf_con_id)
        .where(col(MfConYear.mf_id) == col(TobaccoPurchase.vendor_id))
        .where(MfConYear.year == current_year)
        .correlate(TobaccoPurchase)
        .exists()
    )

    # Data query: vendor_name from an outer join instead of a separate selectinload batch.
    # Annotated as Any because col(...).label(...) on Optional columns produces Label[Unknown]
    # in Pylance — the underlying SQLAlchemy expression is correct at runtime.
    data_base: Any = (  # pyright: ignore[reportUnknownVariableType]
        select(
            TobaccoPurchase,
            col(MemberFarmer.name).label("vendor_name"),  # type: ignore[arg-type]
            detail_count_subq.label("detail_count"),
        )
        .outerjoin(MemberFarmer, col(TobaccoPurchase.vendor_id) == col(MemberFarmer.mf_id))
        .where(has_current_year_contract)
    )

    # Count query: selects only tp_id — no correlated subqueries, no extra columns.
    count_base = (
        select(TobaccoPurchase.tp_id)
        .where(has_current_year_contract)
    )

    if search:
        search_filter = (
            col(TobaccoPurchase.invoice_num).contains(search)
            | col(MemberFarmer.name).contains(search)
            | col(Purchaser.p_name).contains(search)
            | col(Purchaser.p_name_kh).contains(search)
        )
        data_base = (
            data_base
            .outerjoin(Purchaser, col(TobaccoPurchase.buyer) == col(Purchaser.p_id))
            .where(search_filter)
        )
        count_base = (
            count_base
            .outerjoin(MemberFarmer, col(TobaccoPurchase.vendor_id) == col(MemberFarmer.mf_id))
            .outerjoin(Purchaser, col(TobaccoPurchase.buyer) == col(Purchaser.p_id))
            .where(search_filter)
        )

    if buyer is not None:
        data_base = data_base.where(col(TobaccoPurchase.buyer) == buyer)
        count_base = count_base.where(col(TobaccoPurchase.buyer) == buyer)

    total = await db.scalar(select(func.count()).select_from(count_base.subquery()))

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

    result = await db.execute(data_base.order_by(order_col).offset(skip).limit(limit))
    return list(result.all()), total or 0



async def update_purchase(
    db: AsyncSession,
    db_obj: TobaccoPurchase,
    obj_in: PurchaseUpdate,
    user_name: str,
    ip_address: str,
) -> Optional[TobaccoPurchase]:
    assert db_obj.tp_id is not None
    update_data = obj_in.model_dump(exclude_unset=True, exclude={"details", "vendor_id", "returns"}, exclude_none=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)

    if obj_in.details is not None:
        await _sync_purchase_details(db, db_obj, obj_in.details, user_name, ip_address, delete_existing=True)

    if obj_in.returns is not None:
        await _sync_purchase_returns(
            db, obj_in.returns, db_obj.tp_date, db_obj.oven, db_obj.tp_note, user_name, ip_address
        )

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
    start_date = date(current_year, 1, 1)
    end_date = date(current_year, 12, 31)

    weight_subquery: Any = (
        select(
            col(TobaccoPurchase.vendor_id).label("vendor_id"),  # type: ignore[arg-type]
            func.sum(TobaccoPurchase.total_net_weight).label("total_weight")
        )
        .where(TobaccoPurchase.tp_date >= start_date)
        .where(TobaccoPurchase.tp_date <= end_date)
        .group_by(TobaccoPurchase.vendor_id)
    ).subquery()

    statement = (
        select(
            MemberFarmer,
            MfConYear.tobac_num,
            func.coalesce(weight_subquery.c.total_weight, 0.0)
        )
        .join(Represent, col(MemberFarmer.represent) == col(Represent.represent_id))
        .join(MfConYear, col(MfConYear.mf_id) == col(MemberFarmer.mf_id))
        .outerjoin(weight_subquery, col(MemberFarmer.mf_id) == weight_subquery.c.vendor_id)
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
            buyer_id=buyer_id,
        )
        for r in rows
    ]


async def search_vendors(db: AsyncSession, search: str = "", limit: int = 20) -> List[VendorItem]:
    current_year = datetime.now(CAMBODIA_TZ).year

    statement = (
        select(MemberFarmer, Represent.p_id, MfConYear.tobac_num)
        .join(Represent, col(MemberFarmer.represent) == col(Represent.represent_id))
        .join(MfConYear, col(MfConYear.mf_id) == col(MemberFarmer.mf_id))
        .where(Represent.do_not_show == 0)
        .where(MemberFarmer.active == "YES")
        .where(col(Represent.p_id).is_not(None))
        .where(MfConYear.year == current_year)
    )
    search = search.strip()
    if search:
        pattern = f"%{search}%"
        statement = statement.where(
            col(MemberFarmer.name).ilike(pattern) | col(MemberFarmer.mf_code).ilike(pattern)
        )
    statement = statement.order_by(col(MemberFarmer.name)).limit(limit)
    result = await db.execute(statement)
    rows = result.all()
    return [
        VendorItem(
            mf_id=r[0].mf_id,
            name=r[0].name,
            mf_code=r[0].mf_code,
            address=r[0].address,
            tobac_num=r[2],
            buyer_id=r[1],
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


async def get_vendor_sack_kg(db: AsyncSession, vendor_id: int) -> float:
    return await get_vendor_available_sack_kg(db, vendor_id)


def _purchase_to_report_rows(p: TobaccoPurchase, tobacco_map: dict[int, str]) -> list[dict[str, Any]]:
    """One row per detail line — Farmer ID/Inv No/Remark repeat, Grade/Qty/Price/Total are per-line."""
    farmer_id = p.vendor.mf_code if p.vendor else (p.vendor_id or "")
    details = sorted(p.details, key=lambda d: d.tpd_id or 0)
    return [
        {
            "farmer_id": farmer_id,
            "invoice_num": p.invoice_num,
            "grade": tobacco_map.get(d.tobacco_name, str(d.tobacco_name)),
            "qty_kg": d.qty,
            "unit_price": d.price,
            "total_amount": d.total_amount,
            "remark": p.tp_note,
        }
        for d in details
    ]


async def get_purchase_report_data(
    db: AsyncSession,
    buyer_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> dict[str, Any]:
    """Assemble header info + one row per purchase for the buyer's settlement report, within [date_from, date_to]."""
    date_to = date_to or datetime.now(CAMBODIA_TZ).date()

    purchaser = await db.get(Purchaser, buyer_id)

    conditions = [TobaccoPurchase.buyer == buyer_id, TobaccoPurchase.tp_date <= date_to]
    if date_from:
        conditions.append(TobaccoPurchase.tp_date >= date_from)

    result = await db.execute(
        select(TobaccoPurchase)
        .options(selectinload(TobaccoPurchase.details))  # type: ignore[arg-type]
        .options(selectinload(TobaccoPurchase.vendor))  # type: ignore[arg-type]
        .where(*conditions)
        .order_by(col(TobaccoPurchase.tp_date), col(TobaccoPurchase.tp_id))
    )
    purchases = result.scalars().all()

    tobacco_map = {t.t_id: (t.t_name_kh or t.t_name) for t in await get_tobacco_types(db)}
    rows = [row for p in purchases for row in _purchase_to_report_rows(p, tobacco_map)]

    oven_ids = list({p.oven for p in purchases if p.oven})
    ovens = [o for oid in oven_ids if (o := await db.get(Oven, oid)) is not None]
    region = await db.get(Region, purchaser.region) if purchaser and purchaser.region else None

    return {
        "representative": (purchaser.p_name_kh or purchaser.p_name) if purchaser else None,
        "region": (region.reg_name_kh or region.reg_name) if region else None,
        "oven": ", ".join(o.name_kh or o.name_en for o in ovens) or None,
        "report_date": datetime.now(CAMBODIA_TZ).date(),
        "rows": rows,
    }
