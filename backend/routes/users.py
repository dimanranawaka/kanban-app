import bcrypt
from fastapi import APIRouter, HTTPException

from backend.db import get_connection
from backend.deps import CurrentUser
from backend.models import UserProfile, UserProfileUpdate

router = APIRouter(tags=["users"])


@router.get("/api/users/me", response_model=UserProfile)
async def get_profile(user: CurrentUser):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, username, display_name, email, created_at FROM users WHERE id = ?",
            (user.user_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return UserProfile(**dict(row))
    finally:
        conn.close()


@router.put("/api/users/me", response_model=UserProfile)
async def update_profile(body: UserProfileUpdate, user: CurrentUser):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, username, password_hash, display_name, email, created_at FROM users WHERE id = ?",
            (user.user_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        fields: dict = {}

        if body.display_name is not None:
            fields["display_name"] = body.display_name.strip()

        if body.email is not None:
            fields["email"] = body.email.strip()

        if body.new_password is not None:
            if not body.current_password:
                raise HTTPException(status_code=400, detail="Current password required to change password")
            if not row["password_hash"] or not bcrypt.checkpw(
                body.current_password.encode("utf-8"), row["password_hash"].encode("utf-8")
            ):
                raise HTTPException(status_code=400, detail="Current password is incorrect")
            fields["password_hash"] = bcrypt.hashpw(
                body.new_password.encode("utf-8"), bcrypt.gensalt()
            ).decode("utf-8")

        if fields:
            set_clause = ", ".join(f"{k} = ?" for k in fields)
            conn.execute(
                f"UPDATE users SET {set_clause} WHERE id = ?",
                [*fields.values(), user.user_id],
            )
            conn.commit()

        updated = conn.execute(
            "SELECT id, username, display_name, email, created_at FROM users WHERE id = ?",
            (user.user_id,),
        ).fetchone()
        return UserProfile(**dict(updated))
    finally:
        conn.close()
