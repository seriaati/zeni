from __future__ import annotations

from typing import TYPE_CHECKING, Literal, cast, get_args

import anthropic
from anthropic.types import Base64ImageSourceParam, ImageBlockParam, TextBlockParam

from app.providers.base import (
    CHAT_SYSTEM_PROMPT,
    SYSTEM_PROMPT,
    ChatResponse,
    LLMProvider,
    ParsedTransactionOutput,
    build_chat_context_str,
    build_parse_prompt,
)
from app.providers.errors import (
    ProviderAPIError,
    ProviderAuthError,
    ProviderConnectionError,
    ProviderPermissionError,
    ProviderRateLimitError,
)

if TYPE_CHECKING:
    from app.providers.base import ChatContext

_SupportedMediaType = Literal["image/jpeg", "image/png", "image/gif", "image/webp"]
_SUPPORTED_MEDIA_TYPES: frozenset[str] = frozenset(get_args(_SupportedMediaType))


def _wrap_anthropic_error(exc: Exception) -> Exception:
    if isinstance(exc, anthropic.AuthenticationError):
        return ProviderAuthError(str(exc))
    if isinstance(exc, anthropic.PermissionDeniedError):
        return ProviderPermissionError(str(exc))
    if isinstance(exc, anthropic.RateLimitError):
        return ProviderRateLimitError(str(exc))
    if isinstance(exc, anthropic.APIConnectionError):
        return ProviderConnectionError(str(exc))
    if isinstance(exc, anthropic.APIError):
        return ProviderAPIError(str(exc))
    return exc


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str, model: str) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=api_key)
        self._model = model

    async def parse_transactions(  # noqa: PLR0913
        self,
        *,
        text: str | None,
        image_base64: str | None,
        image_media_type: str | None,
        categories: list[str],
        tags: list[str],
        timezone: str = "UTC",
        custom_prompt: str | None = None,
    ) -> ParsedTransactionOutput:
        if not text and not image_base64:
            msg = "At least one of text or image must be provided"
            raise ValueError(msg)

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

        prompt_text = build_parse_prompt(
            text=text,
            categories=categories,
            tags=tags,
            timezone=timezone,
            custom_prompt=custom_prompt,
        )
        parts.append(TextBlockParam(type="text", text=prompt_text))

        try:
            response = await self._client.messages.parse(
                model=self._model,
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": parts}],
                output_format=ParsedTransactionOutput,
            )
        except Exception as exc:
            raise _wrap_anthropic_error(exc) from exc

        parsed = response.parsed_output
        if parsed is None:
            msg = "Failed to parse expense from input"
            raise ValueError(msg)
        return parsed

    async def chat_with_data(self, *, message: str, context: ChatContext) -> ChatResponse:
        data_context = build_chat_context_str(message=message, context=context)

        try:
            response = await self._client.messages.create(
                model=self._model,
                max_tokens=1024,
                system=CHAT_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": data_context}],
            )
        except Exception as exc:
            raise _wrap_anthropic_error(exc) from exc

        raw = response.content[0]
        if raw.type != "text":
            msg = "Unexpected response type from Anthropic"
            raise ValueError(msg)

        return ChatResponse(response=raw.text)

    async def list_models(self) -> list[str]:
        try:
            page = await self._client.models.list(limit=100)
        except Exception as exc:
            raise _wrap_anthropic_error(exc) from exc
        else:
            return [m.id for m in page.data]

    async def validate_key(self) -> bool:
        try:
            await self.list_models()
        except ProviderAuthError:
            return False
        else:
            return True
