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
from dependencies import get_connector  # noqa: E402
from routers import chat as chat_router  # noqa: E402
from services.redmine_connector import RedmineApiError  # noqa: E402
from services.tools import execute_tool  # noqa: E402

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


class FailingConnector:
    def __init__(self, status: int, body: str):
        self.status = status
        self.body = body

    async def update_issue(self, issue_id: int, fields: dict) -> dict:
        raise RedmineApiError("Redmine API error", self.status, self.body)


class ReferenceConnector:
    async def list_projects(self) -> dict:
        return {"projects": [{"id": 1, "identifier": "mock", "name": "Mock Project"}]}

    async def list_issue_statuses(self) -> dict:
        return {"statuses": [{"id": 5, "name": "Closed", "is_closed": True}]}

    async def list_priorities(self) -> dict:
        return {"priorities": [{"id": 4, "name": "Urgent"}]}

    async def list_users(self) -> dict:
        return {"users": [{"id": 5, "login": "tanaka", "name": "田中 健太"}]}

    async def list_versions(self, project_id: str) -> dict:
        return {"versions": [{"id": 3, "name": "Sprint 3", "status": "open"}]}


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


def test_execute_update_records_retryable_server_error():
    app.dependency_overrides[get_connector] = lambda: FailingConnector(503, "temporary outage")
    try:
        resp = client.post("/api/proposals/update", json={
            "issue_id": 1208,
            "action": "due_date",
            "new_due_date": "2026-07-01",
        })
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 503
    detail = resp.json()["detail"]
    assert detail["category"] == "server"
    assert detail["retryable"] is True
    assert detail["status"] == 503
    assert detail["detail"] == "temporary outage"
    assert detail["log"]["category"] == "server"
    assert detail["log"]["retryable"] is True
    assert detail["log"]["status"] == 503


def test_execute_update_records_non_retryable_validation_error():
    app.dependency_overrides[get_connector] = lambda: FailingConnector(422, "invalid due_date")
    try:
        resp = client.post("/api/proposals/update", json={
            "issue_id": 1208,
            "action": "due_date",
            "new_due_date": "not-a-date",
        })
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 422
    detail = resp.json()["detail"]
    assert detail["category"] == "validation"
    assert detail["retryable"] is False
    assert detail["status"] == 422
    assert detail["log"]["category"] == "validation"
    assert detail["log"]["retryable"] is False


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


@pytest.mark.asyncio
async def test_reference_tools_return_lookup_values():
    connector = ReferenceConnector()

    projects = await execute_tool("list_projects", {}, connector, None)
    statuses = await execute_tool("list_issue_statuses", {}, connector, None)
    priorities = await execute_tool("list_priorities", {}, connector, None)
    users = await execute_tool("list_users", {}, connector, None)
    versions = await execute_tool("list_versions", {"project_id": "mock"}, connector, None)

    assert "Mock Project" in projects
    assert "Closed" in statuses
    assert "Urgent" in priorities
    assert "tanaka" in users
    assert "Sprint 3" in versions


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
