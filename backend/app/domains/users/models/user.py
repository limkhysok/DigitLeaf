from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

from app.core.config import CAMBODIA_TZ

if TYPE_CHECKING:
    from app.domains.rbac.models.role import Role
    from app.domains.auth.models.mfa import UserMFA


class User(SQLModel, table=True):
    __tablename__ = "dl_user" # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    user_name: str = Field(max_length=255, unique=True, index=True)
    password: str = Field(max_length=255)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(CAMBODIA_TZ))

    role_id: Optional[int] = Field(default=None, foreign_key="dl_role.id")
    role: Optional["Role"] = Relationship(
        back_populates="users",
        sa_relationship_kwargs={"lazy": "selectin"},
    )

    mfa: Optional["UserMFA"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"uselist": False, "lazy": "selectin"},
    )

    def __str__(self):
        return self.user_name

    @property
    def totp_enabled(self) -> bool:
        return self.mfa.totp_enabled if self.mfa else False
