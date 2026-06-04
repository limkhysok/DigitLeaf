from typing import Annotated
from fastapi import APIRouter, Depends, Security
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, col
from app.db.session import get_session
from app.domains.audit.models import AuditLog
from app.domains.users.models import User
from app.api.deps import get_current_user

from app.core.route_logger import AuditLogRoute

router = APIRouter(route_class=AuditLogRoute)


@router.get("/")
async def read_audit_logs(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_admin: Annotated[User, Security(get_current_user, scopes=["admin"])],
    skip: int = 0,
    limit: int = 100,
) -> list[AuditLog]:
    result = await session.execute(
        select(AuditLog).order_by(col(AuditLog.created_at).desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())
