from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class FarmerContractPublic(BaseModel):
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


class FarmerContractListResponse(BaseModel):
    items: List[FarmerContractPublic]
    total: int
    has_more: bool


class TobaccoTypeItem(BaseModel):
    t_id: int
    t_name: str
    t_name_kh: Optional[str] = None


class FarmerContractFormMetadata(BaseModel):
    tobacco_types: List[TobaccoTypeItem]


class FarmerContractCreate(BaseModel):
    mf_id: int
    year: int
    land: Optional[float] = None
    tobac_num: Optional[int] = None


class FarmerContractCreated(BaseModel):
    mf_con_id: int
    mf_id: int
    year: int
    land: Optional[float] = None
    tobac_num: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
