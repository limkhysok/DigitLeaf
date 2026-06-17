from sqlmodel import Field, SQLModel

class Purchaser(SQLModel, table=True):
    __tablename__ = "purchaser" # type: ignore[assignment]

    p_id: int | None = Field(default=None, primary_key=True)
    p_name: str = Field(max_length=255)
    p_name_kh: str | None = Field(default=None, max_length=255)
    region: int | None = Field(default=None)
    do_not_show: int = Field(default=0)
