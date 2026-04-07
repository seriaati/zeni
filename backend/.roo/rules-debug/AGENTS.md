# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Commands

> **Always use `uv run`** — never call `python`, `alembic`, `ruff`, or `uvicorn` directly.

**After modifying any Python file**, always run:
```sh
uv run ruff format .
uv run ruff check .
uv run pyright
```

## Non-Obvious Debug Rules

- **No test suite** — there is no pytest or test runner; verify behavior by running the dev server and hitting endpoints manually
- **Migrations run automatically** on container start via `entrypoint.sh` (`alembic upgrade head`) — migration errors surface at startup, not at import time
- **Auth silently falls through**: `get_current_user` tries JWT first, then hashed API token — a 401 means both paths failed; check token type claim (`"type": "access"`) and `APIToken.token_hash` separately
- **AI provider errors are caught and re-raised as HTTP exceptions** in `app/services/ai_expense.py` — the original SDK exception is chained via `from exc`; check `__cause__` for the root Anthropic SDK error
- **`session.exec()` returns a `ScalarResult`** — call `.first()`, `.all()`, or `.one()` explicitly; forgetting this returns the result object, not the data
- **`expire_on_commit=False`** is set on `AsyncSessionLocal` — objects remain accessible after commit without a refresh, but `session.refresh()` is still needed to get server-generated values (UUIDs, timestamps)
- **Ruff `TC` rules** cause import errors if a type-only import is not under `TYPE_CHECKING` — pyright and ruff may disagree; ruff wins at CI
