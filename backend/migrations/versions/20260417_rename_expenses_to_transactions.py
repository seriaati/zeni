"""rename_expenses_to_transactions

Revision ID: rename_expenses_to_transactions
Revises: add_expense_group_id
Create Date: 2026-04-17 04:37:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "rename_expenses_to_transactions"
down_revision: Union[str, Sequence[str], None] = "add_expense_group_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_index("ix_expenses_group_id", table_name="expenses")
    op.drop_constraint("fk_expenses_group_id", "expenses", type_="foreignkey")

    op.drop_constraint("expense_tags_expense_id_fkey", "expense_tags", type_="foreignkey")

    op.rename_table("expense_tags", "transaction_tags")
    op.rename_table("recurring_expenses", "recurring_transactions")
    op.rename_table("expenses", "transactions")

    op.add_column(
        "transactions", sa.Column("type", sa.String(10), nullable=False, server_default="expense")
    )
    op.add_column(
        "recurring_transactions",
        sa.Column("type", sa.String(10), nullable=False, server_default="expense"),
    )

    op.alter_column("transaction_tags", "expense_id", new_column_name="transaction_id")

    op.create_foreign_key(
        "fk_transactions_group_id",
        "transactions",
        "transactions",
        ["group_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_transactions_group_id", "transactions", ["group_id"])

    op.create_foreign_key(
        "transaction_tags_transaction_id_fkey",
        "transaction_tags",
        "transactions",
        ["transaction_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.drop_constraint("expenses_wallet_id_fkey", "transactions", type_="foreignkey")
    op.create_foreign_key(
        "transactions_wallet_id_fkey",
        "transactions",
        "wallets",
        ["wallet_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.drop_constraint("expenses_category_id_fkey", "transactions", type_="foreignkey")
    op.create_foreign_key(
        "transactions_category_id_fkey", "transactions", "categories", ["category_id"], ["id"]
    )

    op.drop_constraint(
        "recurring_expenses_wallet_id_fkey", "recurring_transactions", type_="foreignkey"
    )
    op.create_foreign_key(
        "recurring_transactions_wallet_id_fkey",
        "recurring_transactions",
        "wallets",
        ["wallet_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.drop_constraint(
        "recurring_expenses_category_id_fkey", "recurring_transactions", type_="foreignkey"
    )
    op.create_foreign_key(
        "recurring_transactions_category_id_fkey",
        "recurring_transactions",
        "categories",
        ["category_id"],
        ["id"],
    )

    op.drop_index("ix_expenses_wallet_id", table_name="transactions")
    op.create_index("ix_transactions_wallet_id", "transactions", ["wallet_id"])

    op.drop_index("ix_recurring_expenses_wallet_id", table_name="recurring_transactions")
    op.create_index("ix_recurring_transactions_wallet_id", "recurring_transactions", ["wallet_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_recurring_transactions_wallet_id", table_name="recurring_transactions")
    op.create_index("ix_recurring_expenses_wallet_id", "recurring_transactions", ["wallet_id"])

    op.drop_index("ix_transactions_wallet_id", table_name="transactions")
    op.create_index("ix_expenses_wallet_id", "transactions", ["wallet_id"])

    op.drop_constraint(
        "recurring_transactions_category_id_fkey", "recurring_transactions", type_="foreignkey"
    )
    op.create_foreign_key(
        "recurring_expenses_category_id_fkey",
        "recurring_transactions",
        "categories",
        ["category_id"],
        ["id"],
    )

    op.drop_constraint(
        "recurring_transactions_wallet_id_fkey", "recurring_transactions", type_="foreignkey"
    )
    op.create_foreign_key(
        "recurring_expenses_wallet_id_fkey",
        "recurring_transactions",
        "wallets",
        ["wallet_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.drop_constraint("transactions_category_id_fkey", "transactions", type_="foreignkey")
    op.create_foreign_key(
        "expenses_category_id_fkey", "transactions", "categories", ["category_id"], ["id"]
    )

    op.drop_constraint("transactions_wallet_id_fkey", "transactions", type_="foreignkey")
    op.create_foreign_key(
        "expenses_wallet_id_fkey",
        "transactions",
        "wallets",
        ["wallet_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.drop_constraint(
        "transaction_tags_transaction_id_fkey", "transaction_tags", type_="foreignkey"
    )

    op.alter_column("transaction_tags", "transaction_id", new_column_name="expense_id")

    op.drop_index("ix_transactions_group_id", table_name="transactions")
    op.drop_constraint("fk_transactions_group_id", "transactions", type_="foreignkey")

    op.drop_column("recurring_transactions", "type")
    op.drop_column("transactions", "type")

    op.rename_table("transactions", "expenses")
    op.rename_table("recurring_transactions", "recurring_expenses")
    op.rename_table("transaction_tags", "expense_tags")

    op.create_foreign_key(
        "expense_tags_expense_id_fkey",
        "expense_tags",
        "expenses",
        ["expense_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.create_foreign_key(
        "fk_expenses_group_id", "expenses", "expenses", ["group_id"], ["id"], ondelete="CASCADE"
    )
    op.create_index("ix_expenses_group_id", "expenses", ["group_id"])
