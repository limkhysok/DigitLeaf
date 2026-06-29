"""drop dead represent_name/member_farmer_name/status columns from dl_sack_registration

These three NOT-NULL, no-default columns are leftovers from the original
dl_leaf_sack_registration schema (0d6c0a057ce4) that survived the rename to
dl_sack_registration. The model (SackRegistration) never mapped them, and
represent_name/member_farmer_name are instead joined live from Represent and
MemberFarmer in crud.py — so the ORM INSERT omits all three columns, which
MySQL rejects with "Field 'represent_name' doesn't have a default value".

Revision ID: 7077e3b770dc
Revises: 29bf2492f004
Create Date: 2026-06-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '7077e3b770dc'
down_revision: Union[str, None] = '29bf2492f004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_COLUMNS = ("represent_name", "member_farmer_name", "status")


def _has_column(conn, table: str, column: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    ), {"table": table, "column": column})
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()

    for column in _COLUMNS:
        if _has_column(conn, "dl_sack_registration", column):
            op.drop_column("dl_sack_registration", column)


def downgrade() -> None:
    conn = op.get_bind()

    if not _has_column(conn, "dl_sack_registration", "represent_name"):
        op.add_column("dl_sack_registration", sa.Column("represent_name", sa.String(length=255), nullable=False, server_default=""))
    if not _has_column(conn, "dl_sack_registration", "member_farmer_name"):
        op.add_column("dl_sack_registration", sa.Column("member_farmer_name", sa.String(length=255), nullable=False, server_default=""))
    if not _has_column(conn, "dl_sack_registration", "status"):
        op.add_column("dl_sack_registration", sa.Column("status", sa.Integer(), nullable=False, server_default="0"))
