"""initial_oauth_tables

Revision ID: initial_oauth_tables
Revises: e99074fad2c7
Create Date: 2026-04-20 00:00:00.000000

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

revision: str = "initial_oauth_tables"
down_revision: Union[str, Sequence[str], None] = "e99074fad2c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "oauth_clients",
        sa.Column("client_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("client_data", sa.TEXT(), nullable=False),
        sa.PrimaryKeyConstraint("client_id"),
    )
    op.create_table(
        "oauth_refresh_tokens",
        sa.Column("token", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("client_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("scopes", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("token"),
    )
    op.create_index(
        op.f("ix_oauth_refresh_tokens_user_id"), "oauth_refresh_tokens", ["user_id"], unique=False
    )
    op.create_table(
        "oauth_auth_codes",
        sa.Column("code", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("client_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("scopes", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("expires_at", sa.Double(), nullable=False),
        sa.Column("code_challenge", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("redirect_uri", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("redirect_uri_provided_explicitly", sa.Boolean(), nullable=False),
        sa.Column("resource", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("code"),
    )
    op.create_index(
        op.f("ix_oauth_auth_codes_user_id"), "oauth_auth_codes", ["user_id"], unique=False
    )
    op.create_table(
        "oauth_pending_requests",
        sa.Column("request_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("client_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("redirect_uri", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("redirect_uri_provided_explicitly", sa.Boolean(), nullable=False),
        sa.Column("code_challenge", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("state", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("scopes", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("resource", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("created_at", sa.Double(), nullable=False),
        sa.PrimaryKeyConstraint("request_id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("oauth_pending_requests")
    op.drop_index(op.f("ix_oauth_auth_codes_user_id"), table_name="oauth_auth_codes")
    op.drop_table("oauth_auth_codes")
    op.drop_index(op.f("ix_oauth_refresh_tokens_user_id"), table_name="oauth_refresh_tokens")
    op.drop_table("oauth_refresh_tokens")
    op.drop_table("oauth_clients")
