from pydantic import BaseModel
from typing import Optional

class TobaccoReturnItem(BaseModel):
    con_id: Optional[int]
    con_num: Optional[str]
    contractor: Optional[str]
    represent: Optional[str]
    tobac_type: Optional[int]
    t_name: Optional[str]
    t_name_kh: Optional[str]
    qty: Optional[float]
    total_returned: Optional[float]
    price: Optional[float]
    note: Optional[str]

class TContractReturnCreate(BaseModel):
    con_num: str
    tobac_type: int
    qty_repay: float
