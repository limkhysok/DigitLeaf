from typing import Any, Optional, cast
from datetime import datetime, date
from sqlalchemy import cast as sa_cast, Date, Integer, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, col
from app.core.config import CAMBODIA_TZ
from app.domains.sack_registration.models import SackRegistration
from app.domains.farmers.models import Represent, MemberFarmer
from app.domains.farmers.crud import search_member_farmer
from app.domains.sack_registration.schemas import SackRegistrationCreate, SackRegistrationUpdate
from app.domains.tobacco_purchase.models import TobaccoPurchase, TobaccoPurchaseDetail


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
        .where(sa_cast(col(TobaccoPurchase.vendor_id), Integer).in_(farmer_ids))
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
    data["sack_in_kg"] = remaining
    return data


async def get_all(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 200,
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    sort_sack_in_kg: Optional[str] = None,
) -> tuple[list[dict[str, Any]], int]:
    stmt = (
        select(SackRegistration, Represent.represent_name, MemberFarmer.name, MemberFarmer.mf_code)
        .join(Represent, col(SackRegistration.represent_id) == col(Represent.represent_id))
        .join(MemberFarmer, col(SackRegistration.farmer_id) == col(MemberFarmer.mf_id))
    )
    if search:
        pattern = f"%{search}%"
        cond = (
            col(MemberFarmer.name).ilike(pattern)
            | col(MemberFarmer.mf_code).ilike(pattern)
            | col(Represent.represent_name).ilike(pattern)
        )
        stmt = stmt.where(cond)

    if date_from is not None:
        stmt = stmt.where(sa_cast(SackRegistration.created_at, Date) >= date_from)

    if date_to is not None:
        stmt = stmt.where(sa_cast(SackRegistration.created_at, Date) <= date_to)

    stmt = stmt.order_by(col(SackRegistration.created_at).desc())

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.scalar(count_stmt)) or 0
    result = await session.execute(stmt.offset(skip).limit(limit))

    raw_rows = result.all()
    farmer_ids = list({cast(tuple[SackRegistration, str, str, str], row)[0].farmer_id for row in raw_rows})
    sack_status = await _get_sack_status(session, farmer_ids)

    items: list[dict[str, Any]] = []
    for row in raw_rows:
        sack, r_name, f_name, mf_code = cast(tuple[SackRegistration, str, str, str], row)
        if sack.id is None:
            raise ValueError("SackRegistration has no id")
        _, remaining = sack_status.get(sack.id, (False, float(sack.sack_in_kg or 0.0)))
        data: dict[str, Any] = sack.model_dump()
        data["represent_name"] = r_name
        data["member_farmer_name"] = f_name
        data["member_farmer_mf_code"] = mf_code
        data["sack_in_kg"] = remaining
        items.append(data)

    if sort_sack_in_kg == "asc":
        items.sort(key=lambda x: (x["sack_in_kg"] is None, x["sack_in_kg"] or 0.0))
    elif sort_sack_in_kg == "desc":
        items.sort(key=lambda x: (x["sack_in_kg"] is None, -(x["sack_in_kg"] or 0.0)))

    return items, total


async def get_stats(session: AsyncSession) -> dict[str, Any]:
    now = datetime.now(CAMBODIA_TZ)
    today = now.date()
    reg_date = sa_cast(SackRegistration.created_at, Date)

    stats_stmt = select(
        func.count().label("total"),
        func.sum(case((reg_date == today, 1), else_=0)).label("today"),
        func.coalesce(func.sum(SackRegistration.sack_in_kg), 0.0).label("total_kg"),
        func.coalesce(
            func.sum(case((reg_date == today, SackRegistration.sack_in_kg), else_=None)),
            0.0,
        ).label("today_kg"),
    ).select_from(SackRegistration)

    row = (await session.execute(stats_stmt)).first()

    return {
        "registration_counts": {
            "total": (row.total or 0) if row else 0,
            "today": (row.today or 0) if row else 0,
        },
        "sack_weight_kg": {
            "total": round(float(row.total_kg), 2) if row else 0.0,
            "today": round(float(row.today_kg), 2) if row else 0.0,
        },
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

    farmer = await search_member_farmer(
        session,
        name=data.member_farmer_name,
        identity_card=data.member_farmer_identity_card,
    )
    if not farmer:
        return None, "farmer_not_found"
    if farmer.mf_id is None:
        raise ValueError("MemberFarmer record has no id")

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


async def update(
    session: AsyncSession,
    record: SackRegistration,
    data: SackRegistrationUpdate,
    current_user_id: int,
    current_user_name: str,
) -> tuple[Optional[dict[str, Any]], Optional[str]]:
    update_data = data.model_dump(exclude_unset=True)

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
        farmer = await search_member_farmer(session, identity_card=mf_code)
        if not farmer or str(farmer.represent) != str(effective_represent_id):
            return None, "farmer_not_found"
        if farmer.mf_id is None:
            raise ValueError("MemberFarmer record has no id")
        record.farmer_id = farmer.mf_id
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
    details: Optional[dict[str, Any]] = await get_details(session, record.id)
    return details, None


async def delete(session: AsyncSession, record: SackRegistration) -> None:
    await session.delete(record)
    await session.commit()
