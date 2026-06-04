from typing import Optional
from sqlmodel import Field, SQLModel


class MfConYear(SQLModel, table=True):
    __tablename__ = "mf_con_year"  # type: ignore[assignment]

    mf_con_id: Optional[int] = Field(default=None, primary_key=True)
    mf_id: int
    year: int
    land: Optional[float] = None
    tobac_num: Optional[int] = None
