from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship
from .role_permission import RolePermissionLink

if TYPE_CHECKING:
    from app.domains.rbac.models.role import Role

class Permission(SQLModel, table=True):
    __tablename__ = "dl_permission"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: Optional[str] = None
    
    roles: List["Role"] = Relationship(
        back_populates="permissions",
        link_model=RolePermissionLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )

    def __str__(self):
        return self.name
