from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field, ConfigDict, field_validator


class UserCreate(BaseModel):
    user_name: str = Field(
        ..., min_length=3, max_length=50, description="The username, 3-50 characters"
    )
    password: str = Field(
        ..., min_length=8, max_length=128, description="The password, min 8 characters"
    )
    access_type: str = Field(default="", max_length=255, description="Access level, e.g. 'all' for full access")
    login_type: str = Field(default="", max_length=255)
    regions: list[int] = Field(default_factory=list, description="reg_ids of the regions this user is assigned to")


class UserPublic(BaseModel):
    id: int
    user_name: str
    access_type: str
    login_type: str
    regions: list[int] = []
    do_date: datetime | None = None
    role_id: int | None = None
    role_name: str | None = None

    @field_validator("do_date", mode="before")
    @classmethod
    def parse_zero_date(cls, v: Any) -> datetime | None:
        if str(v) == "0000-00-00 00:00:00":
            return None
        return v

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    items: list[UserPublic]
    total: int
    has_more: bool


class UserRegionsUpdate(BaseModel):
    regions: list[int] = Field(default_factory=list)


class UserRoleUpdate(BaseModel):
    role_id: int


class RolePublic(BaseModel):
    id: int
    name: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)
