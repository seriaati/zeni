# Project Overview

**Name**: Keni (repo: zeni)
**Purpose**: Personal finance tracker with AI input parsing (text, image, PDF, voice), multi-wallet support, budgets, recurring transactions, MCP/API integrations.

## Stack
- **Backend**: Python, FastAPI, SQLModel, SQLAlchemy (async), Alembic, APScheduler, JWT auth, Whisper STT
- **Frontend**: React 19, TypeScript, Vite, React Router v7, Recharts, lucide-react
- **DB**: PostgreSQL (AsyncSession)
- **Infra**: Docker Compose (postgres + backend + frontend)
- **Package managers**: `bun` (frontend), `uv` (backend) — never npm/yarn/python/pip directly

## Structure
```
/
├── backend/
│   ├── main.py
│   ├── app/
│   │   ├── config.py, database.py, dependencies.py
│   │   ├── models/      # SQLModel table=True
│   │   ├── schemas/     # Pydantic BaseModel (request/response only)
│   │   ├── routers/
│   │   ├── services/
│   │   ├── providers/   # LLM: Anthropic, Gemini, OpenAI-compat, OpenRouter
│   │   └── mcp_server.py
│   └── migrations/
├── frontend/
│   └── src/
│       ├── components/, pages/, contexts/, lib/
│       ├── App.tsx      # route guards: RequireAuth, RequireAdmin
│       └── index.css    # design tokens
└── docker-compose.yml
```
