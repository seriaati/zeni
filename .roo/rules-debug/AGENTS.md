# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Package Manager

**Use `bun`** — never npm or yarn. **Use `uv run`** for all Python/backend commands.

## Debugging Notes

- Dev server proxies `/api/*` → `http://localhost:8000` — backend must be running separately
- Auth tokens stored in `localStorage` as `access_token` and `refresh_token`
- 401 responses trigger a silent refresh attempt via `/api/auth/refresh`; second 401 clears tokens and redirects to `/login`
- `FormData` requests (AI/voice) must pass `headers: {}` — omitting this causes `Content-Type: application/json` to be set, breaking multipart uploads
- `WalletProvider` is only mounted inside `RequireAuth` — accessing wallet context outside authenticated routes throws
- `expenses.export()` in [`src/lib/api.ts`](src/lib/api.ts:187) uses raw `fetch` (not `request()`) because it returns a `Response` for streaming — this is intentional
