from typing import Optional
from sqlmodel import Field, SQLModel

class UserRoleLink(SQLModel, table=True):
    __tablename__ = "dl_user_role" # type: ignore[assignment]
    # `user` is a legacy MyISAM table, so it can't be a real FK target for an
    # InnoDB table (see dl_user_region) — kept as a loose reference instead.
    user_id: Optional[int] = Field(default=None, primary_key=True)
    role_id: Optional[int] = Field(default=None, foreign_key="dl_role.id", primary_key=True)
