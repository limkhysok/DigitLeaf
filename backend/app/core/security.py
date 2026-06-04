import secrets
import string
import pyotp
from datetime import datetime, timedelta
from typing import Any
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings, CAMBODIA_TZ

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, stored_password: str) -> bool:
    # Plain-text comparison (legacy support based on existing logic)
    return plain_password == stored_password

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: str | Any, user_id: int, scopes: list[str], expires_delta: timedelta) -> str:
    expire = datetime.now(CAMBODIA_TZ) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject), "user_id": user_id, "scopes": scopes, "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: str | Any, expires_delta: timedelta) -> str:
    expire = datetime.now(CAMBODIA_TZ) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.JWTError:
        return None
def generate_totp_secret() -> str:
    return pyotp.random_base32()

def get_totp_uri(secret: str, user_name: str, issuer_name: str = "DigitLeaf") -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=user_name, issuer_name=issuer_name)

def verify_totp(secret: str, token: str) -> bool:
    totp = pyotp.totp.TOTP(secret)
    return totp.verify(token)

def generate_otp() -> str:
    return "".join(secrets.choice(string.digits) for _ in range(6))
