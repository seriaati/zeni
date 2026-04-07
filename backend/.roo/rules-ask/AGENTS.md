# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Documentation Context

- **`app/providers/`** contains LLM provider abstractions — `base.py` defines the `LLMProvider` ABC; only `AnthropicProvider` is implemented; adding a new provider means implementing `parse_expense` and `chat_with_data`
- **`ParsedExpense` in `app/providers/base.py`** is a Pydantic `BaseModel` used as the structured output schema for Anthropic's `.messages.parse()` — it is not a DB model or API schema
- **`app/services/ai_expense.py`** contains both AI parsing logic AND the `_encrypt_key`/`_decrypt_key` helpers AND `upsert_ai_provider` — these are co-located because they all relate to the AI provider record lifecycle
- **MCP server** is mounted at `/mcp` as an SSE app (`app.mount("/mcp", mcp.sse_app())`) — it is a separate interface alongside the REST API, not a replacement
- **Voice STT** has two providers (`local` via faster-whisper, `external`) controlled by `settings.stt_provider`; `faster-whisper` is an optional dependency (`uv sync --extra voice`)
- **Recurring expenses** are processed at startup (in `lifespan`) via `process_due_recurring_expenses` — not via a background scheduler or cron
- **`app/models/settings.py`** is `AppSettings` (application-level config stored in DB), distinct from `app/config.py` which is `Settings` (environment/pydantic-settings config)
