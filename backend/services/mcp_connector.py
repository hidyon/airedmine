"""共有 MCP サーバーをバックエンドにした Redmine コネクタ。

`MCP_SERVER_URL` 設定時、`get_connector()` はこの `McpConnector` を返す。
RedmineConnector と同じインターフェース・同じ戻り値形状を提供し、Redmine の
参照・操作をすべて共有 MCP サーバー経由に一本化する（本人の JWT を転送し
switch-user で本人操作）。MCP のツールは connector 互換のリッチ形状を返すため、
AI Agent / PM 集計 / issue 詳細 / proposal 実行がそのまま動く。

意味検索・knowledge は Redmine 操作ではないため対象外（backend が担当）。
mock モードは MCP 未設定時（従来 RedmineConnector）のみ。
"""
import os
from typing import Any

from services import mcp_client
from services.redmine_connector import RedmineApiError

# update_issue の各フィールド → MCP 書き込みツールのマッピング。
_UPDATE_TOOL = {
    "status_id": ("change_status", "status_id"),
    "assigned_to_id": ("change_assignee", "assigned_to_id"),
    "due_date": ("update_due_date", "due_date"),
    "priority_id": ("update_priority", "priority_id"),
    "done_ratio": ("update_done_ratio", "done_ratio"),
    "fixed_version_id": ("assign_version", "version_id"),
}


class McpConnector:
    """RedmineConnector 互換。すべての Redmine 操作を MCP サーバー経由で行う。"""

    # --- config 表示用（RedmineConnector と同じプロパティ） ---
    @property
    def is_connected(self) -> bool:
        return True

    @property
    def mode(self) -> str:
        return "redmine"

    @property
    def base_url(self) -> str | None:
        return os.getenv("MCP_SERVER_URL")

    @property
    def missing(self) -> list[str]:
        return []

    # --- 参照系 ---
    async def list_issues(self, params: dict[str, Any]) -> dict:
        args: dict[str, Any] = {
            "status_id": params.get("status_id", "open"),
            "limit": int(params.get("limit", 100)),
        }
        if params.get("assigned_to_id"):
            args["assigned_to_id"] = str(params["assigned_to_id"])
        if params.get("offset"):
            args["offset"] = int(params["offset"])
        if params.get("sort"):
            args["sort"] = params["sort"]
        return await mcp_client.call_tool("list_issues", args)

    async def get_issue_detail(self, issue_id: int) -> dict | None:
        try:
            return await mcp_client.call_tool("get_issue", {"issue_id": issue_id})
        except RedmineApiError as exc:
            if exc.status == 404:
                return None
            raise

    async def list_projects(self) -> dict:
        return await mcp_client.call_tool("list_projects", {})

    async def list_issue_statuses(self) -> dict:
        return await mcp_client.call_tool("list_issue_statuses", {})

    async def list_priorities(self) -> dict:
        return await mcp_client.call_tool("list_priorities", {})

    async def list_users(self) -> dict:
        return await mcp_client.call_tool("list_users", {})

    async def list_versions(self, project_id: str) -> dict:
        return await mcp_client.call_tool("list_versions", {"project_id": project_id})

    # --- 更新系（proposal 承認後の実行） ---
    async def add_issue_comment(self, issue_id: int, notes: str) -> dict:
        return await mcp_client.call_tool("add_comment", {"issue_id": issue_id, "notes": notes})

    async def update_issue(self, issue_id: int, fields: dict[str, Any]) -> dict:
        result: dict = {"updated": True, "issue_id": issue_id, "fields": fields}
        for key, value in fields.items():
            tool_arg = _UPDATE_TOOL.get(key)
            if tool_arg is None:
                raise RedmineApiError(f"MCP に未対応のフィールド: {key}", 400)
            tool, arg = tool_arg
            result = await mcp_client.call_tool(tool, {"issue_id": issue_id, arg: value})
        return result

    async def create_issue(self, fields: dict[str, Any]) -> dict:
        args = {k: v for k, v in fields.items() if v is not None}
        return await mcp_client.call_tool("create_issue", args)

    async def add_relation(self, issue_id: int, related_issue_id: int, relation_type: str) -> dict:
        return await mcp_client.call_tool(
            "add_relation",
            {"issue_id": issue_id, "related_issue_id": related_issue_id, "relation_type": relation_type},
        )
