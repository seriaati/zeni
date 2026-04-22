from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

import sqlalchemy as sa
from sqlmodel import Field, SQLModel, text


class OAuthToken(SQLModel, table=True):
    __tablename__: str = "oauth_tokens"

    id: uuid.UUID = Field(
        default=None,
        primary_key=True,
        sa_column_kwargs={"server_default": text("gen_random_uuid()")},
    )
    token_hash: str = Field(unique=True, index=True)
    token_type: str  # "access" or "refresh"
    client_id: str = Field(index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    scopes: list[Any] = Field(default_factory=list, sa_column=sa.Column(sa.JSON, nullable=False))
    resource: str | None = Field(default=None, nullable=True)
    expires_at: datetime = Field(sa_column=sa.Column(sa.DateTime(timezone=True), nullable=False))
    created_at: datetime = Field(
        default=None,
        sa_column=sa.Column(
            sa.DateTime(timezone=True), server_default=text("NOW()"), nullable=False
        ),
    )
    revoked: bool = Field(default=False)
    pair_id: uuid.UUID = Field(index=True)
