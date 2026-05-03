import sqlite3
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
import bcrypt

from backend.db import get_connection
from itsdangerous import BadSignature, SignatureExpired
from backend.session_token import create_session_token, parse_session_token
from backend.seeds import create_default_board

router = APIRouter(tags=["auth"])

AUTH_COOKIE = "auth_token"

class AuthBody(BaseModel):
    username: str
    password: str

@router.post("/api/auth/signup")
async def signup(body: AuthBody, response: Response):
    username = body.username.strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

        hashed = bcrypt.hashpw(body.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        conn.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, hashed))
        user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        
        # Create a default board for the new user
        create_default_board(conn, user_id)
        conn.commit()
    finally:
        conn.close()

    token = create_session_token(user_id, username)
    response.set_cookie(
        key=AUTH_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )
    return {"username": username}

@router.post("/api/auth/login")
async def login(body: AuthBody, response: Response):
    conn = get_connection()
    try:
        row = conn.execute("SELECT id, password_hash FROM users WHERE username = ?", (body.username,)).fetchone()
        if not row or not row["password_hash"]:
            raise HTTPException(status_code=401, detail="Invalid username or password")
            
        if not bcrypt.checkpw(body.password.encode('utf-8'), row["password_hash"].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid username or password")
            
        user_id = int(row["id"])
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
