"""Tests for user profile management."""


def _login(client, username="user", password="password"):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200


def _signup(client, username, password="pass123"):
    r = client.post("/api/auth/signup", json={"username": username, "password": password})
    assert r.status_code == 200


def test_get_profile_requires_auth(client):
    r = client.get("/api/users/me")
    assert r.status_code == 401


def test_get_profile_returns_correct_data(client):
    _login(client)
    r = client.get("/api/users/me")
    assert r.status_code == 200
    p = r.json()
    assert p["username"] == "user"
    assert "id" in p
    assert "created_at" in p


def test_update_display_name(client):
    _login(client)
    r = client.put("/api/users/me", json={"display_name": "Alice Smith"})
    assert r.status_code == 200
    assert r.json()["display_name"] == "Alice Smith"


def test_update_email(client):
    _login(client)
    r = client.put("/api/users/me", json={"email": "user@example.com"})
    assert r.status_code == 200
    assert r.json()["email"] == "user@example.com"


def test_display_name_persists(client):
    _login(client)
    client.put("/api/users/me", json={"display_name": "Persistent Name"})
    r = client.get("/api/users/me")
    assert r.json()["display_name"] == "Persistent Name"


def test_change_password_requires_current_password(client):
    _login(client)
    r = client.put("/api/users/me", json={"new_password": "newpass123"})
    assert r.status_code == 400
    assert "current password" in r.json()["detail"].lower()


def test_change_password_with_wrong_current_fails(client):
    _login(client)
    r = client.put("/api/users/me", json={
        "current_password": "wrongpassword",
        "new_password": "newpass123",
    })
    assert r.status_code == 400
    assert "incorrect" in r.json()["detail"].lower()


def test_change_password_success(client):
    _login(client)
    r = client.put("/api/users/me", json={
        "current_password": "password",
        "new_password": "mynewpassword",
    })
    assert r.status_code == 200

    # Old password no longer works
    client.post("/api/auth/logout")
    old_login = client.post("/api/auth/login", json={"username": "user", "password": "password"})
    assert old_login.status_code == 401

    # New password works
    new_login = client.post("/api/auth/login", json={"username": "user", "password": "mynewpassword"})
    assert new_login.status_code == 200


def test_update_profile_for_new_signup(client):
    _signup(client, "newuser", "pass123")
    r = client.get("/api/users/me")
    assert r.status_code == 200
    p = r.json()
    assert p["username"] == "newuser"
    assert p["display_name"] is None

    r2 = client.put("/api/users/me", json={"display_name": "New User Full Name", "email": "new@example.com"})
    assert r2.status_code == 200
    p2 = r2.json()
    assert p2["display_name"] == "New User Full Name"
    assert p2["email"] == "new@example.com"
