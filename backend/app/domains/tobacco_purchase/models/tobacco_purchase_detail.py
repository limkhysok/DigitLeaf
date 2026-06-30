from sqlmodel import Field, SQLModel
from datetime import date, datetime
from app.core.config import CAMBODIA_TZ
from ..constants import ClosingStatus

class TobaccoPurchaseDetail(SQLModel, table=True):
    __tablename__ = "tobacco_purchase_detail" # type: ignore[assignment]

    tpd_id: int | None = Field(default=None, primary_key=True)
    invoice_num: str = Field(max_length=255, index=True)
    tobacco_name: int = Field(index=True) # Linked to tobacco.t_id
    qty: float = Field() # Required
    price: float = Field() # Required
    CreatedDate: date = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ).date())
    closing: ClosingStatus = Field(default=ClosingStatus.NO, max_length=3)
    buyer: int = Field(default=0)
    oven: int = Field(default=0)
    region: int = Field(default=0)
    # `tobacco_purchase` is a legacy MyISAM table; InnoDB can't enforce a FK
    # against a MyISAM parent, so this is a loose reference with no FK constraint.
    m_id: int = Field(index=True)
    user: str = Field(default="", max_length=50)
    do_date: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    ip_address: str = Field(default="")
    edit_user: str = Field(default="", max_length=50)
    edit_do_date: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    edit_ip_address: str = Field(default="")
    remork_in_kg: float = Field(default=0.0)
    sack_in_kg: float = Field(default=0.0)
    gross_weight: float = Field(default=0.0)
    total_amount: float = Field(default=0.0)
    picture: str | None = Field(default=None)
    farmer_own_sack: int = Field(default=0)



    def __str__(self):
        return f"{self.invoice_num} - {self.tpd_id}"
