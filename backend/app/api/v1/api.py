from fastapi import APIRouter
from app.api.v1.endpoints import auth, audit_log, users
from app.core.route_logger import AuditLogRoute

api_router = APIRouter(route_class=AuditLogRoute)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(audit_log.router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
