"""replace dl_user_region table with regions json column on user

Revision ID: e7f8a9b0c1d2
Revises: d6e7f8a9b0c1
Create Date: 2026-06-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7f8a9b0c1d2'
down_revision: Union[str, None] = 'd6e7f8a9b0c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Disable strict mode to prevent '0000-00-00' datetime errors during ALTER
    op.execute("SET SESSION sql_mode = ''")

    op.add_column(
        'user',
        sa.Column('regions', sa.JSON(), nullable=False, server_default=sa.text("(JSON_ARRAY())")),
    )

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if 'dl_user_region' in inspector.get_table_names():
        op.execute(
            "UPDATE user u SET regions = COALESCE("
            "(SELECT JSON_ARRAYAGG(r.reg_id) FROM dl_user_region r WHERE r.user_id = u.id), "
            "JSON_ARRAY())"
        )
        op.drop_table('dl_user_region')


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("SET SESSION sql_mode = ''")

    op.create_table(
        'dl_user_region',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('reg_id', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('user_id', 'reg_id'),
    )

    op.execute(
        "INSERT INTO dl_user_region (user_id, reg_id) "
        "SELECT u.id, jt.reg_id FROM user u, "
        "JSON_TABLE(u.regions, '$[*]' COLUMNS (reg_id INT PATH '$')) AS jt"
    )

    op.drop_column('user', 'regions')
