from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, Security
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.db.session import get_session
from app.domains.users.models import User
from app.domains.users.schemas import UserPublic, UserCreate, UserChangePassword, UserAdminResetPassword
from app.domains.rbac.models import Role
from app.api.deps import get_current_user
from app.domains.users import crud

from app.core.route_logger import AuditLogRoute

router = APIRouter(route_class=AuditLogRoute)


@router.post(
    "/",
    response_model=UserPublic,
    status_code=201,
    responses={
        400: {"description": "Username already exists"},
        404: {"description": "Role not found"},
    },
)
async def create_user(
    request: Request,
    user_in: UserCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["manage_users"])],
):
    existing_user = await crud.get_user_by_username(session=session, user_name=user_in.user_name)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    result = await session.execute(select(Role).where(Role.name == user_in.role_name))
    role = result.scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail=f"Role '{user_in.role_name}' not found")

    new_user = User(
        user_name=user_in.user_name,
        password=user_in.password,
        role=role,
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    return new_user


@router.patch(
    "/me/password",
    responses={
        400: {"description": "Incorrect current password"},
    },
)
async def change_my_password(
    password_data: UserChangePassword,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user)],
):
    if current_user.password != password_data.current_password:
        raise HTTPException(status_code=400, detail="Incorrect current password")

    current_user.password = password_data.new_password

    session.add(current_user)
    await session.commit()

    return {"message": "Password updated successfully"}


@router.patch(
    "/{user_id}/password",
    responses={
        404: {"description": "User not found"},
    },
)
async def admin_reset_password(
    user_id: int,
    password_data: UserAdminResetPassword,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["manage_users"])],
):
    user_to_update = await crud.get_user_by_id(session=session, user_id=user_id)
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    user_to_update.password = password_data.new_password

    session.add(user_to_update)
    await session.commit()
    return {"message": "Password reset successfully by admin"}
