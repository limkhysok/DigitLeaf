"""add dl_user_region table

Revision ID: d6e7f8a9b0c1
Revises: c5d6e7f8a9b0
Create Date: 2026-06-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd6e7f8a9b0c1'
down_revision: Union[str, None] = 'c5d6e7f8a9b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("SET SESSION sql_mode = ''")

    # `user` and `region` are legacy MyISAM tables, which don't support real FK
    # enforcement (the old `fk_user_region` is actually just a plain index).
    # InnoDB can't enforce a FK against a MyISAM parent, so this join table
    # keeps the same "loose reference" convention instead of a hard FK.
    op.create_table(
        'dl_user_region',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('reg_id', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('user_id', 'reg_id'),
    )

    op.execute(
        "INSERT INTO dl_user_region (user_id, reg_id) "
        "SELECT id, region FROM user WHERE region IS NOT NULL"
    )

    op.drop_column('user', 'region')


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("SET SESSION sql_mode = ''")

    op.add_column('user', sa.Column('region', sa.Integer(), nullable=True))
    op.execute(
        "UPDATE user SET region = ("
        "SELECT MIN(reg_id) FROM dl_user_region WHERE dl_user_region.user_id = user.id"
        ")"
    )

    op.drop_table('dl_user_region')
