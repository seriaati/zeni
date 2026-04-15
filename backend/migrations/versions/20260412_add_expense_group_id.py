"""add_expense_group_id

Revision ID: add_expense_group_id
Revises: ce90f9fda434
Create Date: 2026-04-12 02:14:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "add_expense_group_id"
down_revision: Union[str, Sequence[str], None] = "ce90f9fda434"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("expenses", sa.Column("group_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_expenses_group_id", "expenses", "expenses", ["group_id"], ["id"], ondelete="CASCADE"
    )
    op.create_index("ix_expenses_group_id", "expenses", ["group_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_expenses_group_id", table_name="expenses")
    op.drop_constraint("fk_expenses_group_id", "expenses", type_="foreignkey")
    op.drop_column("expenses", "group_id")
