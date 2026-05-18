from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.domains.users.models.user import User

class UserMFA(SQLModel, table=True):
    __tablename__ = "dl_user_mfa"  # type: ignore[assignment]
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="dl_user.id", unique=True, index=True)
    otp_code: Optional[str] = Field(default=None, max_length=6)
    otp_expiry: Optional[datetime] = Field(default=None)
    totp_secret: Optional[str] = Field(default=None, max_length=32)
    totp_enabled: bool = Field(default=False)
    
    user: "User" = Relationship(back_populates="mfa")
