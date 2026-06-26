from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, Security
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.domains.users.models import User
from app.domains.users.schemas import UserPublic, UserCreate, UserRegionsUpdate
from app.api.deps import get_current_user
from app.domains.users import crud

from app.core.route_logger import AuditLogRoute

router = APIRouter(route_class=AuditLogRoute)


def _to_public(user: User) -> UserPublic:
    assert user.id is not None, "user must be persisted before its id is used"
    return UserPublic(
        id=user.id,
        user_name=user.user_name,
        access_type=user.access_type,
        login_type=user.login_type,
        regions=user.regions,
        do_date=user.do_date,
    )


@router.get(
    "/",
    response_model=list[UserPublic],
)
async def list_users(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["manage_users"])],
):
    users = await crud.list_users(session=session)
    return [_to_public(u) for u in users]


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
        regions=user_in.regions,
        user=current_user.user_name,
        ip_address=request.client.host if request.client else "",
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    return _to_public(new_user)


@router.get("/regions")
async def list_assignable_regions(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["manage_users"])],
):
    return await crud.get_assignable_regions(session=session)


@router.put(
    "/{user_id}/regions",
    response_model=UserPublic,
    responses={
        404: {"description": "User not found"},
    },
)
async def set_user_regions(
    user_id: int,
    regions_in: UserRegionsUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["manage_users"])],
):
    target_user = await crud.get_user_by_id(session=session, user_id=user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.regions = regions_in.regions
    session.add(target_user)
    await session.commit()
    await session.refresh(target_user)
    return _to_public(target_user)
