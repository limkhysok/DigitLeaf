from datetime import timedelta
from sqladmin import ModelView
from sqladmin.authentication import AuthenticationBackend
from fastapi import Request
from sqlmodel import Session
from app.db.session import engine
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
        
        with Session(engine) as session:
            user = get_user_by_username(session, username)
            if not user or not security.verify_password(password, user.password):
                return False
            
            # Require Admin or Manager role for dashboard access
            is_admin = user.role and user.role.name.lower() in ["admin", "manager"]
            if not is_admin:
                return False

        # Create a session token using our standard JWT logic
        token = security.create_access_token(
            subject=user.user_name, 
            user_id=user.id,
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
    column_list = [User.id, User.user_name, User.role, User.is_active, User.created_at]
    column_searchable_list = [User.user_name]
    column_sortable_list = [User.id, User.user_name, User.is_active, User.created_at]
    page_size = 100
    
    # Expose only the necessary fields to the CRUD form
    form_columns = [User.user_name, User.password, User.role]
    icon = "fa-solid fa-users"

class UserTokenAdmin(ModelView, model=UserToken):
    column_list = [UserToken.id, UserToken.user_name, UserToken.created_at, UserToken.expires_at]
    column_searchable_list = [UserToken.user_name]
    page_size = 100
    icon = "fa-solid fa-key"

class AuditLogAdmin(ModelView, model=AuditLog):
    column_list = [AuditLog.id, AuditLog.user_id, AuditLog.endpoint, AuditLog.method, AuditLog.created_at]
    column_searchable_list = [AuditLog.user_id, AuditLog.endpoint]
    column_default_sort = [(AuditLog.created_at, True)]
    page_size = 100
    icon = "fa-solid fa-list"
    
    can_create = False
    can_edit = False
    can_delete = False

class RoleAdmin(ModelView, model=Role):
    column_list = [Role.id, Role.name, Role.description]
    column_searchable_list = [Role.name]
    page_size = 100
    
    # Enable editing permissions for a role
    form_columns = [Role.name, Role.description, Role.permissions]
    icon = "fa-solid fa-user-shield"

class PermissionAdmin(ModelView, model=Permission):
    column_list = [Permission.id, Permission.name, Permission.description]
    column_searchable_list = [Permission.name]
    page_size = 100
    
    form_columns = [Permission.name, Permission.description, Permission.roles]
    icon = "fa-solid fa-unlock-keyhole"

def format_user_id(m, _):
    with Session(engine) as session:
        user = session.get(User, m.user_id)
        return user.user_name if user else m.user_id

def format_role_id(m, _):
    with Session(engine) as session:
        role = session.get(Role, m.role_id)
        return role.name if role else m.role_id


