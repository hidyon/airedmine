"""HTTP モードでの認証ユーザー解決（Redmine 操作の identity）。

ASGI ミドルウェアで立てた contextvar はツール実行タスクへ伝播しないため、
ツール実行時に MCP SDK の request_ctx（同じタスクで設定される）から
HTTP リクエストを取り出し、その Bearer JWT を検証して username を得る。

stdio モードでは request_ctx.request が無い（None）ため常に None を返し、
従来どおり単一 API キーで動作する。
"""
import os

import jwt

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"


def decode_token(token: str) -> dict | None:
    if not JWT_SECRET:
        return None
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        return None


def current_switch_user() -> str | None:
    """現在のツール呼び出しに紐づく HTTP リクエストの JWT から Redmine login を返す。"""
    try:
        from mcp.server.lowlevel.server import request_ctx
    except Exception:
        return None
    try:
        ctx = request_ctx.get()
    except LookupError:
        return None
    request = getattr(ctx, "request", None)
    if request is None:
        return None
    auth = request.headers.get("authorization", "") if hasattr(request, "headers") else ""
    if not auth.startswith("Bearer "):
        return None
    payload = decode_token(auth[7:])
    return payload.get("username") if payload else None
