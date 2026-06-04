from datetime import timedelta, datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.domains.rbac.models import Role

from app.core.config import settings, CAMBODIA_TZ
from app.core import security
from app.db.session import get_session
from app.domains.users import crud as crud_user
from app.domains.auth import crud as crud_token
from app.domains.auth.schemas import Token, RefreshTokenRequest, OTPRequest, OTPVerify, TOTPVerify
from app.domains.users.schemas import UserPublic
from app.domains.auth.models import UserMFA
from app.api.deps import CurrentUser
from app.core.route_logger import AuditLogRoute

router = APIRouter(route_class=AuditLogRoute)
INVALID_TOTP_MSG = "Invalid TOTP code"


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

    if user.mfa and user.mfa.totp_enabled:
        return Token(
            access_token="",
            token_type="mfa",
            mfa_required=True,
            username=user.user_name,
        )

    if not user.role:
        result = await session.execute(select(Role).where(Role.name == "staff"))
        staff_role = result.scalars().first()
        if staff_role:
            user.role = staff_role
            session.add(user)
            await session.commit()
            await session.refresh(user)

    allowed_scopes_set = {"user"}
    if user.role:
        allowed_scopes_set.add(user.role.name.lower())
        for perm in user.role.permissions:
            allowed_scopes_set.add(perm.name)

    allowed_scopes = list(allowed_scopes_set)

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


@router.post("/login/otp-request")
async def request_otp(
    session: Annotated[AsyncSession, Depends(get_session)],
    request: OTPRequest,
):
    user = await crud_user.get_user_by_username(session, request.user_name)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    assert user.id is not None

    if not user.mfa:
        user.mfa = UserMFA(user_id=user.id)

    otp = security.generate_otp()
    user.mfa.otp_code = otp
    user.mfa.otp_expiry = datetime.now(CAMBODIA_TZ) + timedelta(minutes=5)

    session.add(user)
    await session.commit()

    return {"message": "OTP generated successfully", "otp": otp}


@router.post("/login/otp-verify")
async def verify_otp(
    session: Annotated[AsyncSession, Depends(get_session)],
    request_data: OTPVerify,
    request: Request,
) -> Token:
    user = await crud_user.get_user_by_username(session, request_data.user_name)
    if not user or not user.mfa or user.mfa.otp_code != request_data.otp_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid username or OTP")
    assert user.id is not None

    if user.mfa.otp_expiry and user.mfa.otp_expiry < datetime.now(CAMBODIA_TZ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired")

    user.mfa.otp_code = None
    user.mfa.otp_expiry = None
    session.add(user)

    allowed_scopes_set = {"user"}
    if user.role:
        allowed_scopes_set.add(user.role.name.lower())
        for perm in user.role.permissions:
            allowed_scopes_set.add(perm.name)

    allowed_scopes = list(allowed_scopes_set)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    refresh_token = security.create_refresh_token(user.user_name, expires_delta=refresh_token_expires)
    expires_at = datetime.now(CAMBODIA_TZ) + refresh_token_expires
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    await crud_token.create_user_token(session, user.id, user.user_name, refresh_token, expires_at, ip_address, user_agent)

    await session.commit()

    return Token(
        access_token=security.create_access_token(
            user.user_name, user.id, scopes=allowed_scopes, expires_delta=access_token_expires
        ),
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        scope=" ".join(allowed_scopes),
        refresh_token=refresh_token,
    )


@router.post("/totp/setup")
async def setup_totp(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: CurrentUser,
):
    if current_user.mfa and current_user.mfa.totp_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP is already enabled")

    if not current_user.mfa:
        assert current_user.id is not None
        current_user.mfa = UserMFA(user_id=current_user.id)

    secret = security.generate_totp_secret()
    current_user.mfa.totp_secret = secret
    session.add(current_user)
    await session.commit()

    uri = security.get_totp_uri(secret, current_user.user_name)
    return {"secret": secret, "uri": uri}


@router.post("/totp/enable")
async def enable_totp(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: CurrentUser,
    request: TOTPVerify,
):
    if current_user.mfa and current_user.mfa.totp_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP is already enabled")

    if not current_user.mfa or not current_user.mfa.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="TOTP secret not generated. Call /totp/setup first.",
        )

    if not security.verify_totp(current_user.mfa.totp_secret, request.totp_code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INVALID_TOTP_MSG)

    current_user.mfa.totp_enabled = True
    session.add(current_user)
    await session.commit()
    return {"message": "TOTP enabled successfully"}


@router.post("/totp/disable")
async def disable_totp(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: CurrentUser,
    request: TOTPVerify,
):
    if not current_user.mfa or not current_user.mfa.totp_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP is already disabled")

    if not current_user.mfa.totp_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No TOTP secret found")

    if not security.verify_totp(current_user.mfa.totp_secret, request.totp_code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INVALID_TOTP_MSG)

    current_user.mfa.totp_enabled = False
    current_user.mfa.totp_secret = None
    session.add(current_user)
    await session.commit()
    return {"message": "TOTP disabled successfully"}


@router.post("/login/totp-verify")
async def verify_totp_login(
    session: Annotated[AsyncSession, Depends(get_session)],
    request_data: TOTPVerify,
    request: Request,
) -> Token:
    user = await crud_user.get_user_by_username(session, request_data.user_name)
    if not user or not user.mfa or not user.mfa.totp_enabled or not user.mfa.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="TOTP is not enabled for this user",
        )
    assert user.id is not None

    if not security.verify_totp(user.mfa.totp_secret, request_data.totp_code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INVALID_TOTP_MSG)

    allowed_scopes_set = {"user"}
    if user.role:
        allowed_scopes_set.add(user.role.name.lower())
        for perm in user.role.permissions:
            allowed_scopes_set.add(perm.name)

    allowed_scopes = list(allowed_scopes_set)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    refresh_token = security.create_refresh_token(user.user_name, expires_delta=refresh_token_expires)
    expires_at = datetime.now(CAMBODIA_TZ) + refresh_token_expires
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    await crud_token.create_user_token(session, user.id, user.user_name, refresh_token, expires_at, ip_address, user_agent)

    await session.commit()

    return Token(
        access_token=security.create_access_token(
            user.user_name, user.id, scopes=allowed_scopes, expires_delta=access_token_expires
        ),
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        scope=" ".join(allowed_scopes),
        refresh_token=refresh_token,
    )


@router.get("/me")
async def read_users_me(current_user: CurrentUser) -> UserPublic:
    user_public = UserPublic.model_validate(current_user)
    user_public.totp_enabled = current_user.mfa.totp_enabled if current_user.mfa else False
    return user_public


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

    allowed_scopes_set = {"user"}
    if user.role:
        allowed_scopes_set.add(user.role.name.lower())
        for perm in user.role.permissions:
            allowed_scopes_set.add(perm.name)

    allowed_scopes = list(allowed_scopes_set)

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


@router.get("/sessions")
async def get_active_sessions(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: CurrentUser,
):
    return await crud_token.get_user_tokens(session, current_user.user_name)
