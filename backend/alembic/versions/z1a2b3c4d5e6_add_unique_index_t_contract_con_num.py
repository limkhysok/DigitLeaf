"""add unique index on t_contract.con_num as a duplicate safety net

Revision ID: z1a2b3c4d5e6
Revises: y0z1a2b3c4d5
Create Date: 2026-07-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'z1a2b3c4d5e6'
down_revision: Union[str, None] = 'y0z1a2b3c4d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_unique_index(conn, table: str, column: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.STATISTICS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table "
        "AND COLUMN_NAME = :column AND NON_UNIQUE = 0"
    ), {"table": table, "column": column})
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

    # generate_contract_num now takes a FOR UPDATE lock on the last-contract
    # read (same pattern as generate_invoice_num/generate_repay_num), so
    # collisions shouldn't happen — this index is a DB-level guarantee in
    # case that ever changes. Skip (and warn) instead of failing the
    # migration if older rows already collide, since those need a manual
    # data fix before the constraint can be added. Some environments may
    # already have an unnamed/differently-named unique index on this column;
    # check by column rather than by a fixed index name to avoid a redundant
    # duplicate index.
    if _has_unique_index(conn, "t_contract", "con_num"):
        pass
    elif not _has_duplicates(conn, "t_contract", "con_num"):
        conn.execute(sa.text(
            "ALTER TABLE t_contract ADD UNIQUE INDEX ux_tc_con_num (con_num)"
        ))
    else:
        print(
            "WARNING: duplicate t_contract.con_num values exist — "
            "skipping unique index. Resolve duplicates, then re-run this migration."
        )


def downgrade() -> None:
    conn = op.get_bind()

    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.STATISTICS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 't_contract' "
        "AND INDEX_NAME = 'ux_tc_con_num'"
    ))
    if result.scalar() > 0:
        conn.execute(sa.text(
            "ALTER TABLE t_contract DROP INDEX ux_tc_con_num"
        ))
