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

    # 2. Migrate existing data: map vendor string name to mf_id
    op.execute(
        "UPDATE tobacco_purchase tp "
        "INNER JOIN member_farmer mf ON mf.name = tp.vendor "
        "SET tp.vendor_id = mf.mf_id"
    )

    # 3. Drop old column vendor
    op.drop_column('tobacco_purchase', 'vendor')


def downgrade() -> None:
    op.execute("SET SESSION sql_mode = ''")
    
    # 1. Add old column vendor
    op.add_column('tobacco_purchase', sa.Column('vendor', sa.String(length=255), server_default="", nullable=False))

    # 2. Migrate data back: map vendor_id to vendor string name
    op.execute(
        "UPDATE tobacco_purchase tp "
        "INNER JOIN member_farmer mf ON mf.mf_id = tp.vendor_id "
        "SET tp.vendor = mf.name"
    )

    # 3. Drop new column vendor_id
    op.drop_constraint('fk_tp_vendor_id', 'tobacco_purchase', type_='foreignkey')
    op.drop_column('tobacco_purchase', 'vendor_id')
