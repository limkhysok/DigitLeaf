from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, Security
from sqlmodel import Session, select
from app.db.session import get_session
from app.domains.users.models import User
from app.domains.users.schemas import UserPublic, UserCreate, UserChangePassword, UserAdminResetPassword
from app.domains.rbac.models import Role
from app.api.deps import get_current_user
from app.domains.users import crud

router = APIRouter()


@router.post(
    "/",
    response_model=UserPublic,
    responses={
        400: {"description": "Username already exists"},
        404: {"description": "Role not found"},
    },
)
def create_user(
    request: Request,
    user_in: UserCreate,
    session: Annotated[Session, Depends(get_session)],
    # Security dependency STRICTLY requires "manage_users" permission
    current_user: Annotated[User, Security(get_current_user, scopes=["manage_users"])],
):
    """
    Create a new user. Only staff/admins with 'manage_users' permission can perform this.
    """
    # 1. Check if user already exists
    existing_user = crud.get_user_by_username(session=session, user_name=user_in.user_name)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    # 2. Find the requested role (e.g., "Farmer")
    role = session.exec(select(Role).where(Role.name == user_in.role_name)).first()
    if not role:
        raise HTTPException(
            status_code=404, detail=f"Role '{user_in.role_name}' not found"
        )

    # 3. Create the user object
    # As requested, temporarily keeping plain-text password logic
    new_user = User(
        user_name=user_in.user_name,
        password=user_in.password,
        roles=[role],  # Magic: SQLModel instantly handles the bridging table insertion!
    )


    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return new_user


@router.patch(
    "/me/password",
    responses={
        400: {"description": "Incorrect current password"},
    },
)
def change_my_password(
    password_data: UserChangePassword,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user)],
):
    """
    Self-service password change for the currently authenticated user.
    """
    # Verify current password (plain-text check)
    if current_user.password != password_data.current_password:
        raise HTTPException(status_code=400, detail="Incorrect current password")

    # Update to new password
    current_user.password = password_data.new_password
    
    session.add(current_user)
    session.commit()
    
    return {"message": "Password updated successfully"}


@router.patch(
    "/{user_id}/password",
    responses={
        404: {"description": "User not found"},
    },
)
def admin_reset_password(
    user_id: int,
    password_data: UserAdminResetPassword,
    session: Annotated[Session, Depends(get_session)],
    # Security dependency STRICTLY requires "manage_users" permission
    current_user: Annotated[User, Security(get_current_user, scopes=["manage_users"])],
):
    """
    Admin endpoint to reset a specific user's password. Requires 'manage_users' permission.
    """
    user_to_update = crud.get_user_by_id(session=session, user_id=user_id)
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    user_to_update.password = password_data.new_password

    session.add(user_to_update)
    session.commit()

    return {"message": f"Password for user '{user_to_update.user_name}' has been reset successfully"}
