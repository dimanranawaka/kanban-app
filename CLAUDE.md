# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kanban Studio** — a containerized, multi-user Kanban board with an integrated AI assistant that can autonomously manipulate the board via structured outputs. Stack: Next.js frontend + FastAPI backend + SQLite, orchestrated via Docker Compose.

## Commands

### Running the App

```bash
# Windows
scripts/start.bat        # docker-compose up -d --build

# Mac/Linux
scripts/start.sh

# App available at http://localhost:8000
```

### Frontend (cd frontend)

```bash
npm run dev              # Next.js dev server
npm run build            # Static export
npm run lint             # ESLint
npm run test:unit        # Vitest unit tests
npm run test:e2e         # Playwright e2e tests
npm run test:all         # Both test suites
```

### Backend (cd backend)

```bash
python -m pytest                      # All tests
python -m pytest test_auth.py -v      # Single test file
uvicorn backend.main:app --reload     # Dev server outside Docker
```

## Architecture

### Request Flow

Frontend (Next.js static export) → served by FastAPI's static file handler at `/` → API routes at `/api/*` — everything runs behind a single Docker container on port 8000.

### Authentication

Cookie-based sessions using `itsdangerous` URLSafeTimedSerializer. The `auth_token` httponly cookie is signed with `AUTH_SECRET`. All protected routes use the `get_current_user` dependency in `backend/deps.py`. Frontend fetch calls use `credentials: "include"`.

### State Management

Board state lives in the `useBoard` hook (`frontend/src/hooks/useBoard.ts`). Card moves use **optimistic UI** — the UI updates immediately, then rolls back on API error. Backend is stateless; each request reads/writes SQLite directly.

### AI Integration

- API key configured in `.env` as `openai_api_key`; routed through OpenRouter (`backend/ai.py`)
- Full board state is sent as JSON context with each AI request
- LLM returns a `AIStructuredOutput` (natural language response + list of actions)
- Actions (`add_card`, `update_card`, `move_card`, `delete_card`) are executed as DB transactions in `backend/routes/ai.py`
- Last 10 chat messages from `chat_history` table are included in context

### Database

SQLite at `KANBAN_DB_PATH` (default `/app/data/kanban.db` in Docker). Schema auto-creates on startup via FastAPI's lifespan event in `backend/main.py`. Default seed: username `user` / password `password` with a 5-column board.

Table hierarchy: `users` → `kanban_boards` → `kanban_columns` → `kanban_cards` (cascade deletes). `chat_history` belongs to a board.

### Drag-and-Drop

Uses `@dnd-kit` with `PointerSensor` (6px activation). Collision detection: `closestCorners`. `DragOverlay` renders `KanbanCardPreview`. Reordering logic in `frontend/src/lib/kanban.ts`.

### API Response Shape

The board detail endpoint returns a denormalized structure:
```json
{ "columns": [...], "cards": { "<column_id>": [...] } }
```
Frontend prefixes IDs: columns as `col-{id}`, cards as `card-{id}`.

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `openai_api_key` | `.env` | OpenRouter API key |
| `AUTH_SECRET` | `docker-compose.yml` | Session token signing key |
| `KANBAN_DB_PATH` | `docker-compose.yml` | SQLite file path |
| `NEXT_PUBLIC_API_BASE` | frontend env | API base URL override |

## Key Files

| File | Purpose |
|---|---|
| `backend/main.py` | FastAPI app entry, lifespan DB init, static file serving |
| `backend/kanban_access.py` | Data access layer — all board/column/card queries |
| `backend/ai.py` | OpenAI client wrapper and prompt construction |
| `backend/schemas/ai.py` | Pydantic schema for LLM structured output |
| `frontend/src/hooks/useBoard.ts` | All board state + API calls |
| `frontend/src/lib/api.ts` | Fetch wrapper for all HTTP calls |
| `frontend/src/lib/kanban.ts` | Pure helpers for card reordering logic |
| `docs/DATABASE.md` | Full schema reference |
