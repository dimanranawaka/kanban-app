import os
import sqlite3
from pathlib import Path

from backend.seeds import seed_mvp_user_and_default_board


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
    conn = sqlite3.connect(path, check_same_thread=False)
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
                password_hash TEXT,
                display_name TEXT,
                email TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS kanban_boards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT DEFAULT 'My Project',
                description TEXT,
                color TEXT DEFAULT '#209DD7',
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
                due_date TEXT,
                priority TEXT DEFAULT 'medium',
                labels TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_kanban_boards_user_id ON kanban_boards(user_id);
            CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id ON kanban_columns(board_id);
            CREATE INDEX IF NOT EXISTS idx_kanban_cards_column_id ON kanban_cards(column_id);
            CREATE INDEX IF NOT EXISTS idx_kanban_cards_position ON kanban_cards(column_id, position);

            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (board_id) REFERENCES kanban_boards(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_chat_history_board_id ON chat_history(board_id);
            """
        )
        conn.commit()

        # Migration: add columns to existing tables if not present
        user_cols = [r["name"] for r in conn.execute("PRAGMA table_info(users)").fetchall()]
        if "password_hash" not in user_cols:
            conn.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
        if "display_name" not in user_cols:
            conn.execute("ALTER TABLE users ADD COLUMN display_name TEXT")
        if "email" not in user_cols:
            conn.execute("ALTER TABLE users ADD COLUMN email TEXT")

        board_cols = [r["name"] for r in conn.execute("PRAGMA table_info(kanban_boards)").fetchall()]
        if "description" not in board_cols:
            conn.execute("ALTER TABLE kanban_boards ADD COLUMN description TEXT")
        if "color" not in board_cols:
            conn.execute("ALTER TABLE kanban_boards ADD COLUMN color TEXT DEFAULT '#209DD7'")

        card_cols = [r["name"] for r in conn.execute("PRAGMA table_info(kanban_cards)").fetchall()]
        if "due_date" not in card_cols:
            conn.execute("ALTER TABLE kanban_cards ADD COLUMN due_date TEXT")
        if "priority" not in card_cols:
            conn.execute("ALTER TABLE kanban_cards ADD COLUMN priority TEXT DEFAULT 'medium'")
        if "labels" not in card_cols:
            conn.execute("ALTER TABLE kanban_cards ADD COLUMN labels TEXT DEFAULT '[]'")

        conn.commit()
        seed_mvp_user_and_default_board(conn)
        conn.commit()
    finally:
        conn.close()
