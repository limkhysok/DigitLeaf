from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime
from app.domains.auth.models import UserToken


async def get_by_refresh_token(session: AsyncSession, refresh_token: str) -> Optional[UserToken]:
    result = await session.execute(select(UserToken).where(UserToken.refresh_token == refresh_token))
    return result.scalars().first()


async def create_user_token(
    session: AsyncSession,
    user_id: int,
    user_name: str,
    refresh_token: str,
    expires_at: datetime,
    ip_address: str = None,
    user_agent: str = None,
) -> UserToken:
    db_token = UserToken(
        user_id=user_id,
        user_name=user_name,
        refresh_token=refresh_token,
        expires_at=expires_at,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    session.add(db_token)
    await session.commit()
    await session.refresh(db_token)
    return db_token


async def delete_user_token(session: AsyncSession, user_name: str) -> None:
    result = await session.execute(select(UserToken).where(UserToken.user_name == user_name))
    tokens = result.scalars().all()
    for t in tokens:
        await session.delete(t)
    await session.commit()


async def delete_specific_token(session: AsyncSession, refresh_token: str) -> None:
    result = await session.execute(select(UserToken).where(UserToken.refresh_token == refresh_token))
    token = result.scalars().first()
    if token:
        await session.delete(token)
        await session.commit()


async def get_user_tokens(session: AsyncSession, user_name: str) -> list[UserToken]:
    result = await session.execute(select(UserToken).where(UserToken.user_name == user_name))
    return list(result.scalars().all())
