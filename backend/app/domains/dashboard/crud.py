from typing import Any, Literal
from datetime import date, datetime, timedelta
from fastapi import HTTPException
from sqlalchemy import Integer, cast as sa_cast
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func, col
from app.core.config import CAMBODIA_TZ
from app.domains.sack_registration import crud as sack_registration_crud
from app.domains.tobacco_purchase.models import TobaccoPurchase
from app.domains.tobacco_repay.models import TContract, TContractRepay
from app.domains.farmer_contract.models import MfConYear
from app.domains.farmers.models import MemberFarmer

TrendPreset = Literal["7d", "30d", "3m", "9m", "12m", "custom"]
PRESET_DAYS: dict[str, int] = {"7d": 7, "30d": 30, "3m": 90, "9m": 270, "12m": 365}


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
    prev_year = year - 1
    stmt = (
        select(
            MfConYear.year,
            func.count().label("count"),
            func.coalesce(func.sum(MfConYear.land), 0.0).label("total_land"),
            func.coalesce(func.sum(MfConYear.tobac_num), 0).label("total_tobac_num"),
        )
        .where(col(MfConYear.year).in_([year, prev_year]))
        .group_by(MfConYear.year)
    )
    rows = (await session.execute(stmt)).all()
    by_year = {row.year: row for row in rows}

    current = by_year.get(year)
    previous = by_year.get(prev_year)

    count = (current.count or 0) if current else 0
    prev_count = (previous.count or 0) if previous else 0

    if prev_count > 0:
        yoy_change_pct = round((count - prev_count) / prev_count * 100, 1)
    elif count > 0:
        yoy_change_pct = 100.0
    else:
        yoy_change_pct = 0.0

    return {
        "year": year,
        "count": count,
        "total_land": round(float(current.total_land), 2) if current else 0.0,
        "total_tobac_num": (current.total_tobac_num or 0) if current else 0,
        "prev_year_count": prev_count,
        "yoy_change_pct": yoy_change_pct,
    }


def _resolve_trend_range(
    preset: TrendPreset,
    start_date: date | None,
    end_date: date | None,
) -> tuple[date, date]:
    if preset == "custom":
        if start_date is None or end_date is None:
            raise HTTPException(status_code=400, detail="start_date and end_date are required for the custom preset")
        return (end_date, start_date) if start_date > end_date else (start_date, end_date)

    today = datetime.now(CAMBODIA_TZ).date()
    return today - timedelta(days=PRESET_DAYS[preset] - 1), today


def _trend_granularity(start_date: date, end_date: date) -> Literal["daily", "weekly", "monthly"]:
    span_days = (end_date - start_date).days + 1
    if span_days <= 31:
        return "daily"
    if span_days <= 120:
        return "weekly"
    return "monthly"


def _trend_bucket_key(d: date, granularity: Literal["daily", "weekly", "monthly"]) -> date:
    if granularity == "daily":
        return d
    if granularity == "weekly":
        return d - timedelta(days=d.weekday())
    return d.replace(day=1)


async def get_purchase_trend(
    session: AsyncSession,
    preset: TrendPreset = "7d",
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict[str, Any]:
    range_start, range_end = _resolve_trend_range(preset, start_date, end_date)

    purchase_stmt = (
        select(
            TobaccoPurchase.tp_date,
            func.coalesce(func.sum(TobaccoPurchase.total_net_weight), 0.0).label("net_weight_kg"),
        )
        .where(col(TobaccoPurchase.tp_date) >= range_start)
        .where(col(TobaccoPurchase.tp_date) <= range_end)
        .group_by(TobaccoPurchase.tp_date)
    )
    purchase_rows = (await session.execute(purchase_stmt)).all()
    purchase_by_date = {row.tp_date: float(row.net_weight_kg) for row in purchase_rows}

    repay_stmt = (
        select(
            TContractRepay.repay_date,
            func.coalesce(func.sum(TContractRepay.qty_repay), 0.0).label("repay_weight_kg"),
        )
        .where(col(TContractRepay.repay_date) >= range_start)
        .where(col(TContractRepay.repay_date) <= range_end)
        .group_by(TContractRepay.repay_date)
    )
    repay_rows = (await session.execute(repay_stmt)).all()
    repay_by_date = {row.repay_date: float(row.repay_weight_kg) for row in repay_rows}

    granularity = _trend_granularity(range_start, range_end)

    buckets: dict[date, dict[str, Any]] = {}
    current = range_start
    while current <= range_end:
        key = _trend_bucket_key(current, granularity)
        bucket = buckets.setdefault(key, {"date": key.isoformat(), "net_weight_kg": 0.0, "repay_weight_kg": 0.0})
        bucket["net_weight_kg"] += purchase_by_date.get(current, 0.0)
        bucket["repay_weight_kg"] += repay_by_date.get(current, 0.0)
        current += timedelta(days=1)

    points = [
        {
            "date": bucket["date"],
            "net_weight_kg": round(bucket["net_weight_kg"], 2),
            "repay_weight_kg": round(bucket["repay_weight_kg"], 2),
        }
        for bucket in sorted(buckets.values(), key=lambda b: b["date"])
    ]

    return {
        "points": points,
        "granularity": granularity,
        "start_date": range_start.isoformat(),
        "end_date": range_end.isoformat(),
    }


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
