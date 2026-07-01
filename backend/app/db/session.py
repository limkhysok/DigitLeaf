from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

assert settings.DATABASE_URL is not None, "DATABASE_URL must be set"
engine = create_async_engine(
    settings.DATABASE_URL, pool_size=20, max_overflow=30, pool_timeout=15
)
async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_session():
    async with async_session_maker() as session:
        yield session
