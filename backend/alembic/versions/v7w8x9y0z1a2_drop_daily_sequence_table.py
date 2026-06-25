"""drop dl_daily_sequence table

Invoice/repay numbers are now generated from MAX(invoice_num/repay_num)+1
on each domain's own data table under a row lock (see generate_invoice_num
in tobacco_purchase/crud.py and generate_repay_num in tobacco_repay/crud.py),
instead of a shared per-day counter table. The existing unique indexes
ux_tp_invoice_num / ux_tcr_repay_num (added in r3s4t5u6v7w8) already make
that row lock scan only today's matching rows instead of the whole table.

Revision ID: v7w8x9y0z1a2
Revises: u6v7w8x9y0z1
Create Date: 2026-06-25 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'v7w8x9y0z1a2'
down_revision: Union[str, None] = 'u6v7w8x9y0z1'
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

    if _table_exists(conn, "dl_daily_sequence"):
        op.drop_table("dl_daily_sequence")


def downgrade() -> None:
    conn = op.get_bind()

    if not _table_exists(conn, "dl_daily_sequence"):
        op.create_table(
            "dl_daily_sequence",
            sa.Column("seq_date", sa.Date(), nullable=False),
            sa.Column("prefix", sa.String(length=8), nullable=False),
            sa.Column("last_seq", sa.Integer(), nullable=False),
            sa.PrimaryKeyConstraint("seq_date", "prefix"),
        )
