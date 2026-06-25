from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.audit.models import AuditLog


async def create_audit_log(
    session: AsyncSession,
    endpoint: str,
    method: str,
    user: str | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    db_log = AuditLog(
        page_name=endpoint,
        action=method,
        user=user or "",
        ip_address=ip_address or "",
    )
    session.add(db_log)
    await session.commit()
    await session.refresh(db_log)
    return db_log
