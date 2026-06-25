from datetime import date
from typing import Optional
from sqlmodel import Field, SQLModel
from sqlalchemy import Index


class MfConYear(SQLModel, table=True):
    __tablename__ = "mf_con_year"  # type: ignore[assignment]
    __table_args__ = (
        Index("ix_mf_con_year_mf_id_year", "mf_id", "year"),
    )

    mf_con_id: Optional[int] = Field(default=None, primary_key=True)
    mf_id: int = Field(index=True)
    mf_code: str
    t_id: int
    user: str
    do_date: date = Field(default_factory=date.today)
    ip_address: str = Field(default="")
    year: int = Field(index=True)
    land: Optional[float] = None
    tobac_num: Optional[int] = None
