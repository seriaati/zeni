from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlmodel import Field, SQLModel, text


class RecurringTransaction(SQLModel, table=True):
    __tablename__: str = "recurring_transactions"

    id: uuid.UUID = Field(
        default=None,
        primary_key=True,
        sa_column_kwargs={"server_default": text("gen_random_uuid()")},
    )
    wallet_id: uuid.UUID = Field(foreign_key="wallets.id", index=True, ondelete="CASCADE")
    category_id: uuid.UUID = Field(foreign_key="categories.id")
    type: str = Field(default="expense", max_length=10)
    amount: float
    description: str | None = Field(default=None, max_length=500)
    frequency: str = Field(max_length=20)
    next_due: datetime = Field(sa_column=sa.Column(sa.DateTime(timezone=True), nullable=False))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default=None,
        sa_column=sa.Column(
            sa.DateTime(timezone=True), server_default=text("NOW()"), nullable=False
        ),
    )
