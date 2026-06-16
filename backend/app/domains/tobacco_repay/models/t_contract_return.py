from typing import Optional
from datetime import date as _date, datetime as _datetime
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, Date, DateTime, Text


class TContractReturn(SQLModel, table=True):
    __tablename__ = "t_contract_repay"  # type: ignore[assignment]

    repay_id: Optional[int] = Field(default=None, primary_key=True)
    repay_num: Optional[str] = Field(default=None, max_length=50)
    con_num: Optional[str] = Field(default=None, max_length=11)
    repay_date: Optional[_date] = Field(default=None, sa_column=Column("date", Date, nullable=True))
    qty_repay: Optional[float] = Field(default=None)
    note: Optional[str] = Field(default=None, max_length=255)
    user: Optional[str] = Field(default=None, max_length=255)
    f_id: Optional[int] = Field(default=None)
    oven: Optional[int] = Field(default=None)
    con_id: Optional[int] = Field(default=None)
    do_date: Optional[_datetime] = Field(default=None, sa_column=Column("do_date", DateTime, nullable=True))
    ip_address: Optional[str] = Field(default=None, sa_column=Column("ip_address", Text, nullable=True))
    edit_user: Optional[str] = Field(default=None, max_length=45)
    edit_do_date: Optional[_datetime] = Field(default=None, sa_column=Column("edit_do_date", DateTime, nullable=True))
    edit_ip_address: Optional[str] = Field(default=None, sa_column=Column("edit_ip_address", Text, nullable=True))
