from pydantic import BaseModel, ConfigDict


class RepresentPublic(BaseModel):
    represent_id: int
    represent_name: str
    farmer_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class MemberFarmerPublic(BaseModel):
    mf_id: int
    name: str
    mf_code: str
    address: str | None = None
    represent_id: int | None = None
    represent_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
