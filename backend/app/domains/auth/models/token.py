from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime
from app.core.config import CAMBODIA_TZ

class UserToken(SQLModel, table=True):
    __tablename__ = "dl_user_token" # type: ignore[arg-type]
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="dl_user.id", index=True)
    user_name: str = Field(max_length=255, index=True)
    refresh_token: str = Field(max_length=512, index=True)
    ip_address: Optional[str] = Field(default=None, max_length=50)
    user_agent: Optional[str] = Field(default=None, max_length=512)
    created_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    expires_at: datetime
