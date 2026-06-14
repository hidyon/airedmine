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
        "name": "change_status",
        "description": "Redmine の issue のステータスを変更する提案を作成する。実行前にユーザーの確認を求める。",
        "input_schema": {
            "type": "object",
            "properties": {
                "issue_id": {
                    "type": "integer",
                    "description": "対象 issue の番号",
                },
                "new_status_id": {
                    "type": "integer",
                    "description": "新しいステータス ID（Redmine の status.id）",
                },
                "new_status_name": {
                    "type": "string",
                    "description": "新しいステータスの表示名（例: '進行中'、'解決済み'）",
                },
                "reason": {
                    "type": "string",
                    "description": "変更理由",
                },
            },
            "required": ["issue_id", "new_status_id", "new_status_name"],
        },
    },
    {
        "name": "change_assignee",
        "description": "Redmine の issue の担当者を変更する提案を作成する。実行前にユーザーの確認を求める。",
        "input_schema": {
            "type": "object",
            "properties": {
                "issue_id": {
                    "type": "integer",
                    "description": "対象 issue の番号",
                },
                "new_assigned_to_id": {
                    "type": "integer",
                    "description": "新しい担当者の Redmine user_id",
                },
                "new_assigned_to_name": {
                    "type": "string",
                    "description": "新しい担当者の表示名",
                },
                "reason": {
                    "type": "string",
                    "description": "変更理由",
                },
            },
            "required": ["issue_id", "new_assigned_to_id", "new_assigned_to_name"],
        },
    },
    {
        "name": "bulk_update",
        "description": (
            "複数の Redmine issue に同じステータス変更または担当者変更を行う提案を作成する。"
            "最大 20 件まで。実行前にユーザーの確認を求める。"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "issue_ids": {
                    "type": "array",
                    "items": {"type": "integer"},
                    "description": "一括更新する issue 番号の配列。最大 20 件。",
                    "minItems": 1,
                    "maxItems": 20,
                },
                "action": {
                    "type": "string",
                    "description": "一括更新の種類",
                    "enum": ["status_change", "assignee_change"],
                },
                "new_status_id": {
                    "type": "integer",
                    "description": "status_change の場合の新しいステータス ID",
                },
                "new_status_name": {
                    "type": "string",
                    "description": "status_change の場合の新しいステータス表示名",
                },
                "new_assigned_to_id": {
                    "type": "integer",
                    "description": "assignee_change の場合の新しい担当者 Redmine user_id",
                },
                "new_assigned_to_name": {
                    "type": "string",
                    "description": "assignee_change の場合の新しい担当者表示名",
                },
                "reason": {
                    "type": "string",
                    "description": "一括更新が必要な理由",
                },
            },
            "required": ["issue_ids", "action"],
        },
    },
    {
        "name": "list_projects",
        "description": "プロジェクト一覧を取得する。create_issue の project_id を調べるのに使う。",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "list_issue_statuses",
        "description": "ステータス一覧（id / name / is_closed）を取得する。change_status の status_id を調べるのに使う。",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "list_priorities",
        "description": "優先度一覧（id / name）を取得する。update_priority の priority_id を調べるのに使う。",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "list_users",
        "description": "ユーザー一覧（id / login / name）を取得する。担当者の user_id を調べるのに使う。権限がない場合はエラーを返す。",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "update_due_date",
        "description": "issue の期日を変更する提案を作成する。実行前にユーザーの確認を求める。",
        "input_schema": {
            "type": "object",
            "properties": {
                "issue_id": {"type": "integer", "description": "対象 issue の番号"},
                "due_date": {"type": "string", "description": "新しい期日 YYYY-MM-DD"},
                "reason": {"type": "string", "description": "変更理由"},
            },
            "required": ["issue_id", "due_date"],
        },
    },
    {
        "name": "update_priority",
        "description": "issue の優先度を変更する提案を作成する。実行前にユーザーの確認を求める。",
        "input_schema": {
            "type": "object",
            "properties": {
                "issue_id": {"type": "integer", "description": "対象 issue の番号"},
                "new_priority_id": {"type": "integer", "description": "新しい優先度 ID（Low=1, Normal=2, High=3, Urgent=4 が一般的）"},
                "new_priority_name": {"type": "string", "description": "新しい優先度の表示名（例: 'High'）"},
                "reason": {"type": "string", "description": "変更理由"},
            },
            "required": ["issue_id", "new_priority_id", "new_priority_name"],
        },
    },
    {
        "name": "update_done_ratio",
        "description": "issue の進捗率（0〜100）を更新する提案を作成する。実行前にユーザーの確認を求める。",
        "input_schema": {
            "type": "object",
            "properties": {
                "issue_id": {"type": "integer", "description": "対象 issue の番号"},
                "done_ratio": {
                    "type": "integer",
                    "description": "進捗率（0〜100）",
                    "minimum": 0,
                    "maximum": 100,
                },
                "reason": {"type": "string", "description": "変更理由"},
            },
            "required": ["issue_id", "done_ratio"],
        },
    },
    {
        "name": "list_versions",
        "description": "プロジェクトのバージョン（スプリント・マイルストーン）一覧を取得する。assign_version の version_id を調べるのに使う。",
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {"type": "string", "description": "プロジェクトの ID または識別子"},
            },
            "required": ["project_id"],
        },
    },
    {
        "name": "assign_version",
        "description": "issue を対象バージョン（スプリント）に割り当てる提案を作成する。実行前にユーザーの確認を求める。version_id は list_versions で調べる。",
        "input_schema": {
            "type": "object",
            "properties": {
                "issue_id": {"type": "integer", "description": "対象 issue の番号"},
                "version_id": {"type": "integer", "description": "バージョンの数値 ID"},
                "version_name": {"type": "string", "description": "バージョンの表示名"},
                "reason": {"type": "string", "description": "変更理由"},
            },
            "required": ["issue_id", "version_id", "version_name"],
        },
    },
    {
        "name": "add_relation",
        "description": "2 つの issue に関連を設定する提案を作成する。実行前にユーザーの確認を求める。",
        "input_schema": {
            "type": "object",
            "properties": {
                "issue_id": {"type": "integer", "description": "起点となる issue の番号"},
                "related_issue_id": {"type": "integer", "description": "関連先の issue の番号"},
                "relation_type": {
                    "type": "string",
                    "description": "関連タイプ",
                    "enum": ["relates", "blocks", "blocked", "precedes", "follows", "duplicates", "duplicated", "copied_to", "copied_from"],
                },
                "reason": {"type": "string", "description": "関連付けの理由"},
            },
            "required": ["issue_id", "related_issue_id", "relation_type"],
        },
    },
    {
        "name": "create_issue",
        "description": (
            "Redmine に issue を新規作成する提案を作成する。実行前にユーザーの確認を求める。"
            "project_id は必須。どのプロジェクトか不明な場合はユーザーに確認する。"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {
                    "type": "string",
                    "description": "作成先プロジェクトの ID または識別子（例: 'kintai-next'）",
                },
                "subject": {
                    "type": "string",
                    "description": "issue のタイトル",
                },
                "description": {
                    "type": "string",
                    "description": "issue の本文・詳細",
                },
                "assigned_to_id": {
                    "type": "integer",
                    "description": "担当者の Redmine user_id（任意）",
                },
                "priority_id": {
                    "type": "integer",
                    "description": "優先度 ID（任意）",
                },
                "due_date": {
                    "type": "string",
                    "description": "期日 YYYY-MM-DD（任意）",
                },
            },
            "required": ["project_id", "subject"],
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


async def execute_tool(
    name: str,
    tool_input: dict[str, Any],
    connector: Any,
    knowledge_base: Any,
    timings: list[dict] | None = None,
) -> str:
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

    if name == "change_status":
        return json.dumps({
            "confirmation_required": True,
            "issue_id": tool_input["issue_id"],
            "new_status_id": tool_input["new_status_id"],
            "new_status_name": tool_input["new_status_name"],
            "reason": tool_input.get("reason", ""),
            "message": "ステータス変更の準備ができました。ユーザーの確認後に実行します。",
        }, ensure_ascii=False)

    if name == "change_assignee":
        return json.dumps({
            "confirmation_required": True,
            "issue_id": tool_input["issue_id"],
            "new_assigned_to_id": tool_input["new_assigned_to_id"],
            "new_assigned_to_name": tool_input["new_assigned_to_name"],
            "reason": tool_input.get("reason", ""),
            "message": "担当者変更の準備ができました。ユーザーの確認後に実行します。",
        }, ensure_ascii=False)

    if name == "bulk_update":
        issue_ids = _unique_issue_ids(tool_input.get("issue_ids", []))
        if not issue_ids:
            return json.dumps({"error": "issue_ids を 1 件以上指定してください"}, ensure_ascii=False)
        if len(issue_ids) > 20:
            return json.dumps({"error": "一括更新は 20 件以下に分割してください", "issue_count": len(issue_ids)}, ensure_ascii=False)
        action = tool_input.get("action")
        if action == "status_change":
            if tool_input.get("new_status_id") is None:
                return json.dumps({"error": "status_change には new_status_id が必要です"}, ensure_ascii=False)
        elif action == "assignee_change":
            if tool_input.get("new_assigned_to_id") is None:
                return json.dumps({"error": "assignee_change には new_assigned_to_id が必要です"}, ensure_ascii=False)
        else:
            return json.dumps({"error": "bulk_update action は status_change または assignee_change を指定してください"}, ensure_ascii=False)
        return json.dumps({
            "confirmation_required": True,
            "issue_ids": issue_ids,
            "action": action,
            "new_status_id": tool_input.get("new_status_id"),
            "new_status_name": tool_input.get("new_status_name", ""),
            "new_assigned_to_id": tool_input.get("new_assigned_to_id"),
            "new_assigned_to_name": tool_input.get("new_assigned_to_name", ""),
            "reason": tool_input.get("reason", ""),
            "message": "一括更新の準備ができました。ユーザーの確認後に実行します。",
        }, ensure_ascii=False)

    if name == "list_projects":
        result = await connector.list_projects()
        return json.dumps(result, ensure_ascii=False)

    if name == "list_issue_statuses":
        result = await connector.list_issue_statuses()
        return json.dumps(result, ensure_ascii=False)

    if name == "list_priorities":
        result = await connector.list_priorities()
        return json.dumps(result, ensure_ascii=False)

    if name == "list_users":
        result = await connector.list_users()
        return json.dumps(result, ensure_ascii=False)

    if name == "list_versions":
        result = await connector.list_versions(tool_input["project_id"])
        return json.dumps(result, ensure_ascii=False)

    if name == "update_due_date":
        return json.dumps({
            "confirmation_required": True,
            "issue_id": tool_input["issue_id"],
            "due_date": tool_input["due_date"],
            "reason": tool_input.get("reason", ""),
            "message": "期日変更の準備ができました。ユーザーの確認後に実行します。",
        }, ensure_ascii=False)

    if name == "update_priority":
        return json.dumps({
            "confirmation_required": True,
            "issue_id": tool_input["issue_id"],
            "new_priority_id": tool_input["new_priority_id"],
            "new_priority_name": tool_input["new_priority_name"],
            "reason": tool_input.get("reason", ""),
            "message": "優先度変更の準備ができました。ユーザーの確認後に実行します。",
        }, ensure_ascii=False)

    if name == "update_done_ratio":
        done_ratio = tool_input["done_ratio"]
        if not 0 <= done_ratio <= 100:
            return json.dumps({
                "error": "done_ratio は 0〜100 で指定してください",
            }, ensure_ascii=False)
        return json.dumps({
            "confirmation_required": True,
            "issue_id": tool_input["issue_id"],
            "done_ratio": done_ratio,
            "reason": tool_input.get("reason", ""),
            "message": "進捗率更新の準備ができました。ユーザーの確認後に実行します。",
        }, ensure_ascii=False)

    if name == "assign_version":
        return json.dumps({
            "confirmation_required": True,
            "issue_id": tool_input["issue_id"],
            "version_id": tool_input["version_id"],
            "version_name": tool_input["version_name"],
            "reason": tool_input.get("reason", ""),
            "message": "バージョン割当の準備ができました。ユーザーの確認後に実行します。",
        }, ensure_ascii=False)

    if name == "add_relation":
        return json.dumps({
            "confirmation_required": True,
            "issue_id": tool_input["issue_id"],
            "related_issue_id": tool_input["related_issue_id"],
            "relation_type": tool_input["relation_type"],
            "reason": tool_input.get("reason", ""),
            "message": "関連付けの準備ができました。ユーザーの確認後に実行します。",
        }, ensure_ascii=False)

    if name == "create_issue":
        return json.dumps({
            "confirmation_required": True,
            "project_id": tool_input["project_id"],
            "subject": tool_input["subject"],
            "description": tool_input.get("description", ""),
            "assigned_to_id": tool_input.get("assigned_to_id"),
            "priority_id": tool_input.get("priority_id"),
            "due_date": tool_input.get("due_date"),
            "message": "issue 作成の準備ができました。ユーザーの確認後に実行します。",
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
            built = await issue_index.build_index(connector, timings=timings)
            if built == 0:
                return json.dumps({"error": "インデックスの構築に失敗しました。Redmine 接続を確認してください。"}, ensure_ascii=False)
        results = issue_index.search(tool_input["query"], top_k=top_k, timings=timings)
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


def _unique_issue_ids(values: list[Any]) -> list[int]:
    issue_ids: list[int] = []
    seen: set[int] = set()
    for value in values:
        try:
            issue_id = int(value)
        except (TypeError, ValueError):
            continue
        if issue_id <= 0 or issue_id in seen:
            continue
        issue_ids.append(issue_id)
        seen.add(issue_id)
    return issue_ids
