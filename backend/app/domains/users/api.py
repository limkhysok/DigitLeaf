from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, Security
from sqlmodel import Session, select
from app.db.session import get_session
from app.domains.users.models import User, UserPublic
from app.domains.rbac.models import Role
from app.schemas.user import UserCreate
from app.api.deps import get_current_user

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
    existing_user = session.exec(
        select(User).where(User.user_name == user_in.user_name)
    ).first()
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
        access_type="",  # Left blank as this is deprecated
        user=current_user.user_name,
        ip_address=request.client.host if request.client else "unknown",
        edit_user=current_user.user_name,
        edit_ip_address=request.client.host if request.client else "unknown",
        roles=[role],  # Magic: SQLModel instantly handles the bridging table insertion!
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return new_user
