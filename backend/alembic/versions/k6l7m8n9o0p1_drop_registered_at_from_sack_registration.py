"""drop registered_at from dl_sack_registration

Revision ID: k6l7m8n9o0p1
Revises: j5k6l7m8n9o0
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'k6l7m8n9o0p1'
down_revision: Union[str, None] = 'j5k6l7m8n9o0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(conn, table: str, column: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    ), {"table": table, "column": column})
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()
    if _column_exists(conn, "dl_sack_registration", "registered_at"):
        op.drop_column("dl_sack_registration", "registered_at")


def downgrade() -> None:
    conn = op.get_bind()
    if not _column_exists(conn, "dl_sack_registration", "registered_at"):
        op.add_column(
            "dl_sack_registration",
            sa.Column("registered_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
