from datetime import datetime as _datetime
from sqlalchemy import Column, DateTime, Text
from sqlmodel import Field, SQLModel


class TobaccoGroup(SQLModel, table=True):
    __tablename__ = "tobacco_groups"  # type: ignore[assignment]

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=255)
    user: str | None = Field(default=None, max_length=50)
    do_date: _datetime | None = Field(default=None, sa_column=Column("do_date", DateTime, nullable=True))
    ip_address: str | None = Field(default=None, sa_column=Column("ip_address", Text, nullable=True))
