from contextlib import asynccontextmanager
from fastapi import FastAPI
from db import init_db
from routers import config, issues, chat, proposals, experience


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="AIRedmine API", lifespan=lifespan)

app.include_router(config.router)
app.include_router(issues.router)
app.include_router(chat.router)
app.include_router(proposals.router)
app.include_router(experience.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
