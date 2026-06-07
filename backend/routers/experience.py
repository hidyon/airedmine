import time
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from models import ExperienceNoteCreate
from db import get_connection

router = APIRouter()

_ALLOWED_ROLES = ("developer", "pm", "observer")
_ALLOWED_MOMENTS = ("morning", "triage", "handoff", "update", "review")
_ALLOWED_SIGNALS = ("lighter", "clearer", "blocked", "risky", "unclear")

_PROMPTS = [
    "Redmine を直接見るより、判断までの時間は短くなったか",
    "AI の根拠と人間確認の境界は分かりやすかったか",
    "次に issue 化すべき摩擦や不安は何か",
]


@router.get("/api/experience/notes")
async def get_notes() -> dict:
    return _build_summary()


@router.post("/api/experience/notes", status_code=201)
async def create_note(body: ExperienceNoteCreate) -> dict:
    if not body.note.strip():
        raise HTTPException(status_code=400, detail={"error": "note is required", "message": "体験メモを入力してください。"})

    entry = {
        "id": f"exp-{int(time.time() * 1000)}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "role": _normalize(body.role, _ALLOWED_ROLES, "developer"),
        "moment": _normalize(body.moment, _ALLOWED_MOMENTS, "triage"),
        "signal": _normalize(body.signal, _ALLOWED_SIGNALS, "clearer"),
        "note": body.note.strip()[:600],
        "next_action": body.next_action.strip()[:240],
    }

    with get_connection() as conn:
        conn.execute(
            "INSERT INTO experience_notes (id, created_at, role, moment, signal, note, next_action) VALUES (?,?,?,?,?,?,?)",
            (entry["id"], entry["created_at"], entry["role"], entry["moment"], entry["signal"], entry["note"], entry["next_action"]),
        )
        conn.commit()

    return {"note": entry, "summary": _build_summary()}


def _normalize(value: str, allowed: tuple, fallback: str) -> str:
    return value.strip() if value.strip() in allowed else fallback


def _build_summary() -> dict:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM experience_notes ORDER BY created_at DESC LIMIT 50").fetchall()

    notes = [dict(r) for r in rows]
    recent = notes[:20]

    return {
        "notes": recent,
        "total": len(notes),
        "summary": {
            "by_role": _count(notes, "role"),
            "by_moment": _count(notes, "moment"),
            "by_signal": _count(notes, "signal"),
            "improvement_candidates": [
                {"id": n["id"], "created_at": n["created_at"], "signal": n["signal"], "next_action": n["next_action"], "source_note": n["note"]}
                for n in notes if n["next_action"]
            ][:5],
        },
        "prompts": _PROMPTS,
    }


def _count(entries: list[dict], key: str) -> dict:
    counts: dict[str, int] = {}
    for e in entries:
        k = e.get(key, "")
        counts[k] = counts.get(k, 0) + 1
    return counts
