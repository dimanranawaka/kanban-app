import json
from fastapi import APIRouter, HTTPException

from backend.db import get_connection
from backend.deps import CurrentUser
from backend.kanban_access import fetch_board_owned
from backend.models import (
    BoardCreate,
    BoardDetail,
    BoardSummary,
    BoardTitleUpdate,
    CardPayload,
    ColumnPayload,
)
from backend.seeds import DEFAULT_COLUMN_NAMES

router = APIRouter(tags=["boards"])


def _ts(row: dict, key: str) -> str:
    v = row[key]
    return v if isinstance(v, str) else str(v)


def _parse_labels(raw) -> list:
    if not raw:
        return []
    try:
        return json.loads(raw)
    except Exception:
        return []


def load_board_detail(conn, user_id: int, board_id: int) -> BoardDetail:
    board = fetch_board_owned(conn, user_id, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    b = dict(board)
    bid = int(b["id"])
    columns = conn.execute(
        """
        SELECT id, name, position FROM kanban_columns
        WHERE board_id = ?
        ORDER BY position ASC, id ASC
        """,
        (bid,),
    ).fetchall()

    col_ids = [int(c["id"]) for c in columns]
    cards_map: dict[str, CardPayload] = {}
    col_card_ids: dict[int, list[str]] = {cid: [] for cid in col_ids}

    if col_ids:
        placeholders = ",".join("?" * len(col_ids))
        cards = conn.execute(
            f"""
            SELECT id, column_id, title, description, position,
                   due_date, priority, labels
            FROM kanban_cards
            WHERE column_id IN ({placeholders})
            ORDER BY column_id ASC, position ASC, id ASC
            """,
            col_ids,
        ).fetchall()
        for row in cards:
            r = dict(row)
            cid = int(r["column_id"])
            sid = str(r["id"])
            col_card_ids[cid].append(sid)
            cards_map[sid] = CardPayload(
                id=sid,
                title=r["title"],
                description=r["description"],
                column_id=cid,
                position=int(r["position"]),
                due_date=r.get("due_date"),
                priority=r.get("priority", "medium"),
                labels=_parse_labels(r.get("labels")),
            )

    column_payloads = [
        ColumnPayload(
            id=int(c["id"]),
            name=c["name"],
            position=int(c["position"]),
            card_ids=col_card_ids[int(c["id"])],
        )
        for c in columns
    ]

    return BoardDetail(
        id=bid,
        user_id=int(b["user_id"]),
        title=b["title"],
        description=b.get("description"),
        color=b.get("color", "#209DD7"),
        created_at=_ts(b, "created_at"),
        updated_at=_ts(b, "updated_at"),
        columns=column_payloads,
        cards=cards_map,
    )


@router.get("/api/boards", response_model=list[BoardSummary])
async def list_boards(user: CurrentUser):
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT id, user_id, title, description, color, created_at, updated_at
            FROM kanban_boards
            WHERE user_id = ?
            ORDER BY id ASC
            """,
            (user.user_id,),
        ).fetchall()
        return [BoardSummary(**dict(r)) for r in rows]
    finally:
        conn.close()


@router.post("/api/boards", response_model=BoardSummary)
async def create_board(body: BoardCreate, user: CurrentUser):
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            INSERT INTO kanban_boards (user_id, title, description, color)
            VALUES (?, ?, ?, ?)
            """,
            (user.user_id, body.title.strip(), body.description, body.color or "#209DD7"),
        )
        board_id = cursor.lastrowid
        for position, name in enumerate(DEFAULT_COLUMN_NAMES):
            conn.execute(
                "INSERT INTO kanban_columns (board_id, name, position) VALUES (?, ?, ?)",
                (board_id, name, position),
            )
        conn.commit()
        row = conn.execute(
            "SELECT id, user_id, title, description, color, created_at, updated_at FROM kanban_boards WHERE id = ?",
            (board_id,),
        ).fetchone()
        return BoardSummary(**dict(row))
    finally:
        conn.close()


@router.get("/api/boards/{board_id}", response_model=BoardDetail)
async def get_board(board_id: int, user: CurrentUser):
    conn = get_connection()
    try:
        return load_board_detail(conn, user.user_id, board_id)
    finally:
        conn.close()


@router.put("/api/boards/{board_id}", response_model=BoardSummary)
async def update_board(board_id: int, body: BoardTitleUpdate, user: CurrentUser):
    conn = get_connection()
    try:
        board = fetch_board_owned(conn, user.user_id, board_id)
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")

        fields: dict = {"title": body.title.strip()}
        if body.description is not None:
            fields["description"] = body.description
        if body.color is not None:
            fields["color"] = body.color

        set_clause = ", ".join(f"{k} = ?" for k in fields)
        conn.execute(
            f"UPDATE kanban_boards SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
            [*fields.values(), board_id, user.user_id],
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, user_id, title, description, color, created_at, updated_at FROM kanban_boards WHERE id = ?",
            (board_id,),
        ).fetchone()
        return BoardSummary(**dict(row))
    finally:
        conn.close()


@router.delete("/api/boards/{board_id}")
async def delete_board(board_id: int, user: CurrentUser):
    conn = get_connection()
    try:
        board = fetch_board_owned(conn, user.user_id, board_id)
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")

        remaining = conn.execute(
            "SELECT COUNT(*) AS c FROM kanban_boards WHERE user_id = ?",
            (user.user_id,),
        ).fetchone()
        if int(remaining["c"]) <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete your last board")

        conn.execute("DELETE FROM kanban_boards WHERE id = ? AND user_id = ?", (board_id, user.user_id))
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()
