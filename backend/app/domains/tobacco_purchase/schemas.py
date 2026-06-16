from typing import Any
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator
from .constants import ClosingStatus

# ── Vendor (Member Farmer by Buyer) ──────────────────────────────────────

class VendorItem(BaseModel):
    mf_id: int
    name: str
    mf_code: str
    address: str | None = None
    tobac_num: int | None = None
    purchased_weight: float | None = None

class TobaccoItem(BaseModel):
    t_id: int
    t_name: str
    t_name_kh: str | None = None

    model_config = ConfigDict(from_attributes=True)

# ── Purchase Detail Schemas ───────────────────────────────────────────────

class PurchaseDetailBase(BaseModel):
    tobacco_name: int
    gross_weight: float | None = None
    price: float
    remork_in_kg: float | None = None
    sack_in_kg: float | None = None
    farmer_own_sack: int = 0
    CreatedDate: date | None = Field(default_factory=date.today)
    closing: ClosingStatus = ClosingStatus.NO
    buyer: int = 0
    oven: int = 0
    region: int = 0
    m_id: int | None = None
    picture: str | None = None

    @field_validator("CreatedDate", mode="before")
    @classmethod
    def parse_zero_created_date(cls, v: Any) -> date | None:
        if str(v) == "0000-00-00":
            return None
        return v

class PurchaseDetailCreate(PurchaseDetailBase):
    pass

class PurchaseDetail(PurchaseDetailBase):
    tpd_id: int
    invoice_num: str
    total_amount: float | None = None
    user: str | None = None
    do_date: datetime | None = None

    @field_validator("do_date", mode="before")
    @classmethod
    def parse_zero_date(cls, v: Any) -> datetime | None:
        if str(v) == "0000-00-00 00:00:00":
            return None
        return v

    model_config = ConfigDict(from_attributes=True)

class PurchaseReturnCreate(BaseModel):
    con_id: int
    tobac_type: int
    qty_repay: float

# ── Purchase Schemas ──────────────────────────────────────────────────────

class PurchaseBase(BaseModel):
    invoice_num: str | None = None
    buyer: int | None = None
    vendor_id: int | str | None = None
    v_addr: str | None = None
    region: int | None = None
    tp_date: date = Field(default_factory=date.today)
    tp_note: str | None = None
    closing: ClosingStatus = ClosingStatus.NO
    oven: int | None = None
    rate: int

class PurchaseCreate(PurchaseBase):
    details: list[PurchaseDetailCreate] = []
    returns: list[PurchaseReturnCreate] | None = None

class PurchaseUpdate(BaseModel):
    buyer: int | None = None
    vendor_id: int | str | None = None
    v_addr: str | None = None
    region: int | None = None
    tp_date: date | None = None
    tp_note: str | None = None
    closing: ClosingStatus | None = None
    oven: int | None = None
    rate: int | None = None
    details: list[PurchaseDetailCreate] | None = None
    returns: list[PurchaseReturnCreate] | None = None

class Purchase(PurchaseBase):
    tp_id: int
    user: str | None = None
    do_date: datetime | None = None
    total_net_weight: float | None = None
    grand_total: float | None = None
    vendor: Any | None = Field(default=None, exclude=True)
    details: list[PurchaseDetail] = []

    @computed_field
    @property
    def vendor_name(self) -> str | None:
        if self.vendor:
            return getattr(self.vendor, "name", None)
        if self.vendor_id and not str(self.vendor_id).isdigit():
            return str(self.vendor_id)
        return None

    @field_validator("do_date", mode="before")
    @classmethod
    def parse_zero_date(cls, v: Any) -> datetime | None:
        if str(v) == "0000-00-00 00:00:00":
            return None
        return v

    @computed_field
    @property
    def tobacco_item_count(self) -> int:
        return len(self.details)

    model_config = ConfigDict(from_attributes=True)

class PurchaseListItem(BaseModel):
    """Lean list-row schema — no detail records, count from SQL."""
    tp_id: int
    invoice_num: str | None = None
    buyer: int | None = None
    vendor_id: int | str | None = None
    vendor_name: str | None = None
    v_addr: str | None = None
    region: int | None = None
    tp_date: date = Field(default_factory=date.today)
    tp_note: str | None = None
    closing: ClosingStatus = ClosingStatus.NO
    oven: int | None = None
    rate: int = 0
    user: str | None = None
    do_date: datetime | None = None
    total_net_weight: float | None = None
    grand_total: float | None = None
    tobacco_item_count: int = 0

    @field_validator("do_date", mode="before")
    @classmethod
    def parse_zero_date(cls, v: Any) -> datetime | None:
        if str(v) == "0000-00-00 00:00:00":
            return None
        return v

class PurchaseList(BaseModel):
    items: list[PurchaseListItem]
    total: int
    has_more: bool

class FormMetadataResponse(BaseModel):
    purchasers: list[Any]
    regions: list[Any]
    ovens: list[Any]
    tobacco_types: list[TobaccoItem]
