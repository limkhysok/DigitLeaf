import asyncio
from app.db.session import async_session_maker
from app.domains.tobacco_return.crud import get_vendor_contracts

async def main():
    async with async_session_maker() as session:
        for i in range(1, 10):
            contracts = await get_vendor_contracts(session, i)
            if contracts:
                print(f"Vendor {i}: {contracts}")

asyncio.run(main())
