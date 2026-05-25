from fastapi import APIRouter, HTTPException

from backend.db import get_connection
from backend.deps import CurrentUser
from backend.kanban_access import fetch_board_owned, fetch_column_owned
from backend.models import ColumnCreate, ColumnRename

router = APIRouter(tags=["columns"])


@router.post("/api/boards/{board_id}/columns")
async def create_column(board_id: int, body: ColumnCreate, user: CurrentUser):
    conn = get_connection()
    try:
        board = fetch_board_owned(conn, user.user_id, board_id)
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")

        max_pos = conn.execute(
            "SELECT COALESCE(MAX(position), -1) AS m FROM kanban_columns WHERE board_id = ?",
            (board_id,),
        ).fetchone()["m"]
        new_pos = int(max_pos) + 1

        cursor = conn.execute(
            "INSERT INTO kanban_columns (board_id, name, position) VALUES (?, ?, ?)",
            (board_id, body.name.strip(), new_pos),
        )
        conn.commit()
        col_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM kanban_columns WHERE id = ?", (col_id,)).fetchone()
        return dict(row)
    finally:
        conn.close()


@router.put("/api/columns/{column_id}")
async def rename_column(column_id: int, body: ColumnRename, user: CurrentUser):
    conn = get_connection()
    try:
        col = fetch_column_owned(conn, user.user_id, column_id)
        if not col:
            raise HTTPException(status_code=404, detail="Column not found")
        conn.execute(
            "UPDATE kanban_columns SET name = ? WHERE id = ?",
            (body.name.strip(), column_id),
        )
        conn.commit()
        row = fetch_column_owned(conn, user.user_id, column_id)
        return dict(row)
    finally:
        conn.close()


@router.delete("/api/columns/{column_id}")
async def delete_column(column_id: int, user: CurrentUser):
    conn = get_connection()
    try:
        col = fetch_column_owned(conn, user.user_id, column_id)
        if not col:
            raise HTTPException(status_code=404, detail="Column not found")

        board_id = int(col["board_id"])
        remaining = conn.execute(
            "SELECT COUNT(*) AS c FROM kanban_columns WHERE board_id = ?",
            (board_id,),
        ).fetchone()
        if int(remaining["c"]) <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last column")

        conn.execute("DELETE FROM kanban_columns WHERE id = ?", (column_id,))

        # Renumber remaining columns
        cols = conn.execute(
            "SELECT id FROM kanban_columns WHERE board_id = ? ORDER BY position ASC, id ASC",
            (board_id,),
        ).fetchall()
        for i, c in enumerate(cols):
            conn.execute("UPDATE kanban_columns SET position = ? WHERE id = ?", (i, c["id"]))

        conn.commit()
        return {"ok": True}
    finally:
        conn.close()
