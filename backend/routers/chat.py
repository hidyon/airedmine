from typing import Annotated
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Query
from models import ChatRequest
from services.redmine_connector import RedmineConnector, RedmineApiError
from services.agent import run_agent
from dependencies import get_connector
from db import (
    add_conversation_message,
    get_all_users,
    get_chat_session,
    get_conversation_messages,
    list_chat_sessions,
    upsert_chat_session,
)

router = APIRouter()
ConnectorDep = Annotated[RedmineConnector, Depends(get_connector)]


@router.post("/api/chat")
async def chat(request: ChatRequest, connector: ConnectorDep) -> dict:
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail={"error": "question is required"})

    session_id = request.session_id.strip() or f"chat-{uuid4().hex}"
    try:
        messages = [m.model_dump() for m in request.messages]
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
async def chat_sessions(limit: int = Query(default=50, ge=1, le=100)) -> dict:
    return {"sessions": list_chat_sessions(limit)}


@router.get("/api/chat/sessions/{session_id}")
async def chat_session_detail(session_id: str) -> dict:
    session = get_chat_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail={"error": "session not found"})
    return {
        "session": session,
        "messages": get_conversation_messages(session_id),
    }


def _save_chat_turn(session_id: str, role: str, question: str, result: dict) -> None:
    title = _session_title(question)
    upsert_chat_session(session_id, title, role)
    add_conversation_message(session_id, "user", question)
    add_conversation_message(session_id, "assistant", _assistant_content(result))


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
