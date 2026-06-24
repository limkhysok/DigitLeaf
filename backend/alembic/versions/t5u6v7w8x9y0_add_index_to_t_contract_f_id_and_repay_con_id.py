"""add index to t_contract f_id and t_contract_repay con_id

Revision ID: t5u6v7w8x9y0
Revises: s4t5u6v7w8x9
Create Date: 2026-06-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 't5u6v7w8x9y0'
down_revision: Union[str, None] = 's4t5u6v7w8x9'
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
    # Some legacy rows have '0000-00-00' dates (e.g. t_contract.identify_date),
    # which MySQL re-validates while rebuilding the table for ADD INDEX under
    # strict mode. Relax sql_mode for this DDL only - no data is read or
    # written, this purely affects whether the rebuild re-checks old values.
    original_sql_mode = conn.execute(sa.text("SELECT @@SESSION.sql_mode")).scalar()
    conn.execute(sa.text(
        "SET SESSION sql_mode = "
        "REPLACE(REPLACE(REPLACE(@@SESSION.sql_mode, 'STRICT_TRANS_TABLES', ''), "
        "'NO_ZERO_DATE', ''), 'NO_ZERO_IN_DATE', '')"
    ))
    try:
        # t_contract.f_id had no index, forcing a full table scan as the driving
        # side of the join to mf_con_year in get_tobacco_repays (tobacco_repay list
        # and history endpoints) instead of letting MySQL drive from the much
        # smaller year-filtered mf_con_year set.
        if not _index_exists(conn, "t_contract", "ix_t_contract_f_id"):
            conn.execute(sa.text(
                "ALTER TABLE t_contract ADD INDEX ix_t_contract_f_id (f_id)"
            ))

        # t_contract_repay.con_id had no index, forcing a full table scan + temp
        # table to compute the per-contract repaid-quantity sum on every request.
        # Composite (con_id, qty_repay) lets the SUM/GROUP BY run as a covering
        # index scan instead of reading full rows.
        if not _index_exists(conn, "t_contract_repay", "ix_tcr_con_id_qty_repay"):
            conn.execute(sa.text(
                "ALTER TABLE t_contract_repay ADD INDEX ix_tcr_con_id_qty_repay (con_id, qty_repay)"
            ))
    finally:
        conn.execute(sa.text("SET SESSION sql_mode = :mode"), {"mode": original_sql_mode})


def downgrade() -> None:
    conn = op.get_bind()
    if _index_exists(conn, "t_contract_repay", "ix_tcr_con_id_qty_repay"):
        conn.execute(sa.text(
            "ALTER TABLE t_contract_repay DROP INDEX ix_tcr_con_id_qty_repay"
        ))
    if _index_exists(conn, "t_contract", "ix_t_contract_f_id"):
        conn.execute(sa.text(
            "ALTER TABLE t_contract DROP INDEX ix_t_contract_f_id"
        ))
