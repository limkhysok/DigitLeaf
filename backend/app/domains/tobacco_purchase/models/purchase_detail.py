from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import date, datetime
from app.core.config import CAMBODIA_TZ

class TobaccoPurchaseDetail(SQLModel, table=True):
    __tablename__ = "tobacco_purchase_detail"

    tpd_id: Optional[int] = Field(default=None, primary_key=True)
    invoice_num: str = Field(max_length=255, index=True)
    tobacco_name: int = Field(index=True) # Linked to tobacco.t_id
    qty: float = Field() # Required
    price: float = Field() # Required
    CreatedDate: date = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ).date())
    closing: str = Field(default="NO", max_length=3)
    buyer: int = Field(default=0)
    oven: int = Field(default=0)
    region: int = Field(default=0)
    m_id: int = Field(index=True) # Linked to tobacco_purchase.tp_id
    user: Optional[str] = Field(default=None, max_length=50)
    do_date: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    ip_address: Optional[str] = Field(default=None)
    edit_user: str = Field(default="", max_length=50)
    edit_do_date: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    edit_ip_address: str = Field(default="")
    remork_in_kg: Optional[float] = Field(default=None)
    gross_weight: Optional[float] = Field(default=None)
    total_amount: Optional[float] = Field(default=None)

    def __str__(self):
        return f"{self.invoice_num} - {self.tpd_id}"
