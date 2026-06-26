from datetime import datetime
from typing import Optional
from sqlalchemy import Column, JSON, Text
from sqlmodel import Field, SQLModel

from app.core.config import CAMBODIA_TZ


class User(SQLModel, table=True):
    __tablename__ = "user" # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    user_name: str = Field(max_length=255, unique=True, index=True)
    password: str = Field(max_length=255)
    access_type: str = Field(default="", max_length=255)
    login_type: str = Field(default="", max_length=255)
    user: str = Field(default="", max_length=50)
    regions: list[int] = Field(default_factory=list, sa_column=Column("regions", JSON, nullable=False))
    do_date: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    ip_address: str = Field(default="", sa_column=Column("ip_address", Text, nullable=False))
    edit_user: str = Field(default="", max_length=50)
    edit_do_date: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    edit_ip_address: str = Field(default="", sa_column=Column("edit_ip_address", Text, nullable=False))

    def __str__(self):
        return self.user_name

    @property
    def is_full_access(self) -> bool:
        return self.access_type.strip().lower() == "all"
