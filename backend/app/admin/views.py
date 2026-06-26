from datetime import timedelta
from typing import Any
from sqladmin import ModelView
from sqladmin.authentication import AuthenticationBackend
from fastapi import Request
from sqlmodel import Session
from app.db.session import engine, async_session_maker
from app.domains.users.models import User
from app.domains.auth.models import UserToken
from app.domains.audit.models import AuditLog
from app.domains.rbac.models import Role, Permission
from app.core import security
from app.domains.users.crud import get_user_by_username
from app.core.config import settings


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")

        if not isinstance(username, str) or not isinstance(password, str):
            return False

        async with async_session_maker() as session:
            user = await get_user_by_username(session, username)
            if not user or not security.verify_password(password, user.password):
                return False

            if not user.is_full_access:
                return False

            user_name = user.user_name
            user_id = user.id
            assert user_id is not None

        token = security.create_access_token(
            subject=user_name,
            user_id=user_id,
            scopes=["admin"],
            expires_delta=timedelta(hours=2)
        )
        request.session.update({"token": token})
        return True

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        if not token:
            return False

        payload = security.decode_token(token)
        if not payload or "admin" not in payload.get("scopes", []):
            return False

        return True


authentication_backend = AdminAuth(secret_key=settings.SECRET_KEY)


class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.user_name, User.access_type, User.login_type, User.region, User.do_date]  # type: ignore[assignment]
    column_searchable_list = [User.user_name]  # type: ignore[assignment]
    column_sortable_list = [User.id, User.user_name, User.do_date]  # type: ignore[assignment]
    page_size = 100

    form_columns = [User.user_name, User.password, User.access_type, User.login_type, User.region]  # type: ignore[assignment]
    icon = "fa-solid fa-users"


class UserTokenAdmin(ModelView, model=UserToken):
    column_list = [UserToken.id, UserToken.user_name, UserToken.created_at, UserToken.expires_at]  # type: ignore[assignment]
    column_searchable_list = [UserToken.user_name]  # type: ignore[assignment]
    page_size = 100
    icon = "fa-solid fa-key"


class AuditLogAdmin(ModelView, model=AuditLog):
    column_list = [AuditLog.id, AuditLog.user, AuditLog.page_name, AuditLog.action, AuditLog.date]  # type: ignore[assignment]
    column_searchable_list = [AuditLog.user, AuditLog.page_name]  # type: ignore[assignment]
    column_default_sort = [(AuditLog.date, True)]  # type: ignore[assignment]
    page_size = 100
    icon = "fa-solid fa-list"

    can_create = False
    can_edit = False
    can_delete = False


class RoleAdmin(ModelView, model=Role):
    column_list = [Role.id, Role.name, Role.description]  # type: ignore[assignment]
    column_searchable_list = [Role.name]  # type: ignore[assignment]
    page_size = 100

    form_columns = [Role.name, Role.description, Role.permissions]  # type: ignore[assignment]
    icon = "fa-solid fa-user-shield"


class PermissionAdmin(ModelView, model=Permission):
    column_list = [Permission.id, Permission.name, Permission.description]  # type: ignore[assignment]
    column_searchable_list = [Permission.name]  # type: ignore[assignment]
    page_size = 100

    form_columns = [Permission.name, Permission.description, Permission.roles]  # type: ignore[assignment]
    icon = "fa-solid fa-unlock-keyhole"


def format_user_id(m: Any, _: Any) -> str:
    with Session(engine) as session:  # type: ignore[arg-type]
        user = session.get(User, m.user_id)
        return user.user_name if user else str(m.user_id)


def format_role_id(m: Any, _: Any) -> str:
    with Session(engine) as session:  # type: ignore[arg-type]
        role = session.get(Role, m.role_id)
        return role.name if role else str(m.role_id)
