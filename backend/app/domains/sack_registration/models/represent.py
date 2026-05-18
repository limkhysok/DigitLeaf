from typing import Optional
from sqlmodel import Field, SQLModel


class Represent(SQLModel, table=True):
    __tablename__ = "represent" # type: ignore[assignment]

    represent_id: Optional[int] = Field(default=None, primary_key=True)
    represent_name: str = Field(max_length=255)
    p_id: Optional[int] = Field(default=None)
    do_not_show: int = Field(default=0)
