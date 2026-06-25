from typing import Any, Optional
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, col, func
from app.domains.farmer_contract.models import MfConYear
from app.domains.farmer_contract.schemas import FarmerContractCreate, FarmerContractUpdate, FarmerContractPatch
from app.domains.farmers.models import MemberFarmer
from app.domains.tobacco_purchase.models import TobaccoPurchase, Tobacco


async def get_farmer_contracts(
    session: AsyncSession,
    year: int = 2026,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
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
        col(MfConYear.do_date),
        col(MfConYear.t_id),
    ).join(MemberFarmer, col(MfConYear.mf_id) == col(MemberFarmer.mf_id)).outerjoin(
        weight_subquery, col(MemberFarmer.mf_id) == weight_subquery.c.vendor_id
    ).where(col(MfConYear.year) == year)

    if search:
        search_filter = (
            col(MemberFarmer.name).contains(search)
            | col(MemberFarmer.mf_code).contains(search)
        )
        base_stmt = base_stmt.where(search_filter)

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
            "do_date": r[8].isoformat() if r[8] is not None else None,
            "t_id": r[9],
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


async def get_farmer_contract(session: AsyncSession, mf_con_id: int) -> dict[str, Any] | None:
    contract = await session.get(MfConYear, mf_con_id)
    if contract is None:
        return None

    start_date = date(contract.year, 1, 1)
    end_date = date(contract.year, 12, 31)

    weight_subquery = (
        select(  # type: ignore[call-overload]
            col(TobaccoPurchase.vendor_id).label("vendor_id"),  # type: ignore[arg-type]
            func.sum(TobaccoPurchase.total_net_weight).label("total_weight"),
        )
        .where(TobaccoPurchase.tp_date >= start_date)
        .where(TobaccoPurchase.tp_date <= end_date)
        .group_by(TobaccoPurchase.vendor_id)
    ).subquery()

    stmt: Any = select(  # type: ignore[call-overload]
        col(MfConYear.mf_con_id),
        col(MfConYear.mf_id),
        col(MfConYear.year),
        col(MemberFarmer.name),
        col(MemberFarmer.mf_code),
        col(MfConYear.land),
        col(MfConYear.tobac_num),
        func.coalesce(weight_subquery.c.total_weight, 0.0),
        col(MfConYear.do_date),
        col(MfConYear.t_id),
    ).join(MemberFarmer, col(MfConYear.mf_id) == col(MemberFarmer.mf_id)).outerjoin(
        weight_subquery, col(MemberFarmer.mf_id) == weight_subquery.c.vendor_id
    ).where(col(MfConYear.mf_con_id) == mf_con_id)

    result = await session.execute(stmt)  # type: ignore[arg-type]
    row = result.one_or_none()  # type: ignore[union-attr]
    if row is None:
        return None

    return {
        "mf_con_id": row[0],
        "mf_id": row[1],
        "year": row[2],
        "name": row[3],
        "mf_code": row[4],
        "land": row[5],
        "tobac_num": row[6],
        "expected_yield": round(row[6] * 0.8, 2) if row[6] is not None else None,
        "purchased_weight": round(row[7], 2),
        "do_date": row[8].isoformat() if row[8] is not None else None,
        "t_id": row[9],
    }


async def create_farmer_contract(
    session: AsyncSession,
    data: FarmerContractCreate,
    current_user: Any,
    ip_address: str = "",
) -> MfConYear:
    farmer = await session.get(MemberFarmer, data.mf_id)
    if farmer is None:
        raise ValueError(f"Farmer with id {data.mf_id} not found")
    contract = MfConYear(
        mf_id=data.mf_id,
        mf_code=farmer.mf_code,
        t_id=data.t_id,
        user=current_user.user_name,
        ip_address=ip_address,
        year=data.year,
        land=data.land,
        tobac_num=data.tobac_num,
    )
    session.add(contract)
    await session.commit()
    await session.refresh(contract)
    return contract


async def update_farmer_contract(
    session: AsyncSession,
    mf_con_id: int,
    data: FarmerContractUpdate,
    current_user: Any,
    ip_address: str = "",
) -> MfConYear:
    contract = await session.get(MfConYear, mf_con_id)
    if contract is None:
        raise ValueError(f"Contract with id {mf_con_id} not found")

    if data.mf_id != contract.mf_id:
        farmer = await session.get(MemberFarmer, data.mf_id)
        if farmer is None:
            raise ValueError(f"Farmer with id {data.mf_id} not found")
        contract.mf_id = data.mf_id
        contract.mf_code = farmer.mf_code

    contract.t_id = data.t_id
    contract.year = data.year
    contract.land = data.land
    contract.tobac_num = data.tobac_num
    contract.user = current_user.user_name
    contract.ip_address = ip_address

    await session.commit()
    await session.refresh(contract)
    return contract


async def patch_farmer_contract(
    session: AsyncSession,
    mf_con_id: int,
    data: FarmerContractPatch,
    current_user: Any,
    ip_address: str = "",
) -> MfConYear:
    contract = await session.get(MfConYear, mf_con_id)
    if contract is None:
        raise ValueError(f"Contract with id {mf_con_id} not found")

    update_data = data.model_dump(exclude_unset=True)

    if "mf_id" in update_data and update_data["mf_id"] != contract.mf_id:
        farmer = await session.get(MemberFarmer, update_data["mf_id"])
        if farmer is None:
            raise ValueError(f"Farmer with id {update_data['mf_id']} not found")
        contract.mf_id = update_data["mf_id"]
        contract.mf_code = farmer.mf_code

    for field in ("t_id", "year", "land", "tobac_num"):
        if field in update_data:
            setattr(contract, field, update_data[field])

    contract.user = current_user.user_name
    contract.ip_address = ip_address

    await session.commit()
    await session.refresh(contract)
    return contract


async def delete_farmer_contract(session: AsyncSession, mf_con_id: int) -> None:
    contract = await session.get(MfConYear, mf_con_id)
    if contract is None:
        raise ValueError(f"Contract with id {mf_con_id} not found")
    await session.delete(contract)
    await session.commit()
