from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

FrequencyType = Literal["daily", "weekly", "bi-weekly", "monthly", "yearly"]


class RecurringTransactionCreate(BaseModel):
    category_id: uuid.UUID
    type: Literal["expense", "income"] = "expense"
    amount: float = Field(gt=0)
    description: str | None = Field(default=None, max_length=500)
    frequency: FrequencyType
    next_due: datetime


class RecurringTransactionUpdate(BaseModel):
    category_id: uuid.UUID | None = None
    type: Literal["expense", "income"] | None = None
    amount: float | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, max_length=500)
    frequency: FrequencyType | None = None
    next_due: datetime | None = None
    is_active: bool | None = None


class RecurringTransactionResponse(BaseModel):
    id: uuid.UUID
    wallet_id: uuid.UUID
    category_id: uuid.UUID
    type: str
    amount: float
    description: str | None
    frequency: str
    next_due: datetime
    is_active: bool
    created_at: datetime
