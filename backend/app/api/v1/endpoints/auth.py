from datetime import timedelta, datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.core.config import settings, CAMBODIA_TZ
from app.core import security
from app.db.session import get_session
from app.crud import user as crud_user
from app.crud import user_token as crud_token
from app.schemas.token import Token, RefreshTokenRequest
from app.models.user import UserPublic
from app.api.deps import CurrentUser

router = APIRouter()


@router.post("/login/access-token")
def login_access_token(
    session: Annotated[Session, Depends(get_session)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud_user.get_user_by_username(session, form_data.username)
    if not user or not security.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password",
        )

    # Define allowed scopes dynamically from DB Roles and Permissions
    allowed_scopes_set = {"user"}
    for role in user.roles:
        # Add the role name itself (e.g., "superadmin")
        allowed_scopes_set.add(role.name.lower())
        # Add all individual permissions attached to this role
        for perm in role.permissions:
            allowed_scopes_set.add(perm.name)
            
    allowed_scopes = list(allowed_scopes_set)

    # If the client requested specific scopes, filter them against allowed scopes
    if form_data.scopes:
        scopes = [s for s in form_data.scopes if s in allowed_scopes]
    else:
        # Default to all allowed scopes if none were requested
        scopes = allowed_scopes

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    refresh_token = security.create_refresh_token(
        user.user_name, expires_delta=refresh_token_expires
    )
    
    expires_at = datetime.now(CAMBODIA_TZ) + refresh_token_expires
    
    # Save refresh token to DB in separate table
    crud_token.create_user_token(session, user.user_name, refresh_token, expires_at)

    return Token(
        access_token=security.create_access_token(
            user.user_name, scopes=scopes, expires_delta=access_token_expires
        ),
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        scope=" ".join(scopes),
        refresh_token=refresh_token
    )


@router.get("/me")
def read_users_me(current_user: CurrentUser) -> UserPublic:
    """
    Get current user.
    """
    return current_user

@router.post("/login/refresh")
def refresh_token(
    session: Annotated[Session, Depends(get_session)],
    request: RefreshTokenRequest,
) -> Token:
    """
    Refresh access token using a refresh token.
    """
    payload = security.decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    username = payload.get("sub")
    
    # Check if the token exists in the user_token table
    db_token = crud_token.get_by_refresh_token(session, request.refresh_token)
    if not db_token or db_token.user_name != username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user = crud_user.get_user_by_username(session, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )

    # Re-evaluate dynamic scopes
    allowed_scopes_set = {"user"}
    for role in user.roles:
        allowed_scopes_set.add(role.name.lower())
        for perm in role.permissions:
            allowed_scopes_set.add(perm.name)
            
    allowed_scopes = list(allowed_scopes_set)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Delete the old refresh token
    crud_token.delete_specific_token(session, request.refresh_token)

    # Rotate refresh token
    new_refresh_token = security.create_refresh_token(
        user.user_name, expires_delta=refresh_token_expires
    )
    
    expires_at = datetime.now(CAMBODIA_TZ) + refresh_token_expires
    
    # Save the new token
    crud_token.create_user_token(session, user.user_name, new_refresh_token, expires_at)

    return Token(
        access_token=security.create_access_token(
            user.user_name, scopes=allowed_scopes, expires_delta=access_token_expires
        ),
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        scope=" ".join(allowed_scopes),
        refresh_token=new_refresh_token
    )

@router.post("/logout")
def logout(
    session: Annotated[Session, Depends(get_session)],
    current_user: CurrentUser,
):
    """
    Logout current user by clearing their refresh tokens in the database.
    """
    crud_token.delete_user_token(session, current_user.user_name)
    return {"message": "Successfully logged out of all sessions"}
