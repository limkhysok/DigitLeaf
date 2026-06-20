"""add dl_daily_sequence table for atomic invoice/repay number generation

Revision ID: q2r3s4t5u6v7
Revises: p1q2r3s4t5u6
Create Date: 2026-06-20 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'q2r3s4t5u6v7'
down_revision: Union[str, None] = 'p1q2r3s4t5u6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(conn, table: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table"
    ), {"table": table})
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()

    # One row per (seq_date, prefix) — e.g. (2026-06-20, "TP"). Generating a
    # number is an atomic UPSERT against this row instead of a racy
    # MAX(invoice_num)+1 read off the (much larger) data table.
    #
    # (seq_date, prefix) is the primary key directly — no separate AUTO_INCREMENT
    # id column, since that would make MySQL overwrite LAST_INSERT_ID() with the
    # row's own id on every insert, clobbering the LAST_INSERT_ID(last_seq + 1)
    # trick next_daily_seq() uses to read back the sequence value.
    if not _table_exists(conn, "dl_daily_sequence"):
        op.create_table(
            'dl_daily_sequence',
            sa.Column('seq_date', sa.Date(), nullable=False),
            sa.Column('prefix', sa.String(length=8), nullable=False),
            sa.Column('last_seq', sa.Integer(), nullable=False),
            sa.PrimaryKeyConstraint('seq_date', 'prefix'),
        )


def downgrade() -> None:
    conn = op.get_bind()

    if _table_exists(conn, "dl_daily_sequence"):
        op.drop_table('dl_daily_sequence')
