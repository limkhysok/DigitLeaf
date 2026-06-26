from typing import TYPE_CHECKING, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.domains.users.models import User, UserRegion

if TYPE_CHECKING:
    from app.domains.tobacco_purchase.models import Region


async def get_user_by_username(session: AsyncSession, user_name: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.user_name == user_name))
    return result.scalars().first()


async def get_user_by_id(session: AsyncSession, user_id: int) -> Optional[User]:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalars().first()


async def list_users(session: AsyncSession) -> list[User]:
    result = await session.execute(select(User).order_by(User.user_name))
    return list(result.scalars().all())


async def get_regions_for_users(session: AsyncSession, user_ids: list[int]) -> dict[int, list[int]]:
    if not user_ids:
        return {}
    result = await session.execute(select(UserRegion).where(UserRegion.user_id.in_(user_ids)))
    regions_map: dict[int, list[int]] = {}
    for link in result.scalars().all():
        regions_map.setdefault(link.user_id, []).append(link.reg_id)
    return regions_map


async def set_user_regions(session: AsyncSession, user_id: int, region_ids: list[int]) -> None:
    existing = await session.execute(select(UserRegion).where(UserRegion.user_id == user_id))
    for link in existing.scalars().all():
        await session.delete(link)
    for reg_id in region_ids:
        session.add(UserRegion(user_id=user_id, reg_id=reg_id))
    await session.commit()


async def get_assignable_regions(session: AsyncSession) -> "list[Region]":
    # Deferred import: app.domains.tobacco_purchase's package __init__ eagerly imports its
    # api module, which imports app.api.deps, which imports this module — a top-level import
    # here would be circular.
    from app.domains.tobacco_purchase.models import Region

    result = await session.execute(
        select(Region).where(Region.do_not_show == 0, Region.w_id > 0)
    )
    return list(result.scalars().all())
