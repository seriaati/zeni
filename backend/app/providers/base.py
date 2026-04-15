from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Literal

from pydantic import BaseModel, Field


class ParsedExpense(BaseModel):
    amount: float
    currency: str
    category_name: str
    description: str
    date: str
    ai_context: str
    suggested_tags: list[str] = Field(default_factory=list)


class ParsedExpenseGroupInfo(BaseModel):
    description: str
    amount: float
    currency: str
    category_name: str
    date: str
    ai_context: str
    suggested_tags: list[str] = Field(default_factory=list)


class ParsedExpenseOutput(BaseModel):
    result_type: Literal["single", "multiple", "group"]
    expenses: list[ParsedExpense]
    group: ParsedExpenseGroupInfo | None = None


@dataclass
class ChatContext:
    total_expenses: int
    total_amount: float
    currency: str
    date_range: str
    by_category: list[dict]
    by_month: list[dict]
    recent_expenses: list[dict]
    wallet_names: list[str] = field(default_factory=list)


@dataclass
class ChatResponse:
    response: str
    data: dict | None = None


SYSTEM_PROMPT = """\
You are an expense parsing assistant. Extract expense information from the user's input \
(text, image, or both) and return structured data.

You must decide which result_type to use:
- "single": exactly one expense item (e.g. "coffee 4.5")
- "multiple": two or more independent, unrelated expense items listed together \
(e.g. "coffee 4.5, salad 2.3, phone 3000") — each gets its own category and tags; \
do NOT infer a group just because items appear together
- "group": contextually related items under one explicit umbrella \
(e.g. "lunch with Sarah: burger 10$, coke 2$", or a receipt scan with a store name and \
line items) — only use "group" when there is clear context tying the items together; \
NEVER infer groups from coincidental or unrelated purchases

For "group" result_type:
- The `group` field must be filled with the parent expense metadata \
(description = the umbrella label, amount = sum of all children, same currency/date)
- The `expenses` list contains the individual sub-expenses (children)
- The parent amount must equal the sum of children amounts

For "single" and "multiple":
- The `group` field must be null
- For "single", `expenses` has exactly 1 item
- For "multiple", `expenses` has N items (one per independent expense)

Rules for each expense item:
- amount must be a positive number
- currency must be a 3-letter ISO currency code (e.g. "USD")
- category_name: FIRST check the provided categories list for a good match. If a match exists, \
use it exactly. If NO good match exists, you MUST invent a specific, descriptive new category \
name (e.g. "Electronics", "Gaming", "Healthcare", "Transport") — NEVER use "Others" unless the \
expense is completely ambiguous and cannot be described more specifically.
- description should be concise (max 100 chars)
- date: use ISO 8601 format YYYY-MM-DD; use today's date if not specified
- ai_context: brief summary of what you extracted and why you chose the category
- suggested_tags: FIRST check the provided tags list for relevant matches. Then, for any \
concrete purchase (a product, service, or activity), you may also suggest new descriptive \
short tags that are NOT in the provided list (e.g. for a gaming mouse: "gaming", "hardware" \
). One expense can only have 3 tags in maximum, so if existing tags already match and the \
maximum will be exceeded, don't suggest. Return an empty array if no tags are suggested.
"""

CHAT_SYSTEM_PROMPT = """\
You are a personal finance assistant helping a user understand their spending habits. \
You have access to a summary of the user's expense data provided in the user message.

Guidelines:
- Be concise, friendly, and insightful
- Focus on actionable spending insights and tips when relevant
- When the user asks for numbers, reference the data provided
- If the data doesn't contain enough information to answer, say so honestly
- Do not make up expense data that isn't in the context
- Respond in plain text; do not use markdown formatting
"""


class LLMProvider(ABC):
    @abstractmethod
    async def parse_expenses(
        self,
        *,
        text: str | None,
        image_base64: str | None,
        image_media_type: str | None,
        categories: list[str],
        tags: list[str],
    ) -> ParsedExpenseOutput: ...

    @abstractmethod
    async def chat_with_data(self, *, message: str, context: ChatContext) -> ChatResponse: ...

    @abstractmethod
    async def list_models(self) -> list[str]: ...

    @abstractmethod
    async def validate_key(self) -> bool: ...
