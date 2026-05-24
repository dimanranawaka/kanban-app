from fastapi import APIRouter, HTTPException

from backend.db import get_connection
from backend.deps import CurrentUser
from backend.kanban_access import (
    card_board_id,
    column_board_id,
    fetch_card_owned,
    fetch_column_owned,
    move_card,
    renumber_column,
)
from backend.models import CardCreate, CardMove, CardUpdate

router = APIRouter(tags=["cards"])


@router.post("/api/cards")
async def create_card(body: CardCreate, user: CurrentUser):
    conn = get_connection()
    try:
        col = fetch_column_owned(conn, user.user_id, body.column_id)
        if not col:
            raise HTTPException(status_code=404, detail="Column not found")

        cur = conn.execute(
            "SELECT COUNT(*) AS c FROM kanban_cards WHERE column_id = ?",
            (body.column_id,),
        ).fetchone()
        count = int(cur["c"])
        pos = count if body.position is None else min(body.position, count)

        conn.execute(
            """
            UPDATE kanban_cards SET position = position + 1
            WHERE column_id = ? AND position >= ?
            """,
            (body.column_id, pos),
        )
        cursor = conn.execute(
            """
            INSERT INTO kanban_cards (column_id, title, description, position)
            VALUES (?, ?, ?, ?)
            """,
            (body.column_id, body.title.strip(), body.description, pos),
        )
        conn.commit()
        row_id = cursor.lastrowid
        row = conn.execute(
            "SELECT * FROM kanban_cards WHERE id = ?", (row_id,)
        ).fetchone()
        return dict(row)
    finally:
        conn.close()


@router.put("/api/cards/{card_id}")
async def update_card(card_id: int, body: CardUpdate, user: CurrentUser):
    if body.title is None and body.description is None:
        raise HTTPException(status_code=400, detail="No fields to update")

    conn = get_connection()
    try:
        card = fetch_card_owned(conn, user.user_id, card_id)
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")

        fields: dict = {}
        if body.title is not None:
            fields["title"] = body.title.strip()
        if body.description is not None:
            fields["description"] = body.description
        set_clause = ", ".join(f"{k} = ?" for k in fields)
        conn.execute(
            f"UPDATE kanban_cards SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [*fields.values(), card_id],
        )
        conn.commit()
        row = fetch_card_owned(conn, user.user_id, card_id)
        return dict(row)
    finally:
        conn.close()


@router.delete("/api/cards/{card_id}")
async def delete_card(card_id: int, user: CurrentUser):
    conn = get_connection()
    try:
        card = fetch_card_owned(conn, user.user_id, card_id)
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")
        column_id = int(card["column_id"])
        conn.execute("DELETE FROM kanban_cards WHERE id = ?", (card_id,))
        renumber_column(conn, column_id)
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()


@router.put("/api/cards/{card_id}/move")
async def move_card_route(card_id: int, body: CardMove, user: CurrentUser):
    conn = get_connection()
    try:
        card = fetch_card_owned(conn, user.user_id, card_id)
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")

        dest_col = fetch_column_owned(conn, user.user_id, body.column_id)
        if not dest_col:
            raise HTTPException(status_code=404, detail="Column not found")

        src_board = card_board_id(conn, card_id)
        dest_board = column_board_id(conn, body.column_id)
        if (
            src_board is None
            or dest_board is None
            or src_board != dest_board
        ):
            raise HTTPException(status_code=400, detail="Column not on same board")

        move_card(
            conn,
            card_id,
            int(card["column_id"]),
            body.column_id,
            body.position,
        )
        conn.commit()
        row = fetch_card_owned(conn, user.user_id, card_id)
        return dict(row)
    finally:
        conn.close()
