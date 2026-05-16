"""drop sack_in_kg from tobacco_purchase_detail

Revision ID: h3i4j5k6l7m8
Revises: g2h3i4j5k6l7
Create Date: 2026-05-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'h3i4j5k6l7m8'
down_revision: Union[str, None] = 'g2h3i4j5k6l7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_NAME = 'tobacco_purchase_detail' AND COLUMN_NAME = 'sack_in_kg'"
    ))
    if result.scalar() > 0:
        conn.execute(sa.text(
            "ALTER TABLE tobacco_purchase_detail DROP COLUMN sack_in_kg"
        ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE tobacco_purchase_detail ADD COLUMN sack_in_kg FLOAT NOT NULL DEFAULT 0.0"
    ))
