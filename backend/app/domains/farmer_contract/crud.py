from typing import Any
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, col, func
from app.domains.farmer_contract.models import MfConYear
from app.domains.farmer_contract.schemas import FarmerContractCreate
from app.domains.farmers.models import MemberFarmer
from app.domains.tobacco_purchase.models import TobaccoPurchase, Tobacco


async def get_farmer_contracts(
    session: AsyncSession,
    year: int = 2026,
    skip: int = 0,
    limit: int = 20,
) -> dict[str, Any]:
    start_date = date(year, 1, 1)
    end_date = date(year, 12, 31)

    weight_subquery = (
        select(  # type: ignore[call-overload]
            col(TobaccoPurchase.vendor_id).label("vendor_id"),  # type: ignore[arg-type]
            func.sum(TobaccoPurchase.total_net_weight).label("total_weight"),
        )
        .where(TobaccoPurchase.tp_date >= start_date)
        .where(TobaccoPurchase.tp_date <= end_date)
        .group_by(TobaccoPurchase.vendor_id)
    ).subquery()

    base_stmt: Any = select(  # type: ignore[call-overload]
        col(MfConYear.mf_con_id),
        col(MfConYear.mf_id),
        col(MfConYear.year),
        col(MemberFarmer.name),
        col(MemberFarmer.mf_code),
        col(MfConYear.land),
        col(MfConYear.tobac_num),
        func.coalesce(weight_subquery.c.total_weight, 0.0),
    ).join(MemberFarmer, col(MfConYear.mf_id) == col(MemberFarmer.mf_id)).outerjoin(
        weight_subquery, col(MemberFarmer.mf_id) == weight_subquery.c.vendor_id
    ).where(col(MfConYear.year) == year)

    count_result = await session.execute(
        select(func.count()).select_from(base_stmt.subquery())  # type: ignore[arg-type]
    )
    total = count_result.scalar() or 0

    result = await session.execute(  # type: ignore[arg-type]
        base_stmt.order_by(col(MfConYear.mf_con_id).desc()).offset(skip).limit(limit)  # type: ignore[union-attr]
    )
    rows = result.all()  # type: ignore[union-attr]
    items: list[dict[str, Any]] = [
        {
            "mf_con_id": r[0],
            "mf_id": r[1],
            "year": r[2],
            "name": r[3],
            "mf_code": r[4],
            "land": r[5],
            "tobac_num": r[6],
            "expected_yield": round(r[6] * 0.8, 2) if r[6] is not None else None,
            "purchased_weight": round(r[7], 2),
        }
        for r in rows  # type: ignore[union-attr]
    ]
    return {"items": items, "total": total}


async def get_form_metadata(session: AsyncSession) -> dict[str, Any]:
    result = await session.execute(
        select(Tobacco)
        .where(Tobacco.discontinue == 0)
        .order_by(Tobacco.t_name)
    )
    tobaccos = result.scalars().all()
    return {
        "tobacco_types": [
            {"t_id": t.t_id, "t_name": t.t_name, "t_name_kh": t.t_name_kh}
            for t in tobaccos
        ]
    }


async def create_farmer_contract(
    session: AsyncSession,
    data: FarmerContractCreate,
) -> MfConYear:
    contract = MfConYear(
        mf_id=data.mf_id,
        year=data.year,
        land=data.land,
        tobac_num=data.tobac_num,
    )
    session.add(contract)
    await session.commit()
    await session.refresh(contract)
    return contract
