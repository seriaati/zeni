# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Package Manager

**Use `bun`** — never npm or yarn. **Use `uv run`** for all Python/backend commands (e.g. `uv run alembic upgrade head`, `uv run python -c "..."`).

## Critical Coding Rules

- All API calls must go through [`src/lib/api.ts`](src/lib/api.ts) — never use `fetch` directly in components
- For `FormData` requests (AI/voice), pass `headers: {}` to `request()` to avoid overriding `Content-Type`
- Always use `import type` for type-only imports (`verbatimModuleSyntax` is enforced)
- Use [`cn()`](src/lib/utils.ts:53) from `src/lib/utils.ts` for className merging — not `clsx` directly
- Use [`fmt()`](src/lib/utils.ts:1) for currency display — never raw `Intl.NumberFormat`
- Use [`fmtDate`](src/lib/utils.ts:10)/[`fmtDateShort`](src/lib/utils.ts:15)/[`fmtRelative`](src/lib/utils.ts:20) for dates
- Use [`startOfMonth()`](src/lib/utils.ts:31)/[`endOfMonth()`](src/lib/utils.ts:38)/[`startOfWeek()`](src/lib/utils.ts:45) — they return ISO strings
- `WalletProvider` context is only available inside `RequireAuth` — don't use `useWallet()` on public routes
- Styling uses CSS custom properties from [`src/index.css`](src/index.css) — use `var(--cream)`, `var(--forest)`, etc., not hardcoded colors
- `noUnusedLocals` + `noUnusedParameters` are enforced — remove all unused variables before finishing
