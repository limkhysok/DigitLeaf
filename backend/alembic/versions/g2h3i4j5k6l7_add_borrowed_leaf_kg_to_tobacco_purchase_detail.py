"""add borrowed_leaf_kg to tobacco_purchase_detail

Revision ID: g2h3i4j5k6l7
Revises: f1a2b3c4d5e6
Create Date: 2026-05-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'g2h3i4j5k6l7'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_NAME = 'tobacco_purchase_detail' AND COLUMN_NAME = 'borrowed_leaf_kg'"
    ))
    if result.scalar() == 0:
        conn.execute(sa.text(
            "ALTER TABLE tobacco_purchase_detail ADD COLUMN borrowed_leaf_kg FLOAT NULL"
        ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE tobacco_purchase_detail DROP COLUMN borrowed_leaf_kg"
    ))
