from typing import Annotated
from fastapi import APIRouter, Depends, Query, Security
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, col, func
from app.db.session import get_session
from app.domains.audit.models import AuditLog
from app.domains.audit.schemas import AuditLogListResponse, AuditLogPublic
from app.domains.users.models import User
from app.api.deps import get_current_user

from app.core.route_logger import AuditLogRoute

router = APIRouter(route_class=AuditLogRoute)

_MONITORED_PREFIXES = [
    "/api/v1/sack-registrations/",
    "/api/v1/tobacco-purchases/",
    "/api/v1/tobacco-repays/",
    "/api/v1/farmer-contract/",
    "/api/v1/users/",
]


@router.get("/", response_model=AuditLogListResponse)
async def read_audit_logs(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["view_audit_logs"])],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
) -> AuditLogListResponse:
    skip = (page - 1) * limit
    monitored_filter = or_(*[col(AuditLog.page_name).like(f"{p}%") for p in _MONITORED_PREFIXES])
    total = (
        await session.scalar(select(func.count()).select_from(AuditLog).where(monitored_filter))
    ) or 0
    result = await session.execute(
        select(AuditLog)
        .where(monitored_filter)
        .order_by(col(AuditLog.date).desc())
        .offset(skip)
        .limit(limit)
    )
    items = [AuditLogPublic.model_validate(row) for row in result.scalars().all()]
    return AuditLogListResponse(items=items, total=total, has_more=(skip + len(items)) < total)
