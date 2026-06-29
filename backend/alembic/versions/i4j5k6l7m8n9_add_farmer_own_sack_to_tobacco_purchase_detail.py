"""add farmer_own_sack to tobacco_purchase_detail

Revision ID: i4j5k6l7m8n9
Revises: 563fc1ac7c1c
Create Date: 2026-06-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'i4j5k6l7m8n9'
down_revision: Union[str, None] = '563fc1ac7c1c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("SET SESSION sql_mode = ''"))
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tobacco_purchase_detail' "
        "AND COLUMN_NAME = 'farmer_own_sack'"
    ))
    if result.scalar() == 0:
        conn.execute(sa.text(
            "ALTER TABLE tobacco_purchase_detail ADD COLUMN farmer_own_sack TINYINT NOT NULL DEFAULT 0"
        ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE tobacco_purchase_detail DROP COLUMN farmer_own_sack"
    ))
