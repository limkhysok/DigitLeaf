from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.audit.models import AuditLog


async def create_audit_log(
    session: AsyncSession,
    endpoint: str,
    method: str,
    user_id: int | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> AuditLog:
    db_log = AuditLog(
        user_id=user_id,
        endpoint=endpoint,
        method=method,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    session.add(db_log)
    await session.commit()
    await session.refresh(db_log)
    return db_log
