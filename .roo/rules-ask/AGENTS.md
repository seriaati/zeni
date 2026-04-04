# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Package Manager

**Use `bun`** — never npm or yarn. **Use `uv run`** for all Python/backend commands.

## Architecture Context

- All API namespaces (`auth`, `users`, `wallets`, `expenses`, `categories`, `tags`, `budgets`, `recurring`, `tokens`, `aiProvider`, `chat`, `admin`) are exported from [`src/lib/api.ts`](src/lib/api.ts) — this is the single source of truth for backend communication
- All backend types are in [`src/lib/types.ts`](src/lib/types.ts) — no inline type definitions for API shapes
- `expenses.export()` intentionally bypasses `request()` and uses raw `fetch` — it returns a `Response` for blob/streaming download
- `WalletProvider` wraps authenticated routes only (inside `RequireAuth` in [`src/App.tsx`](src/App.tsx:69)) — wallet state is not global
- CSS design tokens are oklch-based (not hex/rgb) — defined in [`src/index.css`](src/index.css:9)
