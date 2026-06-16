from typing import Any, List, Optional
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func, col
from sqlalchemy import text
from .models.t_contract import TContract
from .models.t_contract_return import TContractReturn
from .schemas import TContractRepayCreate
from app.domains.farmers.models.member_farmer import MemberFarmer
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
    year: Optional[int] = None,
) -> dict[str, Any]:
    year_expr = ":year_val" if year is not None else "YEAR(CURDATE()) - 1"
    bind = {"skip": skip, "limit": limit}
    if year is not None:
        bind["year_val"] = year

    count_query = text(f"""
        SELECT COUNT(DISTINCT c.con_id)
        FROM kaic_db.t_contract AS c
        INNER JOIN kaic_db.member_farmer AS m ON c.f_id = m.mf_id
        INNER JOIN kaic_db.mf_con_year AS mcy ON mcy.mf_id = c.f_id AND mcy.year = YEAR(c.date)
        WHERE mcy.year = {year_expr}
    """)
    count_result = await db.execute(count_query, bind)
    total = count_result.scalar() or 0

    query = text(f"""
        SELECT
            c.con_id AS id,
            c.con_num AS contract_number,
            c.contractor AS contract_contractor_name,
            r.represent_name AS representative,
            mcy.year AS contract_year,
            mcy.mf_con_id,
            c.f_id,
            m.name AS farmer_name,
            t.tobacco AS tobacco_type,
            SUM(c.qty) AS Quantity,
            IFNULL(repay.total_qty_repay, 0) AS total_repaid
        FROM
            kaic_db.t_contract AS c
        INNER JOIN
            kaic_db.member_farmer AS m ON c.f_id = m.mf_id
        INNER JOIN
            kaic_db.mf_con_year AS mcy ON mcy.mf_id = c.f_id
            AND mcy.year = YEAR(c.date)
        LEFT JOIN
            kaic_db.represent AS r ON c.represent = r.represent_id
        LEFT JOIN
            kaic_db.con_tobacco AS t ON c.tobac_type = t.t_id
        LEFT JOIN (
            SELECT con_id, SUM(qty_repay) AS total_qty_repay
            FROM kaic_db.t_contract_repay
            GROUP BY con_id
        ) AS repay ON c.con_id = repay.con_id
        WHERE
            mcy.year = {year_expr}
        GROUP BY
            c.con_id,
            c.con_num,
            c.represent,
            r.represent_name,
            c.f_id,
            m.mf_id,
            m.name,
            mcy.mf_id,
            mcy.mf_con_id,
            c.contractor,
            mcy.year,
            c.tobac_type,
            t.tobacco
        ORDER BY
            c.f_id DESC
        LIMIT :limit OFFSET :skip
    """)
    result = await db.execute(query, bind)
    rows = result.fetchall()

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

async def get_available_years(db: AsyncSession) -> List[int]:
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
    ip_address: Optional[str] = None,
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
    year: Optional[int] = None,
) -> dict[str, Any]:
    year_expr = ":year_val" if year is not None else "YEAR(CURDATE()) - 1"
    bind = {"skip": skip, "limit": limit}
    if year is not None:
        bind["year_val"] = year

    count_query = text(f"""
        SELECT COUNT(r.repay_id)
        FROM kaic_db.t_contract_repay AS r
        INNER JOIN kaic_db.t_contract AS c ON r.con_id = c.con_id
        INNER JOIN kaic_db.mf_con_year AS mcy ON mcy.mf_id = c.f_id AND mcy.year = YEAR(c.date)
        WHERE mcy.year = {year_expr}
    """)
    count_result = await db.execute(count_query, bind)
    total = count_result.scalar() or 0

    query = text(f"""
        SELECT
            r.repay_id,
            r.date AS repay_date,
            r.repay_num,
            c.con_num,
            m.name AS farmer_name,
            t.tobacco AS tobacco_type,
            r.qty_repay,
            r.note,
            r.user
        FROM
            kaic_db.t_contract_repay AS r
        INNER JOIN kaic_db.t_contract AS c ON r.con_id = c.con_id
        INNER JOIN kaic_db.member_farmer AS m ON c.f_id = m.mf_id
        INNER JOIN kaic_db.mf_con_year AS mcy ON mcy.mf_id = c.f_id AND mcy.year = YEAR(c.date)
        LEFT JOIN kaic_db.con_tobacco AS t ON c.tobac_type = t.t_id
        WHERE
            mcy.year = {year_expr}
        ORDER BY
            r.date DESC, r.repay_id DESC
        LIMIT :limit OFFSET :skip
    """)
    result = await db.execute(query, bind)
    rows = result.fetchall()

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
        }
        for row in rows
    ]
    return {"items": items, "total": total}
