# Style & Conventions

## Python (backend)
- `from __future__ import annotations` in every file
- Type-only imports under `if TYPE_CHECKING:` (ruff TC rules)
- Raise errors: `msg = "..."; raise ValueError(msg)` (EM rule)
- No `print()` — use `logging.getLogger(__name__)`
- UUID PKs: `server_default=text("gen_random_uuid()")` with `default=None`
- Timestamps: `sa.Column(sa.DateTime(timezone=True), server_default=text("NOW()"))` — no Python-side defaults
- `app/models/__init__.py` must import every model (Alembic reads metadata from there)
- DB queries: `AsyncSession` via `session.exec(select(...))` — no raw SQL
- Migrations: forward-only; auto-run via `entrypoint.sh`

## TypeScript (frontend)
- Strict TS: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`
- Always `import type` for type-only imports
- Named exports for all components and hooks
- Context hooks (`useAuth`, `useWallet`) throw if used outside provider
- All API calls via `request<T>()` in `src/lib/api.ts`
- FormData uploads (AI/voice): pass `headers: {}` to skip `Content-Type: application/json`
- No third-party UI lib — use primitives in `src/components/ui/`
- Use `fmt(amount, currency)` from `src/lib/utils.ts` for currency formatting
- Use `cn(...classes)` for className merging

## Design tokens (index.css)
- Colors: `--cream`, `--forest`, `--ink`, `--amber`, `--rose`, `--sky` (oklch)
- Fonts: `--font-display` (Instrument Serif), `--font-body` (DM Sans)
- Layout: `--nav-width: 240px`, `--header-height: 56px`
