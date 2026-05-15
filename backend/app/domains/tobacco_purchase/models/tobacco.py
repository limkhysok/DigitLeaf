from typing import Optional
from sqlmodel import Field, SQLModel


class Tobacco(SQLModel, table=True):
    __tablename__ = "tobacco"

    t_id: Optional[int] = Field(default=None, primary_key=True)
    t_name: str = Field(max_length=255)
    t_name_kh: Optional[str] = Field(default=None, max_length=255)
    t_cate: int = Field(index=True)
    discontinue: int = Field(default=0)
