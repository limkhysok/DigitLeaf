from typing import Optional
from sqlmodel import Field, SQLModel

class Oven(SQLModel, table=True):
    __tablename__ = "ovens"

    id: Optional[int] = Field(default=None, primary_key=True)
    name_en: str = Field(max_length=255)
    name_kh: Optional[str] = Field(default=None)
    do_not_show: int = Field(default=0)
