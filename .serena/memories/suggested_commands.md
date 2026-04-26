# Suggested Commands

## Frontend (frontend/)
```bash
bun dev              # dev server :5173
bun run build        # tsc -b && vite build
bun run lint         # eslint
bun run preview      # vite preview
```

## Backend (backend/) — always prefix with `uv run`
```bash
uv run uvicorn main:app --reload                        # dev server :8000
uv run alembic upgrade head                             # apply migrations
uv run alembic revision --autogenerate -m "<msg>"       # generate migration
uv run ruff format . && uv run ruff check .             # format + lint
uv run pyright                                          # type check
```

## Full stack
```bash
docker compose up -d   # postgres + backend + frontend
```
