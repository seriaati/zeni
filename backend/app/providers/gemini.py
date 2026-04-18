from __future__ import annotations

import json
from typing import TYPE_CHECKING

from google import genai
from google.genai import errors as genai_errors
from google.genai import types as genai_types

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


def _wrap_google_error(exc: Exception) -> Exception:
    if isinstance(exc, genai_errors.ClientError):
        return _wrap_client_error(exc)
    if isinstance(exc, genai_errors.ServerError):
        return ProviderAPIError(str(exc))
    if isinstance(exc, (ConnectionError, TimeoutError, OSError)):
        return ProviderConnectionError(str(exc))
    return exc


def _wrap_client_error(exc: genai_errors.ClientError) -> Exception:
    msg = str(exc)
    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    if code == 401 or "API_KEY_INVALID" in msg or "UNAUTHENTICATED" in msg:
        return ProviderAuthError(msg)
    if code == 403 or "PERMISSION_DENIED" in msg:
        return ProviderPermissionError(msg)
    if code == 429 or "RESOURCE_EXHAUSTED" in msg:
        return ProviderRateLimitError(msg)
    return ProviderAPIError(msg)


class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model: str) -> None:
        self._client = genai.Client(api_key=api_key)
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

        parts: list[genai_types.Part] = []

        if image_base64 and image_media_type:
            parts.append(
                genai_types.Part.from_bytes(
                    data=__import__("base64").b64decode(image_base64), mime_type=image_media_type
                )
            )

        prompt_text = build_parse_prompt(
            text=text,
            categories=categories,
            tags=tags,
            timezone=timezone,
            custom_prompt=custom_prompt,
        )
        parts.append(genai_types.Part.from_text(text=prompt_text))

        schema = ParsedTransactionOutput.model_json_schema()

        try:
            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=genai_types.Content(role="user", parts=parts),
                config=genai_types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=schema,
                ),
            )
        except Exception as exc:
            raise _wrap_google_error(exc) from exc

        raw_text = response.text
        if not raw_text:
            msg = "Failed to parse expense from input"
            raise ValueError(msg)

        return ParsedTransactionOutput.model_validate(json.loads(raw_text))

    async def chat_with_data(self, *, message: str, context: ChatContext) -> ChatResponse:
        data_context = build_chat_context_str(message=message, context=context)

        try:
            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=genai_types.Content(
                    role="user", parts=[genai_types.Part.from_text(text=data_context)]
                ),
                config=genai_types.GenerateContentConfig(system_instruction=CHAT_SYSTEM_PROMPT),
            )
        except Exception as exc:
            raise _wrap_google_error(exc) from exc

        return ChatResponse(response=response.text or "")

    async def list_models(self) -> list[str]:
        model_ids: list[str] = []
        try:
            async for m in await self._client.aio.models.list():
                name: str = m.name or ""
                if "generateContent" in (m.supported_actions or []):
                    model_ids.append(name.removeprefix("models/"))
        except Exception as exc:
            raise _wrap_google_error(exc) from exc
        else:
            return model_ids

    async def validate_key(self) -> bool:
        try:
            await self.list_models()
        except ProviderAuthError:
            return False
        else:
            return True
