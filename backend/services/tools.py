"""Redmine tool definitions for Anthropic tool_use."""
import json
from typing import Any

TOOL_SCHEMAS = [
    {
        "name": "list_issues",
        "description": "Redmine の issue 一覧を取得する。担当者・ステータス・件数でフィルタできる。",
        "input_schema": {
            "type": "object",
            "properties": {
                "status_id": {
                    "type": "string",
                    "description": "open（未完了）/ closed（完了）/ * （全件）",
                    "enum": ["open", "closed", "*"],
                },
                "assigned_to_id": {
                    "type": "string",
                    "description": "担当者の数値 ID（例: \"5\"）。ログインユーザーの issue を取得する場合はシステムプロンプトに記載された Redmine user_id を使用する。省略すると全員分を取得。",
                },
                "limit": {
                    "type": "integer",
                    "description": "取得件数上限（最大 100）",
                    "default": 25,
                },
            },
        },
    },
    {
        "name": "get_issue",
        "description": "Redmine の issue 詳細（説明・コメント履歴）を取得する。",
        "input_schema": {
            "type": "object",
            "properties": {
                "issue_id": {
                    "type": "integer",
                    "description": "issue の番号",
                },
            },
            "required": ["issue_id"],
        },
    },
    {
        "name": "search_issues",
        "description": "キーワードで issue を全文検索する。",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "検索キーワード",
                },
                "limit": {
                    "type": "integer",
                    "description": "取得件数上限",
                    "default": 10,
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "add_comment",
        "description": "Redmine の issue にコメントを追加する。実行前に必ず内容を確認する。",
        "input_schema": {
            "type": "object",
            "properties": {
                "issue_id": {
                    "type": "integer",
                    "description": "コメントを追加する issue の番号",
                },
                "notes": {
                    "type": "string",
                    "description": "追加するコメント本文",
                },
            },
            "required": ["issue_id", "notes"],
        },
    },
    {
        "name": "search_knowledge",
        "description": "プロジェクトの docs（ロードマップ・方針・仕様）をキーワード検索する。",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "検索キーワード",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "search_issues_semantic",
        "description": (
            "意味的に近い issue を検索する。キーワード完全一致ではなく意味の近さで探すため、"
            "「認証」で「ログイン」「セキュリティ」関連 issue も拾える。"
            "search_issues でヒットしない場合や、概念・テーマで検索したい場合に使う。"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "検索したい概念やテーマ（日本語可）",
                },
                "top_k": {
                    "type": "integer",
                    "description": "返す件数上限（デフォルト 10）",
                    "default": 10,
                },
            },
            "required": ["query"],
        },
    },
]


async def execute_tool(name: str, tool_input: dict[str, Any], connector: Any, knowledge_base: Any) -> str:
    """ツールを実行して結果を JSON 文字列で返す。add_comment は確認待ちを返す。"""
    if name == "list_issues":
        params: dict[str, Any] = {
            "status_id": tool_input.get("status_id", "open"),
            "limit": tool_input.get("limit", 25),
        }
        assigned = tool_input.get("assigned_to_id", "")
        if assigned:
            params["assigned_to_id"] = assigned
        result = await connector.list_issues(params)
        issues = result.get("issues", [])
        return json.dumps({
            "total": result.get("total_count", len(issues)),
            "issues": [_summarize_issue(i) for i in issues],
        }, ensure_ascii=False)

    if name == "get_issue":
        issue = await connector.get_issue_detail(tool_input["issue_id"])
        if not issue:
            return json.dumps({"error": f"issue #{tool_input['issue_id']} が見つかりません"}, ensure_ascii=False)
        return json.dumps(_detail_issue(issue), ensure_ascii=False)

    if name == "search_issues":
        result = await connector.list_issues({"status_id": "*", "limit": 100})
        query = tool_input["query"].lower()
        matched = [
            _summarize_issue(i) for i in result.get("issues", [])
            if query in (i.get("subject") or "").lower()
        ][:tool_input.get("limit", 10)]
        return json.dumps({"matched": len(matched), "issues": matched}, ensure_ascii=False)

    if name == "add_comment":
        return json.dumps({
            "confirmation_required": True,
            "issue_id": tool_input["issue_id"],
            "notes": tool_input["notes"],
            "message": "コメント追加の準備ができました。ユーザーの確認後に実行します。",
        }, ensure_ascii=False)

    if name == "search_knowledge":
        kb = knowledge_base.read_knowledge_base()
        refs = knowledge_base.find_references(tool_input["query"], kb)
        return json.dumps({"results": refs[:3]}, ensure_ascii=False)

    if name == "search_issues_semantic":
        from services import issue_index
        top_k = tool_input.get("top_k", 10)
        count = issue_index.index_count()
        if count == 0:
            built = await issue_index.build_index(connector)
            if built == 0:
                return json.dumps({"error": "インデックスの構築に失敗しました。Redmine 接続を確認してください。"}, ensure_ascii=False)
        results = issue_index.search(tool_input["query"], top_k=top_k)
        return json.dumps({"matched": len(results), "issues": results}, ensure_ascii=False)

    return json.dumps({"error": f"未知のツール: {name}"}, ensure_ascii=False)


def _summarize_issue(i: dict) -> dict:
    return {
        "id": i.get("id"),
        "subject": i.get("subject"),
        "status": (i.get("status") or {}).get("name"),
        "priority": (i.get("priority") or {}).get("name"),
        "assigned_to": (i.get("assigned_to") or {}).get("name"),
        "updated_on": i.get("updated_on"),
    }


def _detail_issue(i: dict) -> dict:
    journals = [
        {"user": (j.get("user") or {}).get("name"), "notes": j["notes"], "date": j.get("created_on")}
        for j in i.get("journals", [])
        if j.get("notes")
    ]
    return {
        **_summarize_issue(i),
        "description": (i.get("description") or "")[:800],
        "journals": journals[-5:],
    }
