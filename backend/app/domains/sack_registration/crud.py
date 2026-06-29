from typing import Any, Literal, Optional, cast
from datetime import datetime, date, timedelta
from sqlalchemy import cast as sa_cast, Date, Integer, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased
from sqlmodel import select, col
from app.core.config import CAMBODIA_TZ
from app.domains.sack_registration.models import SackRegistration
from app.domains.farmers.models import Represent, MemberFarmer
from app.domains.farmers.crud import search_member_farmer
from app.domains.sack_registration.schemas import SackRegistrationCreate, SackRegistrationUpdate
from app.domains.tobacco_purchase.models import TobaccoPurchase, TobaccoPurchaseDetail
from app.domains.audit import crud as audit_crud

_MEMBER_FARMER_NO_ID_ERROR = "MemberFarmer record has no id"
_CONFIRMED_EPSILON = 1e-9


async def _get_sack_status(
    session: AsyncSession, farmer_ids: list[int]
) -> dict[int, tuple[bool, float]]:
    if not farmer_ids:
        return {}

    pool_subq = (
        select(
            sa_cast(TobaccoPurchase.vendor_id, Integer).label("farmer_id"),
            func.coalesce(func.sum(TobaccoPurchaseDetail.sack_in_kg), 0.0).label("total_used"),
        )
        .join(TobaccoPurchaseDetail, col(TobaccoPurchaseDetail.m_id) == col(TobaccoPurchase.tp_id))
        .where(col(TobaccoPurchaseDetail.farmer_own_sack) == 0)
        # Compare against the raw string column (matches ix_tp_vendor) instead of
        # casting vendor to Integer, which would force a full table scan.
        .where(col(TobaccoPurchase.vendor_id).in_([str(fid) for fid in farmer_ids]))
        .group_by(TobaccoPurchase.vendor_id)
        .subquery()
    )

    prev_cumsum = func.coalesce(
        func.sum(SackRegistration.sack_in_kg).over(
            partition_by=col(SackRegistration.farmer_id),
            order_by=col(SackRegistration.created_at).asc(),
            rows=(None, -1),
        ),
        0.0,
    )

    remaining_expr = func.greatest(
        0.0,
        func.coalesce(SackRegistration.sack_in_kg, 0.0)
        - func.greatest(0.0, func.coalesce(pool_subq.c.total_used, 0.0) - prev_cumsum),
    )

    result = await session.execute(
        select(SackRegistration.id, remaining_expr.label("remaining"))
        .outerjoin(pool_subq, pool_subq.c.farmer_id == SackRegistration.farmer_id)
        .where(col(SackRegistration.farmer_id).in_(farmer_ids))
        .order_by(col(SackRegistration.farmer_id), col(SackRegistration.created_at).asc())
    )

    status: dict[int, tuple[bool, float]] = {}
    for sack_id, remaining in result.all():
        remaining = round(float(remaining or 0.0), 6)
        status[sack_id] = (remaining < 1e-9, remaining)

    return status


async def get_by_id(session: AsyncSession, sack_id: int) -> Optional[SackRegistration]:
    result = await session.execute(select(SackRegistration).where(SackRegistration.id == sack_id))
    return result.scalars().first()


async def get_details(session: AsyncSession, sack_id: int) -> Optional[dict[str, Any]]:
    stmt = (
        select(SackRegistration, Represent.represent_name, MemberFarmer.name, MemberFarmer.mf_code)
        .join(Represent, col(SackRegistration.represent_id) == col(Represent.represent_id))
        .join(MemberFarmer, col(SackRegistration.farmer_id) == col(MemberFarmer.mf_id))
        .where(SackRegistration.id == sack_id)
    )
    result = await session.execute(stmt)
    row = result.first()
    if not row:
        return None
    sack, r_name, f_name, mf_code = cast(tuple[SackRegistration, str, str, str], row)
    if sack.id is None:
        raise ValueError("SackRegistration has no id")
    sack_status = await _get_sack_status(session, [sack.farmer_id])
    _, remaining = sack_status.get(sack.id, (False, float(sack.sack_in_kg or 0.0)))
    data: dict[str, Any] = sack.model_dump()
    data["represent_name"] = r_name
    data["member_farmer_name"] = f_name
    data["member_farmer_mf_code"] = mf_code
    data["registered_sack_in_kg"] = sack.sack_in_kg
    data["sack_in_kg"] = remaining
    return data


def _build_remaining_subquery(farmer_ids: list[int]) -> Any:
    # `remaining` depends on the FIFO consumption of *all* of a farmer's sack
    # registrations (not just the filtered/paginated page), so it has to be
    # computed in SQL before WHERE/ORDER BY/LIMIT are applied, otherwise
    # filtering or sorting by status on top of a paginated page would be wrong.
    pool_subq = (
        select(
            sa_cast(TobaccoPurchase.vendor_id, Integer).label("farmer_id"),
            func.coalesce(func.sum(TobaccoPurchaseDetail.sack_in_kg), 0.0).label("total_used"),
        )
        .join(TobaccoPurchaseDetail, col(TobaccoPurchaseDetail.m_id) == col(TobaccoPurchase.tp_id))
        .where(col(TobaccoPurchaseDetail.farmer_own_sack) == 0)
        # Restrict to farmers that actually have sack registrations, comparing
        # against the raw string column (matches ix_tp_vendor) instead of casting
        # vendor to Integer, which would force a full table scan.
        .where(col(TobaccoPurchase.vendor_id).in_([str(fid) for fid in farmer_ids]))
        .group_by(TobaccoPurchase.vendor_id)
        .subquery()
    )

    prev_cumsum = func.coalesce(
        func.sum(SackRegistration.sack_in_kg).over(
            partition_by=col(SackRegistration.farmer_id),
            order_by=col(SackRegistration.created_at).asc(),
            rows=(None, -1),
        ),
        0.0,
    )

    remaining_expr = func.greatest(
        0.0,
        func.coalesce(SackRegistration.sack_in_kg, 0.0)
        - func.greatest(0.0, func.coalesce(pool_subq.c.total_used, 0.0) - prev_cumsum),
    ).label("remaining")

    return (
        select(SackRegistration, remaining_expr)
        .outerjoin(pool_subq, pool_subq.c.farmer_id == SackRegistration.farmer_id)
        .subquery()
    )


def _apply_search_and_date_filters(
    stmt: Any,
    sr: Any,
    search: Optional[str],
    date_from: Optional[date],
    date_to: Optional[date],
) -> Any:
    if search:
        pattern = f"%{search}%"
        cond = (
            col(MemberFarmer.name).ilike(pattern)
            | col(MemberFarmer.mf_code).ilike(pattern)
            | col(Represent.represent_name).ilike(pattern)
        )
        stmt = stmt.where(cond)

    if date_from is not None:
        # Compare the raw column (no CAST) so an index on created_at can be used.
        stmt = stmt.where(col(sr.created_at) >= datetime.combine(date_from, datetime.min.time()))

    if date_to is not None:
        next_day = datetime.combine(date_to + timedelta(days=1), datetime.min.time())
        stmt = stmt.where(col(sr.created_at) < next_day)

    return stmt


def _apply_status_filter_and_order(
    stmt: Any,
    sack_calc: Any,
    sr: Any,
    status: Optional[Literal["pending", "confirmed"]],
) -> Any:
    is_confirmed = sack_calc.c.remaining < _CONFIRMED_EPSILON
    if status == "pending":
        stmt = stmt.where(~is_confirmed)
    elif status == "confirmed":
        stmt = stmt.where(is_confirmed)

    if status is None:
        # Default view: pending records first, confirmed ones fall to the
        # bottom (and naturally spill into later pages once pending runs out).
        return stmt.order_by(case((is_confirmed, 1), else_=0), col(sr.created_at).desc())
    return stmt.order_by(col(sr.created_at).desc())


def _rows_to_items(raw_rows: Any) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for row in raw_rows:
        sack, r_name, f_name, mf_code, remaining = cast(tuple[SackRegistration, str, str, str, float], row[:5])
        if sack.id is None:
            raise ValueError("SackRegistration has no id")
        data: dict[str, Any] = sack.model_dump()
        data["represent_name"] = r_name
        data["member_farmer_name"] = f_name
        data["member_farmer_mf_code"] = mf_code
        data["registered_sack_in_kg"] = sack.sack_in_kg
        data["sack_in_kg"] = round(float(remaining or 0.0), 6)
        items.append(data)
    return items


def _sort_items_by_sack_in_kg(items: list[dict[str, Any]], sort_sack_in_kg: Optional[str]) -> None:
    if sort_sack_in_kg == "asc":
        items.sort(key=lambda x: (x["sack_in_kg"] is None, x["sack_in_kg"] or 0.0))
    elif sort_sack_in_kg == "desc":
        items.sort(key=lambda x: (x["sack_in_kg"] is None, -(x["sack_in_kg"] or 0.0)))


async def get_all(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 200,
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    sort_sack_in_kg: Optional[str] = None,
    status: Optional[Literal["pending", "confirmed"]] = None,
    represent_id: Optional[int] = None,
) -> tuple[list[dict[str, Any]], int]:
    farmer_ids_result = await session.execute(select(SackRegistration.farmer_id).distinct())
    farmer_ids = [fid for fid in farmer_ids_result.scalars().all() if fid is not None]

    sack_calc = _build_remaining_subquery(farmer_ids)
    sr = aliased(SackRegistration, sack_calc)

    stmt = (
        select(sr, Represent.represent_name, MemberFarmer.name, MemberFarmer.mf_code)
        .add_columns(sack_calc.c.remaining)
        .join(Represent, col(sr.represent_id) == col(Represent.represent_id))
        .join(MemberFarmer, col(sr.farmer_id) == col(MemberFarmer.mf_id))
    )
    stmt = _apply_search_and_date_filters(stmt, sr, search, date_from, date_to)
    if represent_id is not None:
        stmt = stmt.where(col(sr.represent_id) == represent_id)
    stmt = _apply_status_filter_and_order(stmt, sack_calc, sr, status)

    total_count = func.count().over().label("total_count")
    result = await session.execute(stmt.add_columns(total_count).offset(skip).limit(limit))

    raw_rows = result.all()
    if raw_rows:
        total = raw_rows[0][-1]
    else:
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await session.scalar(count_stmt)) or 0

    items = _rows_to_items(raw_rows)
    _sort_items_by_sack_in_kg(items, sort_sack_in_kg)

    return items, total


async def get_stats(session: AsyncSession) -> dict[str, Any]:
    now = datetime.now(CAMBODIA_TZ)
    today = now.date()
    yesterday = today - timedelta(days=1)
    reg_date = sa_cast(SackRegistration.created_at, Date)

    stats_stmt = (
        select(
            func.count().label("total"),
            func.sum(case((reg_date == today, 1), else_=0)).label("today"),
            func.coalesce(func.sum(SackRegistration.sack_in_kg), 0.0).label("total_kg"),
            func.coalesce(
                func.sum(case((reg_date == today, SackRegistration.sack_in_kg), else_=None)),
                0.0,
            ).label("today_kg"),
        )
        .add_columns(
            func.coalesce(
                func.sum(case((reg_date == yesterday, SackRegistration.sack_in_kg), else_=None)),
                0.0,
            ).label("yesterday_kg"),
        )
        .select_from(SackRegistration)
    )

    row = (await session.execute(stats_stmt)).first()

    today_kg = round(float(row.today_kg), 2) if row else 0.0
    yesterday_kg = round(float(row.yesterday_kg), 2) if row else 0.0

    if yesterday_kg > 0:
        change_pct = round((today_kg - yesterday_kg) / yesterday_kg * 100, 1)
    elif today_kg > 0:
        change_pct = 100.0
    else:
        change_pct = 0.0

    return {
        "registration_counts": {
            "total": (row.total or 0) if row else 0,
            "today": (row.today or 0) if row else 0,
        },
        "sack_weight_kg": {
            "total": round(float(row.total_kg), 2) if row else 0.0,
            "today": today_kg,
            "yesterday": yesterday_kg,
        },
        "change_pct": change_pct,
    }


async def create(
    session: AsyncSession,
    data: SackRegistrationCreate,
    current_user_id: int,
    current_user_name: str,
) -> tuple[Optional[dict[str, Any]], Optional[str]]:
    result = await session.execute(select(Represent).where(Represent.represent_id == data.represent_id))
    represent = result.scalars().first()
    if not represent:
        return None, "represent_not_found"
    if represent.represent_id is None:
        raise ValueError("Represent record has no id")

    farmer_row = await search_member_farmer(
        session,
        name=data.member_farmer_name,
        identity_card=data.member_farmer_identity_card,
    )
    if not farmer_row:
        return None, "farmer_not_found"
    farmer, _represent_name = farmer_row
    if farmer.mf_id is None:
        raise ValueError(_MEMBER_FARMER_NO_ID_ERROR)

    record = SackRegistration(
        represent_id=represent.represent_id,
        farmer_id=farmer.mf_id,
        action_by_id=current_user_id,
        action_by=current_user_name,
        sack_in_kg=data.sack_in_kg,
        notes=data.notes,
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)

    if record.id is None:
        raise ValueError("SackRegistration has no id after commit")
    details: Optional[dict[str, Any]] = await get_details(session, record.id)
    return details, None


async def _resolve_updated_farmer_id(
    session: AsyncSession,
    mf_code: str,
    effective_represent_id: Optional[int],
) -> tuple[Optional[int], Optional[str]]:
    farmer_row = await search_member_farmer(session, identity_card=mf_code)
    if not farmer_row:
        return None, "farmer_not_found"
    farmer, _represent_name = farmer_row
    if str(farmer.represent) != str(effective_represent_id):
        return None, "farmer_not_found"
    if farmer.mf_id is None:
        raise ValueError(_MEMBER_FARMER_NO_ID_ERROR)
    return farmer.mf_id, None


async def update(
    session: AsyncSession,
    record: SackRegistration,
    data: SackRegistrationUpdate,
    current_user_id: int,
    current_user_name: str,
    ip_address: str | None = None,
    page_name: str = "sack_registration",
) -> tuple[Optional[dict[str, Any]], Optional[str]]:
    update_data = data.model_dump(exclude_unset=True)

    tracked_fields = [k for k in update_data if k != "member_farmer_mf_code"]
    if "member_farmer_mf_code" in update_data and "farmer_id" not in tracked_fields:
        tracked_fields.append("farmer_id")
    old_values = {k: getattr(record, k, None) for k in tracked_fields}

    represent_changed = "represent_id" in update_data
    if represent_changed:
        new_represent_id = update_data.pop("represent_id")
        result = await session.execute(select(Represent).where(Represent.represent_id == new_represent_id))
        if not result.scalars().first():
            return None, "represent_not_found"
        record.represent_id = new_represent_id

    effective_represent_id = record.represent_id

    mf_code = update_data.pop("member_farmer_mf_code", None)
    if mf_code:
        farmer_id, error = await _resolve_updated_farmer_id(session, mf_code, effective_represent_id)
        if error or farmer_id is None:
            return None, error or "farmer_not_found"
        record.farmer_id = farmer_id
    elif represent_changed:
        # Represent changed but farmer wasn't updated — ensure existing farmer still belongs to the new represent
        existing_farmer = (
            await session.execute(select(MemberFarmer).where(MemberFarmer.mf_id == record.farmer_id))
        ).scalars().first()
        if not existing_farmer or str(existing_farmer.represent) != str(effective_represent_id):
            return None, "farmer_not_in_represent"

    for key, value in update_data.items():
        setattr(record, key, value)

    record.action_by_id = current_user_id
    record.action_by = current_user_name
    record.updated_at = datetime.now(CAMBODIA_TZ)
    session.add(record)
    await session.commit()

    if record.id is None:
        raise ValueError("SackRegistration has no id after commit")

    new_values = {k: getattr(record, k, None) for k in tracked_fields}
    await audit_crud.log_field_changes(
        session,
        page_name=page_name,
        record_id=record.id,
        old_values=old_values,
        new_values=new_values,
        user_name=current_user_name,
        ip_address=ip_address,
    )

    details: Optional[dict[str, Any]] = await get_details(session, record.id)
    return details, None


async def delete(
    session: AsyncSession,
    record: SackRegistration,
    current_user_name: str,
    ip_address: str | None = None,
    page_name: str = "sack_registration",
) -> None:
    summary = f"Sack {record.id}, {record.sack_in_kg}kg"
    await audit_crud.log_delete(
        session,
        page_name=page_name,
        record_id=record.id if record.id is not None else "unknown",
        summary=summary,
        user_name=current_user_name,
        ip_address=ip_address,
    )
    await session.delete(record)
    await session.commit()
