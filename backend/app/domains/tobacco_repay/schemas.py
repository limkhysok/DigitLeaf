from pydantic import BaseModel
from datetime import date as _date, datetime as _datetime


class TobaccoRepayItem(BaseModel):
    id: int | None
    contract_number: str | None
    contract_contractor_name: str | None
    representative: str | None
    contract_year: int | None
    mf_con_id: int | None
    f_id: int | None
    farmer_name: str | None
    tobacco_type: str | None
    Quantity: float | None
    total_repaid: float | None


class TobaccoRepayListResponse(BaseModel):
    items: list[TobaccoRepayItem]
    total: int
    has_more: bool


class TContractRepayCreate(BaseModel):
    con_id: int
    con_num: str
    f_id: int
    repay_num: str | None = None
    repay_date: _date
    qty_repay: float
    note: str | None = None
    oven: int | None = None


class TContractRepayRead(BaseModel):
    repay_id: int | None
    con_id: int | None
    con_num: str | None
    f_id: int | None
    repay_num: str | None
    repay_date: _date | None
    qty_repay: float | None
    note: str | None
    user: str | None
    do_date: _datetime | None


class RepayHistoryItem(BaseModel):
    repay_id: int
    repay_date: _date | None
    repay_num: str | None
    con_num: str | None
    farmer_name: str | None
    tobacco_type: str | None
    qty_repay: float | None
    note: str | None
    user: str | None
    contract_year: int | None


class RepayHistoryListResponse(BaseModel):
    items: list[RepayHistoryItem]
    total: int
    has_more: bool
