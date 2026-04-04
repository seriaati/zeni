# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project

Zeni frontend — React 19 + TypeScript + Vite SPA (personal finance tracker). Backend is a separate Python/FastAPI service.

## Package Manager

**Use `bun` for all frontend commands.** A `bun.lock` is present; do not use npm or yarn.

```bash
bun dev          # dev server on :5173
bun run build    # tsc -b && vite build
bun run lint     # eslint
```

## Backend

**Always prepend `uv run` for Python commands** (backend lives outside this directory):

```bash
uv run alembic upgrade head
uv run python -c "..."
```

## API Layer

All API calls go through [`src/lib/api.ts`](src/lib/api.ts) — a single `request<T>()` function that:

- Auto-attaches `Authorization: Bearer <token>` from `localStorage`
- On 401, silently attempts token refresh via `/api/auth/refresh`, then retries once
- On second 401, clears tokens and redirects to `/login`
- For `FormData` bodies (AI/voice endpoints), pass `headers: {}` to skip `Content-Type: application/json`
- Returns `undefined as T` for 204 responses

## Vite Proxy

Dev server proxies `/api/*` → `http://localhost:8000`. No CORS config needed in dev.

## Utilities (`src/lib/utils.ts`)

- [`fmt(amount, currency)`](src/lib/utils.ts:1) — currency formatting (use instead of manual `Intl.NumberFormat`)
- [`fmtDate`](src/lib/utils.ts:10), [`fmtDateShort`](src/lib/utils.ts:15), [`fmtRelative`](src/lib/utils.ts:20) — date helpers
- [`startOfMonth()`](src/lib/utils.ts:31), [`endOfMonth()`](src/lib/utils.ts:38), [`startOfWeek()`](src/lib/utils.ts:45) — return ISO strings
- [`cn(...classes)`](src/lib/utils.ts:53) — className helper (project's own, not clsx directly)
- [`isEmoji(str)`](src/lib/utils.ts:88) — validates emoji for category icons

## Design System

CSS custom properties defined in [`src/index.css`](src/index.css). Key tokens:

- Colors: `--cream`, `--forest`, `--ink`, `--amber`, `--rose`, `--sky` (oklch-based)
- Fonts: `--font-display` (Instrument Serif), `--font-body` (DM Sans)
- Radii: `--radius-sm/--radius/--radius-lg/--radius-xl`
- Layout: `--nav-width: 240px`, `--header-height: 56px`

## TypeScript

Strict mode + `noUnusedLocals` + `noUnusedParameters` + `erasableSyntaxOnly`. Use `verbatimModuleSyntax` — always use `import type` for type-only imports.

## Auth

[`AuthContext`](src/contexts/AuthContext.tsx) wraps the app. Use `useAuth()` hook. `WalletProvider` is nested inside `RequireAuth` — wallet context is only available on authenticated routes.
