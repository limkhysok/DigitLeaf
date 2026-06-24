from typing import Literal
from pydantic import BaseModel
from app.domains.sack_registration.schemas import SackRegistrationStats


class TodayPurchasesSummary(BaseModel):
    count: int
    net_weight_kg: float
    grand_total: float
    yesterday_net_weight_kg: float
    change_pct: float


class OutstandingRepaySummary(BaseModel):
    year: int
    today_repaid_kg: float
    today_repay_pct: float
    yesterday_repay_pct: float
    repay_change_pct: float
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


class PurchaseByBuyerItem(BaseModel):
    buyer_id: int
    buyer_name: str
    vendor_count: int


class PurchaseByBuyerResponse(BaseModel):
    year: int
    items: list[PurchaseByBuyerItem]


class PurchaseByTobaccoTypeItem(BaseModel):
    tobacco_id: int
    tobacco_name: str
    weight_kg: float


class PurchaseByTobaccoTypeResponse(BaseModel):
    year: int
    items: list[PurchaseByTobaccoTypeItem]
