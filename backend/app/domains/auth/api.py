from datetime import timedelta, datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings, CAMBODIA_TZ
from app.core import security
from app.db.session import get_session
from app.domains.users import crud as crud_user
from app.domains.auth import crud as crud_token
from app.domains.auth.schemas import Token, RefreshTokenRequest
from app.domains.rbac import crud as crud_rbac
from app.domains.users.models import User
from app.domains.users.schemas import UserPublic
from app.api.deps import CurrentUser
from app.core.route_logger import AuditLogRoute

router = APIRouter(route_class=AuditLogRoute)


async def _build_scopes(session: AsyncSession, user: User) -> list[str]:
    assert user.id is not None
    role_permissions = await crud_rbac.get_user_permission_names(session, user.id)
    return list({"user"} | role_permissions)


@router.post("/login/access-token")
async def login_access_token(
    session: Annotated[AsyncSession, Depends(get_session)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    request: Request,
) -> Token:
    user = await crud_user.get_user_by_username(session, form_data.username)
    if not user or not security.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password",
        )
    assert user.id is not None

    allowed_scopes = await _build_scopes(session, user)

    if form_data.scopes:
        scopes = [s for s in form_data.scopes if s in allowed_scopes]
    else:
        scopes = allowed_scopes

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    refresh_token = security.create_refresh_token(user.user_name, expires_delta=refresh_token_expires)
    expires_at = datetime.now(CAMBODIA_TZ) + refresh_token_expires

    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    await crud_token.create_user_token(session, user.id, user.user_name, refresh_token, expires_at, ip_address, user_agent)

    return Token(
        access_token=security.create_access_token(
            user.user_name, user.id, scopes=scopes, expires_delta=access_token_expires
        ),
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        scope=" ".join(scopes),
        refresh_token=refresh_token,
    )


@router.get("/me")
async def read_users_me(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: CurrentUser,
) -> UserPublic:
    assert current_user.id is not None
    roles_map = await crud_user.get_user_roles_map(session, user_ids=[current_user.id])
    role = roles_map.get(current_user.id)
    return UserPublic(
        id=current_user.id,
        user_name=current_user.user_name,
        access_type=current_user.access_type,
        login_type=current_user.login_type,
        regions=current_user.regions,
        do_date=current_user.do_date,
        role_id=role.id if role else None,
        role_name=role.name if role else None,
    )


@router.post("/login/refresh")
async def refresh_token(
    session: Annotated[AsyncSession, Depends(get_session)],
    refresh_request: RefreshTokenRequest,
    request: Request,
) -> Token:
    payload = security.decode_token(refresh_request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    username = payload.get("sub")
    assert username is not None

    db_token = await crud_token.get_by_refresh_token(session, refresh_request.refresh_token)
    if not db_token or db_token.user_name != username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = await crud_user.get_user_by_username(session, username)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")
    assert user.id is not None

    allowed_scopes = await _build_scopes(session, user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    await crud_token.delete_specific_token(session, refresh_request.refresh_token)

    new_refresh_token = security.create_refresh_token(user.user_name, expires_delta=refresh_token_expires)
    expires_at = datetime.now(CAMBODIA_TZ) + refresh_token_expires

    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    await crud_token.create_user_token(session, user.id, user.user_name, new_refresh_token, expires_at, ip_address, user_agent)

    return Token(
        access_token=security.create_access_token(
            user.user_name, user.id, scopes=allowed_scopes, expires_delta=access_token_expires
        ),
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        scope=" ".join(allowed_scopes),
        refresh_token=new_refresh_token,
    )


@router.post("/logout")
async def logout(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: CurrentUser,
):
    await crud_token.delete_user_token(session, current_user.user_name)
    return {"message": "Successfully logged out of all sessions"}
