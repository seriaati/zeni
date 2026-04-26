# Task Completion Checklist

## After Python edits
```bash
uv run ruff format . && uv run ruff check .   # format + lint (run always)
uv run pyright                                 # type check
```

## After frontend edits
```bash
bun run lint    # eslint
bun run build   # verify no TS errors
```

## After adding a new model
- Import it in `app/models/__init__.py`
- Run `uv run alembic revision --autogenerate -m "<msg>"`
- Run `uv run alembic upgrade head`

## No test suite exists in either package.
