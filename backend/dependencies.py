from services.redmine_connector import RedmineConnector, create_connector
from services import mcp_client
from services.mcp_connector import McpConnector

_connector: RedmineConnector | None = None


def get_connector():
    """Redmine コネクタを返す。

    `MCP_SERVER_URL` 設定時は、Redmine の参照・操作をすべて共有 MCP サーバー経由で
    行う `McpConnector` を返す（本人操作）。未設定時は従来の RedmineConnector
    （実 Redmine 直結、または未設定ならモック）。
    """
    if mcp_client.mcp_enabled():
        return McpConnector()
    global _connector
    if _connector is None:
        _connector = create_connector()
    return _connector
