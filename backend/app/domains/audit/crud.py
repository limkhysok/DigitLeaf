from sqlmodel import Session
from app.domains.audit.models import AuditLog

def create_audit_log(
    session: Session, 
    endpoint: str, 
    method: str, 
    user_id: int,
    ip_address: str | None = None,
    user_agent: str | None = None
) -> AuditLog:
    db_log = AuditLog(
        user_id=user_id,
        endpoint=endpoint,
        method=method,
        ip_address=ip_address,
        user_agent=user_agent
    )
    session.add(db_log)
    session.commit()
    session.refresh(db_log)
    return db_log
