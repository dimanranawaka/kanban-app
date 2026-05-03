from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, Request

from backend.routes.auth import AUTH_COOKIE
from backend.session_token import parse_session_token
from itsdangerous import BadSignature, SignatureExpired


@dataclass
class SessionUser:
    user_id: int
    username: str


def get_current_user(request: Request) -> SessionUser:
    raw = request.cookies.get(AUTH_COOKIE)
    if not raw:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        data = parse_session_token(raw)
    except (BadSignature, SignatureExpired):
        raise HTTPException(status_code=401, detail="Invalid session") from None
    return SessionUser(user_id=int(data["user_id"]), username=str(data["username"]))


CurrentUser = Annotated[SessionUser, Depends(get_current_user)]
