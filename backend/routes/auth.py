import sqlite3

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

from backend.db import get_connection
from itsdangerous import BadSignature, SignatureExpired

from backend.session_token import create_session_token, parse_session_token

router = APIRouter(tags=["auth"])

AUTH_COOKIE = "auth_token"


class LoginBody(BaseModel):
    username: str
    password: str


def _mvp_credentials_ok(username: str, password: str) -> bool:
    return username == "user" and password == "password"


def _user_id_for_username(conn: sqlite3.Connection, username: str) -> int | None:
    row = conn.execute(
        "SELECT id FROM users WHERE username = ?", (username,)
    ).fetchone()
    return int(row["id"]) if row else None


@router.post("/api/auth/login")
async def login(body: LoginBody, response: Response):
    if not _mvp_credentials_ok(body.username, body.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    conn = get_connection()
    try:
        user_id = _user_id_for_username(conn, body.username)
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid username or password")
    finally:
        conn.close()

    token = create_session_token(user_id, body.username)
    response.set_cookie(
        key=AUTH_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )
    return {"username": body.username}


@router.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(AUTH_COOKIE, path="/")
    return {"ok": True}


@router.get("/api/auth/me")
async def me(request: Request):
    raw = request.cookies.get(AUTH_COOKIE)
    if not raw:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        data = parse_session_token(raw)
    except (BadSignature, SignatureExpired):
        raise HTTPException(status_code=401, detail="Invalid session") from None
    return {"user_id": data["user_id"], "username": data["username"]}
