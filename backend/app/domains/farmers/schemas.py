from pydantic import BaseModel, ConfigDict
from typing import Optional


class RepresentPublic(BaseModel):
    represent_id: int
    represent_name: str
    farmer_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class MemberFarmerPublic(BaseModel):
    mf_id: int
    name: str
    mf_code: str
    address: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
