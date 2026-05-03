from fastapi import APIRouter, HTTPException
from backend.ai import test_ai_connection, process_chat
from backend.deps import CurrentUser
from backend.db import get_connection
from backend.routes.boards import load_board_detail
from backend.kanban_access import move_card, renumber_column
from backend.schemas.ai import ChatMessagePayload

router = APIRouter()

@router.post("/test")
async def test_ai():
    """Test endpoint to verify connectivity to OpenAI."""
    response = await test_ai_connection()
    return {"message": response}

@router.get("/chat/{board_id}")
async def get_chat_history(board_id: int, user: CurrentUser):
    conn = get_connection()
    try:
        board = conn.execute("SELECT id FROM kanban_boards WHERE id = ? AND user_id = ?", (board_id, user.user_id)).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")

        history_rows = conn.execute("SELECT role, content FROM chat_history WHERE board_id = ? ORDER BY id ASC", (board_id,)).fetchall()
        return [{"role": row["role"], "content": row["content"]} for row in history_rows]
    finally:
        conn.close()

@router.post("/chat")
async def chat_endpoint(payload: ChatMessagePayload, user: CurrentUser):
    conn = get_connection()
    try:
        # Verify board ownership
        board = conn.execute("SELECT id FROM kanban_boards WHERE id = ? AND user_id = ?", (payload.board_id, user.user_id)).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")

        # Load chat history
        history_rows = conn.execute("SELECT role, content FROM chat_history WHERE board_id = ? ORDER BY id DESC LIMIT 10", (payload.board_id,)).fetchall()
        history = [{"role": row["role"], "content": row["content"]} for row in reversed(history_rows)]

        # Load board state
        board_state = load_board_detail(conn, user.user_id, payload.board_id)

        # Call AI
        try:
            ai_response = await process_chat(payload.message, board_state, history)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        # Save user message
        conn.execute("INSERT INTO chat_history (board_id, role, content) VALUES (?, 'user', ?)", (payload.board_id, payload.message))

        # Execute actions
        for action in ai_response.actions:
            if action.action_type == "add_card" and action.column_id and action.title:
                cur = conn.execute("SELECT COUNT(*) AS c FROM kanban_cards WHERE column_id = ?", (action.column_id,)).fetchone()
                pos = int(cur["c"]) if action.position is None else action.position
                conn.execute(
                    "UPDATE kanban_cards SET position = position + 1 WHERE column_id = ? AND position >= ?",
                    (action.column_id, pos)
                )
                conn.execute(
                    "INSERT INTO kanban_cards (column_id, title, description, position) VALUES (?, ?, ?, ?)",
                    (action.column_id, action.title, action.description, pos)
                )
            elif action.action_type == "update_card" and action.card_id:
                if action.title:
                    conn.execute("UPDATE kanban_cards SET title = ? WHERE id = ?", (action.title, action.card_id))
                if action.description is not None:
                    conn.execute("UPDATE kanban_cards SET description = ? WHERE id = ?", (action.description, action.card_id))
            elif action.action_type == "delete_card" and action.card_id:
                card = conn.execute("SELECT column_id FROM kanban_cards WHERE id = ?", (action.card_id,)).fetchone()
                if card:
                    conn.execute("DELETE FROM kanban_cards WHERE id = ?", (action.card_id,))
                    renumber_column(conn, int(card["column_id"]))
            elif action.action_type == "move_card" and action.card_id and action.column_id:
                card = conn.execute("SELECT column_id FROM kanban_cards WHERE id = ?", (action.card_id,)).fetchone()
                if card:
                    move_card(conn, action.card_id, int(card["column_id"]), action.column_id, action.position)

        # Save AI response
        conn.execute("INSERT INTO chat_history (board_id, role, content) VALUES (?, 'assistant', ?)", (payload.board_id, ai_response.response_text))
        
        conn.commit()
        
        # Load updated board state
        updated_board_state = load_board_detail(conn, user.user_id, payload.board_id)
        
        return {
            "message": ai_response.response_text,
            "board": updated_board_state
        }
    finally:
        conn.close()
