from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime
from app.core.config import CAMBODIA_TZ

from sqlalchemy import Column, TEXT

class AuditLog(SQLModel, table=True):
    """Maps to the pre-existing legacy `user_action` table (not managed by our migrations)."""
    __tablename__ = "user_action" # type: ignore

    id: Optional[int] = Field(default=None, primary_key=True)
    page_name: str = Field(sa_column=Column(TEXT, nullable=False))
    date: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    field_type: str = Field(default="", sa_column=Column(TEXT, nullable=False))
    old_value: str = Field(default="", sa_column=Column(TEXT, nullable=False))
    new_value: str = Field(default="", sa_column=Column(TEXT, nullable=False))
    user: str = Field(max_length=100)
    action: str = Field(max_length=50)
    log_on: str = Field(default="", max_length=50)
    ip_address: str = Field(default="", sa_column=Column(TEXT, nullable=False))
