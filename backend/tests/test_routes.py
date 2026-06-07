import os
import pytest
from fastapi.testclient import TestClient

os.environ["DB_PATH"] = "/tmp/test_airedmaine.db"
os.environ["DOCS_ROOT"] = "/project"
os.environ["REDMINE_BASE_URL"] = ""
os.environ["REDMINE_API_KEY"] = ""

from db import init_db  # noqa: E402
from main import app  # noqa: E402

init_db()
client = TestClient(app)


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


def test_chat_basic():
    resp = client.post("/api/chat", json={"question": "今日まず何からやればいい？"})
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert "references" in data
    assert isinstance(data["references"], list)


def test_chat_clarification():
    resp = client.post("/api/chat", json={"question": "なんか更新して"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["clarification"] is not None
    assert data["clarification"]["type"] == "clarification_required"


def test_chat_no_clarification_with_issue_id():
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
