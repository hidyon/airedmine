import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from db import get_connection

router = APIRouter()

DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "demo")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24


class LoginRequest(BaseModel):
    username: str
    password: str


def _make_token(user: dict) -> str:
    payload = {
        "user_id": user["id"],
        "username": user["username"],
        "display_name": user["display_name"],
        "role": user["role"],
        "redmine_user_id": user.get("redmine_user_id"),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail={"error": "セッションの有効期限が切れました"})
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail={"error": "無効なトークンです"})


@router.post("/api/auth/login")
def login(req: LoginRequest) -> dict:
    if req.password != DEMO_PASSWORD:
        raise HTTPException(status_code=401, detail={"error": "パスワードが違います"})

    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, username, display_name, role, redmine_user_id FROM users WHERE username = ?",
            (req.username,),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=401, detail={"error": "ユーザーが見つかりません"})

    user = dict(row)
    token = _make_token(user)
    return {"token": token, "user": user}


@router.get("/api/auth/me")
def me(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail={"error": "未認証"})
    payload = _decode_token(authorization[7:])
    return {
        "user": {
            "user_id": payload["user_id"],
            "username": payload["username"],
            "display_name": payload["display_name"],
            "role": payload["role"],
            "redmine_user_id": payload.get("redmine_user_id"),
        }
    }
