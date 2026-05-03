import sqlite3


def fetch_board_owned(
    conn: sqlite3.Connection, user_id: int, board_id: int
) -> sqlite3.Row | None:
    return conn.execute(
        "SELECT * FROM kanban_boards WHERE id = ? AND user_id = ?",
        (board_id, user_id),
    ).fetchone()


def fetch_column_owned(
    conn: sqlite3.Connection, user_id: int, column_id: int
) -> sqlite3.Row | None:
    return conn.execute(
        """
        SELECT c.* FROM kanban_columns c
        INNER JOIN kanban_boards b ON b.id = c.board_id
        WHERE c.id = ? AND b.user_id = ?
        """,
        (column_id, user_id),
    ).fetchone()


def fetch_card_owned(
    conn: sqlite3.Connection, user_id: int, card_id: int
) -> sqlite3.Row | None:
    return conn.execute(
        """
        SELECT k.* FROM kanban_cards k
        INNER JOIN kanban_columns c ON c.id = k.column_id
        INNER JOIN kanban_boards b ON b.id = c.board_id
        WHERE k.id = ? AND b.user_id = ?
        """,
        (card_id, user_id),
    ).fetchone()


def column_board_id(conn: sqlite3.Connection, column_id: int) -> int | None:
    row = conn.execute(
        "SELECT board_id FROM kanban_columns WHERE id = ?", (column_id,)
    ).fetchone()
    return int(row["board_id"]) if row else None


def card_board_id(conn: sqlite3.Connection, card_id: int) -> int | None:
    row = conn.execute(
        """
        SELECT c.board_id FROM kanban_cards k
        INNER JOIN kanban_columns c ON c.id = k.column_id
        WHERE k.id = ?
        """,
        (card_id,),
    ).fetchone()
    return int(row["board_id"]) if row else None


def reorder_column_cards(
    conn: sqlite3.Connection, column_id: int, ordered_ids: list[int]
) -> None:
    for i, cid in enumerate(ordered_ids):
        conn.execute(
            """
            UPDATE kanban_cards SET position = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND column_id = ?
            """,
            (i, cid, column_id),
        )


def renumber_column(conn: sqlite3.Connection, column_id: int) -> None:
    rows = conn.execute(
        """
        SELECT id FROM kanban_cards
        WHERE column_id = ?
        ORDER BY position ASC, id ASC
        """,
        (column_id,),
    ).fetchall()
    reorder_column_cards(conn, column_id, [int(r["id"]) for r in rows])


def move_card(
    conn: sqlite3.Connection,
    card_id: int,
    src_column_id: int,
    dest_column_id: int,
    dest_position: int,
) -> None:
    if src_column_id == dest_column_id:
        rows = conn.execute(
            """
            SELECT id FROM kanban_cards
            WHERE column_id = ?
            ORDER BY position ASC, id ASC
            """,
            (src_column_id,),
        ).fetchall()
        ids = [int(r["id"]) for r in rows]
        ids.remove(card_id)
        pos = min(dest_position, len(ids))
        ids.insert(pos, card_id)
        reorder_column_cards(conn, src_column_id, ids)
        return

    conn.execute(
        """
        UPDATE kanban_cards SET column_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (dest_column_id, card_id),
    )
    renumber_column(conn, src_column_id)
    rows = conn.execute(
        """
        SELECT id FROM kanban_cards
        WHERE column_id = ?
        ORDER BY position ASC, id ASC
        """,
        (dest_column_id,),
    ).fetchall()
    ids = [int(r["id"]) for r in rows]
    ids.remove(card_id)
    pos = min(dest_position, len(ids))
    ids.insert(pos, card_id)
    reorder_column_cards(conn, dest_column_id, ids)
