from fastapi import APIRouter, HTTPException

from backend.db import get_connection
from backend.deps import CurrentUser
from backend.kanban_access import fetch_column_owned
from backend.models import ColumnRename

router = APIRouter(tags=["columns"])


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
