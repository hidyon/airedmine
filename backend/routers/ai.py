import os
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
import anthropic

from services import issue_index
from dependencies import get_connector
from services.redmine_connector import RedmineConnector

router = APIRouter()

MODEL = "claude-haiku-4-5-20251001"
ConnectorDep = Annotated[RedmineConnector, Depends(get_connector)]


@router.get("/api/ai/health")
async def ai_health() -> dict:
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY が設定されていません")
    try:
        client = anthropic.Anthropic(api_key=api_key)
        msg = client.messages.create(
            model=MODEL,
            max_tokens=16,
            messages=[{"role": "user", "content": "ping"}],
        )
        return {"status": "ok", "model": MODEL, "reply": msg.content[0].text.strip()}
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="API キーが無効です")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Anthropic API 接続エラー: {e}")


@router.get("/api/ai/index/status")
async def index_status() -> dict:
    count = issue_index.index_count()
    return {"indexed_issues": count, "ready": count > 0}


@router.post("/api/ai/index/build")
async def index_build(connector: ConnectorDep) -> dict:
    built = await issue_index.build_index(connector, force=True)
    return {"indexed_issues": built, "ready": built > 0}
