from typing import Optional
from sqlmodel import Field, SQLModel

class Purchaser(SQLModel, table=True):
    __tablename__ = "purchaser"

    p_id: Optional[int] = Field(default=None, primary_key=True)
    p_name: str = Field(max_length=255)
    p_name_kh: Optional[str] = Field(default=None, max_length=255)
    region: Optional[int] = Field(default=None)
    do_not_show: int = Field(default=0)
