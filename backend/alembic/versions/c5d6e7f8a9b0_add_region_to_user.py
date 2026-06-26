"""add region to user

Revision ID: c5d6e7f8a9b0
Revises: b4472dad4e01
Create Date: 2026-06-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5d6e7f8a9b0'
down_revision: Union[str, None] = 'b4472dad4e01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Disable strict mode to prevent '0000-00-00' datetime errors during ALTER
    op.execute("SET SESSION sql_mode = ''")

    op.add_column('user', sa.Column('region', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_user_region', 'user', 'region', ['region'], ['reg_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("SET SESSION sql_mode = ''")

    op.drop_constraint('fk_user_region', 'user', type_='foreignkey')
    op.drop_column('user', 'region')
