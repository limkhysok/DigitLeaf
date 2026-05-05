from typing import Annotated
from fastapi import APIRouter, Depends, Security
from sqlmodel import Session, select
from app.db.session import get_session
from app.domains.audit.models import AuditLog
from app.domains.users.models import User
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/")
def read_audit_logs(
    session: Annotated[Session, Depends(get_session)],
    current_admin: Annotated[User, Security(get_current_user, scopes=["admin"])],
    skip: int = 0,
    limit: int = 100,
) -> list[AuditLog]:
    """
    Retrieve all system audit logs. 
    **Secure Endpoint**: Only accessible by users with the 'admin' scope.
    """
    statement = select(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    logs = session.exec(statement).all()
    return logs
