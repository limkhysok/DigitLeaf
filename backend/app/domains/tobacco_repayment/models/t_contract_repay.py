from typing import Optional
from sqlmodel import Field, SQLModel

class TContractRepay(SQLModel, table=True):
    __tablename__ = "t_contract_repay" # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    con_id: Optional[int] = Field(default=None)
    tp_id: Optional[int] = Field(default=None)
    tobac_type: Optional[int] = Field(default=None)
    qty_repay: Optional[float] = Field(default=None)
