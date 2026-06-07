from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from models import ChatRequest
from services.redmine_connector import RedmineConnector, RedmineApiError
from services.knowledge_base import read_knowledge_base
from services.chat_engine import build_chat_response, extract_issue_id
from dependencies import get_connector

router = APIRouter()
ConnectorDep = Annotated[RedmineConnector, Depends(get_connector)]


@router.post("/api/chat")
async def chat(request: ChatRequest, connector: ConnectorDep) -> dict:
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail={"error": "question is required"})

    try:
        issue_id = extract_issue_id(question)
        issues_data, knowledge = await _fetch_context(connector)

        requested_detail = None
        if issue_id is not None:
            try:
                requested_detail = await connector.get_issue_detail(issue_id)
            except RedmineApiError:
                pass

        return build_chat_response(question, issues_data, knowledge, requested_detail)

    except RedmineApiError as exc:
        raise HTTPException(status_code=exc.status, detail={"error": "Redmine chat context fetch failed", "message": exc.body[:240]}) from exc


async def _fetch_context(connector: RedmineConnector) -> tuple[list[dict], list[dict]]:
    from urllib.parse import urlencode
    issues_result = await connector.list_issues({
        "assigned_to_id": "me",
        "status_id": "*",
        "limit": 100,
    })
    knowledge = read_knowledge_base()
    return issues_result.get("issues", []), knowledge
