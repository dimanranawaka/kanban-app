# Project Management MVP - Detailed Implementation Plan

## Overview
Build a professional Kanban board application with AI assistance. The app will run in Docker, featuring NextJS frontend, Python FastAPI backend, SQLite persistence, and OpenRouter AI integration.

---

## Part 1: Plan Enrichment & Frontend Codebase Documentation

**Objective:** Document existing code and create detailed execution plan for all 10 parts with clear success criteria.

### Substeps
- [ ] Review existing frontend code structure (KanbanBoard, KanbanCard, components, lib)
- [ ] Document frontend architecture in `frontend/AGENTS.md` (structure, dependencies, testing setup)
- [ ] Enrich docs/PLAN.md with detailed steps for all 10 parts (this document)
- [ ] Define database schema approach (SQLite, Kanban model, user model)
- [ ] Define API contract (routes, payloads, responses)
- [ ] Document Docker setup strategy (image, volume mounts, env vars)

### Tests
- No functional tests for Part 1 (planning phase)
- Verify frontend code compiles and existing tests pass
- Verify markdown documentation is valid and complete

### Success Criteria
✓ `frontend/AGENTS.md` exists and documents existing code
✓ `docs/PLAN.md` contains detailed substeps for all 10 parts
✓ Database schema is documented (user, kanban_board, kanban_column, kanban_card models)
✓ API routes are documented (GET/POST/PUT/DELETE endpoints)
✓ Docker strategy is documented (Dockerfile, docker-compose, volumes)
✓ User has reviewed and approved the plan

---

## Part 2: Docker Scaffolding & Backend Foundation

**Objective:** Set up Docker infrastructure and basic FastAPI backend serving a "hello world" with API connectivity test.

### Substeps
- [ ] Create `Dockerfile` (Python 3.12, uv for package management)
- [ ] Create `docker-compose.yml` (services: backend, volumes for db and code)
- [ ] Create `backend/requirements.txt` with FastAPI, uvicorn, sqlite3 dependencies
- [ ] Create `backend/main.py` with basic FastAPI app
- [ ] Add route `GET /` serving simple HTML
- [ ] Add route `GET /api/health` for health check
- [ ] Create `scripts/start.sh` (Mac/Linux)
- [ ] Create `scripts/start.bat` (Windows)
- [ ] Create `scripts/stop.sh` (Mac/Linux)
- [ ] Create `scripts/stop.bat` (Windows)
- [ ] Test locally: start container, verify `/` loads HTML, verify `/api/health` responds with JSON

### Tests
- Unit test for health endpoint (FastAPI test client)
- Smoke test: Docker build succeeds
- Integration test: Container starts, responds on port 8000

### Success Criteria
✓ Docker container builds without errors
✓ `docker-compose up` starts backend on port 8000
✓ `GET /` returns simple HTML ("Hello from FastAPI")
✓ `GET /api/health` returns `{"status": "ok"}`
✓ Start/stop scripts work on target OS
✓ Container shuts down cleanly with stop script

---

## Part 3: Frontend Static Build & Integration

**Objective:** Build Next.js frontend as static assets and serve from FastAPI.

### Substeps
- [ ] Refactor frontend components for professional UI (polish styling, improve layout)
- [ ] Update `frontend/next.config.ts` to output static HTML (`output: 'export'`)
- [ ] Run `npm run build` in frontend and verify `.next/static` is generated
- [ ] Copy built frontend files to backend serving directory in Docker
- [ ] Update `backend/main.py` to serve static files from `/frontend/build`
- [ ] Add route `GET /` to serve `frontend/build/index.html`
- [ ] Ensure all static assets (CSS, JS) are served correctly
- [ ] Update Dockerfile to build frontend during image build

### Tests
- E2E test: Load app at `http://localhost:8000/`, verify Kanban board renders
- Unit test: Verify all Next.js components compile without errors
- Integration test: Static assets load correctly (check Network tab)
- Ensure existing frontend unit tests pass

### Success Criteria
✓ Frontend builds to static files
✓ Backend serves static files correctly
✓ Kanban board displays at `http://localhost:8000/`
✓ All CSS/JS assets load (no 404s)
✓ Professional UI is visible
✓ All existing frontend tests pass

---

## Part 4: Login/Logout Flow

**Objective:** Add hardcoded authentication (credentials: "user" / "password").

### Substeps
- [ ] Create new Next.js page `frontend/src/app/login/page.tsx`
- [ ] Create `frontend/src/components/LoginForm.tsx` (email, password inputs, submit button)
- [ ] Add form submission to set session/cookie with hardcoded check
- [ ] Update `frontend/src/app/page.tsx` to redirect to `/login` if not authenticated
- [ ] Create `/api/auth/login` endpoint in Next.js API routes
- [ ] Create `/api/auth/logout` endpoint
- [ ] Add logout button to Kanban board header
- [ ] Add session validation middleware to protect Kanban page
- [ ] Style login page with project color scheme

### Tests
- Unit test: LoginForm renders, accepts input, submits
- Integration test: Login with correct credentials redirects to Kanban
- Integration test: Login with wrong credentials shows error
- Integration test: Logout clears session and redirects to login
- E2E test: Full flow - load app → login → view Kanban → logout → redirected to login

### Success Criteria
✓ Navigating to `/` redirects to `/login` if not authenticated
✓ LoginForm accepts "user" / "password" and authenticates
✓ Kanban board visible only after login
✓ Logout button clears auth and redirects to login
✓ All login/logout tests pass
✓ Session persists on page reload
✓ UI matches color scheme

---

## Part 5: Database Schema & Documentation

**Objective:** Design and document SQLite schema; provide sample data for reference.

### Database Schema
```json
{
  "tables": {
    "users": {
      "columns": {
        "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
        "username": "TEXT UNIQUE NOT NULL",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
      }
    },
    "kanban_boards": {
      "columns": {
        "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
        "user_id": "INTEGER NOT NULL FOREIGN KEY",
        "title": "TEXT DEFAULT 'My Project'",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "updated_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
      }
    },
    "kanban_columns": {
      "columns": {
        "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
        "board_id": "INTEGER NOT NULL FOREIGN KEY",
        "name": "TEXT NOT NULL",
        "position": "INTEGER NOT NULL",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
      }
    },
    "kanban_cards": {
      "columns": {
        "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
        "column_id": "INTEGER NOT NULL FOREIGN KEY",
        "title": "TEXT NOT NULL",
        "description": "TEXT",
        "position": "INTEGER NOT NULL",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "updated_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
      }
    }
  }
}
```

### Substeps
- [ ] Create `docs/DATABASE.md` documenting schema rationale and relationships
- [ ] Create `docs/SAMPLE_DATA.json` with example Kanban board, columns, and cards
- [ ] Design migrations strategy (auto-create tables on startup)
- [ ] Define API response formats (board, columns, cards as JSON)

### Tests
- No code changes; documentation review only

### Success Criteria
✓ Schema documented in `docs/DATABASE.md`
✓ Sample data provided in `docs/SAMPLE_DATA.json`
✓ User approves schema design
✓ Relationships and constraints are clear

---

## Part 6: Backend API Routes

**Objective:** Implement FastAPI routes to read/write Kanban data; auto-create DB.

### Substeps
- [ ] Create `backend/db.py` with SQLite connection and table initialization
- [ ] Implement auto-create tables on startup if they don't exist
- [ ] Create `backend/models.py` with Pydantic models (User, Board, Column, Card)
- [ ] Create `backend/routes/auth.py` with POST `/api/auth/login` (validate user/password)
- [ ] Create `backend/routes/boards.py` with:
  - [ ] GET `/api/boards` (list user's boards)
  - [ ] GET `/api/boards/{board_id}` (get board with columns and cards)
  - [ ] PUT `/api/boards/{board_id}` (update board title)
- [ ] Create `backend/routes/columns.py` with:
  - [ ] PUT `/api/columns/{column_id}` (rename column)
- [ ] Create `backend/routes/cards.py` with:
  - [ ] POST `/api/cards` (create card)
  - [ ] PUT `/api/cards/{card_id}` (update card)
  - [ ] DELETE `/api/cards/{card_id}` (delete card)
  - [ ] PUT `/api/cards/{card_id}/move` (move to different column + reorder)
- [ ] Add user authentication middleware to all routes
- [ ] Create `backend/seeds.py` to populate initial board for user on first login

### Tests
- Unit tests for each route (mocked DB)
- Integration tests with real SQLite in-memory DB
- Test cases:
  - [ ] Login returns valid token/session
  - [ ] GetBoard returns columns and cards in correct order
  - [ ] CreateCard adds card to column
  - [ ] MoveCard updates column and position
  - [ ] RenameColumn updates name
  - [ ] DeleteCard removes card

### Success Criteria
✓ All routes return correct status codes
✓ Database auto-creates on startup
✓ User's data isolated (can't access other user's boards)
✓ Authentication required on all protected routes
✓ Sample board created for new user
✓ All backend unit tests pass
✓ All integration tests pass

---

## Part 7: Frontend-Backend Integration

**Objective:** Replace frontend mock data with real API calls; ensure persistence and real-time sync.

### Substeps
- [ ] Create `frontend/src/lib/api.ts` with fetch wrapper for backend API
- [ ] Create `frontend/src/hooks/useBoard.ts` hook to fetch board data
- [ ] Update `frontend/src/components/KanbanBoard.tsx` to use API
- [ ] Update card creation to call `/api/cards` POST
- [ ] Update card move/drag to call `/api/cards/{id}/move` PUT
- [ ] Update card edit to call `/api/cards/{id}` PUT
- [ ] Update column rename to call `/api/columns/{id}` PUT
- [ ] Update card delete to call `/api/cards/{id}` DELETE
- [ ] Add loading states and error handling
- [ ] Add toast notifications for API errors

### Tests
- Unit tests for API functions (mocked fetch)
- Integration tests: login → fetch board → create card → move card → verify DB
- E2E tests:
  - [ ] Login, create card, verify in DB
  - [ ] Move card, refresh page, verify position persisted
  - [ ] Edit card, verify changes persisted
  - [ ] Delete card, verify removed from DB
  - [ ] Rename column, verify persisted

### Success Criteria
✓ Frontend fetches real board data from API
✓ All CRUD operations persist to database
✓ Page refresh shows persisted state
✓ Error handling works (network errors, 401s, etc)
✓ UI provides feedback for async operations
✓ All integration tests pass

---

## Part 8: AI Connectivity via OpenRouter

**Objective:** Verify OpenRouter API integration with simple test ("2+2").

### Substeps
- [ ] Add `openai` Python package to `backend/requirements.txt`
- [ ] Create `backend/ai.py` module with OpenRouter client setup
- [ ] Create `POST /api/ai/test` endpoint that sends "What is 2+2?" to OpenRouter
- [ ] Use model: `openai/gpt-oss-120b` as specified
- [ ] Return AI response to frontend
- [ ] Add error handling for invalid API key, rate limits, timeouts
- [ ] Create test UI page to verify connectivity (frontend `/ai-test`)

### Tests
- Unit test: API client initializes with correct model
- Integration test: Test endpoint returns valid AI response
- Verify response contains expected math answer
- Verify error handling (missing API key, network error, etc)

### Success Criteria
✓ OpenRouter connection established with correct API key
✓ Model `openai/gpt-oss-120b` responds successfully
✓ `/api/ai/test` endpoint returns "4" or similar for "2+2"
✓ Error handling for common failures
✓ All tests pass

---

## Part 9: Structured AI Output with Kanban Context

**Objective:** AI receives full Kanban state and conversation history; responds with structured output (text + optional Kanban update).

### Substeps
- [ ] Create `backend/schemas/ai.py` with Pydantic models:
  - [ ] `ChatMessage` (role, content)
  - [ ] `KanbanUpdate` (optional cards to add/update/delete)
  - [ ] `AIResponse` (text response, kanban_update)
- [ ] Create `/api/chat` endpoint that:
  - [ ] Accepts `{"message": "user input", "conversation_history": [...]}`
  - [ ] Fetches user's current board state
  - [ ] Constructs prompt: board JSON + conversation history + new message
  - [ ] Sends to OpenRouter with structured output request
  - [ ] Parses AI response into `AIResponse` schema
  - [ ] Applies any Kanban updates to database
  - [ ] Returns response with updated board state
- [ ] Store conversation history per board (new table: `chat_history`)
- [ ] Implement conversation context limit (last 10 messages)

### Tests
- Unit tests for prompt construction
- Unit tests for response parsing
- Integration tests:
  - [ ] Simple query (no Kanban changes)
  - [ ] Create card request ("Add a task called Deploy to Production")
  - [ ] Move card request ("Move Deploy to Production to Done")
  - [ ] Edit card request ("Change title to 'Deploy App to Prod'")
  - [ ] Multi-action request
- Verify Kanban updates are applied correctly

### Success Criteria
✓ AI receives full Kanban context
✓ AI understands user requests about cards
✓ Structured output correctly parsed
✓ Kanban updates applied to database
✓ Conversation history stored and retrieved
✓ All tests pass

---

## Part 10: AI Chat UI Sidebar

**Objective:** Add beautiful chat sidebar widget; enable AI to update Kanban in real-time.

### Substeps
- [ ] Create `frontend/src/components/ChatSidebar.tsx` component
- [ ] Design sidebar layout (messages, input field, send button)
- [ ] Apply color scheme (accent yellow, blue, purple)
- [ ] Implement message rendering (user messages right-aligned, AI left-aligned)
- [ ] Create form for chat input with send button
- [ ] Integrate with `/api/chat` endpoint
- [ ] Display loading state while AI responds
- [ ] Display error messages if API fails
- [ ] On successful response, update Kanban if AI made changes
- [ ] Add smooth animations for new messages
- [ ] Add typing indicator while waiting for AI
- [ ] Handle long conversations (scroll to bottom)

### Tests
- Unit tests for ChatSidebar component rendering
- Integration tests:
  - [ ] Send message, receive response
  - [ ] AI response triggers Kanban update
  - [ ] Messages persist in UI
  - [ ] Long conversations scroll correctly
  - [ ] Error states display
- E2E tests:
  - [ ] User sends "Create a card called Testing"
  - [ ] AI responds and creates card
  - [ ] Card appears in Kanban
  - [ ] User refreshes, card persists
  - [ ] Conversation history visible in sidebar

### Success Criteria
✓ Chat sidebar renders and styled professionally
✓ Messages send and receive correctly
✓ AI can add/edit/move/delete cards via chat
✓ Kanban updates in real-time when AI acts
✓ Conversation history visible
✓ All UI tests pass
✓ All integration tests pass
✓ App is production-ready MVP

---

## Key Technical Notes

**Database**: SQLite stored in Docker volume at `/app/data/kanban.db`
**Auth**: Session-based (cookie) for MVP; hardcoded user/password
**Frontend**: Next.js static export; served by FastAPI
**AI**: OpenRouter with structured output schema
**Testing**: Vitest + Playwright for frontend; pytest for backend
**Docker**: Multi-stage build (frontend build → backend image)