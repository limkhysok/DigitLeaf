import sys
from loguru import logger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
from sqladmin import Admin
from app.db.session import engine, init_db

# Core models for mapping to prevent relationship resolution errors
from app.domains.rbac.models import Role, Permission, RolePermissionLink
from app.domains.users.models import User
from app.domains.auth.models import UserMFA
from app.admin import (
    authentication_backend, UserAdmin, UserTokenAdmin, 
    AuditLogAdmin, RoleAdmin, PermissionAdmin
)
from app.domains.tobacco_purchase import models as tobacco_models # Ensure tobacco models are registered

# Register models with SQLModel/SQLAlchemy to prevent relationship resolution errors
_ = (Role, Permission, RolePermissionLink, User, UserMFA)
_ = tobacco_models 

# Setup structured logging
logger.remove() # Remove default console logger
logger.add(
    sys.stdout, 
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)
logger.add("logs/app_{time:YYYY-MM-DD}.log", rotation="50 MB", retention="10 days", level="INFO")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/api/v1/openapi.json"
)

# Setup SQLAdmin Dashboard
admin = Admin(app, engine, authentication_backend=authentication_backend)
admin.add_view(UserAdmin)
admin.add_view(RoleAdmin)
admin.add_view(PermissionAdmin)
admin.add_view(UserTokenAdmin)
admin.add_view(AuditLogAdmin)

# Set all CORS enabled origins securely from config
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("DigitLeaf API has successfully started and database initialized!")

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    logger.info("Root endpoint was accessed")
    return {"message": "Welcome to DigitLeaf API"}
