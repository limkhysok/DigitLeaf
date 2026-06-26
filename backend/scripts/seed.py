"""Seed the 'limkhy' admin user if it doesn't already exist.

Run from backend/: python -m scripts.seed
"""
import asyncio
from datetime import datetime

from sqlmodel import select

from app.core.config import CAMBODIA_TZ
from app.db.session import async_session_maker, engine
from app.domains.users.models import User


async def seed_limkhy_user() -> None:
    async with async_session_maker() as session:
        existing = (
            await session.execute(select(User).where(User.user_name == "limkhy"))
        ).scalars().first()

        if existing:
            print("User 'limkhy' already exists, skipping.")
            return

        now = datetime.now(CAMBODIA_TZ)
        user = User(
            user_name="limkhy",
            password="limkhy123",
            access_type="all",
            login_type="1",
            user="",
            do_date=now,
            ip_address="",
            edit_user="",
            edit_do_date=now,
            edit_ip_address="",
            region=None,
        )
        session.add(user)
        await session.commit()
        print("Created user 'limkhy'.")


async def main() -> None:
    await seed_limkhy_user()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
