from typing import Any
from datetime import datetime, timedelta
from sqlalchemy import Integer, cast as sa_cast
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func, col
from app.core.config import CAMBODIA_TZ
from app.domains.sack_registration import crud as sack_registration_crud
from app.domains.tobacco_purchase.models import TobaccoPurchase
from app.domains.tobacco_repay.models import TContract, TContractRepay
from app.domains.farmer_contract.models import MfConYear
from app.domains.farmers.models import MemberFarmer


async def _get_today_purchases(session: AsyncSession) -> dict[str, Any]:
    today = datetime.now(CAMBODIA_TZ).date()
    stmt = select(
        func.count().label("count"),
        func.coalesce(func.sum(TobaccoPurchase.total_net_weight), 0.0).label("net_weight_kg"),
        func.coalesce(func.sum(TobaccoPurchase.grand_total), 0.0).label("grand_total"),
    ).where(TobaccoPurchase.tp_date == today)
    row = (await session.execute(stmt)).first()
    return {
        "count": (row.count or 0) if row else 0,
        "net_weight_kg": round(float(row.net_weight_kg), 2) if row else 0.0,
        "grand_total": round(float(row.grand_total), 2) if row else 0.0,
    }


async def _get_outstanding_repay(session: AsyncSession) -> dict[str, Any]:
    contracted_stmt = select(
        func.count().label("contract_count"),
        func.coalesce(func.sum(TContract.qty), 0.0).label("total_contracted"),
    ).select_from(TContract)
    contracted_row = (await session.execute(contracted_stmt)).first()

    repaid_stmt = select(
        func.coalesce(func.sum(TContractRepay.qty_repay), 0.0).label("total_repaid"),
    ).select_from(TContractRepay)
    total_repaid = (await session.execute(repaid_stmt)).scalar() or 0.0

    total_contracted = float(contracted_row.total_contracted) if contracted_row else 0.0
    total_repaid = float(total_repaid)

    return {
        "contract_count": (contracted_row.contract_count or 0) if contracted_row else 0,
        "total_contracted": round(total_contracted, 2),
        "total_repaid": round(total_repaid, 2),
        "outstanding": round(max(0.0, total_contracted - total_repaid), 2),
    }


async def _get_farmer_contracts(session: AsyncSession, year: int) -> dict[str, Any]:
    stmt = select(
        func.count().label("count"),
        func.coalesce(func.sum(MfConYear.land), 0.0).label("total_land"),
        func.coalesce(func.sum(MfConYear.tobac_num), 0).label("total_tobac_num"),
    ).where(MfConYear.year == year)
    row = (await session.execute(stmt)).first()
    return {
        "year": year,
        "count": (row.count or 0) if row else 0,
        "total_land": round(float(row.total_land), 2) if row else 0.0,
        "total_tobac_num": (row.total_tobac_num or 0) if row else 0,
    }


async def get_purchase_trend(session: AsyncSession, days: int = 30) -> dict[str, Any]:
    end_date = datetime.now(CAMBODIA_TZ).date()
    start_date = end_date - timedelta(days=days - 1)

    stmt = (
        select(
            TobaccoPurchase.tp_date,
            func.coalesce(func.sum(TobaccoPurchase.total_net_weight), 0.0).label("net_weight_kg"),
        )
        .where(col(TobaccoPurchase.tp_date) >= start_date)
        .where(col(TobaccoPurchase.tp_date) <= end_date)
        .group_by(TobaccoPurchase.tp_date)
    )
    rows = (await session.execute(stmt)).all()
    by_date = {row.tp_date: round(float(row.net_weight_kg), 2) for row in rows}

    points: list[dict[str, Any]] = []
    current = start_date
    while current <= end_date:
        points.append({"date": current.isoformat(), "net_weight_kg": by_date.get(current, 0.0)})
        current += timedelta(days=1)

    return {"points": points}


async def get_recent_activity(session: AsyncSession, limit: int = 10) -> dict[str, Any]:
    purchase_stmt = (
        select(
            col(TobaccoPurchase.tp_id).label("id"),
            col(TobaccoPurchase.invoice_num).label("reference"),
            col(TobaccoPurchase.do_date).label("sort_date"),
            col(TobaccoPurchase.tp_date).label("display_date"),
            col(TobaccoPurchase.total_net_weight).label("qty_kg"),
            col(MemberFarmer.name).label("name"),
        )
        .outerjoin(MemberFarmer, sa_cast(TobaccoPurchase.vendor_id, Integer) == col(MemberFarmer.mf_id))
        .order_by(col(TobaccoPurchase.do_date).desc())
        .limit(limit)
    )
    purchase_rows = (await session.execute(purchase_stmt)).all()

    repay_stmt = (
        select(
            col(TContractRepay.repay_id).label("id"),
            col(TContractRepay.repay_num).label("reference"),
            col(TContractRepay.do_date).label("sort_date"),
            col(TContractRepay.repay_date).label("display_date"),
            col(TContractRepay.qty_repay).label("qty_kg"),
            col(MemberFarmer.name).label("name"),
        )
        .outerjoin(MemberFarmer, TContractRepay.f_id == col(MemberFarmer.mf_id))
        .order_by(col(TContractRepay.do_date).desc())
        .limit(limit)
    )
    repay_rows = (await session.execute(repay_stmt)).all()

    items: list[dict[str, Any]] = [
        {
            "type": "purchase",
            "id": row.id,
            "date": (row.sort_date or row.display_date).isoformat() if (row.sort_date or row.display_date) else "",
            "reference": row.reference or "",
            "name": row.name or "Unknown",
            "qty_kg": round(float(row.qty_kg), 2) if row.qty_kg is not None else 0.0,
        }
        for row in purchase_rows
    ] + [
        {
            "type": "repay",
            "id": row.id,
            "date": (row.sort_date or row.display_date).isoformat() if (row.sort_date or row.display_date) else "",
            "reference": row.reference or "",
            "name": row.name or "Unknown",
            "qty_kg": round(float(row.qty_kg), 2) if row.qty_kg is not None else 0.0,
        }
        for row in repay_rows
    ]
    items.sort(key=lambda x: x["date"], reverse=True)
    return {"items": items[:limit]}


async def get_summary(session: AsyncSession) -> dict[str, Any]:
    current_year = datetime.now(CAMBODIA_TZ).year
    return {
        "today_purchases": await _get_today_purchases(session),
        "sack_registration": await sack_registration_crud.get_stats(session),
        "outstanding_repay": await _get_outstanding_repay(session),
        "farmer_contracts": await _get_farmer_contracts(session, current_year),
    }
