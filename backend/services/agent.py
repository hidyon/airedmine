"""AI Agent core: Anthropic tool_use loop with conversation context."""
import json
import os
import time
from typing import Any

import anthropic

from services.tools import TOOL_SCHEMAS, execute_tool
from services.prompts import get_system_prompt
from services import knowledge_base

MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 1024
MAX_TOOL_ROUNDS = 5


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def _to_api_messages(messages: list[dict]) -> list[dict]:
    """フロントから受け取った messages[] を Anthropic API 形式に変換する。"""
    result = []
    for m in messages:
        role = m.get("role")
        content = m.get("content", "")
        if role in ("user", "assistant") and content:
            result.append({"role": role, "content": str(content)})
    return result


async def run_agent(
    question: str,
    messages: list[dict],
    role: str,
    connector: Any,
    display_name: str = "",
    redmine_user_id: int | None = None,
    users: list[dict] | None = None,
) -> dict:
    """
    tool_use ループを回して最終回答を返す。

    Returns:
        {
            answer: str | None,
            proposal: dict | None,   # add_comment の確認待ち
            tool_calls: list[str],   # 呼ばれたツール名一覧（フロント表示用）
        }
    """
    client = _client()
    total_started = time.perf_counter()
    timings = {
        "total_ms": 0.0,
        "claude_ms": 0.0,
        "tool_total_ms": 0.0,
        "rounds": 0,
        "tools": [],
        "semantic": [],
    }
    system = get_system_prompt(
        role,
        display_name=display_name,
        redmine_user_id=redmine_user_id,
        users=users,
    )

    # 会話履歴 + 今回の質問
    api_messages = _to_api_messages(messages)
    api_messages.append({"role": "user", "content": question})

    tool_calls: list[str] = []
    proposal: dict | None = None

    for _round in range(MAX_TOOL_ROUNDS):
        timings["rounds"] += 1
        claude_started = time.perf_counter()
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=system,
            tools=TOOL_SCHEMAS,
            messages=api_messages,
        )
        timings["claude_ms"] += _elapsed_ms(claude_started)

        # ツール呼び出しがない → 最終回答
        if response.stop_reason == "end_turn":
            answer = _extract_text(response)
            return {"answer": answer, "proposal": proposal, "tool_calls": tool_calls, "timings": _finalize_timings(timings, total_started)}

        # tool_use ブロックを処理
        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            tool_calls.append(block.name)
            tool_started = time.perf_counter()
            result_str = await execute_tool(
                block.name,
                block.input,
                connector,
                knowledge_base,
                timings=timings["semantic"],
            )
            tool_elapsed = _elapsed_ms(tool_started)
            timings["tool_total_ms"] += tool_elapsed
            timings["tools"].append({
                "name": block.name,
                "category": _tool_category(block.name),
                "duration_ms": tool_elapsed,
            })

            # 書き込み系ツールは確認待ち proposal として保存
            if block.name == "add_comment":
                result_json = json.loads(result_str)
                if result_json.get("confirmation_required"):
                    proposal = {
                        "status": "confirmation_required",
                        "action": "comment",
                        "issue_id": result_json["issue_id"],
                        "notes": result_json["notes"],
                    }

            if block.name == "change_status":
                result_json = json.loads(result_str)
                if result_json.get("confirmation_required"):
                    status_name = result_json.get("new_status_name", "")
                    proposal = {
                        "status": "confirmation_required",
                        "action": "status_change",
                        "issue_id": result_json["issue_id"],
                        "new_status_id": result_json["new_status_id"],
                        "new_status_name": status_name,
                        "reason": result_json.get("reason", ""),
                        "title": f"ステータス変更 #{result_json['issue_id']}",
                        "change_summary": f"ステータスを「{status_name}」に変更",
                        "draft": result_json.get("reason", ""),
                        "checklist": [],
                        "next_step": "",
                    }

            if block.name == "change_assignee":
                result_json = json.loads(result_str)
                if result_json.get("confirmation_required"):
                    assignee_name = result_json.get("new_assigned_to_name", "")
                    proposal = {
                        "status": "confirmation_required",
                        "action": "assignee_change",
                        "issue_id": result_json["issue_id"],
                        "new_assigned_to_id": result_json["new_assigned_to_id"],
                        "new_assigned_to_name": assignee_name,
                        "reason": result_json.get("reason", ""),
                        "title": f"担当者変更 #{result_json['issue_id']}",
                        "change_summary": f"担当者を「{assignee_name}」に変更",
                        "draft": result_json.get("reason", ""),
                        "checklist": [],
                        "next_step": "",
                    }

            if block.name == "bulk_update":
                result_json = json.loads(result_str)
                if result_json.get("confirmation_required"):
                    issue_ids = result_json["issue_ids"]
                    action = result_json["action"]
                    if action == "status_change":
                        label = result_json.get("new_status_name") or str(result_json.get("new_status_id"))
                        change_summary = f"{len(issue_ids)} 件のステータスを「{label}」に変更"
                    else:
                        label = result_json.get("new_assigned_to_name") or str(result_json.get("new_assigned_to_id"))
                        change_summary = f"{len(issue_ids)} 件の担当者を「{label}」に変更"
                    proposal = {
                        "status": "confirmation_required",
                        "action": "bulk_update",
                        "issue_ids": issue_ids,
                        "bulk_action": action,
                        "new_status_id": result_json.get("new_status_id"),
                        "new_status_name": result_json.get("new_status_name"),
                        "new_assigned_to_id": result_json.get("new_assigned_to_id"),
                        "new_assigned_to_name": result_json.get("new_assigned_to_name"),
                        "reason": result_json.get("reason", ""),
                        "title": f"一括更新 {len(issue_ids)} 件",
                        "change_summary": change_summary,
                        "draft": result_json.get("reason", ""),
                        "checklist": ["対象 issue と件数が意図通りか確認する"],
                        "next_step": "",
                    }

            if block.name == "update_due_date":
                result_json = json.loads(result_str)
                if result_json.get("confirmation_required"):
                    iid = result_json["issue_id"]
                    due = result_json["due_date"]
                    proposal = {
                        "status": "confirmation_required",
                        "action": "due_date",
                        "issue_id": iid,
                        "new_due_date": due,
                        "reason": result_json.get("reason", ""),
                        "title": f"期日変更 #{iid}",
                        "change_summary": f"期日を {due} に変更",
                        "draft": result_json.get("reason", ""),
                        "checklist": [],
                        "next_step": "",
                    }

            if block.name == "update_priority":
                result_json = json.loads(result_str)
                if result_json.get("confirmation_required"):
                    iid = result_json["issue_id"]
                    pname = result_json.get("new_priority_name", "")
                    proposal = {
                        "status": "confirmation_required",
                        "action": "priority",
                        "issue_id": iid,
                        "new_priority_id": result_json["new_priority_id"],
                        "new_priority_name": pname,
                        "reason": result_json.get("reason", ""),
                        "title": f"優先度変更 #{iid}",
                        "change_summary": f"優先度を「{pname}」に変更",
                        "draft": result_json.get("reason", ""),
                        "checklist": [],
                        "next_step": "",
                    }

            if block.name == "update_done_ratio":
                result_json = json.loads(result_str)
                if result_json.get("confirmation_required"):
                    iid = result_json["issue_id"]
                    ratio = result_json["done_ratio"]
                    proposal = {
                        "status": "confirmation_required",
                        "action": "done_ratio",
                        "issue_id": iid,
                        "new_done_ratio": ratio,
                        "reason": result_json.get("reason", ""),
                        "title": f"進捗率更新 #{iid}",
                        "change_summary": f"進捗率を {ratio}% に更新",
                        "draft": result_json.get("reason", ""),
                        "checklist": [],
                        "next_step": "",
                    }

            if block.name == "assign_version":
                result_json = json.loads(result_str)
                if result_json.get("confirmation_required"):
                    iid = result_json["issue_id"]
                    vname = result_json.get("version_name", "")
                    proposal = {
                        "status": "confirmation_required",
                        "action": "version",
                        "issue_id": iid,
                        "new_version_id": result_json["version_id"],
                        "new_version_name": vname,
                        "reason": result_json.get("reason", ""),
                        "title": f"バージョン割当 #{iid}",
                        "change_summary": f"バージョンを「{vname}」に割り当て",
                        "draft": result_json.get("reason", ""),
                        "checklist": [],
                        "next_step": "",
                    }

            if block.name == "add_relation":
                result_json = json.loads(result_str)
                if result_json.get("confirmation_required"):
                    iid = result_json["issue_id"]
                    rid = result_json["related_issue_id"]
                    rtype = result_json["relation_type"]
                    proposal = {
                        "status": "confirmation_required",
                        "action": "add_relation",
                        "issue_id": iid,
                        "related_issue_id": rid,
                        "relation_type": rtype,
                        "reason": result_json.get("reason", ""),
                        "title": f"関連付け #{iid}",
                        "change_summary": f"#{iid} と #{rid} を「{rtype}」で関連付け",
                        "draft": result_json.get("reason", ""),
                        "checklist": [],
                        "next_step": "",
                    }

            if block.name == "create_issue":
                result_json = json.loads(result_str)
                if result_json.get("confirmation_required"):
                    subject = result_json.get("subject", "")
                    project_id = result_json.get("project_id", "")
                    meta = [f"プロジェクト: {project_id}"]
                    if result_json.get("assigned_to_id"):
                        meta.append(f"担当: {result_json['assigned_to_id']}")
                    if result_json.get("priority_id"):
                        meta.append(f"優先度: {result_json['priority_id']}")
                    if result_json.get("due_date"):
                        meta.append(f"期日: {result_json['due_date']}")
                    proposal = {
                        "status": "confirmation_required",
                        "action": "create_issue",
                        "project_id": project_id,
                        "subject": subject,
                        "description": result_json.get("description", ""),
                        "assigned_to_id": result_json.get("assigned_to_id"),
                        "priority_id": result_json.get("priority_id"),
                        "due_date": result_json.get("due_date"),
                        "title": f"issue 作成: {subject}",
                        "change_summary": " / ".join(meta),
                        "draft": result_json.get("description", ""),
                        "checklist": [],
                        "next_step": "",
                    }

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result_str,
            })

        # assistant メッセージとツール結果を履歴に追加
        api_messages.append({"role": "assistant", "content": response.content})
        api_messages.append({"role": "user", "content": tool_results})

    # ループ上限到達
    return {
        "answer": "処理が複雑すぎました。質問を分割して再度お試しください。",
        "proposal": proposal,
        "tool_calls": tool_calls,
        "timings": _finalize_timings(timings, total_started),
    }


def _extract_text(response: Any) -> str:
    for block in response.content:
        if hasattr(block, "text"):
            return block.text
    return ""


def _elapsed_ms(started: float) -> float:
    return round((time.perf_counter() - started) * 1000, 1)


def _finalize_timings(timings: dict, total_started: float) -> dict:
    timings["total_ms"] = _elapsed_ms(total_started)
    timings["claude_ms"] = round(timings["claude_ms"], 1)
    timings["tool_total_ms"] = round(timings["tool_total_ms"], 1)
    return timings


def _tool_category(name: str) -> str:
    if name == "search_issues_semantic":
        return "semantic_search"
    if name == "search_knowledge":
        return "knowledge_search"
    if name in {
        "list_issues",
        "get_issue",
        "search_issues",
        "list_projects",
        "list_issue_statuses",
        "list_priorities",
        "list_users",
        "list_versions",
    }:
        return "redmine_read"
    if name in {
        "add_comment",
        "change_status",
        "change_assignee",
        "update_due_date",
        "update_priority",
        "update_done_ratio",
        "assign_version",
        "add_relation",
        "create_issue",
        "bulk_update",
    }:
        return "proposal"
    return "other"
