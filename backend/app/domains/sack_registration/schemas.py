from pydantic import BaseModel, Field, ConfigDict, model_validator
from datetime import datetime
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


class SackRegistrationCreate(BaseModel):
    represent_id: int = Field(..., description="Selected represent ID from dropdown")
    member_farmer_name: Optional[str] = Field(default=None, max_length=255, description="Search farmer by name")
    member_farmer_identity_card: Optional[str] = Field(default=None, max_length=100, description="Search farmer by identity card")
    status: int = Field(default=0, description="0=pending, 1=approved, 2=rejected")
    sack_in_kg: Optional[float] = Field(default=None, ge=0, description="Sack weight in kilograms")
    notes: Optional[str] = Field(default=None, max_length=500)
    registered_at: Optional[datetime] = Field(default=None, description="Date of registration (defaults to now)")

    @model_validator(mode="after")
    def require_farmer_lookup(self):
        if not self.member_farmer_name and not self.member_farmer_identity_card:
            raise ValueError("Provide either member_farmer_name or member_farmer_identity_card")
        return self


class SackRegistrationUpdate(BaseModel):
    member_farmer_identity_card: Optional[str] = Field(default=None, max_length=100, description="Change farmer by mf_code")
    status: Optional[int] = Field(default=None, description="0=pending, 1=approved, 2=rejected")
    sack_in_kg: Optional[float] = Field(default=None, ge=0, description="Sack weight in kilograms")
    notes: Optional[str] = Field(default=None, max_length=500)


class SackRegistrationPublic(BaseModel):
    id: int
    represent_id: int
    represent_name: str
    member_farmer_id: int
    member_farmer_name: str
    dl_user_id: int
    dl_user_name: str
    status: int
    sack_in_kg: Optional[float] = None
    notes: Optional[str] = None
    registered_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SackRegistrationListResponse(BaseModel):
    items: list[SackRegistrationPublic]
    total: int
    has_more: bool


class SackRegistrationStatusCounts(BaseModel):
    all: int
    pending: int
    approved: int
    rejected: int


class FarmerContrastPublic(BaseModel):
    mf_con_id: int
    mf_id: int
    year: int
    name: str
    mf_code: str
    land: Optional[float] = None
    tobac_num: Optional[int] = None
    expected_yield: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
