from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Literal, cast, get_args

import anthropic
from anthropic.types import Base64ImageSourceParam, ImageBlockParam, TextBlockParam

from app.providers.base import ChatResponse, LLMProvider, ParsedExpense

if TYPE_CHECKING:
    from app.providers.base import ChatContext

SYSTEM_PROMPT = """\
You are an expense parsing assistant. Extract expense information from the user's input \
(text, image, or both) and call the extract_expense tool with the parsed data.

Rules:
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

_SupportedMediaType = Literal["image/jpeg", "image/png", "image/gif", "image/webp"]
_SUPPORTED_MEDIA_TYPES: frozenset[str] = frozenset(get_args(_SupportedMediaType))


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str, model: str) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=api_key)
        self._model = model

    async def parse_expense(
        self,
        *,
        text: str | None,
        image_base64: str | None,
        image_media_type: str | None,
        categories: list[str],
        tags: list[str],
    ) -> ParsedExpense:
        if not text and not image_base64:
            msg = "At least one of text or image must be provided"
            raise ValueError(msg)

        today = datetime.now(UTC).strftime("%Y-%m-%d")
        category_list = ", ".join(categories) if categories else "Others"
        tag_list = ", ".join(tags) if tags else ""

        parts: list[TextBlockParam | ImageBlockParam] = []

        if image_base64 and image_media_type:
            safe_media_type = cast(
                "_SupportedMediaType",
                image_media_type if image_media_type in _SUPPORTED_MEDIA_TYPES else "image/jpeg",
            )
            parts.append(
                ImageBlockParam(
                    type="image",
                    source=Base64ImageSourceParam(
                        type="base64", media_type=safe_media_type, data=image_base64
                    ),
                )
            )

        prompt_text = f"Today's date: {today}\nAvailable categories: {category_list}\n"
        if tag_list:
            prompt_text += f"Available tags: {tag_list}\n"
        prompt_text += "\n"

        if text:
            prompt_text += f"User input: {text}"
        else:
            prompt_text += "Please extract the expense from the image above."

        parts.append(TextBlockParam(type="text", text=prompt_text))

        response = await self._client.messages.parse(
            model=self._model,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": parts}],
            output_format=ParsedExpense,
        )

        parsed = response.parsed_output
        if parsed is None:
            msg = "Failed to parse expense from input"
            raise ValueError(msg)
        return parsed

    async def chat_with_data(self, *, message: str, context: ChatContext) -> ChatResponse:
        by_category_lines = "\n".join(
            f"  - {row['category_name']}: {row['total']:.2f} ({row['count']} expenses)"
            for row in context.by_category
        )
        by_month_lines = "\n".join(
            f"  - {row['period']}: {row['total']:.2f} ({row['count']} expenses)"
            for row in context.by_month
        )
        recent_lines = "\n".join(
            f"  - {row['date']} | {row['category']} | {row['amount']:.2f} | {row['description']}"
            for row in context.recent_expenses
        )
        wallets_line = ", ".join(context.wallet_names) if context.wallet_names else "all wallets"

        data_context = f"""\
Expense data summary ({wallets_line}):
- Date range: {context.date_range}
- Total expenses: {context.total_expenses}
- Total amount spent: {context.total_amount:.2f} {context.currency}

Spending by category:
{by_category_lines or "  (no data)"}

Spending by month:
{by_month_lines or "  (no data)"}

Recent expenses (up to 10):
{recent_lines or "  (no data)"}

User question: {message}"""

        response = await self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            system=CHAT_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": data_context}],
        )

        raw = response.content[0]
        if raw.type != "text":
            msg = "Unexpected response type from Anthropic"
            raise ValueError(msg)

        return ChatResponse(response=raw.text)
