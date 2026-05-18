from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, Field, computed_field
from .constants import ClosingStatus

# ── Vendor (Member Farmer by Buyer) ──────────────────────────────────────

class VendorItem(BaseModel):
    mf_id: int
    name: str
    mf_code: str
    address: Optional[str] = None

class TobaccoItem(BaseModel):
    t_id: int
    t_name: str
    t_name_kh: Optional[str] = None

    class Config:
        from_attributes = True

# ── Purchase Detail Schemas ───────────────────────────────────────────────

class PurchaseDetailBase(BaseModel):
    tobacco_name: int
    gross_weight: Optional[float] = None
    price: float
    remork_in_kg: Optional[float] = None
    sack_in_kg: Optional[float] = None
    borrowed_leaf_kg: float = 0.0
    CreatedDate: date = Field(default_factory=date.today)
    closing: ClosingStatus = ClosingStatus.NO
    buyer: int = 0
    oven: int = 0
    region: int = 0
    m_id: Optional[int] = None
    picture: Optional[str] = None

class PurchaseDetailCreate(PurchaseDetailBase):
    pass

class PurchaseDetail(PurchaseDetailBase):
    tpd_id: int
    invoice_num: str
    total_amount: Optional[float] = None
    user: Optional[str] = None
    do_date: datetime

    class Config:
        from_attributes = True

# ── Purchase Schemas ──────────────────────────────────────────────────────

class PurchaseBase(BaseModel):
    invoice_num: Optional[str] = None
    buyer: Optional[int] = None
    vendor: Optional[str] = None
    v_addr: Optional[str] = None
    region: Optional[int] = None
    tp_date: date = Field(default_factory=date.today)
    tp_note: Optional[str] = None
    closing: ClosingStatus = ClosingStatus.NO
    oven: Optional[int] = None
    rate: int

class PurchaseCreate(PurchaseBase):
    details: List[PurchaseDetailCreate] = []

class PurchaseUpdate(BaseModel):
    buyer: Optional[int] = None
    vendor: Optional[str] = None
    v_addr: Optional[str] = None
    region: Optional[int] = None
    tp_date: Optional[date] = None
    tp_note: Optional[str] = None
    closing: Optional[ClosingStatus] = None
    oven: Optional[int] = None
    rate: Optional[int] = None
    details: Optional[List[PurchaseDetailCreate]] = None

class Purchase(PurchaseBase):
    tp_id: int
    user: Optional[str] = None
    do_date: datetime
    total_net_weight: Optional[float] = None
    grand_total: Optional[float] = None
    details: List[PurchaseDetail] = []

    @computed_field
    @property
    def tobacco_item_count(self) -> int:
        return len(self.details)

    class Config:
        from_attributes = True

class PurchaseList(BaseModel):
    items: List[Purchase]
    total: int

