"""add computed columns to tobacco_purchase

Recreated: the original file for this revision was lost from disk (only its
compiled __pycache__/.pyc survived) before ever being committed to git, while
f6ef51698a44 (which indexes these columns) still depends on it. Rebuilt to
match the live model fields (app/domains/tobacco_purchase/models/tobacco_purchase.py),
guarded so it's a no-op if the columns were already added by hand.

Revision ID: d5e6f7a8b9c0
Revises: h3i4j5k6l7m8
Create Date: 2026-05-21 08:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, None] = 'h3i4j5k6l7m8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(conn, table: str, column: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    ), {"table": table, "column": column})
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()
    if not _has_column(conn, 'tobacco_purchase', 'total_net_weight'):
        op.add_column('tobacco_purchase', sa.Column('total_net_weight', sa.Float(), nullable=False, server_default='0'))
    if not _has_column(conn, 'tobacco_purchase', 'grand_total'):
        op.add_column('tobacco_purchase', sa.Column('grand_total', sa.Float(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('tobacco_purchase', 'grand_total')
    op.drop_column('tobacco_purchase', 'total_net_weight')
