import os

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60


def _serializer() -> URLSafeTimedSerializer:
    secret = os.environ.get("AUTH_SECRET", "dev-insecure-secret-change-me")
    return URLSafeTimedSerializer(secret_key=secret, salt="kanban-auth-session")


def create_session_token(user_id: int, username: str) -> str:
    return _serializer().dumps({"user_id": user_id, "username": username})


def parse_session_token(token: str) -> dict:
    return _serializer().loads(token, max_age=SESSION_MAX_AGE_SECONDS)
