from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship
from .role_permission import RolePermissionLink

if TYPE_CHECKING:
    from app.domains.rbac.models.permission import Permission

class Role(SQLModel, table=True):
    __tablename__ = "dl_role" # type: ignore[assignment]
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: Optional[str] = None

    permissions: List["Permission"] = Relationship(
        back_populates="roles",
        link_model=RolePermissionLink,
        sa_relationship_kwargs={"lazy": "noload"},
    )

    def __str__(self):
        return self.name
