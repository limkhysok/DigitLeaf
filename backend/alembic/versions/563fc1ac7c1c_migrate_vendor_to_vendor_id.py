"""migrate vendor to vendor_id

Revision ID: 563fc1ac7c1c
Revises: f6ef51698a44
Create Date: 2026-05-27 09:28:16.582080

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '563fc1ac7c1c'
down_revision: Union[str, None] = 'f6ef51698a44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(conn, table: str, column: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    ), {"table": table, "column": column})
    return result.scalar() > 0


def _has_index(conn, table: str, index: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.STATISTICS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND INDEX_NAME = :index"
    ), {"table": table, "index": index})
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()

    # Disable strict mode to prevent '0000-00-00' datetime errors during ALTER
    op.execute("SET SESSION sql_mode = ''")

    # 1. Add new column vendor_id (a plain index, not a real FK constraint:
    # tobacco_purchase is legacy MyISAM, which silently ignores FK enforcement)
    if not _has_column(conn, 'tobacco_purchase', 'vendor_id'):
        op.add_column('tobacco_purchase', sa.Column('vendor_id', sa.Integer(), nullable=True))
    if not _has_index(conn, 'tobacco_purchase', 'fk_tp_vendor_id'):
        op.create_foreign_key('fk_tp_vendor_id', 'tobacco_purchase', 'member_farmer', ['vendor_id'], ['mf_id'])

    # member_farmer.name has no index, so the join below would otherwise be a
    # full O(n*m) nested-loop scan (113k x 5k rows). Index it for this lookup.
    if not _has_index(conn, 'member_farmer', 'ix_member_farmer_name'):
        op.create_index('ix_member_farmer_name', 'member_farmer', ['name'])

    # 2. Backfill from the existing vendor column where it matches a member_farmer name
    op.execute(
        "UPDATE tobacco_purchase tp "
        "INNER JOIN member_farmer mf ON mf.name = tp.vendor "
        "SET tp.vendor_id = mf.mf_id "
        "WHERE tp.vendor_id IS NULL"
    )

    # NOTE: `vendor` is intentionally NOT dropped. The ORM model
    # (TobaccoPurchase.vendor_id) still maps onto this legacy varchar column —
    # it also holds free-text vendor names with no member_farmer match — so
    # dropping it here would break every purchase read/write downstream.


def downgrade() -> None:
    # Reverse of upgrade(): only vendor_id/its FK were added, `vendor` was never dropped.
    op.drop_constraint('fk_tp_vendor_id', 'tobacco_purchase', type_='foreignkey')
    op.drop_column('tobacco_purchase', 'vendor_id')
