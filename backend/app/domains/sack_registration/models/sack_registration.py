from sqlmodel import Field, SQLModel
from datetime import datetime
from app.core.config import CAMBODIA_TZ


class SackRegistration(SQLModel, table=True):
    # Table 'dl_sack_registration'
    __tablename__ = "dl_sack_registration"  # type: ignore[assignment]
    # PK
    id: int | None = Field(default=None, primary_key=True)
    # Properties
    sack_in_kg: float | None = Field(default=None)
    notes: str | None = Field(default=None, max_length=500)
    action_by: str = Field(max_length=255)
    # FK
    represent_id: int = Field(index=True, foreign_key="represent.represent_id")
    farmer_id: int = Field(index=True, foreign_key="member_farmer.mf_id")
    action_by_id: int = Field(index=True)
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ), index=True)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))

    def __str__(self):
        return str(self.id)
