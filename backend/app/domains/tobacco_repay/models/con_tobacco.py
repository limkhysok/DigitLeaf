from datetime import datetime as _datetime
from sqlalchemy import Column, DateTime, Text
from sqlmodel import Field, SQLModel


class ConTobacco(SQLModel, table=True):
    __tablename__ = "con_tobacco"  # type: ignore[assignment]

    t_id: int | None = Field(default=None, primary_key=True)
    tobacco_type: str | None = Field(default=None, max_length=100, index=True)  # FK -> tobacco_groups.id (stored as string)
    tobacco: str | None = Field(default=None, max_length=200)
    note: str | None = Field(default=None, max_length=255)
    user: str | None = Field(default=None, max_length=50)
    do_date: _datetime | None = Field(default=None, sa_column=Column("do_date", DateTime, nullable=True))
    ip_address: str | None = Field(default=None, sa_column=Column("ip_address", Text, nullable=True))
