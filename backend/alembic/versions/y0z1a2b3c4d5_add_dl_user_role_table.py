"""Add dl_user_role join table linking user to dl_role

Revision ID: y0z1a2b3c4d5
Revises: x9y0z1a2b3c4
Create Date: 2026-06-26 00:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'y0z1a2b3c4d5'
down_revision: Union[str, None] = 'x9y0z1a2b3c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # `user` is a legacy MyISAM table; InnoDB can't enforce a FK against a
    # MyISAM parent (same convention as dl_user_region), so user_id is a
    # loose reference with no FK constraint.
    op.create_table(
        'dl_user_role',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['dl_role.id']),
        sa.PrimaryKeyConstraint('user_id', 'role_id'),
    )


def downgrade() -> None:
    op.drop_table('dl_user_role')
