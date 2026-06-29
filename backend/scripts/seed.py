"""Seed the 'limkhy' admin user and the default roles/permissions if they don't already exist.

Run from backend/: python -m scripts.seed
"""
import asyncio
from datetime import datetime

from sqlmodel import select

from app.core.config import CAMBODIA_TZ
from app.db.session import async_session_maker, engine
from app.domains.users.models import User
from app.domains.rbac.models import Permission, Role, RolePermissionLink, UserRoleLink

ADMIN_USER_IDS = {1}  # youvuth
ADMIN_USERNAMES = {"limkhy"}
DEFAULT_ROLE = "field_staff"

PERMISSIONS = [
    ("login_system", "Basic permission to access system endpoints"),
    ("manage_users", "Can create, edit, and delete user accounts"),
    ("view_audit_logs", "Can view system security audit logs"),
    ("approve_leave", "Can approve or reject leave requests"),
]

ROLES = [
    ("admin", "Full system administrator"),
    ("boss", "Boss role with elevated, cross-region access"),
    ("office_staff", "Office staff handling administrative tasks"),
    ("field_staff", "Field staff working directly with farmers/regions"),
]

ROLE_PERMISSIONS = {
    "admin": ["login_system", "manage_users", "view_audit_logs", "approve_leave"],
    "boss": ["login_system", "manage_users", "view_audit_logs", "approve_leave"],
    "office_staff": ["login_system"],
    "field_staff": ["login_system"],
}


async def seed_limkhy_user() -> None:
    async with async_session_maker() as session:
        existing = (
            await session.execute(select(User).where(User.user_name == "limkhy"))
        ).scalars().first()

        if existing:
            print("User 'limkhy' already exists, skipping.")
            return

        now = datetime.now(CAMBODIA_TZ)
        user = User(
            user_name="limkhy",
            password="limkhy123",
            access_type="all",
            login_type="1",
            user="",
            do_date=now,
            ip_address="",
            edit_user="",
            edit_do_date=now,
            edit_ip_address="",
            region=None,
        )
        session.add(user)
        await session.commit()
        print("Created user 'limkhy'.")


async def seed_roles_and_permissions() -> None:
    async with async_session_maker() as session:
        for name, description in PERMISSIONS:
            existing = (await session.execute(select(Permission).where(Permission.name == name))).scalars().first()
            if not existing:
                session.add(Permission(name=name, description=description))

        for name, description in ROLES:
            existing = (await session.execute(select(Role).where(Role.name == name))).scalars().first()
            if not existing:
                session.add(Role(name=name, description=description))

        await session.commit()

        roles_by_name = {r.name: r for r in (await session.execute(select(Role))).scalars().all()}
        permissions_by_name = {p.name: p for p in (await session.execute(select(Permission))).scalars().all()}

        for role_name, perm_names in ROLE_PERMISSIONS.items():
            role = roles_by_name.get(role_name)
            if not role:
                continue
            existing_links = {
                link.permission_id
                for link in (
                    await session.execute(select(RolePermissionLink).where(RolePermissionLink.role_id == role.id))
                ).scalars().all()
            }
            for perm_name in perm_names:
                perm = permissions_by_name.get(perm_name)
                if not perm or perm.id in existing_links:
                    continue
                session.add(RolePermissionLink(role_id=role.id, permission_id=perm.id))

        await session.commit()
        print("Synced roles and permissions.")


async def seed_user_roles() -> None:
    async with async_session_maker() as session:
        roles_by_name = {r.name: r for r in (await session.execute(select(Role))).scalars().all()}
        admin_role = roles_by_name.get("admin")
        default_role = roles_by_name.get(DEFAULT_ROLE)
        if not admin_role or not default_role:
            print("Roles not seeded yet, skipping user role assignment.")
            return

        users = (await session.execute(select(User))).scalars().all()
        linked_user_ids = {
            link.user_id
            for link in (await session.execute(select(UserRoleLink))).scalars().all()
        }

        for user in users:
            if user.id in linked_user_ids:
                continue
            is_admin = user.id in ADMIN_USER_IDS or user.user_name in ADMIN_USERNAMES
            role = admin_role if is_admin else default_role
            session.add(UserRoleLink(user_id=user.id, role_id=role.id))

        await session.commit()
        print("Synced user role assignments.")


async def main() -> None:
    await seed_limkhy_user()
    await seed_roles_and_permissions()
    await seed_user_roles()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
