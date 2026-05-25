"""Tests for extended board management: create, delete, multi-board."""
import pytest


def _login(client, username="user", password="password"):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200


def _signup(client, username, password="pass123"):
    r = client.post("/api/auth/signup", json={"username": username, "password": password})
    assert r.status_code == 200
    return r.json()


# ── Board CRUD ──────────────────────────────────────────────────────────────

def test_create_board(client):
    _login(client)
    r = client.post("/api/boards", json={"title": "Sprint 1", "description": "First sprint", "color": "#FF5733"})
    assert r.status_code == 200
    b = r.json()
    assert b["title"] == "Sprint 1"
    assert b["description"] == "First sprint"
    assert b["color"] == "#FF5733"


def test_create_board_has_default_columns(client):
    _login(client)
    r = client.post("/api/boards", json={"title": "New Board"})
    assert r.status_code == 200
    board_id = r.json()["id"]
    detail = client.get(f"/api/boards/{board_id}").json()
    assert len(detail["columns"]) == 5
    assert detail["columns"][0]["name"] == "To Do"


def test_list_boards_after_create(client):
    _login(client)
    before = len(client.get("/api/boards").json())
    client.post("/api/boards", json={"title": "Board 2"})
    after = len(client.get("/api/boards").json())
    assert after == before + 1


def test_delete_board(client):
    _login(client)
    r = client.post("/api/boards", json={"title": "Delete me"})
    new_id = r.json()["id"]
    assert client.delete(f"/api/boards/{new_id}").status_code == 200
    assert client.get(f"/api/boards/{new_id}").status_code == 404


def test_cannot_delete_last_board(client):
    _login(client)
    boards = client.get("/api/boards").json()
    assert len(boards) == 1
    r = client.delete(f"/api/boards/{boards[0]['id']}")
    assert r.status_code == 400
    assert "last board" in r.json()["detail"].lower()


def test_delete_board_requires_auth(client):
    _login(client)
    boards = client.get("/api/boards").json()
    bid = boards[0]["id"]
    client.post("/api/auth/logout")
    r = client.delete(f"/api/boards/{bid}")
    assert r.status_code == 401


def test_cannot_delete_other_user_board(client):
    _signup(client, "alice")
    client.post("/api/auth/logout")
    _login(client)
    boards = client.get("/api/boards").json()
    bid = boards[0]["id"]
    client.post("/api/auth/logout")
    _signup(client, "bob")
    r = client.delete(f"/api/boards/{bid}")
    assert r.status_code == 404


def test_update_board_description_and_color(client):
    _login(client)
    bid = client.get("/api/boards").json()[0]["id"]
    r = client.put(f"/api/boards/{bid}", json={"title": "Updated", "description": "Desc", "color": "#ABC123"})
    assert r.status_code == 200
    b = r.json()
    assert b["title"] == "Updated"
    assert b["description"] == "Desc"
    assert b["color"] == "#ABC123"


def test_board_detail_includes_new_fields(client):
    _login(client)
    r = client.post("/api/boards", json={"title": "Test Board", "description": "My desc", "color": "#123456"})
    bid = r.json()["id"]
    detail = client.get(f"/api/boards/{bid}").json()
    assert detail["description"] == "My desc"
    assert detail["color"] == "#123456"


# ── Column CRUD ──────────────────────────────────────────────────────────────

def test_create_column(client):
    _login(client)
    bid = client.get("/api/boards").json()[0]["id"]
    r = client.post(f"/api/boards/{bid}/columns", json={"name": "New Column"})
    assert r.status_code == 200
    col = r.json()
    assert col["name"] == "New Column"


def test_created_column_appears_in_board(client):
    _login(client)
    bid = client.get("/api/boards").json()[0]["id"]
    before = len(client.get(f"/api/boards/{bid}").json()["columns"])
    client.post(f"/api/boards/{bid}/columns", json={"name": "Extra"})
    after = len(client.get(f"/api/boards/{bid}").json()["columns"])
    assert after == before + 1


def test_delete_column(client):
    _login(client)
    bid = client.get("/api/boards").json()[0]["id"]
    r = client.post(f"/api/boards/{bid}/columns", json={"name": "Temp"})
    col_id = r.json()["id"]
    assert client.delete(f"/api/columns/{col_id}").status_code == 200
    detail = client.get(f"/api/boards/{bid}").json()
    assert col_id not in [c["id"] for c in detail["columns"]]


def test_cannot_delete_last_column(client):
    _login(client)
    # Create a fresh board and delete columns one by one until we hit the last
    r = client.post("/api/boards", json={"title": "Temp Board"})
    bid = r.json()["id"]
    detail = client.get(f"/api/boards/{bid}").json()
    col_ids = [c["id"] for c in detail["columns"]]
    for col_id in col_ids[:-1]:
        assert client.delete(f"/api/columns/{col_id}").status_code == 200
    # Try to delete last one
    r = client.delete(f"/api/columns/{col_ids[-1]}")
    assert r.status_code == 400


def test_column_positions_renumber_after_delete(client):
    _login(client)
    bid = client.get("/api/boards").json()[0]["id"]
    # Add extra column so we can delete a middle one
    client.post(f"/api/boards/{bid}/columns", json={"name": "Extra"})
    detail = client.get(f"/api/boards/{bid}").json()
    first_col_id = detail["columns"][0]["id"]
    client.delete(f"/api/columns/{first_col_id}")
    detail2 = client.get(f"/api/boards/{bid}").json()
    positions = [c["position"] for c in detail2["columns"]]
    assert positions == list(range(len(positions)))


def test_create_column_on_foreign_board_fails(client):
    _signup(client, "carol")
    carol_bid = client.get("/api/boards").json()[0]["id"]
    client.post("/api/auth/logout")
    _login(client)
    r = client.post(f"/api/boards/{carol_bid}/columns", json={"name": "Hack"})
    assert r.status_code == 404


# ── Card enhancements (due_date, priority, labels) ──────────────────────────

def test_create_card_with_due_date_priority_labels(client):
    _login(client)
    bid = client.get("/api/boards").json()[0]["id"]
    col_id = client.get(f"/api/boards/{bid}").json()["columns"][0]["id"]
    r = client.post("/api/cards", json={
        "column_id": col_id,
        "title": "Rich Card",
        "due_date": "2025-12-31",
        "priority": "high",
        "labels": ["bug", "urgent"],
    })
    assert r.status_code == 200
    card = r.json()
    assert card["due_date"] == "2025-12-31"
    assert card["priority"] == "high"
    assert card["labels"] == ["bug", "urgent"]


def test_update_card_priority_and_labels(client):
    _login(client)
    bid = client.get("/api/boards").json()[0]["id"]
    col_id = client.get(f"/api/boards/{bid}").json()["columns"][0]["id"]
    cid = client.post("/api/cards", json={"column_id": col_id, "title": "Task"}).json()["id"]
    r = client.put(f"/api/cards/{cid}", json={"priority": "low", "labels": ["feature"]})
    assert r.status_code == 200
    c = r.json()
    assert c["priority"] == "low"
    assert c["labels"] == ["feature"]


def test_card_labels_in_board_detail(client):
    _login(client)
    bid = client.get("/api/boards").json()[0]["id"]
    col_id = client.get(f"/api/boards/{bid}").json()["columns"][0]["id"]
    client.post("/api/cards", json={
        "column_id": col_id, "title": "Tagged", "labels": ["alpha", "beta"]
    })
    detail = client.get(f"/api/boards/{bid}").json()
    cards_with_labels = [c for c in detail["cards"].values() if c["labels"]]
    assert any("alpha" in c["labels"] for c in cards_with_labels)


def test_update_card_due_date(client):
    _login(client)
    bid = client.get("/api/boards").json()[0]["id"]
    col_id = client.get(f"/api/boards/{bid}").json()["columns"][0]["id"]
    cid = client.post("/api/cards", json={"column_id": col_id, "title": "Dated"}).json()["id"]
    r = client.put(f"/api/cards/{cid}", json={"due_date": "2026-01-01"})
    assert r.status_code == 200
    assert r.json()["due_date"] == "2026-01-01"
