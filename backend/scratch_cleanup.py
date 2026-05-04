import sqlalchemy
from app.core.config import settings

engine = sqlalchemy.create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    conn.execute(sqlalchemy.text("DROP TABLE IF EXISTS dl_user_mfa"))
    print("Dropped dl_user_mfa table")
