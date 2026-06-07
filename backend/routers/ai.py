import os
from fastapi import APIRouter, HTTPException
import anthropic

router = APIRouter()

MODEL = "claude-haiku-4-5-20251001"


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
