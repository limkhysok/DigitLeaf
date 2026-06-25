from typing import Any, cast
from datetime import date, datetime
from sqlalchemy import Select, cast as sa_cast, Integer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func, col
from .models.con_tobacco import ConTobacco
from .models.t_contract import TContract
from .models.t_contract_repay import TContractRepay
from .models.tobacco_groups import TobaccoGroup
from .schemas import TContractRepayCreate, TContractCreate, TContractRepayUpdate
from app.domains.farmers.models.member_farmer import MemberFarmer
from app.domains.farmers.models.represent import Represent
from app.domains.farmer_contract.models.mf_con_year import MfConYear
from app.core.config import CAMBODIA_TZ

async def generate_repay_num(db: AsyncSession) -> str:
    # Format: TR + DDMMYY + "-" + 2-digit daily sequence (e.g. TR200626-01).
    # FOR UPDATE locks today's repay_num range so concurrent repayments
    # serialize on the MAX() read instead of racing (InnoDB takes a gap lock
    # on the scanned index range even when no row for today exists yet).
    today = datetime.now(CAMBODIA_TZ).date()
    prefix = f"TR{today.strftime('%d%m%y')}-"
    last_num = await db.scalar(
        select(TContractRepay.repay_num)
        .where(col(TContractRepay.repay_num).like(f"{prefix}%"))
        .order_by(col(TContractRepay.repay_num).desc())
        .limit(1)
        .with_for_update()
    )
    seq = int(last_num.split("-")[-1]) + 1 if last_num else 1
    return f"{prefix}{seq:02d}"


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
    search: str | None = None,
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
        .outerjoin(Represent, TContract.represent == Represent.represent_id)  # type: ignore[arg-type]
        .where(year_filter)
    )
    if search:
        count_stmt = count_stmt.where(
            col(TContract.con_num).contains(search)
            | col(TContract.contractor).contains(search)
            | col(Represent.represent_name).contains(search)
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
    ))
    if search:
        stmt = stmt.where(
            col(TContract.con_num).contains(search)
            | col(TContract.contractor).contains(search)
            | col(Represent.represent_name).contains(search)
        )
    stmt = (
        stmt
        .group_by(
            col(TContract.con_id),
            col(TContract.con_num),
            col(TContract.represent),
            col(Represent.represent_name),
            col(TContract.f_id),
            col(MemberFarmer.mf_id),
            col(MemberFarmer.name),
            col(MfConYear.mf_id),
            col(MfConYear.mf_con_id),
            col(TContract.contractor),
            col(MfConYear.year),
            col(TContract.tobac_type),
            col(ConTobacco.tobacco),
        )
        .order_by(col(TContract.con_id).desc())
        .limit(limit)
        .offset(skip)
    )
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

async def get_contract_repay_detail(db: AsyncSession, con_id: int) -> dict[str, Any] | None:
    repay_subq = (
        select(
            TContractRepay.con_id,
            func.sum(TContractRepay.qty_repay).label("total_qty_repay"),
        )
        .group_by(TContractRepay.con_id)  # type: ignore[arg-type]
    ).subquery()

    stmt = cast(Select[Any], (
        select(  # type: ignore[call-overload]
            col(TContract.con_id).label("id"),
            col(TContract.con_num).label("contract_number"),
            col(TContract.contractor).label("contract_contractor_name"),
            col(Represent.represent_name).label("representative"),
            col(MfConYear.year).label("contract_year"),
            col(MemberFarmer.name).label("farmer_name"),
            col(ConTobacco.tobacco).label("tobacco_type"),
            col(TContract.qty).label("Quantity"),
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
        .where(TContract.con_id == con_id)
    ))
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        return None

    repays_stmt = cast(Select[Any], (
        select(  # type: ignore[call-overload]
            col(TContractRepay.repay_id).label("repay_id"),
            col(TContractRepay.repay_date).label("repay_date"),
            col(TContractRepay.repay_num).label("repay_num"),
            col(TContractRepay.qty_repay).label("qty_repay"),
            col(TContractRepay.note).label("note"),
            col(TContractRepay.user).label("user"),
        )
        .where(TContractRepay.con_id == con_id)
        .order_by(col(TContractRepay.repay_date).desc(), col(TContractRepay.repay_id).desc())
    ))
    repays_result = await db.execute(repays_stmt)
    repay_rows = repays_result.all()

    return {
        "id": row.id,
        "contract_number": row.contract_number,
        "contract_contractor_name": row.contract_contractor_name,
        "representative": row.representative,
        "contract_year": row.contract_year,
        "farmer_name": row.farmer_name,
        "tobacco_type": row.tobacco_type,
        "Quantity": float(row.Quantity) if row.Quantity is not None else 0.0,
        "total_repaid": float(row.total_repaid) if row.total_repaid is not None else 0.0,
        "repays": [
            {
                "repay_id": r.repay_id,
                "repay_date": r.repay_date,
                "repay_num": r.repay_num,
                "qty_repay": float(r.qty_repay) if r.qty_repay is not None else 0.0,
                "note": r.note,
                "user": r.user,
            }
            for r in repay_rows
        ],
    }


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

    total_repaid = await db.scalar(
        select(func.sum(TContractRepay.qty_repay)).where(TContractRepay.con_id == obj_in.con_id)
    ) or 0.0
    remaining = (contract.qty or 0.0) - total_repaid
    if obj_in.qty_repay > remaining:
        raise ValueError(
            f"Repay quantity ({obj_in.qty_repay} kg) exceeds remaining balance ({remaining} kg)"
        )

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

    if update_data.get("qty_repay") is not None:
        contract = await db.get(TContract, db_obj.con_id)
        if contract:
            total_repaid_others = await db.scalar(
                select(func.sum(TContractRepay.qty_repay))
                .where(TContractRepay.con_id == db_obj.con_id)
                .where(TContractRepay.repay_id != repay_id)
            ) or 0.0
            remaining = (contract.qty or 0.0) - total_repaid_others
            if update_data["qty_repay"] > remaining:
                raise ValueError(
                    f"Repay quantity ({update_data['qty_repay']} kg) exceeds remaining balance ({remaining} kg)"
                )

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


async def get_con_tobacco_types(db: AsyncSession) -> list[dict[str, Any]]:
    stmt = cast(Select[Any], (
        select(  # type: ignore[call-overload]
            col(ConTobacco.t_id).label("t_id"),  # type: ignore[arg-type]
            col(ConTobacco.tobacco).label("tobacco"),  # type: ignore[arg-type]
            col(TobaccoGroup.id).label("group_id"),  # type: ignore[arg-type]
            col(TobaccoGroup.name).label("group_name"),  # type: ignore[arg-type]
        )
        .outerjoin(TobaccoGroup, sa_cast(ConTobacco.tobacco_type, Integer) == TobaccoGroup.id)  # type: ignore[arg-type]
        .order_by(col(TobaccoGroup.name), col(ConTobacco.tobacco))
    ))
    result = await db.execute(stmt)
    rows = result.all()
    return [
        {
            "t_id": row.t_id,
            "tobacco": row.tobacco,
            "group_id": row.group_id,
            "group_name": row.group_name,
        }
        for row in rows
    ]


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

    stmt = cast(Select[Any], (
        select(  # type: ignore[call-overload]
            TContract,
            col(ConTobacco.tobacco).label("tobacco"),  # type: ignore[arg-type]
            col(TobaccoGroup.name).label("group_name"),  # type: ignore[arg-type]
            func.coalesce(repay_subq.c.total_qty_repay, 0).label("total_returned")
        )
        .where(TContract.contractor == mf.name)
        .outerjoin(ConTobacco, TContract.tobac_type == ConTobacco.t_id)  # type: ignore[arg-type]
        .outerjoin(TobaccoGroup, sa_cast(ConTobacco.tobacco_type, Integer) == TobaccoGroup.id)  # type: ignore[arg-type]
        .outerjoin(repay_subq, TContract.con_id == repay_subq.c.con_id)  # type: ignore[arg-type]
    ))
    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            **row.TContract.model_dump(),
            "tobacco": row.tobacco,
            "group_name": row.group_name,
            "total_returned": row.total_returned
        }
        for row in rows
    ]


async def get_tobacco_repay_history(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    year: int | None = None,
    representative_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    filters: list[Any] = []
    if year is not None:
        filters.append(MfConYear.year == year)
    if representative_id is not None:
        filters.append(Represent.represent_id == representative_id)
    if date_from is not None:
        filters.append(col(TContractRepay.repay_date) >= date_from)
    if date_to is not None:
        filters.append(col(TContractRepay.repay_date) <= date_to)
    if not filters:
        filters.append(MfConYear.year == func.year(func.curdate()) - 1)
    if search:
        filters.append(
            col(TContract.con_num).contains(search)
            | col(TContractRepay.repay_num).contains(search)
            | col(MemberFarmer.name).contains(search)
            | col(Represent.represent_name).contains(search)
        )

    count_stmt = (
        select(func.count(col(TContractRepay.repay_id)))
        .join(TContract, TContractRepay.con_id == TContract.con_id)  # type: ignore[arg-type]
        .join(MemberFarmer, TContract.f_id == MemberFarmer.mf_id)  # type: ignore[arg-type]
        .join(
            MfConYear,
            (MfConYear.mf_id == TContract.f_id)  # type: ignore[arg-type]
            & (MfConYear.year == func.year(TContract.con_date)),
        )
        .outerjoin(Represent, TContract.represent == Represent.represent_id)  # type: ignore[arg-type]
        .where(*filters)
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
        .where(*filters)
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


async def get_repay_report_data(
    db: AsyncSession,
    representative_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = 10_000,
) -> dict[str, Any]:
    """Assemble header info + one row per repay record for the repay history report."""
    result = await get_tobacco_repay_history(
        db,
        skip=0,
        limit=limit,
        representative_id=representative_id,
        date_from=date_from,
        date_to=date_to,
    )

    representative = None
    if representative_id is not None:
        represent = await db.get(Represent, representative_id)
        representative = represent.represent_name if represent else None

    return {
        "representative": representative,
        "date_from": date_from,
        "date_to": date_to,
        "report_date": datetime.now(CAMBODIA_TZ).date(),
        "rows": result["items"],
        "total": result["total"],
    }
