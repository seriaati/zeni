"""Convert all datetime columns to TIMESTAMPTZ

Revision ID: timezone_aware_datetimes
Revises: 3aaff079fde2
Create Date: 2026-04-03 16:33:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "timezone_aware_datetimes"
down_revision: Union[str, Sequence[str], None] = "3aaff079fde2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TIMESTAMPTZ = sa.DateTime(timezone=True)
_TIMESTAMP = sa.DateTime(timezone=False)

_columns: list[tuple[str, str]] = [
    ("users", "created_at"),
    ("ai_providers", "created_at"),
    ("ai_providers", "updated_at"),
    ("api_tokens", "last_used"),
    ("api_tokens", "created_at"),
    ("api_tokens", "expires_at"),
    ("categories", "created_at"),
    ("tags", "created_at"),
    ("wallets", "created_at"),
    ("budgets", "start_date"),
    ("budgets", "created_at"),
    ("expenses", "date"),
    ("expenses", "created_at"),
    ("expenses", "updated_at"),
    ("recurring_expenses", "next_due"),
    ("recurring_expenses", "created_at"),
]


def upgrade() -> None:
    for table, column in _columns:
        op.alter_column(
            table, column, type_=_TIMESTAMPTZ, postgresql_using=f"{column} AT TIME ZONE 'UTC'"
        )


def downgrade() -> None:
    for table, column in _columns:
        op.alter_column(
            table, column, type_=_TIMESTAMP, postgresql_using=f"{column} AT TIME ZONE 'UTC'"
        )
