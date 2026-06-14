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
