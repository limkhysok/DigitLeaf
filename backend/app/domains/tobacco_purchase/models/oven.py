from sqlmodel import Field, SQLModel

class Oven(SQLModel, table=True):
    __tablename__ = "ovens" # type: ignore[assignment]

    id: int | None = Field(default=None, primary_key=True)
    name_en: str = Field(max_length=255)
    name_kh: str | None = Field(default=None)
    do_not_show: int = Field(default=0)
