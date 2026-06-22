"""migrate vendor to vendor_id

Revision ID: 563fc1ac7c1c
Revises: f6ef51698a44
Create Date: 2026-05-27 09:28:16.582080

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '563fc1ac7c1c'
down_revision: Union[str, None] = 'f6ef51698a44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Disable strict mode to prevent '0000-00-00' datetime errors during ALTER
    op.execute("SET SESSION sql_mode = ''")

    # 1. Add new column vendor_id
    op.add_column('tobacco_purchase', sa.Column('vendor_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_tp_vendor_id', 'tobacco_purchase', 'member_farmer', ['vendor_id'], ['mf_id'])

    # 2. Backfill from the existing vendor column where it matches a member_farmer name
    op.execute(
        "UPDATE tobacco_purchase tp "
        "INNER JOIN member_farmer mf ON mf.name = tp.vendor "
        "SET tp.vendor_id = mf.mf_id"
    )

    # NOTE: `vendor` is intentionally NOT dropped. The ORM model
    # (TobaccoPurchase.vendor_id) still maps onto this legacy varchar column —
    # it also holds free-text vendor names with no member_farmer match — so
    # dropping it here would break every purchase read/write downstream.


def downgrade() -> None:
    # Reverse of upgrade(): only vendor_id/its FK were added, `vendor` was never dropped.
    op.drop_constraint('fk_tp_vendor_id', 'tobacco_purchase', type_='foreignkey')
    op.drop_column('tobacco_purchase', 'vendor_id')
