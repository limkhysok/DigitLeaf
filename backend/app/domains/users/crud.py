from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.domains.users.models import User


async def get_user_by_username(session: AsyncSession, user_name: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.user_name == user_name))
    return result.scalars().first()


async def get_user_by_id(session: AsyncSession, user_id: int) -> Optional[User]:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalars().first()


async def list_users(session: AsyncSession) -> list[User]:
    result = await session.execute(select(User).order_by(User.user_name))
    return list(result.scalars().all())
