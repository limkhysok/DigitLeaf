from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, col, func
from .models.t_contract import TContract
from .models.t_contract_repay import TContractRepay
from app.domains.sack_registration.models.member_farmer import MemberFarmer
from app.domains.tobacco_purchase.models.tobacco import Tobacco

async def get_tobacco_repayments(db: AsyncSession, note: str = "2025") -> List[dict]:
    # Subquery for total_qty_repay
    repay_subq = (
        select(
            TContractRepay.con_id,
            func.sum(TContractRepay.qty_repay).label("total_qty_repay")
        )
        .group_by(TContractRepay.con_id)
    ).subquery()

    stmt = (
        select(
            TContract.con_id,
            TContract.con_num,
            TContract.contractor,
            TContract.represent,
            TContract.tobac_type,
            Tobacco.t_name,
            Tobacco.t_name_kh,
            TContract.qty,
            func.coalesce(repay_subq.c.total_qty_repay, 0).label("total_repaid"),
            TContract.price,
            TContract.note
        )
        .select_from(MemberFarmer)
        .join(
            TContract,
            (col(MemberFarmer.name).collate("utf8mb3_unicode_ci") == TContract.contractor) &
            (TContract.note == note)
        )
        .join(Tobacco, TContract.tobac_type == Tobacco.t_id)
        .outerjoin(repay_subq, TContract.con_id == repay_subq.c.con_id)
        .distinct()
    )
    result = await db.execute(stmt)
    rows = result.fetchall()
    
    return [
        {
            "con_id": row.con_id,
            "con_num": row.con_num,
            "contractor": row.contractor,
            "represent": row.represent,
            "tobac_type": row.tobac_type,
            "t_name": row.t_name,
            "t_name_kh": row.t_name_kh,
            "qty": row.qty,
            "total_repaid": row.total_repaid,
            "price": row.price,
            "note": row.note,
        }
        for row in rows
    ]

async def get_available_years(db: AsyncSession) -> List[str]:
    stmt = (
        select(TContract.note)
        .where(TContract.note.is_not(None))
        .distinct()
        .order_by(TContract.note.desc())
    )
    result = await db.execute(stmt)
    return [row for row in result.scalars().all() if str(row).isdigit()]
