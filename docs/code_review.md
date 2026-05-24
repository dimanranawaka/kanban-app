# Kanban App — Comprehensive Code Review

**Date:** 2026-05-25  
**Reviewer:** Claude Code (claude-sonnet-4-6)  
**Scope:** Full stack — FastAPI backend, Next.js 16 / React 19 frontend, Docker config

---

## Summary Table

| ID | Severity | Category | File | Issue |
|---|---|---|---|---|
| SEC-1 | Low | Security | `.env` | API key stored in plaintext `.env` (correctly gitignored, not committed) |
| SEC-2 | **Critical** | Security | `session_token.py:9` | Hardcoded fallback session secret |
| SEC-3 | **Critical** | Security | `routes/ai.py:70-95` | AI action executor has no ownership checks |
| SEC-4 | High | Security | `routes/ai.py:11` | `/api/ai/test` endpoint is unauthenticated |
| SEC-5 | High | Security | `routes/auth.py:44,70` | Auth cookie missing `secure=True` |
| SEC-6 | High | Security | `ai.py:40` | Prompt injection via card content in system prompt |
| BUG-1 | High | Bug | `routes/ai.py:54` | Suboptimal history fetch order |
| BUG-2 | High | Bug | `routes/cards.py:57` | Two separate UPDATEs; no description length cap |
| BUG-3 | High | Bug | `db.py:87` | Swallowed `OperationalError` hides real DB errors |
| BUG-4 | Medium | Bug | `KanbanBoard.tsx:181` | Undefined card passed to KanbanCard on state mismatch |
| BUG-5 | Medium | Bug | `routes/ai.py:95` | `None` position crashes `move_card` |
| BUG-6 | Medium | Bug | `seeds.py:11` | `last_insert_rowid()` vs `cursor.lastrowid` |
| BUG-7 | Medium | Bug | `useBoard.ts:20` | `any` type on board update bypasses type safety |
| REL-1 | High | Reliability | `db.py:18` | Blocking SQLite I/O on async event loop thread |
| REL-2 | High | Reliability | `routes/ai.py:44` | DB connection held open during 15s AI call |
| REL-3 | Medium | Reliability | `routes/ai.py:62` | Internal error detail leaked to client |
| REL-4 | Medium | Reliability | `docker-compose.yml:18` | `--reload` in production-style compose |
| REL-5 | Medium | Reliability | `useBoard.ts:117` | Shallow clone of state for rollback |
| PERF-1 | Medium | Performance | `routes/boards.py:36` | All cards fetched with no pagination |
| PERF-2 | Low | Performance | `routes/cards.py:92` | O(n) UPDATEs on card delete |
| QUAL-1 | Medium | Quality | `models.py:38` | Undocumented int↔string ID conversion convention |
| QUAL-2 | Medium | Quality | `kanban.ts:18` | Dead code: `initialData`, `createId` |
| QUAL-3 | Medium | Quality | `KanbanColumn.tsx:16` | Dead code: `columnIcons`; fragile color mapping |
| QUAL-4 | Low | Quality | `ChatSidebar.tsx:11` | `any` type on `onBoardUpdate` callback |
| QUAL-5 | Low | Quality | `routes/columns.py` | Board `updated_at` not refreshed on column rename |
| QUAL-6 | Low | Quality | `routes/auth.py:58` | No rate limiting on login endpoint |
| TEST-1 | High | Test Coverage | (missing) | No tests for AI chat endpoint |
| TEST-2 | Medium | Test Coverage | `kanban.spec.ts:31` | E2E drag test uses non-existent card ID |
| TEST-3 | Medium | Test Coverage | `test_auth.py:13` | Hard-coded `user_id == 1` assertion |
| TEST-4 | Low | Test Coverage | `test_db_schema.py` | `chat_history` table not verified |
| TEST-5 | Low | Test Coverage | `kanban.test.ts` | No tests for useBoard hook mutations |

**Priority order for immediate action:**
1. **SEC-1** — Rotate the exposed API key right now, before anything else
2. **SEC-2** — Remove the fallback session secret
3. **SEC-3** — Add ownership checks to the AI action executor
4. **REL-1 + REL-2** — Fix blocking DB I/O and held-open connection during AI calls
5. **SEC-4, SEC-5, SEC-6** — Secure the remaining attack surface
6. **BUG-5** — Fix the `None`-position crash in `move_card`
7. **TEST-2** — Fix the broken E2E drag test

---

## Security

---

### SEC-1 — Low | `.env`

**Description:**
The `.env` file is correctly listed in `.gitignore` and is not committed to git. The API key is stored in plaintext on disk, which is standard practice for local development. The only residual risk is accidental exposure if the file is copied to a shared location or if `.gitignore` is ever bypassed with `git add -f`.

**Fix:**
Add a `.env.example` file with a placeholder value (`openai_api_key=your-key-here`) so new developers know what variables are required without seeing the real key.

---

### SEC-2 — Critical | `backend/session_token.py:9`

```python
secret = os.environ.get("AUTH_SECRET", "dev-insecure-secret-change-me")
```

**Description:**
The session signing secret has an in-code fallback. If `AUTH_SECRET` is not set in production (misconfiguration, missing `.env` mount, container restart), all sessions are silently signed with the publicly known string. An attacker who reads this source code can forge arbitrary session tokens for any `user_id`, including `1` (the seeded admin user).

**Fix:**
Remove the fallback entirely and fail fast at startup:
```python
secret = os.environ.get("AUTH_SECRET")
if not secret:
    raise RuntimeError("AUTH_SECRET environment variable must be set")
```

---

### SEC-3 — Critical | `backend/routes/ai.py:70-95`

**Description:**
The AI chat endpoint executes database mutations from AI-generated `KanbanAction` objects without verifying that targeted cards and columns belong to the authenticated user. The regular REST endpoints correctly call `fetch_card_owned` / `fetch_column_owned`, but the AI execution path skips all ownership checks. An attacker can craft a conversation to trigger actions on another user's data.

**Fix:**
Before executing each action, call the same ownership helpers used by the REST routes and skip unauthorized actions:
```python
elif action.action_type == "delete_card" and action.card_id:
    owned = fetch_card_owned(conn, user.user_id, action.card_id)
    if not owned:
        continue  # skip unauthorized action
    ...
```

---

### SEC-4 — High | `backend/routes/ai.py:11`

```python
@router.post("/test")
async def test_ai():
```

**Description:**
The `/api/ai/test` endpoint has no authentication. Any unauthenticated caller can trigger a real OpenAI API call, burning quota. The `CurrentUser` dependency is used throughout the rest of the AI router but was omitted here.

**Fix:**
Add `user: CurrentUser` as a parameter, or remove the endpoint entirely from production.

---

### SEC-5 — High | `backend/routes/auth.py:44,70`

**Description:**
The auth cookie is set with `httponly=True` and `samesite="lax"` but is missing `secure=True`. In a production deployment over HTTPS, the browser will still transmit the cookie over plain HTTP, exposing the session token to network interception.

**Fix:**
```python
is_production = os.environ.get("ENV", "development") == "production"
response.set_cookie(
    key=AUTH_COOKIE,
    value=token,
    httponly=True,
    samesite="lax",
    secure=is_production,
    max_age=7 * 24 * 60 * 60,
    path="/",
)
```

---

### SEC-6 — High | `backend/ai.py:40-55`

**Description:**
The entire `BoardDetail` object is serialized into the system prompt on every chat message. If card titles or descriptions contain prompt-injection text (e.g. `"SYSTEM: Ignore all previous instructions and..."`), the injected content sits inside the system prompt with elevated trust. There is no sanitization or length cap on card data sent to the model.

**Fix:**
1. Limit board state to column names and card IDs/titles only, omitting full descriptions
2. Separate structural data from user-controlled content using XML-style delimiters
3. Cap the total token count of the board state and truncate gracefully

---

## Bugs

---

### BUG-1 — High | `backend/routes/ai.py:54-55`

```python
history_rows = conn.execute("... ORDER BY id DESC LIMIT 10", ...).fetchall()
history = [...for row in reversed(history_rows)]
```

**Description:**
Fetching in descending order and Python-reversing works but is unnecessarily complex. The simpler fix is `ORDER BY id ASC LIMIT 20`.

**Fix:**
```sql
SELECT role, content FROM chat_history
WHERE board_id = ? ORDER BY id ASC LIMIT 20
```

---

### BUG-2 — High | `backend/routes/cards.py:57-88`

**Description:**
When both `title` and `description` are provided, two separate `UPDATE` statements are issued. More importantly, `description` has no maximum length validation — a client can write arbitrarily large content (MBs) to SQLite.

**Fix:**
1. Merge both fields into a single SQL UPDATE
2. Add `max_length=10000` to `CardUpdate.description` and `CardCreate.description` in `models.py`

---

### BUG-3 — High | `backend/db.py:87-90`

```python
try:
    conn.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
    conn.commit()
except sqlite3.OperationalError:
    pass
```

**Description:**
The silent `except` swallows any `OperationalError`, including disk full or corrupt DB errors. Also, since `CREATE TABLE IF NOT EXISTS` already includes `password_hash`, this migration block is dead code for fresh installs.

**Fix:**
Check `PRAGMA table_info(users)` first and raise on unexpected errors:
```python
columns = [r["name"] for r in conn.execute("PRAGMA table_info(users)").fetchall()]
if "password_hash" not in columns:
    conn.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
    conn.commit()
```

---

### BUG-4 — Medium | `frontend/src/components/KanbanBoard.tsx:181`

```tsx
cards={column.cardIds.map((cardId) => board.cards[cardId])}
```

**Description:**
If a card is in `cardIds` but not in `board.cards` (e.g. after a failed API response), `board.cards[cardId]` returns `undefined`. This is passed to `KanbanCard` which will crash accessing `undefined.id`.

**Fix:**
```tsx
cards={column.cardIds
  .map((cardId) => board.cards[cardId])
  .filter((c): c is Card => c !== undefined)}
```

---

### BUG-5 — Medium | `backend/routes/ai.py:95`

```python
move_card(conn, action.card_id, int(card["column_id"]), action.column_id, action.position)
```

**Description:**
`action.position` is typed as `int | None`. If the AI omits it, `None` flows into `move_card`'s `dest_position: int` parameter and causes `TypeError: '<' not supported between instances of 'NoneType' and 'int'` — a 500 error.

**Fix:**
```python
pos = action.position if action.position is not None else 0
move_card(conn, action.card_id, int(card["column_id"]), action.column_id, pos)
```

---

### BUG-6 — Medium | `backend/seeds.py:11`

**Description:**
`SELECT last_insert_rowid()` is used instead of `cursor.lastrowid`. The separate SELECT is fragile — if another statement runs between the INSERT and the `last_insert_rowid()` call on the same connection, it may return an unexpected ID.

**Fix:**
```python
cursor = conn.execute("INSERT INTO users ...", (...))
user_id = cursor.lastrowid
```

---

### BUG-7 — Medium | `frontend/src/hooks/useBoard.ts:20`

```typescript
const updateBoard = useCallback((detail: any) => {
```

**Description:**
`any` disables TypeScript type checking for the entire board update path from the AI sidebar. A renamed API field would silently produce `undefined` data with no compile-time error.

**Fix:**
Define a `BoardDetailResponse` interface matching the API's snake_case response shape and use it here and in `ChatSidebar.tsx`.

---

## Reliability

---

### REL-1 — High | `backend/db.py:18`

**Description:**
All route handlers are `async def` (running on the event loop thread), but `get_connection()` calls `sqlite3.connect()` — a blocking file I/O operation — directly, with no `await`. Under any concurrent load, this blocks the entire async event loop, stalling all other requests.

**Fix:**
Either use `aiosqlite` for async DB access, or wrap all DB calls in `asyncio.to_thread()`:
```python
import asyncio
conn = await asyncio.to_thread(get_connection)
```
Also add `check_same_thread=False` to `sqlite3.connect()`.

---

### REL-2 — High | `backend/routes/ai.py:44-110`

**Description:**
The entire AI chat handler — board load, 15-second OpenAI API call, DB mutations, history writes — holds a single open SQLite connection throughout. Since SQLite serializes writers, any other write request (add card, move card) during this window will queue behind the file lock, making the board effectively read-only for all users while AI is processing.

**Fix:**
Restructure the handler into three phases:
1. Load board state and history → close connection
2. Call OpenAI (no DB connection held)
3. Open new connection, execute actions, save history, commit → close connection

---

### REL-3 — Medium | `backend/routes/ai.py:62-64`

```python
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
```

**Description:**
`str(e)` on an `OpenAIError` can include the full request body — containing the system prompt with the entire board state and card descriptions. This leaks internal data and user content to the client.

**Fix:**
```python
except Exception as e:
    import logging
    logging.error("AI chat error: %s", e, exc_info=True)
    raise HTTPException(status_code=500, detail="AI service is temporarily unavailable.")
```

---

### REL-4 — Medium | `docker-compose.yml:18`

```yaml
command: uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Description:**
`--reload` watches files and restarts the server on any change. The production Dockerfile correctly omits it. The divergence means Playwright E2E tests (which start the app via `docker compose up`) run against a reload-enabled server — a reload mid-test causes non-deterministic failures.

**Fix:**
Remove `--reload` from `docker-compose.yml` or move it to a `docker-compose.override.yml` used only during local development.

---

### REL-5 — Medium | `frontend/src/hooks/useBoard.ts:117`

```typescript
const prevData = { ...boardData };
```

**Description:**
Shallow clone means `prevData.cards` and `prevData.columns[n].cardIds` are reference-copied, not deep-cloned. If another state update occurs between the optimistic update and a rollback (e.g. the AI sidebar calls `onBoardUpdate`), the rollback restores stale nested structures. The same issue exists in `renameColumn` and `moveCard`.

**Fix:**
```typescript
const prevData = structuredClone(boardData);
```

---

## Performance

---

### PERF-1 — Medium | `backend/routes/boards.py:36`

**Description:**
All cards for a board are fetched in a single `fetchall()` with no pagination. For large boards (1000+ cards), the entire dataset is loaded into memory and serialized to JSON on every board load. Acceptable for the current MVP scale, but worth noting.

**Fix:**
For current scale, acceptable. If scaling is needed, add pagination on the cards endpoint or lazy-load cards per column.

---

### PERF-2 — Low | `backend/routes/cards.py:92`

**Description:**
`renumber_column()` after a card deletion issues one `UPDATE` per remaining card in the column — O(n) writes for an n-card column. The same pattern occurs in `move_card`.

**Fix:**
For small boards this is acceptable. For scale, use a single bulk UPDATE:
```sql
UPDATE kanban_cards SET position = position - 1
WHERE column_id = ? AND position > ?
```

---

## Code Quality / Maintainability

---

### QUAL-1 — Medium | `backend/models.py:38`

**Description:**
`CardPayload.id` is typed as `str` even though the database stores card IDs as integers. The `"card-{id}"` / `"col-{id}"` prefix convention is not documented. On the frontend, `Number(cardId.replace('card-', ''))` silently returns `NaN` if the ID format ever changes, causing API calls to fail with no error message.

**Fix:**
Document the convention in a comment in `kanban.ts` and `useBoard.ts`. Add a typed helper:
```typescript
const toNumericId = (prefixedId: string, prefix: string): number => {
  const n = Number(prefixedId.replace(prefix, ''));
  if (!Number.isFinite(n)) throw new Error(`Invalid ID: ${prefixedId}`);
  return n;
};
```

---

### QUAL-2 — Medium | `frontend/src/lib/kanban.ts:18`

**Description:**
`initialData` (hardcoded sample board data) and `createId` are never imported or used anywhere in the application. The board is fully loaded from the API. Dead code that looks plausible can mislead future developers.

**Fix:**
Remove `initialData` and `createId` from `kanban.ts`.

---

### QUAL-3 — Medium | `frontend/src/components/KanbanColumn.tsx:16`

**Description:**
`columnIcons` is defined but never used (the icon is accessed via `colorMap[normalizedTitle].icon`). The `colorMap` normalization (`toLowerCase().replace(/\s/g, '')`) only works for the five fixed default names. Renaming any column produces a silent fallback to the "To Do" blue theme, which is visually confusing.

**Fix:**
1. Remove `columnIcons`
2. Store a stable `colorKey` on the `Column` type (e.g. original position index or a server-side enum) rather than deriving it from the user-editable title string

---

### QUAL-4 — Low | `frontend/src/components/ChatSidebar.tsx:11`

```typescript
onBoardUpdate: (newBoard: any) => void
```

**Description:**
The `any` type on `onBoardUpdate` disables TypeScript checking for the entire AI board update path. If the API response shape changes, TypeScript will not catch the mismatch.

**Fix:**
Define and use a `BoardDetailResponse` interface (see BUG-7).

---

### QUAL-5 — Low | `backend/routes/columns.py`

**Description:**
`rename_column` does not update `kanban_boards.updated_at`. The `update_card` endpoint updates the card's `updated_at`. The inconsistency means a board's timestamp does not reflect column renames.

**Fix:**
```python
conn.execute(
    "UPDATE kanban_boards SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    (col["board_id"],)
)
```

---

### QUAL-6 — Low | `backend/routes/auth.py:58`

**Description:**
There is no rate limiting on the login endpoint. An attacker can brute-force passwords at bcrypt speed. The app seeds a known username (`user`) at startup, making it a fixed target.

**Fix:**
Add rate limiting via `slowapi` or an in-memory counter per username on `/api/auth/login`.

---

## Test Coverage

---

### TEST-1 — High | (missing file)

**Description:**
There are no tests for the AI chat endpoint (`/api/ai/chat`) — the most complex endpoint in the application. It contains SEC-3, BUG-5, REL-2, and REL-3. No test verifies that unauthorized card/column access is rejected, that `None` positions are handled, or that chat history is saved correctly.

**Fix:**
Add `backend/test_ai_chat.py` with mocked OpenAI responses testing:
- Unauthorized card/column actions are skipped
- `add_card` creates and returns the new card
- `move_card` with `None` position defaults to 0
- History is saved in chronological order
- Returned board state reflects applied actions

---

### TEST-2 — Medium | `frontend/tests/kanban.spec.ts:31`

```typescript
const card = page.getByTestId("card-card-1");
```

**Description:**
The E2E drag test hard-codes `card-card-1` (database ID 1). The seeded board has no cards, so this element never exists. The test fails on every run against a fresh or persistent database where card ID 1 was never created or has been deleted. This is the failure observed in the test run.

**Fix:**
Create a card in the test body before dragging:
```typescript
const col = page.locator('[data-testid^="column-"]').first();
await col.getByRole("button", { name: "+ Add card" }).click();
await col.getByPlaceholder(/card title/i).fill("Drag me");
await col.getByRole("button", { name: /^add$/i }).click();
await expect(col.getByText("Drag me")).toBeVisible();
const card = col.locator('[data-testid^="card-"]').first();
// now drag card...
```

---

### TEST-3 — Medium | `backend/test_auth.py:13`

```python
assert me.json()["user_id"] == 1
```

**Description:**
Hard-codes `user_id == 1`. While correct for an isolated test DB, this assertion is brittle. If the test fixture ever shares state or if the seeding order changes, it breaks.

**Fix:**
```python
assert me.json()["user_id"] > 0
```

---

### TEST-4 — Low | `backend/test_db_schema.py`

**Description:**
The schema test does not assert that the `chat_history` table exists. If it is accidentally removed from `init_db`, no test will catch it.

**Fix:**
```python
assert "chat_history" in names
```

---

### TEST-5 — Low | `frontend/src/lib/kanban.test.ts`

**Description:**
Unit tests cover only `moveCard`. No tests for `renameColumn` rollback, `deleteCard` rollback, `addCard` state update, or the authentication redirect behavior in `page.tsx`.

**Fix:**
Add `useBoard.test.ts` using `@testing-library/react` and `vi.mock('@/lib/api')` covering success and failure paths for each mutation.

---

## Strengths

The following aspects of the codebase are well implemented:

1. **Authorization model is correct in the REST layer.** Every REST route consistently uses `fetch_board_owned`, `fetch_column_owned`, and `fetch_card_owned` with JOIN-based ownership checks. Cross-user data access is not possible through the regular API.

2. **Session token implementation is solid.** `itsdangerous.URLSafeTimedSerializer` with a configurable secret, salt, and 7-day max age is the right choice. `httponly=True` prevents XSS token theft.

3. **Password hashing uses bcrypt correctly.** `bcrypt.hashpw` with `bcrypt.gensalt()` (cost 12) is correct. The seed function handles the upgrade path for users without a hash.

4. **Optimistic UI with rollback.** The `useBoard` hook implements optimistic updates for rename, delete, and move operations with error-triggered rollbacks and Sonner toast notifications. Well-structured for a client-side hook.

5. **DnD implementation is clean.** `kanban.ts`'s `moveCard` is a pure function, well-tested, and correctly handles same-column reorder, cross-column move by card target, and cross-column move to empty column.

6. **Multi-stage Docker build.** Correctly separates the Node frontend build from the Python slim runtime, keeping the production image lean.

7. **Structured AI output.** Using Pydantic models with `beta.chat.completions.parse()` provides type-safe action parsing and avoids fragile string parsing of LLM output.

8. **Test fixture isolation.** `conftest.py` correctly uses `tmp_path` + `monkeypatch.setenv("KANBAN_DB_PATH", ...)` to give each test its own ephemeral SQLite database with no shared state.

9. **Foreign key constraints and cascade deletes.** The schema correctly enables `PRAGMA foreign_keys = ON` and uses `ON DELETE CASCADE` for all child tables.

10. **Cancellation pattern in auth redirect.** Both `page.tsx` and `login/page.tsx` use a `cancelled` boolean flag in `useEffect` to prevent `setState` after unmount — correct for React 18+ `StrictMode`.
