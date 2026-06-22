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
    # No-op: the sack-quota feature (i4j5k6l7m8n9 / j5k6l7m8n9o0, later in this
    # chain) needs this column again, and the current model
    # (TobaccoPurchaseDetail.sack_in_kg) still reads/writes it. Kept as a no-op
    # so this revision id stays valid for histories that already ran it.
    pass


def downgrade() -> None:
    # No-op: upgrade() never drops the column, so there's nothing to restore.
    pass
