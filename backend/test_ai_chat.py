from unittest.mock import AsyncMock, patch

from backend.schemas.ai import AIStructuredOutput, KanbanAction


def _login(client):
    r = client.post("/api/auth/login", json={"username": "user", "password": "password"})
    assert r.status_code == 200


def _board_and_cols(client):
    boards = client.get("/api/boards").json()
    board_id = boards[0]["id"]
    detail = client.get(f"/api/boards/{board_id}").json()
    return board_id, detail["columns"]


def test_chat_requires_auth(client):
    res = client.post("/api/ai/chat", json={"board_id": 1, "message": "hello"})
    assert res.status_code == 401


def test_chat_no_actions_returns_message(client):
    _login(client)
    board_id, _ = _board_and_cols(client)

    mock_resp = AIStructuredOutput(response_text="Hello! How can I help?", actions=[])
    with patch("backend.routes.ai.process_chat", new_callable=AsyncMock) as m:
        m.return_value = mock_resp
        res = client.post("/api/ai/chat", json={"board_id": board_id, "message": "hello"})

    assert res.status_code == 200
    assert res.json()["message"] == "Hello! How can I help?"


def test_chat_add_card_action_creates_card(client):
    _login(client)
    board_id, cols = _board_and_cols(client)
    col_id = cols[0]["id"]

    mock_resp = AIStructuredOutput(
        response_text="Added a card!",
        actions=[KanbanAction(action_type="add_card", column_id=col_id, title="AI Task")],
    )
    with patch("backend.routes.ai.process_chat", new_callable=AsyncMock) as m:
        m.return_value = mock_resp
        res = client.post("/api/ai/chat", json={"board_id": board_id, "message": "add task"})

    assert res.status_code == 200
    detail = client.get(f"/api/boards/{board_id}").json()
    titles = [c["title"] for c in detail["cards"].values()]
    assert "AI Task" in titles


def test_chat_skips_unauthorized_card(client):
    # Create a second user with their own board and card
    client.post("/api/auth/signup", json={"username": "other", "password": "password123"})
    boards2 = client.get("/api/boards").json()
    board2_id = boards2[0]["id"]
    cols2 = client.get(f"/api/boards/{board2_id}").json()["columns"]
    victim_card = client.post(
        "/api/cards",
        json={"column_id": cols2[0]["id"], "title": "Victim card"},
    ).json()
    victim_card_id = victim_card["id"]
    client.post("/api/auth/logout")

    # Login as default user and try to delete the other user's card via AI
    _login(client)
    board_id, _ = _board_and_cols(client)

    mock_resp = AIStructuredOutput(
        response_text="Deleted!",
        actions=[KanbanAction(action_type="delete_card", card_id=victim_card_id)],
    )
    with patch("backend.routes.ai.process_chat", new_callable=AsyncMock) as m:
        m.return_value = mock_resp
        res = client.post("/api/ai/chat", json={"board_id": board_id, "message": "delete it"})

    assert res.status_code == 200  # request succeeds but action is skipped

    # Verify the victim card still exists
    client.post("/api/auth/logout")
    client.post("/api/auth/login", json={"username": "other", "password": "password123"})
    detail = client.get(f"/api/boards/{board2_id}").json()
    titles = [c["title"] for c in detail["cards"].values()]
    assert "Victim card" in titles


def test_chat_move_card_none_position_does_not_crash(client):
    _login(client)
    board_id, cols = _board_and_cols(client)
    src_col_id = cols[0]["id"]
    dest_col_id = cols[1]["id"]

    card = client.post(
        "/api/cards", json={"column_id": src_col_id, "title": "Move me"}
    ).json()
    card_id = card["id"]

    mock_resp = AIStructuredOutput(
        response_text="Moved!",
        actions=[
            KanbanAction(
                action_type="move_card",
                card_id=card_id,
                column_id=dest_col_id,
                position=None,
            )
        ],
    )
    with patch("backend.routes.ai.process_chat", new_callable=AsyncMock) as m:
        m.return_value = mock_resp
        res = client.post("/api/ai/chat", json={"board_id": board_id, "message": "move card"})

    assert res.status_code == 200
    detail = client.get(f"/api/boards/{board_id}").json()
    assert str(card_id) in detail["columns"][1]["card_ids"]


def test_chat_history_saved_in_order(client):
    _login(client)
    board_id, _ = _board_and_cols(client)

    mock_resp = AIStructuredOutput(response_text="First reply", actions=[])
    with patch("backend.routes.ai.process_chat", new_callable=AsyncMock) as m:
        m.return_value = mock_resp
        client.post("/api/ai/chat", json={"board_id": board_id, "message": "First message"})

    history = client.get(f"/api/ai/chat/{board_id}").json()
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "First message"
    assert history[1]["role"] == "assistant"
    assert history[1]["content"] == "First reply"
