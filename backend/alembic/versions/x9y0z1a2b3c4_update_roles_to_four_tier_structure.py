"""Update dl_role to the four-tier structure: admin/boss/office_staff/field_staff

Revision ID: x9y0z1a2b3c4
Revises: e7f8a9b0c1d2
Create Date: 2026-06-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'x9y0z1a2b3c4'
down_revision: Union[str, None] = 'e7f8a9b0c1d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# (old_name, new_name, new_description) — renames carried over from the original 3-role seed
RENAMES = [
    ("manager", "boss", "Boss role with elevated, cross-region access"),
    ("staff", "office_staff", "Office staff handling administrative tasks"),
]

NEW_ROLES = [
    ("field_staff", "Field staff working directly with farmers/regions"),
]

# manage_users (and therefore /member-hub) is admin-only; boss keeps the other
# elevated permissions it had as 'manager', office_staff/field_staff get base access.
ROLE_PERMISSIONS = {
    "admin": ["login_system", "manage_users", "view_audit_logs", "approve_leave"],
    "boss": ["login_system", "view_audit_logs", "approve_leave"],
    "office_staff": ["login_system"],
    "field_staff": ["login_system"],
}


def _get_role_id(conn, name: str):
    row = conn.execute(sa.text("SELECT id FROM dl_role WHERE name = :name"), {"name": name}).fetchone()
    return row[0] if row else None


def _get_permission_id(conn, name: str):
    row = conn.execute(sa.text("SELECT id FROM dl_permission WHERE name = :name"), {"name": name}).fetchone()
    return row[0] if row else None


def _sync_role_permissions(conn, role_name: str, desired_permissions: list[str]) -> None:
    role_id = _get_role_id(conn, role_name)
    if role_id is None:
        return

    current_ids = {
        row[0]
        for row in conn.execute(
            sa.text("SELECT permission_id FROM dl_role_permission WHERE role_id = :role_id"),
            {"role_id": role_id},
        ).fetchall()
    }
    desired_ids = {pid for pid in (_get_permission_id(conn, p) for p in desired_permissions) if pid is not None}

    for perm_id in current_ids - desired_ids:
        conn.execute(
            sa.text("DELETE FROM dl_role_permission WHERE role_id = :role_id AND permission_id = :perm_id"),
            {"role_id": role_id, "perm_id": perm_id},
        )
    for perm_id in desired_ids - current_ids:
        conn.execute(
            sa.text("INSERT INTO dl_role_permission (role_id, permission_id) VALUES (:role_id, :perm_id)"),
            {"role_id": role_id, "perm_id": perm_id},
        )


def upgrade() -> None:
    conn = op.get_bind()

    for old_name, new_name, new_description in RENAMES:
        if _get_role_id(conn, new_name) is not None:
            continue
        if _get_role_id(conn, old_name) is not None:
            conn.execute(
                sa.text("UPDATE dl_role SET name = :new_name, description = :description WHERE name = :old_name"),
                {"new_name": new_name, "description": new_description, "old_name": old_name},
            )
        else:
            conn.execute(
                sa.text("INSERT INTO dl_role (name, description) VALUES (:name, :description)"),
                {"name": new_name, "description": new_description},
            )

    for name, description in NEW_ROLES:
        if _get_role_id(conn, name) is None:
            conn.execute(
                sa.text("INSERT INTO dl_role (name, description) VALUES (:name, :description)"),
                {"name": name, "description": description},
            )

    for role_name, permissions in ROLE_PERMISSIONS.items():
        _sync_role_permissions(conn, role_name, permissions)


def downgrade() -> None:
    conn = op.get_bind()

    for name, _ in NEW_ROLES:
        role_id = _get_role_id(conn, name)
        if role_id is not None:
            conn.execute(sa.text("DELETE FROM dl_role_permission WHERE role_id = :role_id"), {"role_id": role_id})
            conn.execute(sa.text("DELETE FROM dl_role WHERE id = :role_id"), {"role_id": role_id})

    for old_name, new_name, _ in RENAMES:
        if _get_role_id(conn, old_name) is not None:
            continue
        if _get_role_id(conn, new_name) is not None:
            conn.execute(
                sa.text("UPDATE dl_role SET name = :old_name WHERE name = :new_name"),
                {"old_name": old_name, "new_name": new_name},
            )

    _sync_role_permissions(conn, "manager", ["login_system", "manage_users", "view_audit_logs", "approve_leave"])
    _sync_role_permissions(conn, "staff", ["login_system"])
    _sync_role_permissions(conn, "admin", ["login_system", "manage_users", "view_audit_logs", "approve_leave"])
