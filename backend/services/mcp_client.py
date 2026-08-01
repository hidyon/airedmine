"""backend から共有 MCP サーバー（http モード）をツール源として呼ぶ薄いクライアント。

`MCP_SERVER_URL` が設定されているとき、AI Agent の Redmine 参照ツールと、
承認後の proposal 実行を、この MCP サーバー経由で行う（未設定なら従来 connector）。

リクエストにはログインユーザーの JWT を Bearer で載せる（`current_jwt` contextvar）。
MCP サーバーはこれを検証し、`X-Redmine-Switch-User` で本人として Redmine を操作する。
"""
import contextvars
import json
import os
from typing import Any

import httpx

from services.redmine_connector import RedmineApiError

# リクエスト単位のユーザー JWT（chat / proposals ルーターが設定する）。
current_jwt: contextvars.ContextVar[str | None] = contextvars.ContextVar("current_jwt", default=None)


def mcp_enabled() -> bool:
    return bool(os.getenv("MCP_SERVER_URL"))


def _parse_result(text: str) -> dict:
    """Streamable HTTP の SSE（または素の JSON）から JSON-RPC メッセージを取り出す。"""
    for line in text.splitlines():
        if line.startswith("data:"):
            return json.loads(line[5:].strip())
    return json.loads(text)


async def call_tool(name: str, arguments: dict) -> Any:
    """MCP サーバーの tools/call を呼び、ツールの戻り値（dict）を返す。

    失敗は RedmineApiError として送出し、既存の audit 分類をそのまま使えるようにする。
    """
    url = os.environ["MCP_SERVER_URL"]
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    jwt = current_jwt.get()
    if jwt:
        headers["Authorization"] = f"Bearer {jwt}"

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": name, "arguments": arguments},
    }
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(url, json=payload, headers=headers)
    except httpx.RequestError as exc:
        raise RedmineApiError(f"MCP サーバー接続エラー: {exc}", 503, str(exc)) from exc

    if resp.status_code == 401:
        raise RedmineApiError("MCP 認証エラー（トークンが無効か未設定）", 401, resp.text)
    if not resp.is_success:
        raise RedmineApiError(f"MCP サーバーエラー ({resp.status_code})", resp.status_code, resp.text)

    message = _parse_result(resp.text)
    if "error" in message:  # JSON-RPC レベルのエラー
        err = message["error"]
        raise RedmineApiError(str(err.get("message", err)), 502, json.dumps(err))

    result = message.get("result", {})
    content = result.get("content") or []
    parsed = json.loads(content[0]["text"]) if content else {}

    # ツールレベルのエラー（redmine.py は {"error":..., "status":...} を返す）
    if isinstance(parsed, dict) and "error" in parsed and "status" in parsed:
        raise RedmineApiError(str(parsed["error"]), int(parsed.get("status") or 502), str(parsed))
    return parsed
