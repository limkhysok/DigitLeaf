import sys
from os import path
from logging.config import fileConfig
from typing import Any

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from sqlmodel import SQLModel

from alembic import context

# Add the project root to sys.path to import our app
sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))

from app.core.config import settings
from app.domains.users.models.user import User
from app.domains.auth.models.token import UserToken
from app.domains.audit.models.audit_log import AuditLog
from app.domains.rbac.models.role import Role
from app.domains.rbac.models.permission import Permission
from app.domains.rbac.models.role_permission import RolePermissionLink
from app.domains.rbac.models.user_role import UserRoleLink
from app.domains.sack_registration.models.sack_registration import SackRegistration
from app.domains.tobacco_purchase.models.tobacco_purchase import TobaccoPurchase
from app.domains.tobacco_purchase.models.tobacco_purchase_detail import TobaccoPurchaseDetail

# Referenced here so Pylance sees them as used; their import registers
# each table with SQLModel.metadata for Alembic autogenerate.
_register_models = (
    User, UserToken, AuditLog, Role, Permission,
    RolePermissionLink, UserRoleLink, SackRegistration, TobaccoPurchase, TobaccoPurchaseDetail,
)

# this is the Alembic Config object, which provides access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here for 'autogenerate' support
target_metadata = SQLModel.metadata

def include_object(
    _object: Any,
    name: str | None,
    type_: str,
    _reflected: bool,
    _compare_to: Any,
) -> bool:
    if type_ == "table":
        return bool(name and (name.startswith("dl_") or name in ("user", "alembic_version")))
    return True

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    assert settings.DATABASE_URL is not None
    url = settings.DATABASE_URL.replace("mysql+aiomysql://", "mysql+pymysql://")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    assert settings.DATABASE_URL is not None
    configuration = config.get_section(config.config_ini_section)
    assert configuration is not None
    sync_url = settings.DATABASE_URL.replace("mysql+aiomysql://", "mysql+pymysql://")
    configuration["sqlalchemy.url"] = sync_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
