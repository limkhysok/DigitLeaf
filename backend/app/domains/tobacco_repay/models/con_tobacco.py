from typing import Optional
from sqlmodel import Field, SQLModel


class ConTobacco(SQLModel, table=True):
    __tablename__ = "con_tobacco"  # type: ignore[assignment]

    t_id: Optional[int] = Field(default=None, primary_key=True)
    tobacco: Optional[str] = Field(default=None, max_length=255)
