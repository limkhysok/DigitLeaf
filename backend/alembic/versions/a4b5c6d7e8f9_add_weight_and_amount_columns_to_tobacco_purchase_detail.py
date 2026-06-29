"""add weight/amount columns to tobacco_purchase_detail

remork_in_kg, sack_in_kg, gross_weight, total_amount, picture exist on the
live model (app/domains/tobacco_purchase/models/tobacco_purchase_detail.py)
and on the sibling 'kaic_db' schema, but no migration in this history ever
added them — they were added directly to that database outside alembic.
Recreating here so fresh/lagging databases (e.g. test_kaic_db) catch up.

Revision ID: a4b5c6d7e8f9
Revises: i4j5k6l7m8n9
Create Date: 2026-06-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a4b5c6d7e8f9'
down_revision: Union[str, None] = 'i4j5k6l7m8n9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_FLOAT_COLUMNS = ['remork_in_kg', 'sack_in_kg', 'gross_weight', 'total_amount']


def _has_column(conn, table: str, column: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    ), {"table": table, "column": column})
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()
    for column in _FLOAT_COLUMNS:
        if not _has_column(conn, 'tobacco_purchase_detail', column):
            op.add_column('tobacco_purchase_detail', sa.Column(column, sa.Float(), nullable=False, server_default='0'))
    if not _has_column(conn, 'tobacco_purchase_detail', 'picture'):
        op.add_column('tobacco_purchase_detail', sa.Column('picture', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('tobacco_purchase_detail', 'picture')
    for column in reversed(_FLOAT_COLUMNS):
        op.drop_column('tobacco_purchase_detail', column)
