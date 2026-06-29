"""add indexes for sack status query performance

Revision ID: j5k6l7m8n9o0
Revises: i4j5k6l7m8n9
Create Date: 2026-06-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'j5k6l7m8n9o0'
down_revision: Union[str, None] = 'a4b5c6d7e8f9'
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
    conn.execute(sa.text("SET SESSION sql_mode = ''"))

    # Composite index for _get_sack_status window function:
    # PARTITION BY member_farmer_id ORDER BY created_at
    if not _index_exists(conn, "dl_sack_registration", "ix_dl_sack_reg_farmer_created"):
        conn.execute(sa.text(
            "ALTER TABLE dl_sack_registration "
            "ADD INDEX ix_dl_sack_reg_farmer_created (member_farmer_id, created_at)"
        ))

    # Covering index for pool subquery:
    # WHERE farmer_own_sack = 0 + JOIN on m_id + SUM(sack_in_kg)
    if not _index_exists(conn, "tobacco_purchase_detail", "ix_tpd_own_sack_mid_kg"):
        conn.execute(sa.text(
            "ALTER TABLE tobacco_purchase_detail "
            "ADD INDEX ix_tpd_own_sack_mid_kg (farmer_own_sack, m_id, sack_in_kg)"
        ))

    # Index for WHERE vendor IN (...) / GROUP BY vendor in pool subquery
    if not _index_exists(conn, "tobacco_purchase", "ix_tp_vendor"):
        conn.execute(sa.text(
            "ALTER TABLE tobacco_purchase ADD INDEX ix_tp_vendor (vendor)"
        ))


def downgrade() -> None:
    conn = op.get_bind()

    if _index_exists(conn, "dl_sack_registration", "ix_dl_sack_reg_farmer_created"):
        conn.execute(sa.text(
            "ALTER TABLE dl_sack_registration DROP INDEX ix_dl_sack_reg_farmer_created"
        ))

    if _index_exists(conn, "tobacco_purchase_detail", "ix_tpd_own_sack_mid_kg"):
        conn.execute(sa.text(
            "ALTER TABLE tobacco_purchase_detail DROP INDEX ix_tpd_own_sack_mid_kg"
        ))

    if _index_exists(conn, "tobacco_purchase", "ix_tp_vendor"):
        conn.execute(sa.text(
            "ALTER TABLE tobacco_purchase DROP INDEX ix_tp_vendor"
        ))
