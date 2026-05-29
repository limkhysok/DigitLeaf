from typing import Optional
from sqlmodel import Field, SQLModel

class TContract(SQLModel, table=True):
    __tablename__ = "t_contract" # type: ignore[assignment]

    con_id: Optional[int] = Field(default=None, primary_key=True)
    con_num: Optional[str] = Field(default=None, max_length=255)
    contractor: Optional[str] = Field(default=None, max_length=255)
    represent: Optional[str] = Field(default=None, max_length=255)
    tobac_type: Optional[int] = Field(default=None)
    qty: Optional[float] = Field(default=None)
    price: Optional[float] = Field(default=None)
    note: Optional[str] = Field(default=None, max_length=255)
