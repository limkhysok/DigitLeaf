from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, String
from datetime import date, datetime
from app.core.config import CAMBODIA_TZ
from .tobacco_purchase_detail import TobaccoPurchaseDetail
from ..constants import ClosingStatus
from app.domains.farmers.models.member_farmer import MemberFarmer

class TobaccoPurchase(SQLModel, table=True):
    __tablename__ = "tobacco_purchase" # type: ignore[assignment]

    tp_id: int | None = Field(default=None, primary_key=True)
    invoice_num: str = Field(max_length=255, index=True)
    buyer: int = Field(default=0)
    vendor_id: str | None = Field(default=None, sa_column=Column("vendor", String(255)))
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
    total_net_weight: float = Field(default=0.0, index=True)
    grand_total: float = Field(default=0.0, index=True)

    # Relationships
    # lazy="noload" prevents automatic selectin queries on every fetch.
    # Use explicit selectinload() in get_purchase() where details are needed.
    details: list["TobaccoPurchaseDetail"] = Relationship(
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "noload"}
    )
    vendor: MemberFarmer | None = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "foreign(TobaccoPurchase.vendor_id) == MemberFarmer.mf_id",
            "lazy": "noload"
        }
    )

    def __str__(self):
        return self.invoice_num

