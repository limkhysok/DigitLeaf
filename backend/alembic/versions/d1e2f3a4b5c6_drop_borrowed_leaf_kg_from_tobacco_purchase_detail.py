"""drop borrowed_leaf_kg from tobacco_purchase_detail

borrowed_leaf_kg was added in g2h3i4j5k6l7 but was never mapped in the
TobaccoPurchaseDetail model, never read/written in crud, and has zero
references anywhere in the codebase (backend or frontend). farmer_own_sack
(added in i4j5k6l7m8n9) replaced the concept it was intended to track.

Revision ID: d1e2f3a4b5c6
Revises: c0d1e2f3a4b5
Create Date: 2026-06-30 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, None] = 'c0d1e2f3a4b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(conn, table: str, column: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    ), {"table": table, "column": column})
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()
    if _has_column(conn, "tobacco_purchase_detail", "borrowed_leaf_kg"):
        op.drop_column("tobacco_purchase_detail", "borrowed_leaf_kg")


def downgrade() -> None:
    conn = op.get_bind()
    if not _has_column(conn, "tobacco_purchase_detail", "borrowed_leaf_kg"):
        op.add_column(
            "tobacco_purchase_detail",
            sa.Column("borrowed_leaf_kg", sa.Float(), nullable=True),
        )
