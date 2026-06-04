from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class FarmerContrastPublic(BaseModel):
    mf_con_id: int
    mf_id: int
    year: int
    name: str
    mf_code: str
    land: Optional[float] = None
    tobac_num: Optional[int] = None
    expected_yield: Optional[float] = None
    purchased_weight: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class FarmerContrastListResponse(BaseModel):
    items: List[FarmerContrastPublic]
    total: int
