from typing import Annotated
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Query
from models import ChatRequest, ChatSessionUpdateRequest
from services.redmine_connector import RedmineConnector, RedmineApiError
from services.agent import run_agent
from dependencies import get_connector
from db import (
    add_conversation_message,
    archive_chat_session,
    get_all_users,
    get_chat_session,
    get_conversation_messages,
    list_chat_sessions,
    unarchive_chat_session,
    update_chat_session_title,
    upsert_chat_session,
)

router = APIRouter()
ConnectorDep = Annotated[RedmineConnector, Depends(get_connector)]
MAX_CONTEXT_MESSAGES = 10
MAX_CONTEXT_CHARS = 6000


@router.post("/api/chat")
async def chat(request: ChatRequest, connector: ConnectorDep) -> dict:
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail={"error": "question is required"})

    session_id = request.session_id.strip() or f"chat-{uuid4().hex}"
    try:
        messages = _context_messages(session_id, [m.model_dump() for m in request.messages])
        users = get_all_users()
        result = await run_agent(
            question=question,
            messages=messages,
            role=request.role,
            connector=connector,
            display_name=request.display_name,
            redmine_user_id=request.redmine_user_id,
            users=users,
        )
        _save_chat_turn(session_id, request.role, question, result)
        return {"session_id": session_id, **result}
    except RedmineApiError as exc:
        raise HTTPException(
            status_code=exc.status,
            detail={"error": "Redmine API error", "message": exc.body[:240]},
        ) from exc


@router.get("/api/chat/sessions")
async def chat_sessions(
    limit: int = Query(default=50, ge=1, le=100),
    include_archived: bool = Query(default=False),
) -> dict:
    return {"sessions": list_chat_sessions(limit, include_archived=include_archived)}


@router.get("/api/chat/sessions/{session_id}")
async def chat_session_detail(session_id: str) -> dict:
    session = get_chat_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail={"error": "session not found"})
    return {
        "session": session,
        "messages": get_conversation_messages(session_id),
    }


@router.patch("/api/chat/sessions/{session_id}")
async def update_chat_session(session_id: str, request: ChatSessionUpdateRequest) -> dict:
    title = " ".join(request.title.split())
    if not title:
        raise HTTPException(status_code=400, detail={"error": "title is required"})
    if len(title) > 80:
        raise HTTPException(status_code=400, detail={"error": "title must be 80 characters or fewer"})
    if not update_chat_session_title(session_id, title):
        raise HTTPException(status_code=404, detail={"error": "session not found"})
    return {"session": get_chat_session(session_id)}


@router.post("/api/chat/sessions/{session_id}/archive")
async def archive_chat_session_route(session_id: str) -> dict:
    if not archive_chat_session(session_id):
        raise HTTPException(status_code=404, detail={"error": "session not found"})
    return {"session": get_chat_session(session_id)}


@router.post("/api/chat/sessions/{session_id}/unarchive")
async def unarchive_chat_session_route(session_id: str) -> dict:
    if not unarchive_chat_session(session_id):
        raise HTTPException(status_code=404, detail={"error": "session not found"})
    return {"session": get_chat_session(session_id)}


def _save_chat_turn(session_id: str, role: str, question: str, result: dict) -> None:
    title = _session_title(question)
    upsert_chat_session(session_id, title, role)
    add_conversation_message(session_id, "user", question)
    add_conversation_message(session_id, "assistant", _assistant_content(result), {"session_id": session_id, **result})


def _context_messages(session_id: str, fallback_messages: list[dict]) -> list[dict]:
    stored = [
        {"role": row["role"], "content": row["content"]}
        for row in get_conversation_messages(session_id)
        if row.get("role") in {"user", "assistant"} and row.get("content")
    ]
    source = stored if stored else fallback_messages
    return _trim_context(source)


def _trim_context(messages: list[dict]) -> list[dict]:
    selected: list[dict] = []
    total_chars = 0
    for message in reversed(messages):
        role = message.get("role")
        content = " ".join(str(message.get("content") or "").split())
        if role not in {"user", "assistant"} or not content:
            continue
        if len(selected) >= MAX_CONTEXT_MESSAGES:
            break
        remaining = MAX_CONTEXT_CHARS - total_chars
        if remaining <= 0:
            break
        if len(content) > remaining:
            content = content[-remaining:]
        selected.append({"role": role, "content": content})
        total_chars += len(content)
    trimmed = list(reversed(selected))
    while trimmed and trimmed[0]["role"] == "assistant":
        trimmed.pop(0)
    return trimmed


def _session_title(question: str) -> str:
    compact = " ".join(question.split())
    if len(compact) <= 60:
        return compact
    return compact[:57].rstrip() + "..."


def _assistant_content(result: dict) -> str:
    if result.get("answer"):
        return result["answer"]
    clarification = result.get("clarification") or {}
    if clarification.get("message"):
        return clarification["message"]
    proposal = result.get("proposal") or {}
    if proposal:
        action = proposal.get("action") or "update"
        issue_id = proposal.get("issue_id")
        target = f" #{issue_id}" if issue_id else ""
        return f"{action}{target} の確認待ち提案を作成しました。"
    return ""
