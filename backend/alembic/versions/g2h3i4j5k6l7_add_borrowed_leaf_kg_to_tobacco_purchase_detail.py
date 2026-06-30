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
    # No-op: borrowed_leaf_kg was never used anywhere in the codebase.
    # farmer_own_sack (i4j5k6l7m8n9) replaced the concept, and the column
    # is dropped cleanly in d1e2f3a4b5c6 later in this chain.
    pass


def downgrade() -> None:
    # No-op: upgrade() never adds the column, nothing to restore.
    pass
