from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, Security
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.domains.users.models import User
from app.domains.users.schemas import UserPublic, UserCreate
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

    new_user = User(
        user_name=user_in.user_name,
        password=user_in.password,
        access_type=user_in.access_type,
        login_type=user_in.login_type,
        user=current_user.user_name,
        ip_address=request.client.host if request.client else "",
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    return new_user
