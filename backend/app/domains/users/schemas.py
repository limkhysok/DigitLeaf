from pydantic import BaseModel, Field, ConfigDict
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


class RolePublic(BaseModel):
    name: str
    model_config = ConfigDict(from_attributes=True)


class UserPublic(BaseModel):
    id: int
    user_name: str
    role: Optional[RolePublic] = None
    totp_enabled: bool = False
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UserChangePassword(BaseModel):
    current_password: str = Field(..., description="The user's current password")
    new_password: str = Field(
        ..., min_length=8, max_length=128, description="The new password, min 8 characters"
    )

class UserAdminResetPassword(BaseModel):
    new_password: str = Field(
        ..., min_length=8, max_length=128, description="The new password, min 8 characters"
    )
