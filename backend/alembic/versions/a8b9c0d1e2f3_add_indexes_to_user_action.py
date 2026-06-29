"""add indexes to user_action for Monitor Logs page_name filter and date sort

Revision ID: a8b9c0d1e2f3
Revises: 7077e3b770dc
Create Date: 2026-06-29 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a8b9c0d1e2f3'
down_revision: Union[str, None] = '7077e3b770dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _index_exists(conn, table: str, index: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.STATISTICS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = :table AND INDEX_NAME = :index"
    ), {"table": table, "index": index})
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()

    # Supports ORDER BY date DESC without a filesort over the whole table.
    if not _index_exists(conn, "user_action", "ix_user_action_date"):
        op.create_index(
            'ix_user_action_date',
            'user_action',
            ['date'],
            unique=False,
        )

    # page_name is TEXT, so a plain index isn't possible — MySQL requires a
    # key-length prefix for indexing TEXT/BLOB columns. 100 chars covers all
    # of the monitored path prefixes (e.g. "/api/v1/sack-registrations/")
    # used by the Monitor Logs page filter, turning a 224k-row full table
    # scan into an index range scan.
    if not _index_exists(conn, "user_action", "ix_user_action_page_name"):
        op.execute("CREATE INDEX ix_user_action_page_name ON user_action (page_name(100))")


def downgrade() -> None:
    conn = op.get_bind()

    if _index_exists(conn, "user_action", "ix_user_action_page_name"):
        op.drop_index('ix_user_action_page_name', table_name='user_action')

    if _index_exists(conn, "user_action", "ix_user_action_date"):
        op.drop_index('ix_user_action_date', table_name='user_action')
