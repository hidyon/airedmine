import json
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from models import ChatRequest
from services.redmine_connector import RedmineConnector, RedmineApiError
from services.agent import run_agent
from dependencies import get_connector

router = APIRouter()
ConnectorDep = Annotated[RedmineConnector, Depends(get_connector)]


@router.post("/api/chat")
async def chat(request: ChatRequest, connector: ConnectorDep) -> dict:
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail={"error": "question is required"})

    try:
        messages = [m.model_dump() for m in request.messages]
        result = await run_agent(
            question=question,
            messages=messages,
            role=request.role,
            connector=connector,
            display_name=request.display_name,
            redmine_user_id=request.redmine_user_id,
        )
        return result
    except RedmineApiError as exc:
        raise HTTPException(
            status_code=exc.status,
            detail={"error": "Redmine API error", "message": exc.body[:240]},
        ) from exc
