from typing import Annotated
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlmodel import Session
from app.core.config import settings
from app.db.session import get_session
from app.crud import user as crud_user
from app.models.user import User
from app.schemas.token import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login/access-token",
    scopes={
        "login_system": "Basic permission to access system endpoints",
        "manage_users": "Can create, edit, and delete user accounts",
        "view_audit_logs": "Can view system security audit logs",
        "approve_leave": "Can approve or reject leave requests",
        "admin": "Legacy god mode",
        "user": "Legacy regular user",
    }
)

TokenDep = Annotated[str, Depends(reusable_oauth2)]

def get_current_user(
    security_scopes: SecurityScopes,
    session: Annotated[Session, Depends(get_session)],
    token: TokenDep
) -> User:
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": authenticate_value},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            raise credentials_exception
    except (JWTError, ValidationError):
        raise credentials_exception
        
    user = crud_user.get_user_by_username(session, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if security_scopes.scopes and not set(security_scopes.scopes).issubset(token_data.scopes):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
            headers={"WWW-Authenticate": authenticate_value},
        )
            
    return user

CurrentUser = Annotated[User, Security(get_current_user, scopes=["login_system"])]
