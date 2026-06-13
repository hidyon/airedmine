import os
import pytest
from fastapi.testclient import TestClient

os.environ["DB_PATH"] = "/tmp/test_airedmaine.db"
os.environ["DOCS_ROOT"] = "/project"
os.environ["REDMINE_BASE_URL"] = ""
os.environ["REDMINE_API_KEY"] = ""
os.environ["JWT_SECRET"] = "test-secret"

from db import init_db  # noqa: E402
from main import app  # noqa: E402
from routers import chat as chat_router  # noqa: E402

init_db()
client = TestClient(app)


async def _fake_run_agent(question, messages, role, connector, **kwargs):
    if question == "なんか更新して":
        return {
            "answer": None,
            "references": [],
            "clarification": {
                "type": "clarification_required",
                "message": "どの issue を更新しますか？",
                "hints": ["例: #1208 にコメントを追加して"],
            },
            "proposal": None,
        }
    if "#1208" in question:
        return {
            "answer": "確認待ちの提案を作成しました。",
            "references": [],
            "clarification": None,
            "proposal": {
                "status": "confirmation_required",
                "action": "comment",
                "issue_id": 1208,
                "notes": "確認済みです",
            },
        }
    return {"answer": "今日の優先候補を確認しました。", "references": [], "clarification": None, "proposal": None}


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_config_mock_mode():
    resp = client.get("/api/config")
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "mock"
    assert "connected" in data
    assert "diagnostics" in data


def test_issues_list_mock():
    resp = client.get("/api/issues")
    assert resp.status_code == 200
    data = resp.json()
    assert "issues" in data
    assert isinstance(data["issues"], list)
    assert data["total_count"] >= 0


def test_issue_detail_mock():
    resp = client.get("/api/issues/1208")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == 1208
    assert "subject" in data
    assert "journals" in data


def test_issue_detail_not_found():
    resp = client.get("/api/issues/9999")
    assert resp.status_code == 404


def test_chat_basic(monkeypatch):
    monkeypatch.setattr(chat_router, "run_agent", _fake_run_agent)
    resp = client.post("/api/chat", json={"question": "今日まず何からやればいい？"})
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert "references" in data
    assert isinstance(data["references"], list)


def test_chat_clarification(monkeypatch):
    monkeypatch.setattr(chat_router, "run_agent", _fake_run_agent)
    resp = client.post("/api/chat", json={"question": "なんか更新して"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["clarification"] is not None
    assert data["clarification"]["type"] == "clarification_required"


def test_chat_no_clarification_with_issue_id(monkeypatch):
    monkeypatch.setattr(chat_router, "run_agent", _fake_run_agent)
    resp = client.post("/api/chat", json={"question": "#1208 にコメントを追加して: 確認済みです"})
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("clarification") is None
    assert data.get("proposal") is not None


def test_proposals_logs_empty():
    resp = client.get("/api/proposals/logs")
    assert resp.status_code == 200
    data = resp.json()
    assert "logs" in data
    assert isinstance(data["logs"], list)


def test_execute_due_date_update_mock():
    resp = client.post("/api/proposals/update", json={
        "issue_id": 1208,
        "action": "due_date",
        "new_due_date": "2026-07-01",
        "reason": "スプリント計画に合わせる",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "mock"
    assert data["fields"] == {"due_date": "2026-07-01"}
    assert data["log"]["action"] == "due_date"


def test_execute_priority_update_mock():
    resp = client.post("/api/proposals/update", json={
        "issue_id": 1208,
        "action": "priority",
        "new_priority_id": 4,
        "new_priority_name": "Urgent",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["fields"] == {"priority_id": 4}


def test_execute_done_ratio_update_mock():
    resp = client.post("/api/proposals/update", json={
        "issue_id": 1208,
        "action": "done_ratio",
        "new_done_ratio": 60,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["fields"] == {"done_ratio": 60}


def test_execute_done_ratio_rejects_out_of_range():
    resp = client.post("/api/proposals/update", json={
        "issue_id": 1208,
        "action": "done_ratio",
        "new_done_ratio": 150,
    })
    assert resp.status_code == 400
    assert resp.json()["detail"]["category"] == "validation"


def test_execute_version_update_mock():
    resp = client.post("/api/proposals/update", json={
        "issue_id": 1208,
        "action": "version",
        "new_version_id": 3,
        "new_version_name": "Sprint 3",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["fields"] == {"fixed_version_id": 3}


def test_execute_add_relation_mock():
    resp = client.post("/api/proposals/add_relation", json={
        "issue_id": 1208,
        "related_issue_id": 1207,
        "relation_type": "blocks",
        "reason": "先に片付ける必要がある",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "mock"
    assert data["issue_id"] == 1208
    assert data["related_issue_id"] == 1207
    assert data["relation_type"] == "blocks"


def test_execute_add_relation_rejects_unknown_type():
    resp = client.post("/api/proposals/add_relation", json={
        "issue_id": 1208,
        "related_issue_id": 1207,
        "relation_type": "blocked_by",
    })
    assert resp.status_code == 422


def test_experience_notes_get():
    resp = client.get("/api/experience/notes")
    assert resp.status_code == 200
    data = resp.json()
    assert "notes" in data
    assert "total" in data


def test_experience_notes_create():
    resp = client.post("/api/experience/notes", json={
        "role": "developer",
        "moment": "triage",
        "signal": "clearer",
        "note": "AIのおかげで優先順位がすぐ分かった",
        "next_action": "",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["note"]["role"] == "developer"
    assert data["note"]["note"] == "AIのおかげで優先順位がすぐ分かった"


def test_experience_notes_create_missing_note():
    resp = client.post("/api/experience/notes", json={"role": "developer", "note": ""})
    assert resp.status_code == 400
