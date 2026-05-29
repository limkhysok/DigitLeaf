from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, col, func
from .models.t_contract import TContract
from .models.t_contract_repay import TContractRepay
from .schemas import TContractRepayCreate
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

async def create_repayment(db: AsyncSession, obj_in: TContractRepayCreate) -> TContractRepay:
    stmt = select(TContract.con_id).where(TContract.con_num == obj_in.con_num)
    result = await db.execute(stmt)
    con_id = result.scalar_first()
    
    if not con_id:
        raise ValueError(f"Contract number {obj_in.con_num} not found")
        
    db_obj = TContractRepay(
        con_id=con_id,
        tobac_type=obj_in.tobac_type,
        qty_repay=obj_in.qty_repay
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_vendor_contracts(db: AsyncSession, vendor_id: int) -> List[dict]:
    mf = await db.get(MemberFarmer, vendor_id)
    if not mf:
        return []
    
    repay_subq = (
        select(
            TContractRepay.con_id,
            func.sum(TContractRepay.qty_repay).label("total_qty_repay")
        )
        .group_by(TContractRepay.con_id)
    ).subquery()

    stmt = (
        select(
            TContract,
            Tobacco.t_name,
            Tobacco.t_name_kh,
            func.coalesce(repay_subq.c.total_qty_repay, 0).label("total_repaid")
        )
        .where(TContract.contractor == mf.name)
        .outerjoin(Tobacco, TContract.tobac_type == Tobacco.t_id)
        .outerjoin(repay_subq, TContract.con_id == repay_subq.c.con_id)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    return [
        {
            **row.TContract.model_dump(),
            "t_name": row.t_name,
            "t_name_kh": row.t_name_kh,
            "total_repaid": row.total_repaid
        }
        for row in rows
    ]
