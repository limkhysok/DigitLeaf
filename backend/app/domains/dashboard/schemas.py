from typing import Literal
from pydantic import BaseModel
from app.domains.sack_registration.schemas import SackRegistrationStats


class TodayPurchasesSummary(BaseModel):
    count: int
    net_weight_kg: float
    grand_total: float


class OutstandingRepaySummary(BaseModel):
    year: int
    today_repaid_kg: float
    today_repay_pct: float
    total_contracted: float
    total_repaid: float
    outstanding: float


class FarmerContractsSummary(BaseModel):
    year: int
    count: int
    total_land: float
    total_tobac_num: int
    prev_year_count: int
    yoy_change_pct: float


class DashboardSummary(BaseModel):
    today_purchases: TodayPurchasesSummary
    sack_registration: SackRegistrationStats
    outstanding_repay: OutstandingRepaySummary
    farmer_contracts: FarmerContractsSummary


class PurchaseTrendPoint(BaseModel):
    date: str
    net_weight_kg: float
    repay_weight_kg: float


class PurchaseTrendResponse(BaseModel):
    points: list[PurchaseTrendPoint]
    granularity: Literal["daily", "weekly", "monthly"]
    start_date: str
    end_date: str


class RecentActivityItem(BaseModel):
    type: Literal["purchase", "repay"]
    id: int
    date: str
    reference: str
    name: str
    qty_kg: float


class RecentActivityResponse(BaseModel):
    items: list[RecentActivityItem]
