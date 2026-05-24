def test_expected_tables_exist_after_init(client):
    from backend.db import get_connection

    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).fetchall()
        names = {r["name"] for r in rows}
        assert "users" in names
        assert "kanban_boards" in names
        assert "kanban_columns" in names
        assert "kanban_cards" in names
        assert "chat_history" in names
    finally:
        conn.close()


def test_kanban_columns_has_board_position_unique(client):
    from backend.db import get_connection

    conn = get_connection()
    try:
        row = conn.execute("SELECT sql FROM sqlite_master WHERE name='kanban_columns'").fetchone()
        assert row and row["sql"]
        assert "UNIQUE" in row["sql"]
    finally:
        conn.close()
