from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import date, datetime
from app.core.config import CAMBODIA_TZ

class TobaccoPurchase(SQLModel, table=True):
    __tablename__ = "tobacco_purchase"

    tp_id: Optional[int] = Field(default=None, primary_key=True)
    invoice_num: str = Field(max_length=255, index=True)
    buyer: Optional[int] = None
    vendor: Optional[str] = Field(default=None, max_length=255)
    v_addr: Optional[str] = Field(default=None, max_length=255)
    region: Optional[int] = None
    tp_date: date = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ).date())
    tp_note: Optional[str] = Field(default=None, max_length=255)
    user: Optional[str] = Field(default=None, max_length=255)
    closing: str = Field(default="NO", max_length=3)
    oven: Optional[int] = None
    rate: int = Field() # Required input
    do_date: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    ip_address: Optional[str] = Field(default=None)
    edit_user: str = Field(default="", max_length=50)
    edit_do_date: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    edit_ip_address: str = Field(default="")
    tobacco_item_count: Optional[int] = Field(default=None)
    total_net_weight: Optional[float] = Field(default=None)
    grand_total: Optional[float] = Field(default=None)

    def __str__(self):
        return self.invoice_num
