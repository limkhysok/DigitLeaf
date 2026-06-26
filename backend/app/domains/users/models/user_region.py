from typing import Optional
from sqlmodel import Field, SQLModel


class UserRegion(SQLModel, table=True):
    # No DB-level FK: `user`/`region` are legacy MyISAM tables, which don't support it.
    __tablename__ = "dl_user_region"  # type: ignore[assignment]
    user_id: Optional[int] = Field(default=None, primary_key=True)
    reg_id: Optional[int] = Field(default=None, primary_key=True)
