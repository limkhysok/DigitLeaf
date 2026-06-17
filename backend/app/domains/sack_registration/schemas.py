from pydantic import BaseModel, Field, ConfigDict, model_validator
from datetime import datetime


class SackRegistrationCreate(BaseModel):
    represent_id: int = Field(..., description="Selected represent ID from dropdown")
    member_farmer_name: str | None = Field(default=None, max_length=255, description="Search farmer by name")
    member_farmer_identity_card: str | None = Field(default=None, max_length=100, description="Search farmer by identity card")
    sack_in_kg: float | None = Field(default=None, ge=0, description="Sack weight in kilograms")
    notes: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def require_farmer_lookup(self):
        if not self.member_farmer_name and not self.member_farmer_identity_card:
            raise ValueError("Provide either member_farmer_name or member_farmer_identity_card")
        return self


class SackRegistrationUpdate(BaseModel):
    member_farmer_identity_card: str | None = Field(default=None, max_length=100, description="Change farmer by mf_code")
    sack_in_kg: float | None = Field(default=None, ge=0, description="Sack weight in kilograms")
    notes: str | None = Field(default=None, max_length=500)


class SackRegistrationPublic(BaseModel):
    id: int
    represent_id: int
    represent_name: str
    farmer_id: int
    member_farmer_name: str
    member_farmer_mf_code: str
    dl_user_id: int
    dl_user_name: str
    sack_in_kg: float | None = None
    notes: str | None = None
    created_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SackRegistrationListResponse(BaseModel):
    items: list[SackRegistrationPublic]
    total: int
    has_more: bool


class RegistrationCounts(BaseModel):
    total: int
    today: int


class SackWeightKg(BaseModel):
    total: float
    today: float


class SackRegistrationStats(BaseModel):
    registration_counts: RegistrationCounts
    sack_weight_kg: SackWeightKg
