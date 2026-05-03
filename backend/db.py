import os
import sqlite3
from pathlib import Path

DEFAULT_COLUMN_NAMES = ["To Do", "In Progress", "In Review", "Done", "Backlog"]


def db_path() -> Path:
    raw = os.environ.get("KANBAN_DB_PATH", "").strip()
    if raw:
        return Path(raw)
    repo_root = Path(__file__).resolve().parent.parent
    data_dir = repo_root / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / "kanban.db"


def get_connection() -> sqlite3.Connection:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    conn = get_connection()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS kanban_boards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT DEFAULT 'My Project',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS kanban_columns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                position INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (board_id) REFERENCES kanban_boards(id) ON DELETE CASCADE,
                UNIQUE (board_id, position)
            );

            CREATE TABLE IF NOT EXISTS kanban_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                column_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                position INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_kanban_boards_user_id ON kanban_boards(user_id);
            CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id ON kanban_columns(board_id);
            CREATE INDEX IF NOT EXISTS idx_kanban_cards_column_id ON kanban_cards(column_id);
            CREATE INDEX IF NOT EXISTS idx_kanban_cards_position ON kanban_cards(column_id, position);
            """
        )
        conn.commit()
        _seed_mvp_user_and_board(conn)
        conn.commit()
    finally:
        conn.close()


def _seed_mvp_user_and_board(conn: sqlite3.Connection) -> None:
    conn.execute(
        "INSERT OR IGNORE INTO users (id, username) VALUES (1, ?)",
        ("user",),
    )
    row = conn.execute(
        "SELECT id FROM users WHERE username = ?", ("user",)
    ).fetchone()
    if not row:
        return
    user_id = row["id"]

    existing = conn.execute(
        "SELECT id FROM kanban_boards WHERE user_id = ? LIMIT 1",
        (user_id,),
    ).fetchone()
    if existing:
        return

    conn.execute(
        "INSERT INTO kanban_boards (user_id, title) VALUES (?, ?)",
        (user_id, "My Project"),
    )
    board_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    for position, name in enumerate(DEFAULT_COLUMN_NAMES):
        conn.execute(
            """
            INSERT INTO kanban_columns (board_id, name, position)
            VALUES (?, ?, ?)
            """,
            (board_id, name, position),
        )
