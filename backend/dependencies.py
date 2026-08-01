from fastapi import Header

from services.redmine_connector import RedmineConnector, create_connector
from services.mcp_client import current_jwt

_connector: RedmineConnector | None = None


def get_connector() -> RedmineConnector:
    global _connector
    if _connector is None:
        _connector = create_connector()
    return _connector


async def bind_jwt(authorization: str | None = Header(default=None)):
    """リクエストの Bearer JWT を contextvar に載せる。MCP 経由の本人操作に使う。"""
    token = authorization[7:] if authorization and authorization.startswith("Bearer ") else None
    reset = current_jwt.set(token)
    try:
        yield
    finally:
        current_jwt.reset(reset)
