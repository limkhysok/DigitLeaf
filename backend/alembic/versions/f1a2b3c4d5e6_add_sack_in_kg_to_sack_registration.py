"""add sack_in_kg to dl_sack_registration

Revision ID: f1a2b3c4d5e6
Revises: a1b2c3d4e5f6
Create Date: 2026-05-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE dl_sack_registration ADD COLUMN sack_in_kg FLOAT NULL"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE dl_sack_registration DROP COLUMN sack_in_kg"
    ))
