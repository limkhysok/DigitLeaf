from pydantic import BaseModel

class UserLogin(BaseModel):
    user_name: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int | None = None
    scope: str | None = None
    refresh_token: str | None = None
    mfa_required: bool = False
    username: str | None = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenPayload(BaseModel):
    sub: str | None = None
    scopes: list[str] = []

class OTPRequest(BaseModel):
    user_name: str

class OTPVerify(BaseModel):
    user_name: str
    otp_code: str

class TOTPVerify(BaseModel):
    user_name: str
    totp_code: str
