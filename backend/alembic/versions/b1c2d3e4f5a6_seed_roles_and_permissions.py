"""Seed default roles and permissions

Revision ID: b1c2d3e4f5a6
Revises: 0d6c0a057ce4
Create Date: 2026-05-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, None] = '0d6c0a057ce4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


PERMISSIONS = [
    ("login_system", "Basic permission to access system endpoints"),
    ("manage_users", "Can create, edit, and delete user accounts"),
    ("view_audit_logs", "Can view system security audit logs"),
    ("approve_leave", "Can approve or reject leave requests"),
]

ROLES = [
    ("staff", "Default role for regular staff members"),
    ("manager", "Manager role with elevated access"),
    ("admin", "Administrator with full system access"),
]

# Permissions granted per role
ROLE_PERMISSIONS = {
    "staff":   ["login_system"],
    "manager": ["login_system", "manage_users", "view_audit_logs", "approve_leave"],
    "admin":   ["login_system", "manage_users", "view_audit_logs", "approve_leave"],
}


def upgrade() -> None:
    conn = op.get_bind()

    # Insert permissions (skip if already exists)
    for name, description in PERMISSIONS:
        exists = conn.execute(
            sa.text("SELECT id FROM dl_permission WHERE name = :name"),
            {"name": name}
        ).fetchone()
        if not exists:
            conn.execute(
                sa.text("INSERT INTO dl_permission (name, description) VALUES (:name, :description)"),
                {"name": name, "description": description}
            )

    # Insert roles (skip if already exists)
    for name, description in ROLES:
        exists = conn.execute(
            sa.text("SELECT id FROM dl_role WHERE name = :name"),
            {"name": name}
        ).fetchone()
        if not exists:
            conn.execute(
                sa.text("INSERT INTO dl_role (name, description) VALUES (:name, :description)"),
                {"name": name, "description": description}
            )

    # Link permissions to roles
    for role_name, perm_names in ROLE_PERMISSIONS.items():
        role_row = conn.execute(
            sa.text("SELECT id FROM dl_role WHERE name = :name"),
            {"name": role_name}
        ).fetchone()
        if not role_row:
            continue
        role_id = role_row[0]

        for perm_name in perm_names:
            perm_row = conn.execute(
                sa.text("SELECT id FROM dl_permission WHERE name = :name"),
                {"name": perm_name}
            ).fetchone()
            if not perm_row:
                continue
            perm_id = perm_row[0]

            link_exists = conn.execute(
                sa.text(
                    "SELECT 1 FROM dl_role_permission "
                    "WHERE role_id = :role_id AND permission_id = :perm_id"
                ),
                {"role_id": role_id, "perm_id": perm_id}
            ).fetchone()
            if not link_exists:
                conn.execute(
                    sa.text(
                        "INSERT INTO dl_role_permission (role_id, permission_id) "
                        "VALUES (:role_id, :perm_id)"
                    ),
                    {"role_id": role_id, "perm_id": perm_id}
                )


def downgrade() -> None:
    conn = op.get_bind()

    for role_name, perm_names in ROLE_PERMISSIONS.items():
        role_row = conn.execute(
            sa.text("SELECT id FROM dl_role WHERE name = :name"),
            {"name": role_name}
        ).fetchone()
        if not role_row:
            continue
        role_id = role_row[0]

        for perm_name in perm_names:
            perm_row = conn.execute(
                sa.text("SELECT id FROM dl_permission WHERE name = :name"),
                {"name": perm_name}
            ).fetchone()
            if not perm_row:
                continue
            perm_id = perm_row[0]

            conn.execute(
                sa.text(
                    "DELETE FROM dl_role_permission "
                    "WHERE role_id = :role_id AND permission_id = :perm_id"
                ),
                {"role_id": role_id, "perm_id": perm_id}
            )

    for name, _ in ROLES:
        conn.execute(
            sa.text("DELETE FROM dl_role WHERE name = :name"),
            {"name": name}
        )

    for name, _ in PERMISSIONS:
        conn.execute(
            sa.text("DELETE FROM dl_permission WHERE name = :name"),
            {"name": name}
        )
