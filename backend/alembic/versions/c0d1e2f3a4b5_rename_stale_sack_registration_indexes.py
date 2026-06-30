"""rename stale dl_leaf_sack_registration index names on dl_sack_registration

When the table was renamed from dl_leaf_sack_registration to dl_sack_registration
(c3d4e5f6a7b8), only the dl_user_id index was explicitly renamed. Two indexes
kept their old leaf_-prefixed names:

  ix_dl_leaf_sack_registration_member_farmer_id  →  ix_dl_sack_registration_farmer_id
    (column was also renamed member_farmer_id → farmer_id in l7m8n9o0p1q2)

  ix_dl_leaf_sack_registration_represent_id      →  ix_dl_sack_registration_represent_id

Both names are checked before renaming so this migration is safe to run on DBs
that already have the correct names (e.g. environments that never ran through
the leaf_ table era).

Revision ID: c0d1e2f3a4b5
Revises: b9c0d1e2f3a4
Create Date: 2026-06-30 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c0d1e2f3a4b5'
down_revision: Union[str, None] = 'b9c0d1e2f3a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "dl_sack_registration"


def _index_exists(conn, table: str, index: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.STATISTICS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = :table AND INDEX_NAME = :index"
    ), {"table": table, "index": index})
    return result.scalar() > 0


def _rename_index(conn, table: str, old_name: str, new_name: str) -> None:
    if _index_exists(conn, table, old_name) and not _index_exists(conn, table, new_name):
        conn.execute(sa.text(
            f"ALTER TABLE `{table}` RENAME INDEX `{old_name}` TO `{new_name}`"
        ))


def upgrade() -> None:
    conn = op.get_bind()
    _rename_index(
        conn, _TABLE,
        "ix_dl_leaf_sack_registration_member_farmer_id",
        "ix_dl_sack_registration_farmer_id",
    )
    _rename_index(
        conn, _TABLE,
        "ix_dl_leaf_sack_registration_represent_id",
        "ix_dl_sack_registration_represent_id",
    )


def downgrade() -> None:
    conn = op.get_bind()
    _rename_index(
        conn, _TABLE,
        "ix_dl_sack_registration_farmer_id",
        "ix_dl_leaf_sack_registration_member_farmer_id",
    )
    _rename_index(
        conn, _TABLE,
        "ix_dl_sack_registration_represent_id",
        "ix_dl_leaf_sack_registration_represent_id",
    )
