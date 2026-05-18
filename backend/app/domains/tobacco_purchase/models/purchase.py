from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import date, datetime
from app.core.config import CAMBODIA_TZ
from .purchase_detail import TobaccoPurchaseDetail
from ..constants import ClosingStatus

class TobaccoPurchase(SQLModel, table=True):
    __tablename__ = "tobacco_purchase" # type: ignore[assignment]

    tp_id: Optional[int] = Field(default=None, primary_key=True)
    invoice_num: str = Field(max_length=255, index=True)
    buyer: int = Field(default=0)
    vendor: str = Field(default="", max_length=255)
    v_addr: str = Field(default="", max_length=255)
    region: int = Field(default=0)
    tp_date: date = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ).date())
    tp_note: str = Field(default="", max_length=255)
    user: str = Field(default="", max_length=255)
    closing: ClosingStatus = Field(default=ClosingStatus.NO, max_length=3)
    oven: int = Field(default=0)

    rate: int = Field() # Required input
    do_date: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    ip_address: str = Field(default="")
    edit_user: str = Field(default="", max_length=50)
    edit_do_date: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    edit_ip_address: str = Field(default="")
    total_net_weight: float = Field(default=0.0)
    grand_total: float = Field(default=0.0)

    # Relationships
    details: List["TobaccoPurchaseDetail"] = Relationship(
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"}
    )

    def __str__(self):
        return self.invoice_num

