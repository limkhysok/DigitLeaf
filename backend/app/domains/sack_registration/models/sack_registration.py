from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime
from app.core.config import CAMBODIA_TZ


class SackRegistration(SQLModel, table=True):
    __tablename__ = "dl_sack_registration"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    # Represents table
    represent_id: int = Field(index=True)
    represent_name: str = Field(max_length=255)
    # farmer table
    member_farmer_id: int = Field(index=True)
    member_farmer_name: str = Field(max_length=255)
    # user table
    dl_user_id: int = Field(foreign_key="dl_user.id", index=True)
    dl_user_name: str = Field(max_length=255)

    ## default is 0 for status which mean pending, 1 for approved, 2 for rejected
    status: int = Field(default=0, index=True)

    sack_in_kg: Optional[float] = Field(default=None)
    notes: Optional[str] = Field(default=None, max_length=500)
    registered_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    created_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))

    def __str__(self):
        return str(self.id)
