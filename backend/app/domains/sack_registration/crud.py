from typing import Optional
from datetime import datetime, date
from sqlalchemy import cast, Date, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, col
from app.core.config import CAMBODIA_TZ
from app.domains.sack_registration.models import SackRegistration, Represent, MemberFarmer, MfConYear
from app.domains.sack_registration.schemas import SackRegistrationCreate, SackRegistrationUpdate, RepresentPublic

_ACTIVE_YEAR = 2026
_ACTIVE_JOIN = (col(MfConYear.mf_id) == col(MemberFarmer.mf_id)) & (MfConYear.year == _ACTIVE_YEAR)


async def get_represents(session: AsyncSession) -> list[RepresentPublic]:
    result = await session.execute(
        select(
            col(Represent.represent_id),
            Represent.represent_name,
            func.count(col(MemberFarmer.mf_id)).label("farmer_count"),
        )
        .join(MemberFarmer, col(MemberFarmer.represent) == col(Represent.represent_id))
        .join(MfConYear, _ACTIVE_JOIN)
        .where(Represent.do_not_show == 0)
        .group_by(col(Represent.represent_id), Represent.represent_name)
        .order_by(Represent.represent_name)
    )
    rows = result.all()
    return [
        RepresentPublic(represent_id=r[0], represent_name=r[1], farmer_count=r[2])
        for r in rows
    ]


async def search_member_farmer(
    session: AsyncSession,
    name: Optional[str] = None,
    identity_card: Optional[str] = None,
) -> Optional[MemberFarmer]:
    base = select(MemberFarmer).join(MfConYear, _ACTIVE_JOIN)
    if identity_card:
        result = await session.execute(base.where(MemberFarmer.mf_code == identity_card))
        farmer = result.scalars().first()
        if farmer:
            return farmer
    if name:
        result = await session.execute(base.where(MemberFarmer.name == name))
        return result.scalars().first()
    return None


async def query_member_farmers(
    session: AsyncSession,
    query: str,
    represent_id: Optional[int] = None,
    limit: int = 10,
) -> list[MemberFarmer]:
    stmt = (
        select(MemberFarmer)
        .join(MfConYear, _ACTIVE_JOIN)
        .where(
            col(MemberFarmer.name).ilike(f"%{query}%") | col(MemberFarmer.mf_code).ilike(f"%{query}%")
        )
        .distinct()
    )
    if represent_id is not None:
        stmt = stmt.where(MemberFarmer.represent == represent_id)
    result = await session.execute(stmt.limit(limit))
    return list(result.scalars().all())


async def get_by_id(session: AsyncSession, sack_id: int) -> Optional[SackRegistration]:
    result = await session.execute(select(SackRegistration).where(SackRegistration.id == sack_id))
    return result.scalars().first()


async def get_all(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 200,
    search: Optional[str] = None,
    status: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> tuple[list[SackRegistration], int]:
    stmt = select(SackRegistration)
    count_stmt = select(func.count()).select_from(SackRegistration)

    if search:
        pattern = f"%{search}%"
        cond = (
            col(SackRegistration.member_farmer_name).ilike(pattern)
            | col(SackRegistration.represent_name).ilike(pattern)
        )
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    if status is not None:
        stmt = stmt.where(SackRegistration.status == status)
        count_stmt = count_stmt.where(SackRegistration.status == status)

    if date_from is not None:
        stmt = stmt.where(cast(SackRegistration.registered_at, Date) >= date_from)
        count_stmt = count_stmt.where(cast(SackRegistration.registered_at, Date) >= date_from)

    if date_to is not None:
        stmt = stmt.where(cast(SackRegistration.registered_at, Date) <= date_to)
        count_stmt = count_stmt.where(cast(SackRegistration.registered_at, Date) <= date_to)

    stmt = stmt.order_by(col(SackRegistration.created_at).desc())

    total = (await session.scalar(count_stmt)) or 0
    result = await session.execute(stmt.offset(skip).limit(limit))
    items = list(result.scalars().all())
    return items, total


async def get_status_counts(
    session: AsyncSession,
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> dict[str, int]:
    stmt = select(SackRegistration.status, func.count().label("cnt")).select_from(SackRegistration)

    if search:
        pattern = f"%{search}%"
        cond = (
            col(SackRegistration.member_farmer_name).ilike(pattern)
            | col(SackRegistration.represent_name).ilike(pattern)
        )
        stmt = stmt.where(cond)

    if date_from is not None:
        stmt = stmt.where(cast(SackRegistration.registered_at, Date) >= date_from)

    if date_to is not None:
        stmt = stmt.where(cast(SackRegistration.registered_at, Date) <= date_to)

    stmt = stmt.group_by(col(SackRegistration.status))
    result = await session.execute(stmt)
    rows = result.all()

    counts: dict[int, int] = {0: 0, 1: 0, 2: 0}
    for row in rows:
        counts[row[0]] = row[1]  # type: ignore[index, assignment]

    return {
        "all": sum(counts.values()),
        "pending": counts[0],
        "approved": counts[1],
        "rejected": counts[2],
    }


async def create(
    session: AsyncSession,
    data: SackRegistrationCreate,
    current_user_id: int,
    current_user_name: str,
) -> tuple[Optional[SackRegistration], Optional[str]]:
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
        represent_name=represent.represent_name,
        member_farmer_id=farmer.mf_id,
        member_farmer_name=farmer.name,
        dl_user_id=current_user_id,
        dl_user_name=current_user_name,
        status=data.status,
        sack_in_kg=data.sack_in_kg,
        notes=data.notes,
    )
    if data.registered_at:
        record.registered_at = data.registered_at
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record, None


async def update(
    session: AsyncSession,
    record: SackRegistration,
    data: SackRegistrationUpdate,
) -> tuple[SackRegistration, Optional[str]]:
    update_data = data.model_dump(exclude_unset=True)

    if "member_farmer_identity_card" in update_data:
        farmer = await search_member_farmer(session, identity_card=update_data.pop("member_farmer_identity_card"))
        if not farmer:
            return record, "farmer_not_found"
        assert farmer.mf_id is not None
        record.member_farmer_id = farmer.mf_id
        record.member_farmer_name = farmer.name

    for key, value in update_data.items():
        setattr(record, key, value)

    record.updated_at = datetime.now(CAMBODIA_TZ)
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record, None


async def delete(session: AsyncSession, record: SackRegistration) -> None:
    await session.delete(record)
    await session.commit()
