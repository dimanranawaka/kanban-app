def test_login_sets_cookie_and_me_ok(client):
    bad = client.post("/api/auth/login", json={"username": "user", "password": "wrong"})
    assert bad.status_code == 401

    res = client.post("/api/auth/login", json={"username": "user", "password": "password"})
    assert res.status_code == 200
    assert res.json()["username"] == "user"
    assert "auth_token" in res.cookies

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["username"] == "user"
    assert me.json()["user_id"] > 0


def test_logout_clears_session(client):
    client.post("/api/auth/login", json={"username": "user", "password": "password"})
    out = client.post("/api/auth/logout")
    assert out.status_code == 200
    me = client.get("/api/auth/me")
    assert me.status_code == 401


def test_me_without_cookie(client):
    assert client.get("/api/auth/me").status_code == 401


def test_db_seeded_default_board(client):
    from backend.db import get_connection

    conn = get_connection()
    try:
        boards = conn.execute(
            "SELECT COUNT(*) AS c FROM kanban_boards WHERE user_id = 1"
        ).fetchone()
        cols = conn.execute(
            "SELECT COUNT(*) AS c FROM kanban_columns WHERE board_id IN "
            "(SELECT id FROM kanban_boards WHERE user_id = 1)"
        ).fetchone()
        assert boards["c"] >= 1
        assert cols["c"] >= 5
    finally:
        conn.close()
