from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime
from app.core.config import CAMBODIA_TZ


class SackRegistration(SQLModel, table=True):
    # Table 'dl_sack_registration'
    __tablename__ = "dl_sack_registration"  # type: ignore[assignment]
    # PK
    id: Optional[int] = Field(default=None, primary_key=True)
    # Properties
    sack_in_kg: Optional[float] = Field(default=None)
    notes: Optional[str] = Field(default=None, max_length=500)
    dl_user_name: str = Field(max_length=255)
    # FK
    represent_id: int = Field(index=True, foreign_key="represent.represent_id")
    farmer_id: int = Field(index=True, foreign_key="member_farmer.mf_id")
    dl_user_id: int = Field(foreign_key="dl_user.id", index=True)
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))

    def __str__(self):
        return str(self.id)
