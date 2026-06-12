"""AI Agent core: Anthropic tool_use loop with conversation context."""
import json
import os
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
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=system,
            tools=TOOL_SCHEMAS,
            messages=api_messages,
        )

        # ツール呼び出しがない → 最終回答
        if response.stop_reason == "end_turn":
            answer = _extract_text(response)
            return {"answer": answer, "proposal": proposal, "tool_calls": tool_calls}

        # tool_use ブロックを処理
        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            tool_calls.append(block.name)
            result_str = await execute_tool(
                block.name, block.input, connector, knowledge_base
            )

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
    }


def _extract_text(response: Any) -> str:
    for block in response.content:
        if hasattr(block, "text"):
            return block.text
    return ""
