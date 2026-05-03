def _login(client):
    r = client.post("/api/auth/login", json={"username": "user", "password": "password"})
    assert r.status_code == 200


def test_api_boards_requires_auth(client):
    assert client.get("/api/boards").status_code == 401


def test_list_and_get_board(client):
    _login(client)
    lst = client.get("/api/boards")
    assert lst.status_code == 200
    boards = lst.json()
    assert len(boards) >= 1
    bid = boards[0]["id"]
    d = client.get(f"/api/boards/{bid}")
    assert d.status_code == 200
    body = d.json()
    assert body["id"] == bid
    assert len(body["columns"]) == 5
    names = [c["name"] for c in body["columns"]]
    assert names[0] == "To Do"
    assert body["cards"] == {}


def test_foreign_board_not_visible(client):
    _login(client)
    from backend.db import get_connection

    conn = get_connection()
    conn.execute("INSERT INTO users (username) VALUES (?)", ("two",))
    uid = int(
        conn.execute(
            "SELECT id FROM users WHERE username = ?", ("two",)
        ).fetchone()["id"]
    )
    conn.execute(
        "INSERT INTO kanban_boards (user_id, title) VALUES (?, ?)",
        (uid, "Secret"),
    )
    bid = int(
        conn.execute(
            "SELECT id FROM kanban_boards WHERE user_id = ? ORDER BY id DESC LIMIT 1",
            (uid,),
        ).fetchone()["id"]
    )
    conn.commit()
    conn.close()

    assert client.get(f"/api/boards/{bid}").status_code == 404


def test_create_rename_move_delete_card(client):
    _login(client)
    bid = client.get("/api/boards").json()[0]["id"]
    detail = client.get(f"/api/boards/{bid}").json()
    col_a = detail["columns"][0]["id"]
    col_b = detail["columns"][1]["id"]

    created = client.post(
        "/api/cards",
        json={"column_id": col_a, "title": "Task", "description": "Note"},
    )
    assert created.status_code == 200
    cid = created.json()["id"]

    detail2 = client.get(f"/api/boards/{bid}").json()
    assert str(cid) in detail2["cards"]
    assert detail2["cards"][str(cid)]["title"] == "Task"

    upd = client.put(f"/api/cards/{cid}", json={"title": "Renamed"})
    assert upd.status_code == 200
    assert upd.json()["title"] == "Renamed"

    mv = client.put(
        f"/api/cards/{cid}/move",
        json={"column_id": col_b, "position": 0},
    )
    assert mv.status_code == 200
    assert mv.json()["column_id"] == col_b

    detail3 = client.get(f"/api/boards/{bid}").json()
    assert str(cid) in detail3["columns"][1]["card_ids"]

    ren_col = client.put(f"/api/columns/{col_a}", json={"name": "Todo renamed"})
    assert ren_col.status_code == 200
    assert ren_col.json()["name"] == "Todo renamed"

    assert client.delete(f"/api/cards/{cid}").status_code == 200

    detail4 = client.get(f"/api/boards/{bid}").json()
    assert str(cid) not in detail4["cards"]


def test_update_board_title(client):
    _login(client)
    bid = client.get("/api/boards").json()[0]["id"]
    r = client.put(f"/api/boards/{bid}", json={"title": "New title"})
    assert r.status_code == 200
    assert r.json()["title"] == "New title"


def test_move_within_column(client):
    _login(client)
    bid = client.get("/api/boards").json()[0]["id"]
    detail = client.get(f"/api/boards/{bid}").json()
    col = detail["columns"][0]["id"]
    c1 = client.post("/api/cards", json={"column_id": col, "title": "A"}).json()["id"]
    c2 = client.post("/api/cards", json={"column_id": col, "title": "B"}).json()["id"]

    client.put(f"/api/cards/{c2}/move", json={"column_id": col, "position": 0})
    after = client.get(f"/api/boards/{bid}").json()
    ids = after["columns"][0]["card_ids"]
    assert ids[0] == str(c2)
    assert ids[1] == str(c1)
