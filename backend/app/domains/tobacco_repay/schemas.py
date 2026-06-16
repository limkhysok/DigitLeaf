from pydantic import BaseModel
from typing import List, Optional
from datetime import date as _date, datetime as _datetime


class TobaccoRepayItem(BaseModel):
    id: Optional[int]
    contract_number: Optional[str]
    contract_contractor_name: Optional[str]
    representative: Optional[str]
    contract_year: Optional[int]
    mf_con_id: Optional[int]
    f_id: Optional[int]
    farmer_name: Optional[str]
    tobacco_type: Optional[str]
    Quantity: Optional[float]
    total_repaid: Optional[float]


class TobaccoRepayListResponse(BaseModel):
    items: List[TobaccoRepayItem]
    total: int
    has_more: bool


class TContractRepayCreate(BaseModel):
    con_id: int
    con_num: str
    f_id: int
    repay_num: Optional[str] = None
    repay_date: _date
    qty_repay: float
    note: Optional[str] = None
    oven: Optional[int] = None


class TContractRepayRead(BaseModel):
    repay_id: Optional[int]
    con_id: Optional[int]
    con_num: Optional[str]
    f_id: Optional[int]
    repay_num: Optional[str]
    repay_date: Optional[_date]
    qty_repay: Optional[float]
    note: Optional[str]
    user: Optional[str]
    do_date: Optional[_datetime]
