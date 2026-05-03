# Database Schema Documentation

## Overview
The Kanban application uses SQLite as its local database. The schema is designed to support multiple users, each with their own Kanban board containing columns and cards.

## Data Model

### Tables

#### `users`
Stores user information for authentication and identification.

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Unique user identifier (auto-incremented)
- `username` - Username for login (unique)
- `created_at` - Account creation timestamp

**Relationships:**
- One user can have multiple kanban_boards

---

#### `kanban_boards`
Stores kanban board information per user.

```sql
CREATE TABLE kanban_boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT DEFAULT 'My Project',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Fields:**
- `id` - Unique board identifier
- `user_id` - Owner of the board (FK to users)
- `title` - Board name/title
- `created_at` - When board was created
- `updated_at` - Last modification timestamp

**Relationships:**
- Belongs to one user
- Contains many kanban_columns
- Contains many kanban_cards (through columns)

**Cascade:** If user is deleted, all their boards are deleted

---

#### `kanban_columns`
Stores workflow stages (To Do, In Progress, etc).

```sql
CREATE TABLE kanban_columns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES kanban_boards(id) ON DELETE CASCADE
);
```

**Fields:**
- `id` - Unique column identifier
- `board_id` - Parent board (FK to kanban_boards)
- `name` - Column title (e.g., "To Do", "In Progress")
- `position` - Display order (0-indexed)
- `created_at` - Creation timestamp

**Relationships:**
- Belongs to one kanban_board
- Contains many kanban_cards

**Cascade:** If board is deleted, all columns are deleted

**Constraints:**
- `(board_id, position)` should be unique to prevent duplicate positions

---

#### `kanban_cards`
Stores individual task cards.

```sql
CREATE TABLE kanban_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  column_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE CASCADE
);
```

**Fields:**
- `id` - Unique card identifier
- `column_id` - Parent column (FK to kanban_columns)
- `title` - Card title/task name
- `description` - Detailed description
- `position` - Display order within column
- `created_at` - Creation timestamp
- `updated_at` - Last modification timestamp

**Relationships:**
- Belongs to one kanban_column
- Updated when moved between columns or reordered

**Cascade:** If column is deleted, all cards are deleted

---

## Relationships Diagram

```
users (1) ─── (many) kanban_boards
  |
  └─ username (unique)

kanban_boards (1) ─── (many) kanban_columns
  |
  └─ board_id (FK to users)

kanban_columns (1) ─── (many) kanban_cards
  |
  └─ column_id (FK to kanban_boards)

kanban_cards
  └─ card_id (FK to kanban_columns)
```

## Data Flow

### Creating a New User
1. Insert into `users` with username
2. Auto-increment generates user id

### Creating a New Board
1. Insert into `kanban_boards` with user_id
2. Board gets auto-incremented id
3. Columns are created separately with board_id

### Initializing Board Columns
1. Insert 5 rows into `kanban_columns` (To Do, In Progress, In Review, Done, Backlog)
2. Each row references board_id
3. Position field determines display order (0-4)

### Adding Cards
1. Insert into `kanban_cards` with column_id
2. Position field determines order within column
3. Card can be moved by updating column_id and position

### Moving Cards
1. Update card's column_id to target column
2. Update position values in both source and destination columns
3. Update card's updated_at timestamp

## Migration Strategy

The backend will implement auto-migration on startup:
1. Check if database exists
2. If not, create all tables with proper schema
3. For new users, auto-create default board with 5 columns
4. Initialize with empty columns ready for cards

## API Response Formats

### Board Response
```json
{
  "id": 1,
  "user_id": 1,
  "title": "My Project",
  "columns": [...],
  "cards": {...},
  "created_at": "2026-05-03T10:00:00Z",
  "updated_at": "2026-05-03T12:00:00Z"
}
```

### Column Response
```json
{
  "id": 1,
  "board_id": 1,
  "name": "To Do",
  "position": 0,
  "card_count": 5
}
```

### Card Response
```json
{
  "id": 1,
  "column_id": 1,
  "title": "Setup project",
  "description": "Initial project setup",
  "position": 0,
  "created_at": "2026-05-03T10:00:00Z",
  "updated_at": "2026-05-03T12:00:00Z"
}
```

## Indexes for Performance

Recommended indexes for common queries:

```sql
CREATE INDEX idx_kanban_boards_user_id ON kanban_boards(user_id);
CREATE INDEX idx_kanban_columns_board_id ON kanban_columns(board_id);
CREATE INDEX idx_kanban_cards_column_id ON kanban_cards(column_id);
CREATE INDEX idx_kanban_cards_position ON kanban_cards(column_id, position);
```

## Notes

- All timestamps use UTC (CURRENT_TIMESTAMP)
- Position is 0-indexed for ordering
- Cascade deletes ensure data consistency
- No soft deletes; deletions are permanent
- For MVP: only 1 board per user (can expand later)
