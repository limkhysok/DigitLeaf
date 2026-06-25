"""add index to dl_sack_registration.created_at for list sort/date-range filtering

Revision ID: p1q2r3s4t5u6
Revises: o0p1q2r3s4t5
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'p1q2r3s4t5u6'
down_revision: Union[str, None] = 'o0p1q2r3s4t5'
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

    # Supports ORDER BY created_at DESC and date_from/date_to range filters
    # in list_registrations/export without a full table scan.
    if not _index_exists(conn, "dl_sack_registration", "ix_dl_sack_registration_created_at"):
        op.create_index(
            'ix_dl_sack_registration_created_at',
            'dl_sack_registration',
            ['created_at'],
            unique=False,
        )


def downgrade() -> None:
    conn = op.get_bind()

    if _index_exists(conn, "dl_sack_registration", "ix_dl_sack_registration_created_at"):
        op.drop_index('ix_dl_sack_registration_created_at', table_name='dl_sack_registration')
