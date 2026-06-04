from fastapi import APIRouter
from app.domains.auth import api as auth
from app.domains.audit import api as audit_log
from app.domains.users import api as users
from app.domains.farmers import api as farmers
from app.domains.farmer_contrast import api as farmer_contrast
from app.domains.sack_registration import api as sack_registration
from app.domains.tobacco_purchase import api as tobacco_purchase
from app.domains.tobacco_return import api as tobacco_return
from app.core.route_logger import AuditLogRoute

api_router = APIRouter(route_class=AuditLogRoute)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(audit_log.router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(farmers.router, prefix="/farmers", tags=["farmers"])
api_router.include_router(farmer_contrast.router, prefix="/farmer-contrast", tags=["farmer-contrast"])
api_router.include_router(sack_registration.router, prefix="/sack-registrations", tags=["sack-registrations"])
api_router.include_router(tobacco_purchase.router, prefix="/tobacco-purchases", tags=["tobacco-purchases"])
api_router.include_router(tobacco_return.router, prefix="/tobacco-returns", tags=["tobacco-returns"])
