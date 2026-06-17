from typing import Any, cast
from datetime import date, datetime
from sqlalchemy import Select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func, col
from .models.con_tobacco import ConTobacco
from .models.t_contract import TContract
from .models.t_contract_return import TContractReturn
from .schemas import TContractRepayCreate
from app.domains.farmers.models.member_farmer import MemberFarmer
from app.domains.farmers.models.represent import Represent
from app.domains.tobacco_purchase.models.tobacco import Tobacco
from app.domains.farmer_contract.models.mf_con_year import MfConYear
from app.core.config import CAMBODIA_TZ

async def generate_repay_num(db: AsyncSession) -> str:
    today_str = datetime.now(CAMBODIA_TZ).strftime("%d%m%y")
    prefix = f"{today_str}-"

    statement = (
        select(TContractReturn.repay_num)
        .order_by(col(TContractReturn.repay_id).desc())
        .limit(1)
    )
    last_num = await db.scalar(statement)

    if last_num and "-" in last_num:
        try:
            last_seq = int(last_num.split("-")[-1])
            new_seq = last_seq + 1
        except (ValueError, IndexError):
            new_seq = 0
    else:
        new_seq = 0

    return f"{prefix}{new_seq:04d}"


async def get_tobacco_repays(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    year: int | None = None,
) -> dict[str, Any]:
    year_filter = (
        MfConYear.year == year
        if year is not None
        else MfConYear.year == func.year(func.curdate()) - 1
    )

    repay_subq = (
        select(
            TContractReturn.con_id,
            func.sum(TContractReturn.qty_repay).label("total_qty_repay"),
        )
        .group_by(TContractReturn.con_id)  # type: ignore[arg-type]
    ).subquery()

    count_stmt = (
        select(func.count(col(TContract.con_id).distinct()))
        .join(MemberFarmer, TContract.f_id == MemberFarmer.mf_id)  # type: ignore[arg-type]
        .join(
            MfConYear,
            (MfConYear.mf_id == TContract.f_id)  # type: ignore[arg-type]
            & (MfConYear.year == func.year(TContract.con_date)),
        )
        .where(year_filter)
    )
    total = await db.scalar(count_stmt) or 0

    stmt = cast(Select[Any], (
        select(  # type: ignore[call-overload]
            col(TContract.con_id).label("id"),
            col(TContract.con_num).label("contract_number"),
            col(TContract.contractor).label("contract_contractor_name"),
            col(Represent.represent_name).label("representative"),
            col(MfConYear.year).label("contract_year"),
            col(MfConYear.mf_con_id).label("mf_con_id"),
            col(TContract.f_id).label("f_id"),
            col(MemberFarmer.name).label("farmer_name"),
            col(ConTobacco.tobacco).label("tobacco_type"),
            func.sum(TContract.qty).label("Quantity"),
            func.coalesce(repay_subq.c.total_qty_repay, 0).label("total_repaid"),
        )
        .join(MemberFarmer, TContract.f_id == MemberFarmer.mf_id)  # type: ignore[arg-type]
        .join(  # type: ignore[arg-type]
            MfConYear,
            (MfConYear.mf_id == TContract.f_id)
            & (MfConYear.year == func.year(TContract.con_date)),
        )
        .outerjoin(Represent, TContract.represent == Represent.represent_id)  # type: ignore[arg-type]
        .outerjoin(ConTobacco, TContract.tobac_type == ConTobacco.t_id)  # type: ignore[arg-type]
        .outerjoin(repay_subq, TContract.con_id == repay_subq.c.con_id)  # type: ignore[arg-type]
        .where(year_filter)
        .group_by(  # type: ignore[arg-type]
            TContract.con_id,
            TContract.con_num,
            TContract.represent,
            Represent.represent_name,
            TContract.f_id,
            MemberFarmer.mf_id,
            MemberFarmer.name,
            MfConYear.mf_id,
            MfConYear.mf_con_id,
            TContract.contractor,
            MfConYear.year,
            TContract.tobac_type,
            ConTobacco.tobacco,
        )
        .order_by(col(TContract.f_id).desc())
        .limit(limit)
        .offset(skip)
    ))
    result = await db.execute(stmt)
    rows = result.all()

    items: list[dict[str, Any]] = [
        {
            "id": row.id,
            "contract_number": row.contract_number,
            "contract_contractor_name": row.contract_contractor_name,
            "representative": row.representative,
            "contract_year": row.contract_year,
            "mf_con_id": row.mf_con_id,
            "f_id": row.f_id,
            "farmer_name": row.farmer_name,
            "tobacco_type": row.tobacco_type,
            "Quantity": float(row.Quantity) if row.Quantity is not None else 0.0,
            "total_repaid": float(row.total_repaid) if row.total_repaid is not None else 0.0,
        }
        for row in rows
    ]
    return {"items": items, "total": total}

async def get_available_years(db: AsyncSession) -> list[int]:
    last_year = date.today().year - 1
    stmt = (
        select(MfConYear.year)
        .where(MfConYear.year <= last_year)
        .distinct()
        .order_by(MfConYear.year.desc())  # type: ignore[union-attr]
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def create_repay(
    db: AsyncSession,
    obj_in: TContractRepayCreate,
    user_name: str,
    ip_address: str | None = None,
) -> TContractReturn:
    contract = await db.get(TContract, obj_in.con_id)
    if not contract:
        raise ValueError(f"Contract id {obj_in.con_id} not found")

    db_obj = TContractReturn(
        con_id=obj_in.con_id,
        con_num=obj_in.con_num,
        f_id=obj_in.f_id,
        repay_num=obj_in.repay_num,
        repay_date=obj_in.repay_date,
        qty_repay=obj_in.qty_repay,
        note=obj_in.note,
        oven=obj_in.oven,
        user=user_name,
        do_date=datetime.now(),
        ip_address=ip_address,
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_vendor_contracts(db: AsyncSession, vendor_id: int) -> list[dict[str, Any]]:
    mf = await db.get(MemberFarmer, vendor_id)
    if not mf:
        return []

    repay_subq = (
        select(
            TContractReturn.con_id,
            func.sum(TContractReturn.qty_repay).label("total_qty_repay")
        )
        .group_by(TContractReturn.con_id)  # type: ignore[arg-type]
    ).subquery()

    stmt = (
        select(
            TContract,
            Tobacco.t_name,
            Tobacco.t_name_kh,
            func.coalesce(repay_subq.c.total_qty_repay, 0).label("total_returned")
        )
        .where(TContract.contractor == mf.name)
        .outerjoin(Tobacco, TContract.tobac_type == Tobacco.t_id)  # type: ignore[arg-type]
        .outerjoin(repay_subq, TContract.con_id == repay_subq.c.con_id)  # type: ignore[arg-type]
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            **row.TContract.model_dump(),
            "t_name": row.t_name,
            "t_name_kh": row.t_name_kh,
            "total_returned": row.total_returned
        }
        for row in rows
    ]


async def get_tobacco_repay_history(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    year: int | None = None,
) -> dict[str, Any]:
    year_filter = (
        MfConYear.year == year
        if year is not None
        else MfConYear.year == func.year(func.curdate()) - 1
    )

    count_stmt = (
        select(func.count(col(TContractReturn.repay_id)))
        .join(TContract, TContractReturn.con_id == TContract.con_id)  # type: ignore[arg-type]
        .join(
            MfConYear,
            (MfConYear.mf_id == TContract.f_id)  # type: ignore[arg-type]
            & (MfConYear.year == func.year(TContract.con_date)),
        )
        .where(year_filter)
    )
    total = await db.scalar(count_stmt) or 0

    stmt = cast(Select[Any], (
        select(  # type: ignore[call-overload]
            col(TContractReturn.repay_id).label("repay_id"),
            col(TContractReturn.repay_date).label("repay_date"),
            col(TContractReturn.repay_num).label("repay_num"),
            col(TContract.con_num).label("con_num"),
            col(MemberFarmer.name).label("farmer_name"),
            col(ConTobacco.tobacco).label("tobacco_type"),
            col(TContractReturn.qty_repay).label("qty_repay"),
            col(TContractReturn.note).label("note"),
            col(TContractReturn.user).label("user"),
            col(MfConYear.year).label("contract_year"),
        )
        .join(TContract, TContractReturn.con_id == TContract.con_id)  # type: ignore[arg-type]
        .join(MemberFarmer, TContract.f_id == MemberFarmer.mf_id)  # type: ignore[arg-type]
        .join(  # type: ignore[arg-type]
            MfConYear,
            (MfConYear.mf_id == TContract.f_id)
            & (MfConYear.year == func.year(TContract.con_date)),
        )
        .outerjoin(ConTobacco, TContract.tobac_type == ConTobacco.t_id)  # type: ignore[arg-type]
        .where(year_filter)
        .order_by(col(TContractReturn.repay_date).desc(), col(TContractReturn.repay_id).desc())
        .limit(limit)
        .offset(skip)
    ))
    result = await db.execute(stmt)
    rows = result.all()

    items: list[dict[str, Any]] = [
        {
            "repay_id": row.repay_id,
            "repay_date": row.repay_date,
            "repay_num": row.repay_num,
            "con_num": row.con_num,
            "farmer_name": row.farmer_name,
            "tobacco_type": row.tobacco_type,
            "qty_repay": float(row.qty_repay) if row.qty_repay is not None else 0.0,
            "note": row.note,
            "user": row.user,
            "contract_year": row.contract_year,
        }
        for row in rows
    ]
    return {"items": items, "total": total}
