from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class TobaccoPublic(BaseModel):
    t_id: int
    t_name: str

    model_config = ConfigDict(from_attributes=True)


class MemberFarmerSearchPublic(BaseModel):
    mf_id: int
    name: str
    mf_code: str

    model_config = ConfigDict(from_attributes=True)


class SackRegistrationBriefPublic(BaseModel):
    id: int
    sack_code: str
    sack_in_kg: int

    model_config = ConfigDict(from_attributes=True)


class WeighLeafCreate(BaseModel):
    sack_registration_id: int = Field(..., description="Selected sack registration ID")
    leaf_type_id: int = Field(..., description="Selected tobacco leaf type ID")
    total_in_kg: float = Field(..., gt=0)
    remork: int = Field(..., ge=0)


class WeighLeafUpdate(BaseModel):
    leaf_type_id: Optional[int] = None
    total_in_kg: Optional[float] = Field(default=None, gt=0)
    remork: Optional[int] = Field(default=None, ge=0)


class WeighLeafPublic(BaseModel):
    id: int
    sack_registration_id: int
    sack_code: str
    sack_in_kg: int
    user_id: int
    user_name: str
    leaf_type_id: int
    leaf_type_name: str
    total_in_kg: float
    remork: int
    total_weight_in_kg: float
    dl_user_id: int
    dl_user_name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
