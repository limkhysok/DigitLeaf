from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    user_name: str = Field(
        ..., min_length=3, max_length=50, description="The username, 3-50 characters"
    )
    password: str = Field(
        ..., min_length=8, max_length=128, description="The password, min 8 characters"
    )
    role_name: str = Field(
        default="Farmer",
        min_length=1,
        max_length=50,
        description="The role name to assign",
    )


class UserPublic(BaseModel):
    id: int
    user_name: str
    totp_enabled: bool = False
    created_at: Optional[datetime] = None

    class ConfigDict:
        from_attributes = True
