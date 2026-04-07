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

## Non-Obvious Coding Rules

- **Every new model file must be imported in `app/models/__init__.py`** — Alembic won't detect it otherwise, so no migration will be generated
- **UUID primary keys**: always `default=None` + `sa_column_kwargs={"server_default": text("gen_random_uuid()")}` — never `default_factory=uuid.uuid4`
- **Timestamps**: always `sa.Column(sa.DateTime(timezone=True), server_default=text("NOW()"))` — never `datetime.now()` or `Field(default_factory=...)`
- **`from __future__ import annotations`** must be the first line of every file — enforced by ruff `future-annotations = true`
- **TYPE_CHECKING pattern**: any type used only in annotations must be under `if TYPE_CHECKING:` — except FastAPI route param types (covered by `runtime-evaluated-decorators` in `ruff.toml`)
- **Error raising**: always `msg = "..."; raise SomeError(msg)` — never inline string in raise (EM rule)
- **No `print()`**: use `logger = logging.getLogger(__name__)` at module level
- **Router pattern**: each router file defines `DbDep = Annotated[AsyncSession, Depends(get_db)]` and `CurrentUser = Annotated[User, Depends(get_current_user)]` at module level
- **AI key storage**: `_encrypt_key`/`_decrypt_key` in `app/services/ai_expense.py` are base64 only — not real encryption
- **`session.flush()`** before accessing auto-generated fields (e.g. UUID) within the same transaction; `session.commit()` + `session.refresh()` after
- **Schemas are pure Pydantic `BaseModel`** — never `SQLModel` without `table=True`; never use model classes directly in request/response types
