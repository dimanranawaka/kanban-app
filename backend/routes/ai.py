import logging

from fastapi import APIRouter, HTTPException
from backend.services.ai import test_ai_connection, process_chat
from backend.deps import CurrentUser
from backend.db import get_connection
from backend.routes.boards import load_board_detail
from backend.kanban_access import move_card, renumber_column
from backend.schemas.ai import ChatMessagePayload

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/test")
async def test_ai(user: CurrentUser):
    response = await test_ai_connection()
    return {"message": response}


@router.get("/chat/{board_id}")
async def get_chat_history(board_id: int, user: CurrentUser):
    conn = get_connection()
    try:
        board = conn.execute(
            "SELECT id FROM kanban_boards WHERE id = ? AND user_id = ?",
            (board_id, user.user_id),
        ).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        history_rows = conn.execute(
            "SELECT role, content FROM chat_history WHERE board_id = ? ORDER BY id ASC",
            (board_id,),
        ).fetchall()
        return [{"role": row["role"], "content": row["content"]} for row in history_rows]
    finally:
        conn.close()


@router.delete("/chat/{board_id}")
async def clear_chat_history(board_id: int, user: CurrentUser):
    conn = get_connection()
    try:
        board = conn.execute(
            "SELECT id FROM kanban_boards WHERE id = ? AND user_id = ?",
            (board_id, user.user_id),
        ).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        conn.execute("DELETE FROM chat_history WHERE board_id = ?", (board_id,))
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()


@router.post("/chat")
async def chat_endpoint(payload: ChatMessagePayload, user: CurrentUser):
    # Phase 1: load board state and history, then release the connection
    conn = get_connection()
    try:
        board = conn.execute(
            "SELECT id FROM kanban_boards WHERE id = ? AND user_id = ?",
            (payload.board_id, user.user_id),
        ).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")

        history_rows = conn.execute(
            "SELECT role, content FROM chat_history WHERE board_id = ? ORDER BY id ASC LIMIT 20",
            (payload.board_id,),
        ).fetchall()
        history = [{"role": row["role"], "content": row["content"]} for row in history_rows]
        board_state = load_board_detail(conn, user.user_id, payload.board_id)
    finally:
        conn.close()

    # Phase 2: call the AI — no DB connection held during the network round-trip
    try:
        ai_response = await process_chat(payload.message, board_state, history)
    except Exception as e:
        logger.error("AI chat error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="AI service is temporarily unavailable.")

    # Phase 3: persist results and execute board actions
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO chat_history (board_id, role, content) VALUES (?, 'user', ?)",
            (payload.board_id, payload.message),
        )

        for action in ai_response.actions:
            if action.action_type == "add_card" and action.column_id and action.title:
                # Verify the target column belongs to this board (SEC-3)
                col_check = conn.execute(
                    "SELECT id FROM kanban_columns WHERE id = ? AND board_id = ?",
                    (action.column_id, payload.board_id),
                ).fetchone()
                if not col_check:
                    continue
                cur_row = conn.execute(
                    "SELECT COUNT(*) AS c FROM kanban_cards WHERE column_id = ?",
                    (action.column_id,),
                ).fetchone()
                pos = int(cur_row["c"]) if action.position is None else action.position
                conn.execute(
                    "UPDATE kanban_cards SET position = position + 1 WHERE column_id = ? AND position >= ?",
                    (action.column_id, pos),
                )
                conn.execute(
                    "INSERT INTO kanban_cards (column_id, title, description, position) VALUES (?, ?, ?, ?)",
                    (action.column_id, action.title, action.description, pos),
                )

            elif action.action_type == "update_card" and action.card_id:
                # Verify the card belongs to this board (SEC-3)
                card_check = conn.execute(
                    """SELECT k.id FROM kanban_cards k
                       INNER JOIN kanban_columns c ON c.id = k.column_id
                       WHERE k.id = ? AND c.board_id = ?""",
                    (action.card_id, payload.board_id),
                ).fetchone()
                if not card_check:
                    continue
                if action.title:
                    conn.execute(
                        "UPDATE kanban_cards SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        (action.title, action.card_id),
                    )
                if action.description is not None:
                    conn.execute(
                        "UPDATE kanban_cards SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        (action.description, action.card_id),
                    )

            elif action.action_type == "delete_card" and action.card_id:
                # Verify the card belongs to this board (SEC-3)
                card = conn.execute(
                    """SELECT k.id, k.column_id FROM kanban_cards k
                       INNER JOIN kanban_columns c ON c.id = k.column_id
                       WHERE k.id = ? AND c.board_id = ?""",
                    (action.card_id, payload.board_id),
                ).fetchone()
                if card:
                    conn.execute("DELETE FROM kanban_cards WHERE id = ?", (action.card_id,))
                    renumber_column(conn, int(card["column_id"]))

            elif action.action_type == "move_card" and action.card_id and action.column_id:
                # Verify both card and destination column belong to this board (SEC-3)
                card = conn.execute(
                    """SELECT k.id, k.column_id FROM kanban_cards k
                       INNER JOIN kanban_columns c ON c.id = k.column_id
                       WHERE k.id = ? AND c.board_id = ?""",
                    (action.card_id, payload.board_id),
                ).fetchone()
                dest_col_check = conn.execute(
                    "SELECT id FROM kanban_columns WHERE id = ? AND board_id = ?",
                    (action.column_id, payload.board_id),
                ).fetchone()
                if card and dest_col_check:
                    pos = action.position if action.position is not None else 0  # BUG-5: default None to 0
                    move_card(conn, action.card_id, int(card["column_id"]), action.column_id, pos)

        conn.execute(
            "INSERT INTO chat_history (board_id, role, content) VALUES (?, 'assistant', ?)",
            (payload.board_id, ai_response.response_text),
        )
        conn.commit()

        updated_board_state = load_board_detail(conn, user.user_id, payload.board_id)
    finally:
        conn.close()

    return {"message": ai_response.response_text, "board": updated_board_state}
