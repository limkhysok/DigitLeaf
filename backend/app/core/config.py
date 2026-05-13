from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Any
from urllib.parse import quote_plus
from datetime import timezone, timedelta

# Cambodia Timezone (UTC+7)
CAMBODIA_TZ = timezone(timedelta(hours=7))

class Settings(BaseSettings):
    PROJECT_NAME: str = "DigitLeaf"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ] # Change this in .env for production (e.g., ["http://localhost:3000"])
    # MySQL Configuration
    MYSQL_USER: str
    MYSQL_PASSWORD: str
    MYSQL_HOST: str
    MYSQL_PORT: int
    MYSQL_DB: str
    
    DATABASE_URL: str | None = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | None, info: Any) -> Any:
        if isinstance(v, str) and v:
            return v
        
        # Build from components if not provided
        data = info.data
        user = data.get("MYSQL_USER")
        # URL encode password to handle special characters like '@'
        password = quote_plus(str(data.get("MYSQL_PASSWORD")))
        host = data.get("MYSQL_HOST")
        port = data.get("MYSQL_PORT")
        db = data.get("MYSQL_DB")
        
        return f"mysql+pymysql://{user}:{password}@{host}:{port}/{db}"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
