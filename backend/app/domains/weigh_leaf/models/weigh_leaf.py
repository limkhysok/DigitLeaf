from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel
from app.core.config import CAMBODIA_TZ


class WeighLeaf(SQLModel, table=True):
    __tablename__ = "dl_weigh_leaf"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Sack registration reference
    sack_registration_id: int = Field(foreign_key="dl_sack_registration.id", index=True)
    sack_in_kg: int

    # User who owns the sack (denormalized from sack_registration.dl_user_id)
    user_id: int = Field(index=True)
    user_name: str = Field(max_length=255)

    # Leaf type (denormalized from tobacco)
    leaf_type_id: int = Field(index=True)
    leaf_type_name: str = Field(max_length=255)

    # Input fields
    total_in_kg: float
    remork: int
    total_weight_in_kg: float

    # Created by (logged-in user)
    dl_user_id: int = Field(foreign_key="dl_user.id", index=True)
    dl_user_name: str = Field(max_length=255)

    created_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
