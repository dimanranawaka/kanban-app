import sqlite3

DEFAULT_COLUMN_NAMES = ["To Do", "In Progress", "In Review", "Done", "Backlog"]


def seed_mvp_user_and_default_board(conn: sqlite3.Connection) -> None:
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
