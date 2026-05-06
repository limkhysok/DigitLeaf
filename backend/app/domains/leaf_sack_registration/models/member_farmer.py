from typing import Optional
from sqlmodel import Field, SQLModel


class MemberFarmer(SQLModel, table=True):
    __tablename__ = "member_farmer"

    mf_id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=50)
    identified_no: str = Field(max_length=255)
