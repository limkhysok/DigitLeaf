import sys
from os import path
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from sqlmodel import SQLModel

from alembic import context

# Add the project root to sys.path to import our app
sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))

from app.core.config import settings
from app.domains.users.models.user import User  # noqa: F401
from app.domains.auth.models.mfa import UserMFA  # noqa: F401
from app.domains.auth.models.token import UserToken  # noqa: F401
from app.domains.audit.models.audit_log import AuditLog  # noqa: F401
from app.domains.rbac.models.role import Role  # noqa: F401
from app.domains.rbac.models.permission import Permission  # noqa: F401
from app.domains.rbac.models.role_permission import RolePermissionLink  # noqa: F401
from app.domains.sack_registration.models.sack_registration import SackRegistration  # noqa: F401

# this is the Alembic Config object, which provides access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here for 'autogenerate' support
target_metadata = SQLModel.metadata

def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table":
        # Only include tables starting with 'dl_' or the alembic version table
        return name.startswith("dl_") or name == "alembic_version"
    return True

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = settings.DATABASE_URL
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
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = settings.DATABASE_URL
    
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
