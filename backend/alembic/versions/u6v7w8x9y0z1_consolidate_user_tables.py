"""consolidate dl_user into the pre-existing legacy 'user' table

The database already contains a legacy 'user' table (from the prior PHP
system) with real account data, separate from this app's own 'dl_user'
table. 'user' is made canonical going forward and is left untouched;
'dl_user' (along with 'dl_user_mfa', whose MFA feature is being dropped)
is removed.

dl_audit_log.user_id, dl_sack_registration.action_by_id, and
dl_user_token.user_id currently hold dl_user's row ids, which have no
correspondence to ids in 'user'. Their FK constraints are dropped rather
than redirected so historical rows aren't blocked or silently misattributed;
the columns remain plain ints.

Revision ID: u6v7w8x9y0z1
Revises: t5u6v7w8x9y0
Create Date: 2026-06-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'u6v7w8x9y0z1'
down_revision: Union[str, None] = 't5u6v7w8x9y0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_FOREIGN_KEYS = (
    ("dl_audit_log", "dl_audit_log_ibfk_1"),
    ("dl_sack_registration", "fk_dl_sack_registration_user"),
    ("dl_user_token", "dl_user_token_ibfk_1"),
    ("dl_weigh_leaf", "dl_weigh_leaf_ibfk_1"),
)


def _fk_exists(conn, table: str, constraint: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table "
        "AND CONSTRAINT_NAME = :constraint AND CONSTRAINT_TYPE = 'FOREIGN KEY'"
    ), {"table": table, "constraint": constraint})
    return result.scalar() > 0


def _table_exists(conn, table: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table"
    ), {"table": table})
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()

    for table, constraint in _FOREIGN_KEYS:
        if _fk_exists(conn, table, constraint):
            conn.execute(sa.text(f"ALTER TABLE `{table}` DROP FOREIGN KEY `{constraint}`"))

    if _table_exists(conn, "dl_user_mfa"):
        conn.execute(sa.text("DROP TABLE dl_user_mfa"))

    if _table_exists(conn, "dl_user"):
        conn.execute(sa.text("DROP TABLE dl_user"))


def downgrade() -> None:
    conn = op.get_bind()

    if not _table_exists(conn, "dl_user"):
        conn.execute(sa.text(
            "CREATE TABLE dl_user ("
            "id INTEGER NOT NULL AUTO_INCREMENT, "
            "user_name VARCHAR(255) NOT NULL, "
            "password VARCHAR(255) NOT NULL, "
            "is_active BOOL NOT NULL, "
            "created_at DATETIME NOT NULL, "
            "updated_at DATETIME NOT NULL, "
            "role_id INTEGER, "
            "PRIMARY KEY (id), "
            "UNIQUE (user_name), "
            "FOREIGN KEY(role_id) REFERENCES dl_role (id)"
            ")"
        ))

    if not _table_exists(conn, "dl_user_mfa"):
        conn.execute(sa.text(
            "CREATE TABLE dl_user_mfa ("
            "id INTEGER NOT NULL AUTO_INCREMENT, "
            "user_id INTEGER NOT NULL, "
            "otp_code VARCHAR(6), "
            "otp_expiry DATETIME, "
            "totp_secret VARCHAR(32), "
            "totp_enabled BOOL NOT NULL, "
            "PRIMARY KEY (id), "
            "UNIQUE (user_id), "
            "FOREIGN KEY(user_id) REFERENCES dl_user (id)"
            ")"
        ))

    for table, constraint in _FOREIGN_KEYS:
        if not _fk_exists(conn, table, constraint):
            if table == "dl_sack_registration":
                ref_column = "action_by_id"
            elif table == "dl_weigh_leaf":
                ref_column = "dl_user_id"
            else:
                ref_column = "user_id"
            conn.execute(sa.text(
                f"ALTER TABLE `{table}` ADD CONSTRAINT `{constraint}` "
                f"FOREIGN KEY ({ref_column}) REFERENCES dl_user (id)"
            ))
