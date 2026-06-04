from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime
from app.core.config import CAMBODIA_TZ

from sqlalchemy import Column, TEXT

class AuditLog(SQLModel, table=True):
    __tablename__ = "dl_audit_log"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="dl_user.id", index=True)
    endpoint: str = Field(max_length=255)
    method: str = Field(max_length=10)
    ip_address: Optional[str] = Field(default=None, max_length=50)
    user_agent: Optional[str] = Field(default=None, sa_column=Column(TEXT))
    created_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
