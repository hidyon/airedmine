"""Redmine MCP サーバー。

Claude Code などの MCP クライアントから Redmine を直接操作するためのツールを公開する。
2 つのトランスポートを選べる（`MCP_TRANSPORT` で切替、既定 stdio）。

  stdio: ローカルの単一ユーザー利用（従来どおり）。単一 API キーで動作。
  http : ステートレスな Streamable HTTP + JWT(Bearer) 認証の共有エンドポイント。
         認証ユーザーとして Redmine を操作する（要 admin キー + REDMINE_SWITCH_USER=1）。

環境変数:
  REDMINE_BASE_URL     接続先 Redmine の URL（例: http://localhost:3000）
  REDMINE_API_KEY      Redmine の API キー（http 共有時は admin 権限が前提）
  MCP_TRANSPORT        "stdio"（既定）または "http"
  MCP_HTTP_HOST        http 時の bind ホスト（既定 0.0.0.0）
  MCP_HTTP_PORT        http 時のポート（既定 8848）
  REDMINE_SWITCH_USER  http 時に "1" で X-Redmine-Switch-User による本人操作を有効化
  JWT_SECRET           http 時の Bearer JWT 検証鍵（backend と共有）
"""
import os
from typing import Any

from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings

from redmine import RedmineClient, RedmineError

# DNS リバインディング保護。既定はオフ（JWT 認証が実質のゲート、Docker 内の任意ホスト名で到達可）。
# MCP_ALLOWED_HOSTS（カンマ区切り）を設定するとその host/origin のみ許可する。
_allowed_hosts = [h.strip() for h in os.getenv("MCP_ALLOWED_HOSTS", "").split(",") if h.strip()]
_transport_security = TransportSecuritySettings(
    enable_dns_rebinding_protection=bool(_allowed_hosts),
    allowed_hosts=_allowed_hosts or ["*"],
    allowed_origins=_allowed_hosts or ["*"],
)

mcp = FastMCP("redmine", stateless_http=True, transport_security=_transport_security)
client = RedmineClient()


async def _safe(coro) -> Any:
    try:
        return await coro
    except RedmineError as exc:
        return {"error": str(exc), "status": exc.status}


@mcp.tool()
async def list_issues(
    status_id: str = "open",
    assigned_to_id: str | None = None,
    limit: int = 25,
    offset: int = 0,
    sort: str = "updated_on:desc",
) -> Any:
    """Redmine の issue 一覧を取得する。

    Args:
        status_id: ステータスフィルタ。"open"（未完了）、"closed"（完了）、"*"（全て）、または数値 ID。
        assigned_to_id: 担当者で絞り込む場合の数値 user_id。自分の場合は "me"。
        limit: 取得件数の上限（既定 25）。
        offset: 取得開始位置（ページング用、既定 0）。
        sort: 並び順（既定 updated_on:desc）。
    """
    return await _safe(client.list_issues(status_id, assigned_to_id, limit, offset, sort))


@mcp.tool()
async def get_issue(issue_id: int) -> Any:
    """指定した issue の詳細（説明・コメント履歴を含む）を取得する。

    Args:
        issue_id: issue 番号。
    """
    return await _safe(client.get_issue(issue_id))


@mcp.tool()
async def search_issues(query: str, limit: int = 25) -> Any:
    """キーワードで issue を全文検索する。

    Args:
        query: 検索キーワード。
        limit: 取得件数の上限（既定 25）。
    """
    return await _safe(client.search_issues(query, limit))


@mcp.tool()
async def list_projects(limit: int = 100) -> Any:
    """プロジェクト一覧を取得する。create_issue の project_id を調べるのに使う。

    Args:
        limit: 取得件数の上限（既定 100）。
    """
    return await _safe(client.list_projects(limit))


@mcp.tool()
async def list_issue_statuses() -> Any:
    """ステータス一覧（id / name / is_closed）を取得する。change_status の status_id を調べるのに使う。

    遷移できるステータスはユーザーのロールとワークフロー設定に依存するため、
    一覧に存在しても変更が反映されない場合がある。
    """
    return await _safe(client.list_issue_statuses())


@mcp.tool()
async def list_priorities() -> Any:
    """優先度一覧（id / name）を取得する。"""
    return await _safe(client.list_priorities())


@mcp.tool()
async def list_users(limit: int = 100) -> Any:
    """ユーザー一覧（id / login / name）を取得する。担当者の user_id を調べるのに使う。

    管理者権限の API キーが必要。権限がない場合はエラーを返す。

    Args:
        limit: 取得件数の上限（既定 100）。
    """
    return await _safe(client.list_users(limit))


@mcp.tool()
async def list_versions(project_id: str) -> Any:
    """指定プロジェクトのバージョン（スプリント・マイルストーン）一覧を取得する。

    Args:
        project_id: プロジェクトの ID または識別子。
    """
    return await _safe(client.list_versions(project_id))


@mcp.tool()
async def create_issue(
    project_id: str,
    subject: str,
    description: str | None = None,
    assigned_to_id: int | None = None,
    priority_id: int | None = None,
    due_date: str | None = None,
) -> Any:
    """Redmine に issue を新規作成する。

    Args:
        project_id: 作成先プロジェクトの ID または識別子。
        subject: issue のタイトル（必須）。
        description: 本文。
        assigned_to_id: 担当者の数値 user_id。
        priority_id: 優先度 ID。
        due_date: 期日（YYYY-MM-DD）。
    """
    return await _safe(
        client.create_issue(
            {
                "project_id": project_id,
                "subject": subject,
                "description": description,
                "assigned_to_id": assigned_to_id,
                "priority_id": priority_id,
                "due_date": due_date,
            }
        )
    )


@mcp.tool()
async def add_comment(issue_id: int, notes: str) -> Any:
    """issue にコメントを追加する。

    Args:
        issue_id: 対象 issue 番号。
        notes: コメント本文。
    """
    return await _safe(client.add_comment(issue_id, notes))


@mcp.tool()
async def change_status(issue_id: int, status_id: int) -> Any:
    """issue のステータスを変更する。

    Args:
        issue_id: 対象 issue 番号。
        status_id: 変更先ステータスの数値 ID。
    """
    return await _safe(client.update_issue(issue_id, {"status_id": status_id}))


@mcp.tool()
async def change_assignee(issue_id: int, assigned_to_id: int) -> Any:
    """issue の担当者を変更する。

    Args:
        issue_id: 対象 issue 番号。
        assigned_to_id: 新しい担当者の数値 user_id。
    """
    return await _safe(client.update_issue(issue_id, {"assigned_to_id": assigned_to_id}))


@mcp.tool()
async def update_due_date(issue_id: int, due_date: str) -> Any:
    """issue の期日を設定する。

    Args:
        issue_id: 対象 issue 番号。
        due_date: 期日（YYYY-MM-DD）。
    """
    return await _safe(client.update_issue(issue_id, {"due_date": due_date}))


@mcp.tool()
async def update_priority(issue_id: int, priority_id: int) -> Any:
    """issue の優先度を変更する。priority_id は list_priorities で調べられる。

    Args:
        issue_id: 対象 issue 番号。
        priority_id: 優先度の数値 ID。
    """
    return await _safe(client.update_issue(issue_id, {"priority_id": priority_id}))


@mcp.tool()
async def update_done_ratio(issue_id: int, done_ratio: int) -> Any:
    """issue の進捗率を更新する。

    Args:
        issue_id: 対象 issue 番号。
        done_ratio: 進捗率（0〜100）。
    """
    if not 0 <= done_ratio <= 100:
        return {"error": "done_ratio は 0〜100 で指定してください", "status": 0}
    return await _safe(client.update_issue(issue_id, {"done_ratio": done_ratio}))


@mcp.tool()
async def assign_version(issue_id: int, version_id: int) -> Any:
    """issue を対象バージョン（スプリント）に割り当てる。version_id は list_versions で調べられる。

    Args:
        issue_id: 対象 issue 番号。
        version_id: バージョンの数値 ID。
    """
    return await _safe(client.update_issue(issue_id, {"fixed_version_id": version_id}))


@mcp.tool()
async def add_relation(
    issue_id: int, related_issue_id: int, relation_type: str = "relates"
) -> Any:
    """2 つの issue に関連を設定する。

    Args:
        issue_id: 起点となる issue 番号。
        related_issue_id: 関連先の issue 番号。
        relation_type: 関連タイプ。relates / blocks / blocked / precedes / follows /
            duplicates / duplicated / copied_to / copied_from のいずれか（既定 relates）。
    """
    return await _safe(client.add_relation(issue_id, related_issue_id, relation_type))


def main() -> None:
    if os.getenv("MCP_TRANSPORT", "stdio").lower() == "http":
        import uvicorn

        from auth import BearerAuthMiddleware

        app = BearerAuthMiddleware(mcp.streamable_http_app())
        uvicorn.run(
            app,
            host=os.getenv("MCP_HTTP_HOST", "0.0.0.0"),
            port=int(os.getenv("MCP_HTTP_PORT", "8848")),
        )
    else:
        mcp.run()


if __name__ == "__main__":
    main()
