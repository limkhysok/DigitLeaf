"""reorder columns in dl_sack_registration to match model definition

Revision ID: m8n9o0p1q2r3
Revises: l7m8n9o0p1q2
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'm8n9o0p1q2r3'
down_revision: Union[str, None] = 'l7m8n9o0p1q2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("SET SESSION sql_mode = ''"))
    # Target order: id, sack_in_kg, dl_user_name, notes, represent_id, farmer_id, dl_user_id, created_at, updated_at
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN sack_in_kg FLOAT NULL AFTER id"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN dl_user_name VARCHAR(255) NOT NULL AFTER sack_in_kg"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN notes VARCHAR(500) NULL AFTER dl_user_name"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN represent_id INT NOT NULL AFTER notes"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN farmer_id INT NOT NULL AFTER represent_id"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN dl_user_id INT NOT NULL AFTER farmer_id"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN created_at DATETIME NOT NULL AFTER dl_user_id"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN updated_at DATETIME NOT NULL AFTER created_at"))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("SET SESSION sql_mode = ''"))
    # Restore original order: id, represent_id, farmer_id, dl_user_id, dl_user_name, notes, created_at, updated_at, sack_in_kg
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN represent_id INT NOT NULL AFTER id"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN farmer_id INT NOT NULL AFTER represent_id"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN dl_user_id INT NOT NULL AFTER farmer_id"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN dl_user_name VARCHAR(255) NOT NULL AFTER dl_user_id"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN notes VARCHAR(500) NULL AFTER dl_user_name"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN created_at DATETIME NOT NULL AFTER notes"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN updated_at DATETIME NOT NULL AFTER created_at"))
    conn.execute(sa.text("ALTER TABLE dl_sack_registration MODIFY COLUMN sack_in_kg FLOAT NULL AFTER updated_at"))
