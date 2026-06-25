"""move notes column after sack_in_kg in dl_sack_registration

Revision ID: n9o0p1q2r3s4
Revises: m8n9o0p1q2r3
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'n9o0p1q2r3s4'
down_revision: Union[str, None] = 'm8n9o0p1q2r3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("SET SESSION sql_mode = ''"))
    # notes moves before dl_user_name: sack_in_kg → notes → dl_user_name
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN notes VARCHAR(500) NULL AFTER sack_in_kg"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN dl_user_name VARCHAR(255) NOT NULL AFTER notes"))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("SET SESSION sql_mode = ''"))
    # restore: sack_in_kg → dl_user_name → notes
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN dl_user_name VARCHAR(255) NOT NULL AFTER sack_in_kg"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN notes VARCHAR(500) NULL AFTER dl_user_name"))
