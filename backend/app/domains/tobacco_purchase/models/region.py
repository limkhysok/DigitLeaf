from typing import Optional
from sqlmodel import Field, SQLModel

class Region(SQLModel, table=True):
    __tablename__ = "region" # type: ignore[assignment]

    reg_id: Optional[int] = Field(default=None, primary_key=True)
    reg_name: str = Field(max_length=255)
    reg_name_kh: Optional[str] = Field(default=None, max_length=255)
    do_not_show: int = Field(default=0)
