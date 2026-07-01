from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Security
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.domains.users.models import User
from app.domains.users.schemas import UserPublic, UserCreate, UserListResponse, UserRegionsUpdate, UserRoleUpdate, RolePublic
from app.domains.rbac.models import Role
from app.api.deps import get_current_user
from app.domains.users import crud

from app.core.route_logger import AuditLogRoute

router = APIRouter(route_class=AuditLogRoute)

_NOT_FOUND = "User not found"
_PROTECTED_ROLES = {"admin", "boss"}


def _to_public(user: User, role: Role | None = None) -> UserPublic:
    assert user.id is not None, "user must be persisted before its id is used"
    return UserPublic(
        id=user.id,
        user_name=user.user_name,
        access_type=user.access_type,
        login_type=user.login_type,
        regions=user.regions,
        do_date=user.do_date,
        role_id=role.id if role else None,
        role_name=role.name if role else None,
    )


@router.get(
    "/",
    response_model=UserListResponse,
)
async def list_users(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["manage_users"])],
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    skip = (page - 1) * limit
    users, total = await crud.list_users(session=session, skip=skip, limit=limit)
    roles_map = await crud.get_user_roles_map(session=session, user_ids=[u.id for u in users if u.id is not None])
    items = [_to_public(u, roles_map.get(u.id)) for u in users if u.id is not None]
    return UserListResponse(items=items, total=total, has_more=(skip + len(items)) < total)


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
        404: {"description": _NOT_FOUND},
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
        raise HTTPException(status_code=404, detail=_NOT_FOUND)

    target_user.regions = regions_in.regions
    session.add(target_user)
    await session.commit()
    await session.refresh(target_user)
    roles_map = await crud.get_user_roles_map(session=session, user_ids=[user_id])
    return _to_public(target_user, roles_map.get(user_id))


@router.get("/roles", response_model=list[RolePublic])
async def list_roles(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["manage_users"])],
):
    return await crud.list_roles(session=session)


@router.put(
    "/{user_id}/role",
    response_model=UserPublic,
    responses={
        404: {"description": _NOT_FOUND},
    },
)
async def set_user_role(
    user_id: int,
    role_in: UserRoleUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["manage_users"])],
):
    target_user = await crud.get_user_by_id(session=session, user_id=user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)

    await crud.set_user_role(session=session, user_id=user_id, role_id=role_in.role_id)
    roles_map = await crud.get_user_roles_map(session=session, user_ids=[user_id])
    return _to_public(target_user, roles_map.get(user_id))


@router.delete(
    "/{user_id}",
    status_code=204,
    responses={
        400: {"description": "Cannot delete your own account, or an admin/boss user"},
        404: {"description": _NOT_FOUND},
    },
)
async def delete_user(
    user_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["manage_users"])],
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    target_user = await crud.get_user_by_id(session=session, user_id=user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)

    roles_map = await crud.get_user_roles_map(session=session, user_ids=[user_id])
    target_role = roles_map.get(user_id)
    if target_role and target_role.name in _PROTECTED_ROLES:
        raise HTTPException(status_code=400, detail="Cannot delete admin or boss users")

    await crud.delete_user(session=session, user=target_user)
    return None
