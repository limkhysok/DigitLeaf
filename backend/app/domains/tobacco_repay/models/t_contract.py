from datetime import date as _date
from sqlalchemy import Column, Date
from sqlmodel import Field, SQLModel


class TContract(SQLModel, table=True):
    __tablename__ = "t_contract"  # type: ignore[assignment]

    con_id: int | None = Field(default=None, primary_key=True)
    con_num: str | None = Field(default=None, max_length=255)
    contractor: str | None = Field(default=None, max_length=255)
    represent: str | None = Field(default=None, max_length=255)
    tobac_type: int | None = Field(default=None)
    qty: float | None = Field(default=None)
    price: float | None = Field(default=None)
    note: str | None = Field(default=None, max_length=255)
    f_id: int | None = Field(default=None)
    con_date: _date | None = Field(default=None, sa_column=Column("date", Date, nullable=True))
