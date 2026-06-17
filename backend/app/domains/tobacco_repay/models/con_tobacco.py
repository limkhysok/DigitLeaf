from sqlmodel import Field, SQLModel


class ConTobacco(SQLModel, table=True):
    __tablename__ = "con_tobacco"  # type: ignore[assignment]

    t_id: int | None = Field(default=None, primary_key=True)
    tobacco: str | None = Field(default=None, max_length=255)
