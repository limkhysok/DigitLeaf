"""add index to tobacco_purchase buyer

Revision ID: s4t5u6v7w8x9
Revises: r3s4t5u6v7w8
Create Date: 2026-06-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 's4t5u6v7w8x9'
down_revision: Union[str, None] = 'r3s4t5u6v7w8'
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
    # buyer is the primary filter for the settlement report (get_purchase_report_data)
    # and an optional filter on the purchase list; tp_date trails it since the report
    # also filters/sorts by date range.
    if not _index_exists(conn, "tobacco_purchase", "ix_tp_buyer_date"):
        conn.execute(sa.text(
            "ALTER TABLE tobacco_purchase ADD INDEX ix_tp_buyer_date (buyer, tp_date)"
        ))


def downgrade() -> None:
    conn = op.get_bind()
    if _index_exists(conn, "tobacco_purchase", "ix_tp_buyer_date"):
        conn.execute(sa.text(
            "ALTER TABLE tobacco_purchase DROP INDEX ix_tp_buyer_date"
        ))
