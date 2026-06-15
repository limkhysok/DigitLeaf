from typing import Any, Optional, cast
from datetime import datetime, date
from sqlalchemy import cast as sa_cast, Date, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, col
from app.core.config import CAMBODIA_TZ
from app.domains.sack_registration.models import SackRegistration
from app.domains.farmers.models import Represent, MemberFarmer
from app.domains.farmers.crud import search_member_farmer
from app.domains.sack_registration.schemas import SackRegistrationCreate, SackRegistrationUpdate


async def get_by_id(session: AsyncSession, sack_id: int) -> Optional[SackRegistration]:
    result = await session.execute(select(SackRegistration).where(SackRegistration.id == sack_id))
    return result.scalars().first()


async def get_details(session: AsyncSession, sack_id: int) -> Optional[dict[str, Any]]:
    stmt = (
        select(SackRegistration, Represent.represent_name, MemberFarmer.name)
        .join(Represent, col(SackRegistration.represent_id) == col(Represent.represent_id))
        .join(MemberFarmer, col(SackRegistration.member_farmer_id) == col(MemberFarmer.mf_id))
        .where(SackRegistration.id == sack_id)
    )
    result = await session.execute(stmt)
    row = result.first()
    if not row:
        return None
    sack, r_name, f_name = cast(tuple[SackRegistration, str, str], row)
    data: dict[str, Any] = sack.model_dump()
    data["represent_name"] = r_name
    data["member_farmer_name"] = f_name
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
        select(SackRegistration, Represent.represent_name, MemberFarmer.name)
        .join(Represent, col(SackRegistration.represent_id) == col(Represent.represent_id))
        .join(MemberFarmer, col(SackRegistration.member_farmer_id) == col(MemberFarmer.mf_id))
    )
    count_stmt = select(func.count()).select_from(SackRegistration)

    if search:
        pattern = f"%{search}%"
        cond = (
            col(MemberFarmer.name).ilike(pattern)
            | col(Represent.represent_name).ilike(pattern)
        )
        stmt = stmt.where(cond)
        count_stmt = (
            count_stmt
            .join(Represent, col(SackRegistration.represent_id) == col(Represent.represent_id))
            .join(MemberFarmer, col(SackRegistration.member_farmer_id) == col(MemberFarmer.mf_id))
            .where(cond)
        )

    if date_from is not None:
        stmt = stmt.where(sa_cast(SackRegistration.registered_at, Date) >= date_from)
        count_stmt = count_stmt.where(sa_cast(SackRegistration.registered_at, Date) >= date_from)

    if date_to is not None:
        stmt = stmt.where(sa_cast(SackRegistration.registered_at, Date) <= date_to)
        count_stmt = count_stmt.where(sa_cast(SackRegistration.registered_at, Date) <= date_to)

    if sort_sack_in_kg == "asc":
        stmt = stmt.order_by(col(SackRegistration.sack_in_kg).is_(None), col(SackRegistration.sack_in_kg).asc(), col(SackRegistration.created_at).desc())
    elif sort_sack_in_kg == "desc":
        stmt = stmt.order_by(col(SackRegistration.sack_in_kg).is_(None), col(SackRegistration.sack_in_kg).desc(), col(SackRegistration.created_at).desc())
    else:
        stmt = stmt.order_by(col(SackRegistration.created_at).desc())

    total = (await session.scalar(count_stmt)) or 0
    result = await session.execute(stmt.offset(skip).limit(limit))

    items: list[dict[str, Any]] = []
    for row in result.all():
        sack, r_name, f_name = cast(tuple[SackRegistration, str, str], row)
        data: dict[str, Any] = sack.model_dump()
        data["represent_name"] = r_name
        data["member_farmer_name"] = f_name
        items.append(data)

    return items, total


async def get_stats(session: AsyncSession) -> dict[str, Any]:
    now = datetime.now(CAMBODIA_TZ)
    today = now.date()
    reg_date = sa_cast(SackRegistration.registered_at, Date)

    count_stmt = select(
        func.count().label("total"),
        func.sum(case((reg_date == today, 1), else_=0)).label("today"),
    ).select_from(SackRegistration)

    weight_stmt = select(
        func.coalesce(func.sum(SackRegistration.sack_in_kg), 0.0).label("total_kg"),
        func.coalesce(
            func.sum(case((reg_date == today, SackRegistration.sack_in_kg), else_=None)),
            0.0,
        ).label("today_kg"),
    ).select_from(SackRegistration)

    count_row = (await session.execute(count_stmt)).first()
    weight_row = (await session.execute(weight_stmt)).first()

    return {
        "registration_counts": {
            "total": (count_row.total or 0) if count_row else 0,
            "today": (count_row.today or 0) if count_row else 0,
        },
        "sack_weight_kg": {
            "total": round(float(weight_row.total_kg), 2) if weight_row else 0.0,
            "today": round(float(weight_row.today_kg), 2) if weight_row else 0.0,
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
    assert represent.represent_id is not None

    farmer = await search_member_farmer(
        session,
        name=data.member_farmer_name,
        identity_card=data.member_farmer_identity_card,
    )
    if not farmer:
        return None, "farmer_not_found"
    assert farmer.mf_id is not None

    record = SackRegistration(
        represent_id=represent.represent_id,
        member_farmer_id=farmer.mf_id,
        dl_user_id=current_user_id,
        dl_user_name=current_user_name,
        sack_in_kg=data.sack_in_kg,
        notes=data.notes,
    )
    if data.registered_at:
        record.registered_at = data.registered_at
    session.add(record)
    await session.commit()
    await session.refresh(record)

    assert record.id is not None
    details: Optional[dict[str, Any]] = await get_details(session, record.id)
    return details, None


async def update(
    session: AsyncSession,
    record: SackRegistration,
    data: SackRegistrationUpdate,
) -> tuple[Optional[dict[str, Any]], Optional[str]]:
    update_data = data.model_dump(exclude_unset=True)

    if "member_farmer_identity_card" in update_data:
        farmer = await search_member_farmer(session, identity_card=update_data.pop("member_farmer_identity_card"))
        if not farmer:
            return None, "farmer_not_found"
        assert farmer.mf_id is not None
        record.member_farmer_id = farmer.mf_id

    for key, value in update_data.items():
        setattr(record, key, value)

    record.updated_at = datetime.now(CAMBODIA_TZ)
    session.add(record)
    await session.commit()

    assert record.id is not None
    details: Optional[dict[str, Any]] = await get_details(session, record.id)
    return details, None


async def delete(session: AsyncSession, record: SackRegistration) -> None:
    await session.delete(record)
    await session.commit()
