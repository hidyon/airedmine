from contextlib import asynccontextmanager
import asyncio
import logging
import os
from fastapi import FastAPI
from db import init_db
from routers import config, issues, chat, proposals, experience, ai, auth, pm
from services import embedder

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if os.getenv("AIREDMINE_DISABLE_WARMUP", "").lower() not in {"1", "true", "yes"}:
        task = asyncio.create_task(asyncio.to_thread(embedder.warm_up))
        task.add_done_callback(_log_warmup_result)
    yield


def _log_warmup_result(task: asyncio.Task) -> None:
    try:
        status = task.result()
        logger.info("Semantic model warm-up finished: %s", status)
    except Exception:
        logger.exception("Semantic model warm-up task failed")


app = FastAPI(title="AIRedmine API", lifespan=lifespan)


@app.middleware("http")
async def bind_jwt_middleware(request, call_next):
    """リクエストの Bearer JWT を contextvar に載せる。

    MCP 経由（McpConnector）のとき、この JWT を MCP に転送して本人として Redmine を操作する。
    """
    from services.mcp_client import current_jwt

    auth = request.headers.get("authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else None
    reset = current_jwt.set(token)
    try:
        return await call_next(request)
    finally:
        current_jwt.reset(reset)


app.include_router(config.router)
app.include_router(issues.router)
app.include_router(chat.router)
app.include_router(proposals.router)
app.include_router(experience.router)
app.include_router(ai.router)
app.include_router(auth.router)
app.include_router(pm.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
