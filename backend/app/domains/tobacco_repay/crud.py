from typing import Any, cast
from datetime import date, datetime
from sqlalchemy import Select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func, col
from .models.con_tobacco import ConTobacco
from .models.t_contract import TContract
from .models.t_contract_repay import TContractRepay
from .schemas import TContractRepayCreate, TContractCreate, TContractRepayUpdate
from app.domains.farmers.models.member_farmer import MemberFarmer
from app.domains.farmers.models.represent import Represent
from app.domains.tobacco_purchase.models.tobacco import Tobacco
from app.domains.farmer_contract.models.mf_con_year import MfConYear
from app.core.config import CAMBODIA_TZ

async def generate_repay_num(db: AsyncSession) -> str:
    today_str = datetime.now(CAMBODIA_TZ).strftime("%d%m%y")
    prefix = f"{today_str}-"

    statement = (
        select(TContractRepay.repay_num)
        .order_by(col(TContractRepay.repay_id).desc())
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


async def generate_contract_num(db: AsyncSession) -> str:
    today_str = datetime.now(CAMBODIA_TZ).strftime("%d%m%y")
    prefix = f"{today_str}-"

    statement = (
        select(TContract.con_num)
        .order_by(col(TContract.con_id).desc())
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
            TContractRepay.con_id,
            func.sum(TContractRepay.qty_repay).label("total_qty_repay"),
        )
        .group_by(TContractRepay.con_id)  # type: ignore[arg-type]
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
        .order_by(col(TContract.con_id).desc())
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
    current_year = date.today().year
    stmt = (
        select(MfConYear.year)
        .where(MfConYear.year <= current_year)
        .distinct()
        .order_by(MfConYear.year.desc())  # type: ignore[union-attr]
        .limit(7)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def create_repay(
    db: AsyncSession,
    obj_in: TContractRepayCreate,
    user_name: str,
    ip_address: str | None = None,
) -> TContractRepay:
    contract = await db.get(TContract, obj_in.con_id)
    if not contract:
        raise ValueError(f"Contract id {obj_in.con_id} not found")

    db_obj = TContractRepay(
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

async def get_repay_detail(db: AsyncSession, repay_id: int) -> dict[str, Any] | None:
    stmt = cast(Select[Any], (
        select(  # type: ignore[call-overload]
            col(TContractRepay.repay_id).label("repay_id"),
            col(TContractRepay.repay_date).label("repay_date"),
            col(TContractRepay.repay_num).label("repay_num"),
            col(TContractRepay.con_id).label("con_id"),
            col(TContractRepay.f_id).label("f_id"),
            col(TContractRepay.oven).label("oven"),
            col(TContract.con_num).label("con_num"),
            col(Represent.represent_name).label("representative"),
            col(MemberFarmer.name).label("farmer_name"),
            col(ConTobacco.tobacco).label("tobacco_type"),
            col(TContractRepay.qty_repay).label("qty_repay"),
            col(TContractRepay.note).label("note"),
            col(TContractRepay.user).label("user"),
            col(TContractRepay.edit_user).label("edit_user"),
            col(TContractRepay.edit_do_date).label("edit_do_date"),
            col(MfConYear.year).label("contract_year"),
        )
        .join(TContract, TContractRepay.con_id == TContract.con_id)  # type: ignore[arg-type]
        .join(MemberFarmer, TContract.f_id == MemberFarmer.mf_id)  # type: ignore[arg-type]
        .join(  # type: ignore[arg-type]
            MfConYear,
            (MfConYear.mf_id == TContract.f_id)
            & (MfConYear.year == func.year(TContract.con_date)),
        )
        .outerjoin(ConTobacco, TContract.tobac_type == ConTobacco.t_id)  # type: ignore[arg-type]
        .outerjoin(Represent, TContract.represent == Represent.represent_id)  # type: ignore[arg-type]
        .where(TContractRepay.repay_id == repay_id)
    ))
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        return None
    return {
        "repay_id": row.repay_id,
        "repay_date": row.repay_date,
        "repay_num": row.repay_num,
        "con_id": row.con_id,
        "f_id": row.f_id,
        "oven": row.oven,
        "con_num": row.con_num,
        "representative": row.representative,
        "farmer_name": row.farmer_name,
        "tobacco_type": row.tobacco_type,
        "qty_repay": float(row.qty_repay) if row.qty_repay is not None else 0.0,
        "note": row.note,
        "user": row.user,
        "edit_user": row.edit_user,
        "edit_do_date": row.edit_do_date,
        "contract_year": row.contract_year,
    }


async def update_repay(
    db: AsyncSession,
    repay_id: int,
    obj_in: TContractRepayUpdate,
    user_name: str,
    ip_address: str | None = None,
) -> TContractRepay:
    db_obj = await db.get(TContractRepay, repay_id)
    if not db_obj:
        raise ValueError(f"Repay id {repay_id} not found")

    update_data = obj_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)

    db_obj.edit_user = user_name
    db_obj.edit_do_date = datetime.now()
    db_obj.edit_ip_address = ip_address

    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def delete_repay(db: AsyncSession, repay_id: int) -> bool:
    db_obj = await db.get(TContractRepay, repay_id)
    if not db_obj:
        return False
    await db.delete(db_obj)
    await db.commit()
    return True


async def get_con_tobacco_types(db: AsyncSession) -> list[ConTobacco]:
    stmt = select(ConTobacco).order_by(col(ConTobacco.tobacco))
    result = await db.execute(stmt)
    return list(result.scalars().all())


def _fallback(value: Any, default: Any) -> Any:
    return default if value is None else value


async def create_contract(
    db: AsyncSession,
    obj_in: TContractCreate,
    user_name: str,
    ip_address: str | None = None,
) -> TContract:
    farmer = await db.get(MemberFarmer, obj_in.f_id)
    if not farmer:
        raise ValueError(f"Farmer id {obj_in.f_id} not found")

    tobacco_type = await db.get(ConTobacco, obj_in.tobac_type)
    if not tobacco_type:
        raise ValueError(f"Tobacco type id {obj_in.tobac_type} not found")

    con_num = obj_in.con_num or await generate_contract_num(db)
    existing = await db.scalar(select(TContract.con_id).where(TContract.con_num == con_num))
    if existing is not None:
        raise ValueError(f"Contract number '{con_num}' already exists")

    # t_contract has NOT NULL constraints (no DB defaults) on most columns; this dialog
    # only collects the business-relevant fields, so the demographic snapshot fields
    # default to empty values when not supplied.
    db_obj = TContract(
        con_num=con_num,
        contractor=obj_in.contractor,
        gender=_fallback(obj_in.gender, ""),
        age=_fallback(obj_in.age, 0),
        home_num=_fallback(obj_in.home_num, ""),
        road_num=_fallback(obj_in.road_num, ""),
        village=_fallback(obj_in.village, ""),
        commune=_fallback(obj_in.commune, ""),
        district=_fallback(obj_in.district, ""),
        province=_fallback(obj_in.province, ""),
        job=_fallback(obj_in.job, ""),
        identify_num=_fallback(obj_in.identify_num, ""),
        identify_date=_fallback(obj_in.identify_date, obj_in.con_date),
        represent=_fallback(obj_in.represent, ""),
        con_date=obj_in.con_date,
        note=_fallback(obj_in.note, ""),
        repay=_fallback(obj_in.repay, "NO"),
        tobac_type=obj_in.tobac_type,
        qty=obj_in.qty,
        price=obj_in.price,
        rate=_fallback(obj_in.rate, 0.0),
        f_id=obj_in.f_id,
        year=_fallback(obj_in.year, obj_in.con_date.year),
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
            TContractRepay.con_id,
            func.sum(TContractRepay.qty_repay).label("total_qty_repay")
        )
        .group_by(TContractRepay.con_id)  # type: ignore[arg-type]
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
        select(func.count(col(TContractRepay.repay_id)))
        .join(TContract, TContractRepay.con_id == TContract.con_id)  # type: ignore[arg-type]
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
            col(TContractRepay.repay_id).label("repay_id"),
            col(TContractRepay.repay_date).label("repay_date"),
            col(TContractRepay.repay_num).label("repay_num"),
            col(TContract.con_num).label("con_num"),
            col(Represent.represent_name).label("representative"),
            col(MemberFarmer.name).label("farmer_name"),
            col(ConTobacco.tobacco).label("tobacco_type"),
            col(TContractRepay.qty_repay).label("qty_repay"),
            col(TContractRepay.note).label("note"),
            col(TContractRepay.user).label("user"),
            col(MfConYear.year).label("contract_year"),
        )
        .join(TContract, TContractRepay.con_id == TContract.con_id)  # type: ignore[arg-type]
        .join(MemberFarmer, TContract.f_id == MemberFarmer.mf_id)  # type: ignore[arg-type]
        .join(  # type: ignore[arg-type]
            MfConYear,
            (MfConYear.mf_id == TContract.f_id)
            & (MfConYear.year == func.year(TContract.con_date)),
        )
        .outerjoin(ConTobacco, TContract.tobac_type == ConTobacco.t_id)  # type: ignore[arg-type]
        .outerjoin(Represent, TContract.represent == Represent.represent_id)  # type: ignore[arg-type]
        .where(year_filter)
        .order_by(col(TContractRepay.repay_date).desc(), col(TContractRepay.repay_id).desc())
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
            "representative": row.representative,
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
