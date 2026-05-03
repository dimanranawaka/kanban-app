# Backend

## Role

FastAPI app: SQLite persistence (Kanban schema + MVP seed), cookie-based session auth, JSON API under `/api`, and static hosting of the exported Next.js site from `frontend/out`.

## Layout

| Module | Purpose |
|--------|---------|
| `main.py` | Lifespan runs `init_db()`; registers `/api/health`, auth router, `/login` HTML shim for static export, mounts `StaticFiles` for `/` |
| `db.py` | `db_path`, `get_connection`, `init_db` (`CREATE TABLE IF NOT EXISTS`, indexes, MVP user + empty default board + five columns) |
| `session_token.py` | Signed session cookie payload (`itsdangerous`), `AUTH_SECRET` |
| `routes/auth.py` | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |

## Environment

- `KANBAN_DB_PATH` — SQLite file path (Docker: `/app/data/kanban.db`).
- `AUTH_SECRET` — secret for signing `auth_token` cookie.

## Docs

- Schema and API JSON shapes: `docs/DATABASE.md`
- Example relational data: `docs/SAMPLE_DATA.json`

## Tests

- `pytest backend/` from repo root (Python on PATH). Uses `backend/conftest.py` temp DB per test.
