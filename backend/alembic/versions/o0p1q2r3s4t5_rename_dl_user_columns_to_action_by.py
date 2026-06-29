"""rename dl_user_id and dl_user_name to action_by_id and action_by in dl_sack_registration

Revision ID: o0p1q2r3s4t5
Revises: n9o0p1q2r3s4
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'o0p1q2r3s4t5'
down_revision: Union[str, None] = 'n9o0p1q2r3s4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(conn, table: str, column: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    ), {"table": table, "column": column})
    return result.scalar() > 0


def _fk_constraints_on_column(conn, table: str, column: str) -> list[str]:
    result = conn.execute(sa.text(
        "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table "
        "AND COLUMN_NAME = :column AND REFERENCED_TABLE_NAME IS NOT NULL"
    ), {"table": table, "column": column})
    return [row[0] for row in result.fetchall()]


def upgrade() -> None:
    conn = op.get_bind()
    if _column_exists(conn, "dl_sack_registration", "dl_user_name"):
        conn.execute(sa.text(
            "ALTER TABLE dl_sack_registration "
            "CHANGE dl_user_name action_by VARCHAR(255) NOT NULL"
        ))
    if _column_exists(conn, "dl_sack_registration", "dl_user_id"):
        # dl_user_id still carries its original FK to dl_user(id) (added in the
        # initial create_table) — dl_user is consolidated away later in this
        # chain (u6v7w8x9y0z1) and the model never declares this FK, so drop it
        # now rather than leave it blocking the index rename below.
        for constraint in _fk_constraints_on_column(conn, "dl_sack_registration", "dl_user_id"):
            conn.execute(sa.text(f"ALTER TABLE dl_sack_registration DROP FOREIGN KEY `{constraint}`"))
        conn.execute(sa.text(
            "ALTER TABLE dl_sack_registration "
            "CHANGE dl_user_id action_by_id INT NOT NULL"
        ))
        op.drop_index('ix_dl_sack_registration_dl_user_id', table_name='dl_sack_registration')
        op.create_index('ix_dl_sack_registration_action_by_id', 'dl_sack_registration', ['action_by_id'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    if _column_exists(conn, "dl_sack_registration", "action_by"):
        conn.execute(sa.text(
            "ALTER TABLE dl_sack_registration "
            "CHANGE action_by dl_user_name VARCHAR(255) NOT NULL"
        ))
    if _column_exists(conn, "dl_sack_registration", "action_by_id"):
        conn.execute(sa.text(
            "ALTER TABLE dl_sack_registration "
            "CHANGE action_by_id dl_user_id INT NOT NULL"
        ))
        op.drop_index('ix_dl_sack_registration_action_by_id', table_name='dl_sack_registration')
        op.create_index('ix_dl_sack_registration_dl_user_id', 'dl_sack_registration', ['dl_user_id'], unique=False)
