from typing import Optional
from sqlmodel import Field, SQLModel

class UserRoleLink(SQLModel, table=True):
    __tablename__ = "dl_user_role"
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)
    role_id: Optional[int] = Field(default=None, foreign_key="dl_role.id", primary_key=True)
