# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Package Manager

**Use `bun`** — never npm or yarn. **Use `uv run`** for all Python/backend commands.

## Architectural Constraints

- [`src/lib/api.ts`](src/lib/api.ts) is the mandatory API boundary — all HTTP calls must go through `request<T>()`, except `expenses.export()` which intentionally uses raw `fetch` for streaming
- `WalletProvider` is scoped to authenticated routes only — it cannot be lifted above `RequireAuth` without breaking the auth guard pattern in [`src/App.tsx`](src/App.tsx:69)
- No state management library — context-only (`AuthContext`, `WalletContext`); adding Redux/Zustand would conflict with this pattern
- Design system is CSS custom properties only (no Tailwind, no CSS-in-JS) — all tokens in [`src/index.css`](src/index.css); component styles in co-located `.css` files
- Backend is a separate Python/FastAPI service — frontend communicates exclusively via `/api/*` proxied by Vite in dev; no direct imports from backend
- `verbatimModuleSyntax` + `erasableSyntaxOnly` enforced — architectural decisions must account for strict import type separation
