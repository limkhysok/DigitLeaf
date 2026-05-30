from pydantic import BaseModel
from typing import Optional

class TobaccoReturnItem(BaseModel):
    id: Optional[int]
    contract_number: Optional[str]
    contract_contractor_name: Optional[str]
    representative: Optional[str]
    contract_year: Optional[int]
    mf_con_id: Optional[int]
    tobacco_type: Optional[str]
    Quantity: Optional[float]
    total_repaid: Optional[float]

class TContractReturnCreate(BaseModel):
    con_num: str
    tobac_type: int
    qty_repay: float
