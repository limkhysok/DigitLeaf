from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, Field

# ── Vendor (Member Farmer by Buyer) ──────────────────────────────────────

class VendorItem(BaseModel):
    mf_id: int
    name: str
    mf_code: str
    address: Optional[str] = None

# ── Purchase Detail Schemas ───────────────────────────────────────────────

class PurchaseDetailBase(BaseModel):
    tobacco_name: int
    gross_weight: Optional[float] = None
    price: float
    remork_in_kg: Optional[float] = None
    sack_in_kg: Optional[float] = None
    CreatedDate: date = Field(default_factory=date.today)
    closing: str = "NO"
    buyer: int = 0
    oven: int = 0
    region: int = 0
    m_id: Optional[int] = None

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
    closing: Optional[str] = None
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
    closing: Optional[str] = None
    oven: Optional[int] = None
    rate: Optional[int] = None

class Purchase(PurchaseBase):
    tp_id: int
    user: Optional[str] = None
    do_date: datetime
    tobacco_item_count: Optional[int] = None
    total_net_weight: Optional[float] = None
    grand_total: Optional[float] = None
    details: List[PurchaseDetail] = []

    class Config:
        from_attributes = True

class PurchaseList(BaseModel):
    items: List[Purchase]
    total: int
