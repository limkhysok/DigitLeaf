from typing import Optional
from sqlmodel import Field, SQLModel

class RolePermissionLink(SQLModel, table=True):
    __tablename__ = "dl_role_permission"
    role_id: Optional[int] = Field(default=None, foreign_key="dl_role.id", primary_key=True)
    permission_id: Optional[int] = Field(default=None, foreign_key="dl_permission.id", primary_key=True)
