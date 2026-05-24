import sqlite3
import bcrypt

DEFAULT_COLUMN_NAMES = ["To Do", "In Progress", "In Review", "Done", "Backlog"]

def create_default_board(conn: sqlite3.Connection, user_id: int) -> None:
    cursor = conn.execute(
        "INSERT INTO kanban_boards (user_id, title) VALUES (?, ?)",
        (user_id, "My Project"),
    )
    board_id = cursor.lastrowid
    for position, name in enumerate(DEFAULT_COLUMN_NAMES):
        conn.execute(
            """
            INSERT INTO kanban_columns (board_id, name, position)
            VALUES (?, ?, ?)
            """,
            (board_id, name, position),
        )

def seed_mvp_user_and_default_board(conn: sqlite3.Connection) -> None:
    row = conn.execute("SELECT id, password_hash FROM users WHERE username = ?", ("user",)).fetchone()
    if not row:
        hashed = bcrypt.hashpw(b"password", bcrypt.gensalt()).decode("utf-8")
        cursor = conn.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            ("user", hashed),
        )
        user_id = cursor.lastrowid
    else:
        user_id = row["id"]
        if not row["password_hash"]:
            hashed = bcrypt.hashpw(b"password", bcrypt.gensalt()).decode("utf-8")
            conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hashed, user_id))

    existing = conn.execute(
        "SELECT id FROM kanban_boards WHERE user_id = ? LIMIT 1",
        (user_id,),
    ).fetchone()
    if not existing:
        create_default_board(conn, user_id)
