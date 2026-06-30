"""Add index to total_net_weight and grand_total

Revision ID: f6ef51698a44
Revises: h3i4j5k6l7m8
Create Date: 2026-05-21 08:51:58.354194

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f6ef51698a44'
down_revision: Union[str, None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("SET @@session.sql_mode = ''")
    op.create_index(op.f('ix_tobacco_purchase_total_net_weight'), 'tobacco_purchase', ['total_net_weight'], unique=False)
    op.create_index(op.f('ix_tobacco_purchase_grand_total'), 'tobacco_purchase', ['grand_total'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_tobacco_purchase_grand_total'), table_name='tobacco_purchase')
    op.drop_index(op.f('ix_tobacco_purchase_total_net_weight'), table_name='tobacco_purchase')
