# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Architectural Constraints

- **Migrations are forward-only** — `entrypoint.sh` runs `alembic upgrade head` on every container start; never write a migration that requires rollback capability
- **`app/models/__init__.py` is a hard dependency for Alembic** — `migrations/env.py` does `import app.models` to register SQLModel metadata; any model not imported here is invisible to autogenerate
- **Auth is dual-path, not layered** — `get_current_user` tries JWT then API token in sequence; both share the same `Authorization: Bearer` header; there is no separate endpoint or header for API tokens
- **AI provider is per-user, not global** — each user stores their own `AIProvider` record with their own API key; there is no shared/admin-level AI provider
- **LLM provider is not pluggable at runtime** — `AnthropicProvider` is instantiated directly in `app/services/ai_expense.py`; the `LLMProvider` ABC exists for future extensibility but is not wired to any factory or registry
- **Recurring expense processing is startup-only** — `process_due_recurring_expenses` runs once in FastAPI `lifespan`; missed runs (e.g. server downtime) are caught on next startup, not via a scheduler
- **Voice STT is an optional install** — `faster-whisper` is under `[project.optional-dependencies] voice`; the local STT provider will fail to import if not installed; use `uv sync --extra voice` to enable
- **MCP server shares the same process** — mounted at `/mcp` via SSE; it is not a separate service and shares the same DB session factory and config
