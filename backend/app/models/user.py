from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

from app.core.config import CAMBODIA_TZ
from app.models.rbac import UserRoleLink
if TYPE_CHECKING:
    from app.models.rbac import Role

class UserBase(SQLModel):
    user_name: str = Field(max_length=255)
    access_type: str = Field(max_length=255, default="farmer")
    login_type: str = Field(max_length=255, default="system")
    user: str = Field(max_length=50, default="admin")
    do_date: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    ip_address: str = Field(default="127.0.0.1")
    edit_user: str = Field(max_length=50, default="admin")
    edit_do_date: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    edit_ip_address: str = Field(default="127.0.0.1")

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    password: str = Field(max_length=255)
    
    roles: list["Role"] = Relationship(
        back_populates="users",
        link_model=UserRoleLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )
    
    # Profile & Status Fields (Sync with migration f35424d651c3)
    avatar_url: Optional[str] = Field(default=None, max_length=255)
    bio: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    refresh_token: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))

    # Authentication Fields (New)
    otp_code: Optional[str] = Field(default=None, max_length=6)
    otp_expiry: Optional[datetime] = Field(default=None)
    totp_secret: Optional[str] = Field(default=None, max_length=32)
    totp_enabled: bool = Field(default=False)

    def __str__(self):
        return self.user_name

class UserLogin(SQLModel):
    user_name: str
    password: str

class UserPublic(SQLModel):
    id: int
    user_name: str
    access_type: str
    login_type: str
    totp_enabled: bool = False
    do_date: datetime | str | None = None
