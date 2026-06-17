from sqlmodel import Field, SQLModel


class Tobacco(SQLModel, table=True):
    __tablename__ = "tobacco" # type: ignore[assignment]

    t_id: int | None = Field(default=None, primary_key=True)
    t_name: str = Field(max_length=255)
    t_name_kh: str | None = Field(default=None, max_length=255)
    t_cate: int = Field(index=True)
    discontinue: int = Field(default=0)
