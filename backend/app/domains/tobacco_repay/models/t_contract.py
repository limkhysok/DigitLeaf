from datetime import date as _date, datetime as _datetime
from sqlalchemy import Column, Date, DateTime, Text
from sqlmodel import Field, SQLModel


class TContract(SQLModel, table=True):
    __tablename__ = "t_contract"  # type: ignore[assignment]

    con_id: int | None = Field(default=None, primary_key=True)
    con_num: str | None = Field(default=None, max_length=255)
    contractor: str | None = Field(default=None, max_length=255)
    gender: str | None = Field(default=None, max_length=50)
    age: int | None = Field(default=None)
    home_num: str | None = Field(default=None, max_length=10)
    road_num: str | None = Field(default=None, max_length=50)
    village: str | None = Field(default=None, max_length=255)
    commune: str | None = Field(default=None, max_length=255)
    district: str | None = Field(default=None, max_length=255)
    province: str | None = Field(default=None, max_length=255)
    job: str | None = Field(default=None, max_length=255)
    identify_num: str | None = Field(default=None, max_length=255)
    identify_date: _date | None = Field(default=None, sa_column=Column("identify_date", Date, nullable=True))
    represent: str | None = Field(default=None, max_length=255)
    con_date: _date | None = Field(default=None, sa_column=Column("date", Date, nullable=True))
    note: str | None = Field(default=None, max_length=255)
    user: str | None = Field(default=None, max_length=255)
    repay: str | None = Field(default=None, max_length=3)
    tobac_type: int | None = Field(default=None)
    qty: float | None = Field(default=None)
    price: float | None = Field(default=None)
    rate: float | None = Field(default=None)
    f_id: int | None = Field(default=None)
    do_date: _datetime | None = Field(default=None, sa_column=Column("do_date", DateTime, nullable=True))
    ip_address: str | None = Field(default=None, sa_column=Column("ip_address", Text, nullable=True))
    year: int | None = Field(default=None)
