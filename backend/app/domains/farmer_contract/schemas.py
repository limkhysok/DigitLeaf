from pydantic import BaseModel, ConfigDict


class FarmerContractPublic(BaseModel):
    mf_con_id: int
    mf_id: int
    year: int
    name: str
    mf_code: str
    t_id: int | None = None
    land: float | None = None
    tobac_num: int | None = None
    expected_yield: float | None = None
    purchased_weight: float | None = None
    do_date: str | None = None

    model_config = ConfigDict(from_attributes=True)


class FarmerContractListResponse(BaseModel):
    items: list[FarmerContractPublic]
    total: int
    has_more: bool


class TobaccoTypeItem(BaseModel):
    t_id: int
    t_name: str
    t_name_kh: str | None = None


class FarmerContractFormMetadata(BaseModel):
    tobacco_types: list[TobaccoTypeItem]


class FarmerContractCreate(BaseModel):
    mf_id: int
    t_id: int
    year: int
    land: float | None = None
    tobac_num: int | None = None


class FarmerContractUpdate(BaseModel):
    mf_id: int
    t_id: int
    year: int
    land: float | None = None
    tobac_num: int | None = None


class FarmerContractPatch(BaseModel):
    mf_id: int | None = None
    t_id: int | None = None
    year: int | None = None
    land: float | None = None
    tobac_num: int | None = None


class FarmerContractCreated(BaseModel):
    mf_con_id: int
    mf_id: int
    year: int
    land: float | None = None
    tobac_num: int | None = None

    model_config = ConfigDict(from_attributes=True)
