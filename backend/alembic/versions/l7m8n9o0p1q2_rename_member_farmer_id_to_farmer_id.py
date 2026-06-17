"""rename member_farmer_id to farmer_id in dl_sack_registration

Revision ID: l7m8n9o0p1q2
Revises: k6l7m8n9o0p1
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'l7m8n9o0p1q2'
down_revision: Union[str, None] = 'k6l7m8n9o0p1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(conn, table: str, column: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    ), {"table": table, "column": column})
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()
    if _column_exists(conn, "dl_sack_registration", "member_farmer_id"):
        conn.execute(sa.text(
            "ALTER TABLE dl_sack_registration "
            "CHANGE member_farmer_id farmer_id INT NOT NULL"
        ))


def downgrade() -> None:
    conn = op.get_bind()
    if _column_exists(conn, "dl_sack_registration", "farmer_id"):
        conn.execute(sa.text(
            "ALTER TABLE dl_sack_registration "
            "CHANGE farmer_id member_farmer_id INT NOT NULL"
        ))
