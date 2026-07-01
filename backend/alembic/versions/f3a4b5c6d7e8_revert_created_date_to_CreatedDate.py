"""revert created_date back to CreatedDate in tobacco_purchase_detail

e2f3a4b5c6d7 renamed the legacy CreatedDate column to created_date, but
production systems rely on the original column name. This reverts it.

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
Create Date: 2026-06-30 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f3a4b5c6d7e8'
down_revision: Union[str, None] = 'e2f3a4b5c6d7'
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
    if _column_exists(conn, "tobacco_purchase_detail", "created_date"):
        conn.execute(sa.text(
            "ALTER TABLE tobacco_purchase_detail "
            "CHANGE created_date CreatedDate DATE NOT NULL"
        ))


def downgrade() -> None:
    conn = op.get_bind()
    if _column_exists(conn, "tobacco_purchase_detail", "CreatedDate"):
        conn.execute(sa.text(
            "ALTER TABLE tobacco_purchase_detail "
            "CHANGE CreatedDate created_date DATE NOT NULL"
        ))
