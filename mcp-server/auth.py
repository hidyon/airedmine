"""HTTP モードの MCP エンドポイントを JWT(Bearer) で保護する ASGI ミドルウェア。

既存アプリ（backend）が発行する JWT を同じ `JWT_SECRET` / HS256 で検証する。
無効・欠落トークンは 401 を返し、ツールには一切到達させない（認証ゲート）。
実際に「誰として Redmine を操作するか」はツール実行時に
`identity.current_switch_user()` が解決する。
"""
from starlette.responses import JSONResponse

from identity import decode_token


class BearerAuthMiddleware:
    """Bearer JWT を検証する認証ゲート。無効なら 401。"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            # lifespan / websocket などはそのまま通す
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers") or [])
        raw = headers.get(b"authorization", b"").decode()
        payload = decode_token(raw[7:]) if raw.startswith("Bearer ") else None

        if not payload:
            response = JSONResponse({"error": "unauthorized"}, status_code=401)
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)
