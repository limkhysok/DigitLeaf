"""add unique index on invoice_num and repay_num as a duplicate safety net

Revision ID: r3s4t5u6v7w8
Revises: q2r3s4t5u6v7
Create Date: 2026-06-20 00:00:00.000001

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'r3s4t5u6v7w8'
down_revision: Union[str, None] = 'q2r3s4t5u6v7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _index_exists(conn, table: str, index: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.STATISTICS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = :table AND INDEX_NAME = :index"
    ), {"table": table, "index": index})
    return result.scalar() > 0


def _has_duplicates(conn, table: str, column: str) -> bool:
    result = conn.execute(sa.text(
        f"SELECT COUNT(*) FROM "
        f"(SELECT {column} FROM {table} WHERE {column} IS NOT NULL "
        f"GROUP BY {column} HAVING COUNT(*) > 1) dupes"
    ))
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()

    # generate_invoice_num/generate_repay_num now mint values from an atomic
    # per-day counter (dl_daily_sequence), so collisions shouldn't happen —
    # this index is a DB-level guarantee in case that ever changes. Skip (and
    # warn) instead of failing the migration if older rows already collide,
    # since those need a manual data fix before the constraint can be added.
    if not _has_duplicates(conn, "tobacco_purchase", "invoice_num"):
        if not _index_exists(conn, "tobacco_purchase", "ux_tp_invoice_num"):
            conn.execute(sa.text(
                "ALTER TABLE tobacco_purchase ADD UNIQUE INDEX ux_tp_invoice_num (invoice_num)"
            ))
    else:
        print(
            "WARNING: duplicate tobacco_purchase.invoice_num values exist — "
            "skipping unique index. Resolve duplicates, then re-run this migration."
        )

    if not _has_duplicates(conn, "t_contract_repay", "repay_num"):
        if not _index_exists(conn, "t_contract_repay", "ux_tcr_repay_num"):
            conn.execute(sa.text(
                "ALTER TABLE t_contract_repay ADD UNIQUE INDEX ux_tcr_repay_num (repay_num)"
            ))
    else:
        print(
            "WARNING: duplicate t_contract_repay.repay_num values exist — "
            "skipping unique index. Resolve duplicates, then re-run this migration."
        )


def downgrade() -> None:
    conn = op.get_bind()

    if _index_exists(conn, "tobacco_purchase", "ux_tp_invoice_num"):
        conn.execute(sa.text(
            "ALTER TABLE tobacco_purchase DROP INDEX ux_tp_invoice_num"
        ))

    if _index_exists(conn, "t_contract_repay", "ux_tcr_repay_num"):
        conn.execute(sa.text(
            "ALTER TABLE t_contract_repay DROP INDEX ux_tcr_repay_num"
        ))
