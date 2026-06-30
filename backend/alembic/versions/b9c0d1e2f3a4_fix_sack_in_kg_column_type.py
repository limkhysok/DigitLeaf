"""fix sack_in_kg column type from INT NOT NULL to FLOAT NULL

The original dl_leaf_sack_registration creation (0d6c0a057ce4) declared
sack_in_kg as INTEGER NOT NULL. Migration f1a2b3c4d5e6 intended to add it as
FLOAT NULL but used ADD COLUMN ... IF NOT EXISTS semantics, making it a no-op
on any DB that ran the original CREATE TABLE. The ORM model (SackRegistration)
declares sack_in_kg as float | None, so the DB type needs to match.

Revision ID: b9c0d1e2f3a4
Revises: a8b9c0d1e2f3
Create Date: 2026-06-30 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b9c0d1e2f3a4'
down_revision: Union[str, None] = 'a8b9c0d1e2f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_type(conn, table: str, column: str) -> str | None:
    result = conn.execute(sa.text(
        "SELECT DATA_TYPE FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    ), {"table": table, "column": column})
    row = result.first()
    return row[0].lower() if row else None


def upgrade() -> None:
    conn = op.get_bind()
    current_type = _column_type(conn, "dl_sack_registration", "sack_in_kg")
    if current_type == "int":
        conn.execute(sa.text(
            "ALTER TABLE dl_sack_registration MODIFY COLUMN sack_in_kg FLOAT NULL"
        ))


def downgrade() -> None:
    conn = op.get_bind()
    current_type = _column_type(conn, "dl_sack_registration", "sack_in_kg")
    if current_type == "float":
        # NULL rows become 0 before tightening back to NOT NULL
        conn.execute(sa.text(
            "UPDATE dl_sack_registration SET sack_in_kg = 0 WHERE sack_in_kg IS NULL"
        ))
        conn.execute(sa.text(
            "ALTER TABLE dl_sack_registration MODIFY COLUMN sack_in_kg INT NOT NULL DEFAULT 0"
        ))
