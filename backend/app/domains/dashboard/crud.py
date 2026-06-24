import unicodedata
from typing import Any, Literal, Sequence
from datetime import date, datetime, timedelta
from fastapi import HTTPException
from sqlalchemy import Integer, cast as sa_cast
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func, col
from app.core.config import CAMBODIA_TZ
from app.domains.sack_registration import crud as sack_registration_crud
from app.domains.tobacco_purchase.models import TobaccoPurchase, TobaccoPurchaseDetail, Tobacco
from app.domains.tobacco_purchase.models.purchaser import Purchaser
from app.domains.tobacco_repay.models import ConTobacco, TContract, TContractRepay, TobaccoGroup
from app.domains.farmer_contract.models import MfConYear
from app.domains.farmers.models import MemberFarmer

TrendPreset = Literal["7d", "30d", "3m", "9m", "12m", "custom"]
PRESET_DAYS: dict[str, int] = {"7d": 7, "30d": 30, "3m": 90, "9m": 270, "12m": 365}

def _clean_display_name(name: str) -> str:
    # Strip zero-width/invisible Unicode formatting chars (category "Cf", e.g. U+200B
    # ZERO WIDTH SPACE) that occasionally leak into legacy Khmer text fields and break
    # SVG text rendering — the whole label disappears instead of just looking odd.
    return "".join(c for c in name if unicodedata.category(c) != "Cf").strip()


def _common_prefix_len(strings: list[str]) -> int:
    length = 0
    for chars in zip(*strings):
        if len(set(chars)) > 1:
            break
        length += 1
    return length


def _disambiguate_tobacco_names(tobaccos: Sequence[Tobacco]) -> dict[int, str]:
    # Distinct sub-types can share an identical t_name_kh when that field wasn't kept
    # in sync with t_name — e.g. t_id=54 "BL (Fresh)" and t_id=811 "BL (Fresh) ជើង"
    # both have t_name_kh "សន្លឹកស្រស់ហាលម្លប់", making them look like a duplicate
    # bug in the chart. Disambiguate by appending whatever part of the English
    # t_name isn't shared across the colliding group.
    groups: dict[str, list[Tobacco]] = {}
    for t in tobaccos:
        if t.t_id is None:
            continue
        groups.setdefault(_clean_display_name(t.t_name_kh or t.t_name), []).append(t)

    names: dict[int, str] = {}
    for display_name, group in groups.items():
        if len(group) == 1:
            names[group[0].t_id] = display_name  # type: ignore[index]
            continue
        prefix_len = _common_prefix_len([t.t_name for t in group])
        for t in group:
            extra = t.t_name[prefix_len:].strip(" ()")
            names[t.t_id] = f"{display_name} ({extra})" if extra else display_name  # type: ignore[index]
    return names


async def _get_today_purchases(session: AsyncSession) -> dict[str, Any]:
    today = datetime.now(CAMBODIA_TZ).date()
    yesterday = today - timedelta(days=1)
    stmt = select(
        func.count().label("total_count"),
        func.coalesce(func.sum(TobaccoPurchase.total_net_weight), 0.0).label("net_weight_kg"),
        func.coalesce(func.sum(TobaccoPurchase.grand_total), 0.0).label("grand_total"),
    ).where(col(TobaccoPurchase.tp_date) == today)
    row = (await session.execute(stmt)).first()
    net_weight_kg = round(float(row.net_weight_kg), 2) if row else 0.0

    yesterday_net_weight_kg = await session.scalar(
        select(func.coalesce(func.sum(TobaccoPurchase.total_net_weight), 0.0)).where(
            col(TobaccoPurchase.tp_date) == yesterday
        )
    ) or 0.0
    yesterday_net_weight_kg = round(float(yesterday_net_weight_kg), 2)

    if yesterday_net_weight_kg > 0:
        change_pct = round((net_weight_kg - yesterday_net_weight_kg) / yesterday_net_weight_kg * 100, 1)
    elif net_weight_kg > 0:
        change_pct = 100.0
    else:
        change_pct = 0.0

    return {
        "count": (row.total_count or 0) if row else 0,
        "net_weight_kg": net_weight_kg,
        "grand_total": round(float(row.grand_total), 2) if row else 0.0,
        "yesterday_net_weight_kg": yesterday_net_weight_kg,
        "change_pct": change_pct,
    }


async def _get_outstanding_repay(session: AsyncSession, year: int) -> dict[str, Any]:
    # Mirrors the join structure used by tobacco_repay.crud.get_tobacco_repays: a contract's
    # "year" is the MfConYear row matching the farmer (f_id) and the contract date's year,
    # not the unreliable TContract.year column (legacy data defaults most rows to 2017).
    contracted_stmt = (
        select(func.coalesce(func.sum(TContract.qty), 0.0))
        .join(MemberFarmer, col(TContract.f_id) == col(MemberFarmer.mf_id))
        .join(
            MfConYear,
            (col(MfConYear.mf_id) == col(TContract.f_id))
            & (col(MfConYear.year) == func.year(TContract.con_date)),
        )
        .where(col(MfConYear.year) == year)
    )
    total_contracted = await session.scalar(contracted_stmt) or 0.0

    repaid_stmt = (
        select(func.coalesce(func.sum(TContractRepay.qty_repay), 0.0))
        .join(TContract, col(TContractRepay.con_id) == col(TContract.con_id))
        .join(MemberFarmer, col(TContract.f_id) == col(MemberFarmer.mf_id))
        .join(
            MfConYear,
            (col(MfConYear.mf_id) == col(TContract.f_id))
            & (col(MfConYear.year) == func.year(TContract.con_date)),
        )
        .where(col(MfConYear.year) == year)
    )
    total_repaid = await session.scalar(repaid_stmt) or 0.0

    today = datetime.now(CAMBODIA_TZ).date()
    yesterday = today - timedelta(days=1)
    today_repaid_kg = await session.scalar(repaid_stmt.where(col(TContractRepay.repay_date) == today)) or 0.0
    yesterday_repaid_kg = await session.scalar(repaid_stmt.where(col(TContractRepay.repay_date) == yesterday)) or 0.0

    total_contracted = float(total_contracted)
    total_repaid = float(total_repaid)
    today_repaid_kg = float(today_repaid_kg)
    yesterday_repaid_kg = float(yesterday_repaid_kg)
    today_repay_pct = round(today_repaid_kg / total_contracted * 100, 1) if total_contracted > 0 else 0.0
    yesterday_repay_pct = round(yesterday_repaid_kg / total_contracted * 100, 1) if total_contracted > 0 else 0.0
    repay_change_pct = round(today_repay_pct - yesterday_repay_pct, 1)

    return {
        "year": year,
        "today_repaid_kg": round(today_repaid_kg, 2),
        "today_repay_pct": today_repay_pct,
        "yesterday_repay_pct": yesterday_repay_pct,
        "repay_change_pct": repay_change_pct,
        "total_contracted": round(total_contracted, 2),
        "total_repaid": round(total_repaid, 2),
        "outstanding": round(max(0.0, total_contracted - total_repaid), 2),
    }


async def _get_farmer_contracts(session: AsyncSession, year: int) -> dict[str, Any]:
    prev_year = year - 1
    stmt = (
        select(
            MfConYear.year,
            func.count().label("total_count"),
            func.coalesce(func.sum(MfConYear.land), 0.0).label("total_land"),
            func.coalesce(func.sum(MfConYear.tobac_num), 0).label("total_tobac_num"),
        )
        .where(col(MfConYear.year).in_([year, prev_year]))
        .group_by(col(MfConYear.year))
    )
    rows = (await session.execute(stmt)).all()
    by_year = {row.year: row for row in rows}

    current = by_year.get(year)
    previous = by_year.get(prev_year)

    count = (current.total_count or 0) if current else 0
    prev_count = (previous.total_count or 0) if previous else 0

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
            col(TobaccoPurchase.tp_date),
            func.coalesce(func.sum(TobaccoPurchase.total_net_weight), 0.0).label("net_weight_kg"),
        )
        .where(col(TobaccoPurchase.tp_date) >= range_start)
        .where(col(TobaccoPurchase.tp_date) <= range_end)
        .group_by(col(TobaccoPurchase.tp_date))
    )
    purchase_rows = (await session.execute(purchase_stmt)).all()
    purchase_by_date = {row.tp_date: float(row.net_weight_kg) for row in purchase_rows}

    repay_stmt = (
        select(
            col(TContractRepay.repay_date),
            func.coalesce(func.sum(TContractRepay.qty_repay), 0.0).label("repay_weight_kg"),
        )
        .where(col(TContractRepay.repay_date) >= range_start)
        .where(col(TContractRepay.repay_date) <= range_end)
        .group_by(col(TContractRepay.repay_date))
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


async def get_purchase_by_buyer(session: AsyncSession, year: int) -> dict[str, Any]:
    # Only count vendors that are actual member farmers under contract for `year` (via
    # MfConYear) so the total reconciles with the farmer_contracts count for the same
    # year — raw tobacco_purchase.vendor_id also holds free-text names for walk-in
    # sellers with no farmer/contract record, which would otherwise inflate the count.
    vendor_mf_id = sa_cast(TobaccoPurchase.vendor_id, Integer)
    stmt = (
        select(
            TobaccoPurchase.buyer,
            func.count(func.distinct(vendor_mf_id)).label("vendor_count"),
        )
        .join(MemberFarmer, vendor_mf_id == col(MemberFarmer.mf_id))
        .join(
            MfConYear,
            (col(MfConYear.mf_id) == col(MemberFarmer.mf_id)) & (col(MfConYear.year) == year),
        )
        .where(func.year(TobaccoPurchase.tp_date) == year)
        .where(col(TobaccoPurchase.buyer) != 0)
        .group_by(col(TobaccoPurchase.buyer))
    )
    rows = (await session.execute(stmt)).all()

    buyer_ids = [row.buyer for row in rows]
    buyer_names: dict[int, str] = {}
    if buyer_ids:
        purchasers = (
            await session.execute(select(Purchaser).where(col(Purchaser.p_id).in_(buyer_ids)))
        ).scalars().all()
        buyer_names = {p.p_id: (p.p_name_kh or p.p_name) for p in purchasers if p.p_id is not None}

    items: list[dict[str, Any]] = [
        {
            "buyer_id": row.buyer,
            "buyer_name": buyer_names.get(row.buyer, str(row.buyer)),
            "vendor_count": row.vendor_count,
        }
        for row in rows
    ]
    items.sort(key=lambda x: x["vendor_count"], reverse=True)
    return {"year": year, "items": items}


async def get_purchase_by_tobacco_type(session: AsyncSession, year: int) -> dict[str, Any]:
    stmt = (
        select(
            TobaccoPurchaseDetail.tobacco_name,
            func.coalesce(func.sum(TobaccoPurchaseDetail.qty), 0.0).label("weight_kg"),
        )
        .join(TobaccoPurchase, col(TobaccoPurchaseDetail.m_id) == col(TobaccoPurchase.tp_id))
        .where(func.year(TobaccoPurchase.tp_date) == year)
        .group_by(col(TobaccoPurchaseDetail.tobacco_name))
    )
    rows = (await session.execute(stmt)).all()

    tobacco_ids = [row.tobacco_name for row in rows]
    tobacco_names: dict[int, str] = {}
    if tobacco_ids:
        tobaccos = (
            await session.execute(select(Tobacco).where(col(Tobacco.t_id).in_(tobacco_ids)))
        ).scalars().all()
        tobacco_names = _disambiguate_tobacco_names(tobaccos)

    items: list[dict[str, Any]] = [
        {
            "tobacco_id": row.tobacco_name,
            "tobacco_name": tobacco_names.get(row.tobacco_name, str(row.tobacco_name)),
            "weight_kg": round(float(row.weight_kg), 2),
        }
        for row in rows
    ]
    items.sort(key=lambda x: x["weight_kg"], reverse=True)
    return {"year": year, "items": items}


async def get_repay_by_tobacco_type(session: AsyncSession, year: int) -> dict[str, Any]:
    # Mirrors the join structure used by _get_outstanding_repay: a contract's "year" is
    # the MfConYear row matching the farmer (f_id) and the contract date's year, not
    # TContractRepay.repay_date — repays for a contract can land in the following year.
    stmt = (
        select(
            ConTobacco.t_id,
            ConTobacco.tobacco,
            TobaccoGroup.name,
            func.coalesce(func.sum(TContractRepay.qty_repay), 0.0).label("weight_kg"),
        )
        .select_from(TContractRepay)
        .join(TContract, col(TContractRepay.con_id) == col(TContract.con_id))
        .join(MemberFarmer, col(TContract.f_id) == col(MemberFarmer.mf_id))
        .join(
            MfConYear,
            (col(MfConYear.mf_id) == col(TContract.f_id))
            & (col(MfConYear.year) == func.year(TContract.con_date)),
        )
        .outerjoin(ConTobacco, col(TContract.tobac_type) == col(ConTobacco.t_id))
        .outerjoin(TobaccoGroup, sa_cast(ConTobacco.tobacco_type, Integer) == col(TobaccoGroup.id))
        .where(col(MfConYear.year) == year)
        .group_by(col(ConTobacco.t_id), col(ConTobacco.tobacco), col(TobaccoGroup.name))
    )
    rows = (await session.execute(stmt)).all()

    # con_tobacco has distinct t_id rows that share an identical display name (e.g. two
    # sub-types both labeled "សន្លឹកកណ្តាល"), which would otherwise render as duplicate
    # bars. Disambiguate using the tobacco_groups name, the only other field that varies
    # between them — same idea as _disambiguate_tobacco_names for the purchase chart.
    name_counts: dict[str, int] = {}
    for row in rows:
        name = row.tobacco or "Unknown"
        name_counts[name] = name_counts.get(name, 0) + 1

    items: list[dict[str, Any]] = [
        {
            "tobacco_id": row.t_id or 0,
            "tobacco_name": (
                f"{row.tobacco} ({row.name})"
                if row.tobacco and row.name and name_counts[row.tobacco] > 1
                else (row.tobacco or "Unknown")
            ),
            "weight_kg": round(float(row.weight_kg), 2),
        }
        for row in rows
    ]
    items.sort(key=lambda x: x["weight_kg"], reverse=True)
    return {"year": year, "items": items}


async def get_summary(session: AsyncSession) -> dict[str, Any]:
    current_year = datetime.now(CAMBODIA_TZ).year
    return {
        "today_purchases": await _get_today_purchases(session),
        "sack_registration": await sack_registration_crud.get_stats(session),
        "outstanding_repay": await _get_outstanding_repay(session, current_year - 1),
        "farmer_contracts": await _get_farmer_contracts(session, current_year),
    }
