"""drop orphaned dl_weigh_leaf table

The weigh_leaf domain (model, API, CRUD, schemas) was removed from the app in
commit 827a55c without a matching migration, leaving dl_weigh_leaf orphaned
in the database with no model pointing to it. Nothing references this table
(no FKs point to it, no model imports it), so it's safe to drop outright.

Revision ID: 5c53b203bd9c
Revises: y0z1a2b3c4d5
Create Date: 2026-06-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '5c53b203bd9c'
down_revision: Union[str, None] = 'y0z1a2b3c4d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(conn, table: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table"
    ), {"table": table})
    return result.scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()

    if _table_exists(conn, "dl_weigh_leaf"):
        op.drop_table("dl_weigh_leaf")


def downgrade() -> None:
    conn = op.get_bind()

    if not _table_exists(conn, "dl_weigh_leaf"):
        op.create_table(
            "dl_weigh_leaf",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("sack_registration_id", sa.Integer(), nullable=False),
            sa.Column("sack_in_kg", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("user_name", sa.String(length=255), nullable=False),
            sa.Column("leaf_type_id", sa.Integer(), nullable=False),
            sa.Column("leaf_type_name", sa.String(length=255), nullable=False),
            sa.Column("total_in_kg", sa.Float(), nullable=False),
            sa.Column("remork", sa.Integer(), nullable=False),
            sa.Column("total_weight_in_kg", sa.Float(), nullable=False),
            sa.Column("dl_user_id", sa.Integer(), nullable=False),
            sa.Column("dl_user_name", sa.String(length=255), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["sack_registration_id"], ["dl_sack_registration.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_dl_weigh_leaf_dl_user_id"), "dl_weigh_leaf", ["dl_user_id"], unique=False)
        op.create_index(op.f("ix_dl_weigh_leaf_leaf_type_id"), "dl_weigh_leaf", ["leaf_type_id"], unique=False)
        op.create_index(op.f("ix_dl_weigh_leaf_sack_registration_id"), "dl_weigh_leaf", ["sack_registration_id"], unique=False)
        op.create_index(op.f("ix_dl_weigh_leaf_user_id"), "dl_weigh_leaf", ["user_id"], unique=False)
