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


class ContractRepayDetailItem(BaseModel):
    repay_id: int
    repay_date: _date | None
    repay_num: str | None
    qty_repay: float | None
    note: str | None
    user: str | None


class TobaccoRepayContractDetail(BaseModel):
    id: int | None
    contract_number: str | None
    contract_contractor_name: str | None
    representative: str | None
    contract_year: int | None
    farmer_name: str | None
    tobacco_type: str | None
    Quantity: float | None
    total_repaid: float | None
    repays: list[ContractRepayDetailItem]


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
    representative: str | None
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


class RepayHistoryDetail(RepayHistoryItem):
    con_id: int | None
    f_id: int | None
    oven: int | None
    edit_user: str | None
    edit_do_date: _datetime | None


class TContractRepayUpdate(BaseModel):
    repay_date: _date | None = None
    qty_repay: float | None = None
    note: str | None = None
    oven: int | None = None


class ConTobaccoItem(BaseModel):
    t_id: int
    tobacco: str | None
    group_id: int | None
    group_name: str | None


class TContractCreate(BaseModel):
    con_num: str | None = None
    contractor: str
    f_id: int
    tobac_type: int
    qty: float
    price: float
    con_date: _date
    rate: float | None = None
    year: int | None = None
    gender: str | None = None
    age: int | None = None
    home_num: str | None = None
    road_num: str | None = None
    village: str | None = None
    commune: str | None = None
    district: str | None = None
    province: str | None = None
    job: str | None = None
    identify_num: str | None = None
    identify_date: _date | None = None
    represent: str | None = None
    note: str | None = None
    repay: str | None = None


class TContractRead(BaseModel):
    con_id: int | None
    con_num: str | None
    contractor: str | None
    f_id: int | None
    tobac_type: int | None
    qty: float | None
    price: float | None
    rate: float | None
    year: int | None
    gender: str | None
    age: int | None
    home_num: str | None
    road_num: str | None
    village: str | None
    commune: str | None
    district: str | None
    province: str | None
    job: str | None
    identify_num: str | None
    identify_date: _date | None
    represent: str | None
    con_date: _date | None
    note: str | None
    repay: str | None
    user: str | None
    do_date: _datetime | None
