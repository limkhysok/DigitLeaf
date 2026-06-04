from typing import Optional
from sqlmodel import Field, SQLModel


class MemberFarmer(SQLModel, table=True):
    __tablename__ = "member_farmer"  # type: ignore[assignment]

    mf_id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=50)
    mf_code: str = Field(max_length=255)
    represent: Optional[int] = Field(default=None)
    address: Optional[str] = Field(default=None, max_length=255)
    active: Optional[str] = Field(default=None, max_length=10)
