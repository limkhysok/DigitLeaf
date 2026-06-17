from datetime import date as _date, datetime as _datetime
from sqlalchemy import Column, Date, DateTime, Text
from sqlmodel import Field, SQLModel


class TContractReturn(SQLModel, table=True):
    __tablename__ = "t_contract_repay"  # type: ignore[assignment]

    repay_id: int | None = Field(default=None, primary_key=True)
    repay_num: str | None = Field(default=None, max_length=50)
    con_num: str | None = Field(default=None, max_length=11)
    repay_date: _date | None = Field(default=None, sa_column=Column("date", Date, nullable=True))
    qty_repay: float | None = Field(default=None)
    note: str | None = Field(default=None, max_length=255)
    user: str | None = Field(default=None, max_length=255)
    f_id: int | None = Field(default=None)
    oven: int | None = Field(default=None)
    con_id: int | None = Field(default=None)
    do_date: _datetime | None = Field(default=None, sa_column=Column("do_date", DateTime, nullable=True))
    ip_address: str | None = Field(default=None, sa_column=Column("ip_address", Text, nullable=True))
    edit_user: str | None = Field(default=None, max_length=45)
    edit_do_date: _datetime | None = Field(default=None, sa_column=Column("edit_do_date", DateTime, nullable=True))
    edit_ip_address: str | None = Field(default=None, sa_column=Column("edit_ip_address", Text, nullable=True))
