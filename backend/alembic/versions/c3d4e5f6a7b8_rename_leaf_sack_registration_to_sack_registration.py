"""Rename leaf_sack_registration to sack_registration

Revision ID: c3d4e5f6a7b8
Revises: b1c2d3e4f5a6
Create Date: 2026-05-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b1c2d3e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Rename table
    conn.execute(sa.text("RENAME TABLE dl_leaf_sack_registration TO dl_sack_registration"))

    # Rename column leaf_sack_code → sack_code
    conn.execute(sa.text(
        "ALTER TABLE dl_sack_registration CHANGE leaf_sack_code sack_code VARCHAR(100) NOT NULL"
    ))

    # Rename the dl_user_id index to match new table name
    conn.execute(sa.text(
        "ALTER TABLE dl_sack_registration RENAME INDEX "
        "`ix_dl_leaf_sack_registration_dl_user_id` TO `ix_dl_sack_registration_dl_user_id`"
    ))

    # Re-add FK constraint (was dropped in a prior migration attempt)
    conn.execute(sa.text("""
        ALTER TABLE dl_sack_registration
        ADD CONSTRAINT fk_dl_sack_registration_user
        FOREIGN KEY (dl_user_id) REFERENCES dl_user(id)
    """))


def downgrade() -> None:
    conn = op.get_bind()

    # Drop FK
    conn.execute(sa.text(
        "ALTER TABLE dl_sack_registration DROP FOREIGN KEY fk_dl_sack_registration_user"
    ))

    conn.execute(sa.text(
        "ALTER TABLE dl_sack_registration RENAME INDEX "
        "`ix_dl_sack_registration_dl_user_id` TO `ix_dl_leaf_sack_registration_dl_user_id`"
    ))

    conn.execute(sa.text(
        "ALTER TABLE dl_sack_registration CHANGE sack_code leaf_sack_code VARCHAR(100) NOT NULL"
    ))

    conn.execute(sa.text("RENAME TABLE dl_sack_registration TO dl_leaf_sack_registration"))

    conn.execute(sa.text("""
        ALTER TABLE dl_leaf_sack_registration
        ADD CONSTRAINT fk_dl_leaf_sack_registration_user
        FOREIGN KEY (dl_user_id) REFERENCES dl_user(id)
    """))
