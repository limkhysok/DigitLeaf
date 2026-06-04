"""drop sack_code and member_farmer_identity_card

Revision ID: a1b2c3d4e5f6
Revises: 654778ef1c76
Create Date: 2026-05-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '654778ef1c76'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Drop sack_code index then column from dl_sack_registration
    conn.execute(sa.text(
        "ALTER TABLE dl_sack_registration DROP INDEX ix_dl_sack_registration_sack_code"
    ))
    conn.execute(sa.text(
        "ALTER TABLE dl_sack_registration DROP COLUMN sack_code"
    ))

    # Drop member_farmer_identity_card from dl_sack_registration
    conn.execute(sa.text(
        "ALTER TABLE dl_sack_registration DROP COLUMN member_farmer_identity_card"
    ))

    # Drop sack_code from dl_weigh_leaf
    conn.execute(sa.text(
        "ALTER TABLE dl_weigh_leaf DROP COLUMN sack_code"
    ))


def downgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text(
        "ALTER TABLE dl_weigh_leaf ADD COLUMN sack_code VARCHAR(100) NOT NULL DEFAULT ''"
    ))
    conn.execute(sa.text(
        "ALTER TABLE dl_sack_registration ADD COLUMN member_farmer_identity_card VARCHAR(100) NOT NULL DEFAULT ''"
    ))
    conn.execute(sa.text(
        "ALTER TABLE dl_sack_registration ADD COLUMN sack_code VARCHAR(100) NOT NULL DEFAULT ''"
    ))
    conn.execute(sa.text(
        "CREATE INDEX ix_dl_sack_registration_sack_code ON dl_sack_registration (sack_code)"
    ))
