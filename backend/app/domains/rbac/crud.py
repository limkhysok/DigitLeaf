from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.domains.rbac.models import UserRoleLink, RolePermissionLink, Permission


async def get_user_permission_names(session: AsyncSession, user_id: int) -> set[str]:
    result = await session.execute(
        select(Permission.name)
        .join(RolePermissionLink, RolePermissionLink.permission_id == Permission.id)
        .join(UserRoleLink, UserRoleLink.role_id == RolePermissionLink.role_id)
        .where(UserRoleLink.user_id == user_id)
    )
    return set(result.scalars().all())
