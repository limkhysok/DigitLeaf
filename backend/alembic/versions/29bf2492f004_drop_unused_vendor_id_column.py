"""drop unused vendor_id column from tobacco_purchase

563fc1ac7c1c added a real INTEGER vendor_id column + fk_tp_vendor_id FK,
intending to normalize the legacy free-text `vendor` varchar column into a
proper member_farmer reference. That direction was abandoned: the ORM model
(TobaccoPurchase.vendor_id) instead aliases the original `vendor` column
directly (sa_column=Column("vendor", ...)), so the real vendor_id column is
never read or written anywhere in the app. Dropping it as dead weight.

Revision ID: 29bf2492f004
Revises: 5c53b203bd9c
Create Date: 2026-06-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '29bf2492f004'
down_revision: Union[str, None] = '5c53b203bd9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(conn, table: str, column: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    ), {"table": table, "column": column})
    return result.scalar() > 0


def _fk_exists(conn, table: str, constraint: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table "
        "AND CONSTRAINT_NAME = :constraint AND CONSTRAINT_TYPE = 'FOREIGN KEY'"
    ), {"table": table, "constraint": constraint})
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()

    if _fk_exists(conn, 'tobacco_purchase', 'fk_tp_vendor_id'):
        op.drop_constraint('fk_tp_vendor_id', 'tobacco_purchase', type_='foreignkey')
    if _has_column(conn, 'tobacco_purchase', 'vendor_id'):
        op.drop_column('tobacco_purchase', 'vendor_id')


def downgrade() -> None:
    conn = op.get_bind()

    if not _has_column(conn, 'tobacco_purchase', 'vendor_id'):
        op.add_column('tobacco_purchase', sa.Column('vendor_id', sa.Integer(), nullable=True))
    if not _fk_exists(conn, 'tobacco_purchase', 'fk_tp_vendor_id'):
        op.create_foreign_key('fk_tp_vendor_id', 'tobacco_purchase', 'member_farmer', ['vendor_id'], ['mf_id'])
