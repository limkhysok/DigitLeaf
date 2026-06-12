from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, col, func
from app.domains.farmers.models import MemberFarmer, Represent
from app.domains.farmer_contract.models import MfConYear
from app.domains.farmers.schemas import RepresentPublic

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
    skip: int = 0,
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
    result = await session.execute(stmt.offset(skip).limit(limit))
    return list(result.scalars().all())
