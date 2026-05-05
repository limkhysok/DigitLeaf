from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship
from .role_permission import RolePermissionLink
from .user_role import UserRoleLink

if TYPE_CHECKING:
    from app.domains.rbac.models.permission import Permission
    from app.domains.users.models.user import User

class Role(SQLModel, table=True):
    __tablename__ = "dl_role"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: Optional[str] = None
    
    permissions: List["Permission"] = Relationship(
        back_populates="roles",
        link_model=RolePermissionLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )
    
    users: List["User"] = Relationship(
        back_populates="roles",
        link_model=UserRoleLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )

    def __str__(self):
        return self.name
