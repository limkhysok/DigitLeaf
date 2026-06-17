from pydantic import BaseModel, Field, ConfigDict, model_validator, field_validator
from datetime import datetime


class SackRegistrationCreate(BaseModel):
    represent_id: int = Field(..., description="Selected represent ID from dropdown")
    member_farmer_name: str | None = Field(default=None, max_length=255, description="Search farmer by name")
    member_farmer_identity_card: str | None = Field(default=None, max_length=100, description="Search farmer by identity card")
    sack_in_kg: float | None = Field(default=None, ge=0, description="Sack weight in kilograms")
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("sack_in_kg")
    @classmethod
    def validate_sack_kg_precision(cls, v: float | None) -> float | None:
        if v is not None:
            parts = str(v).split(".")
            if len(parts) == 2 and len(parts[1]) > 2:
                raise ValueError("sack_in_kg must have at most 2 decimal places")
        return v

    @model_validator(mode="after")
    def require_farmer_lookup(self):
        if not self.member_farmer_name and not self.member_farmer_identity_card:
            raise ValueError("Provide either member_farmer_name or member_farmer_identity_card")
        return self


class SackRegistrationUpdate(BaseModel):
    represent_id: int | None = Field(default=None, description="Change represent; if provided, farmer must belong to this represent")
    member_farmer_mf_code: str | None = Field(default=None, max_length=100, description="Change farmer by mf_code; must belong to the effective represent")
    sack_in_kg: float | None = Field(default=None, ge=0, description="Sack weight in kilograms")
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("sack_in_kg")
    @classmethod
    def validate_sack_kg_precision(cls, v: float | None) -> float | None:
        if v is not None:
            parts = str(v).split(".")
            if len(parts) == 2 and len(parts[1]) > 2:
                raise ValueError("sack_in_kg must have at most 2 decimal places")
        return v


class SackRegistrationPublic(BaseModel):
    id: int
    represent_id: int
    represent_name: str
    farmer_id: int
    member_farmer_name: str
    member_farmer_mf_code: str
    action_by_id: int
    action_by: str
    sack_in_kg: float | None = None
    notes: str | None = None
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
