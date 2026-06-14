import os
import json
import pytest
import numpy as np
from fastapi.testclient import TestClient

os.environ["DB_PATH"] = "/tmp/test_airedmaine.db"
os.environ["DOCS_ROOT"] = "/project"
os.environ["REDMINE_BASE_URL"] = ""
os.environ["REDMINE_API_KEY"] = ""
os.environ["JWT_SECRET"] = "test-secret"
os.environ["AIREDMINE_DISABLE_WARMUP"] = "1"

from db import get_connection, init_db  # noqa: E402
from main import app  # noqa: E402
from dependencies import get_connector  # noqa: E402
from routers import chat as chat_router  # noqa: E402
from routers import pm as pm_router  # noqa: E402
from services import issue_index  # noqa: E402
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


class TrackingConnector:
    def __init__(self):
        self.updates = []

    async def update_issue(self, issue_id: int, fields: dict) -> dict:
        self.updates.append((issue_id, fields))
        return {"mode": "mock", "issue_id": issue_id, "fields": fields, "updated": True}


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


class FreshnessConnector:
    issues = [
        {"id": 1, "subject": "stale issue", "updated_on": "2026-06-14T00:00:00Z"},
        {"id": 3, "subject": "missing issue", "updated_on": "2026-06-14T00:00:00Z"},
    ]

    async def list_issues(self, query: dict) -> dict:
        offset = int(query.get("offset", 0))
        limit = int(query.get("limit", 100))
        return {
            "issues": self.issues[offset:offset + limit],
            "total_count": len(self.issues),
        }


class DetailIndexConnector:
    async def list_issues(self, query: dict) -> dict:
        return {
            "issues": [
                {
                    "id": 10,
                    "subject": "月次カレンダーの性能劣化を調査する",
                    "tracker": {"name": "Bug"},
                    "status": {"name": "In Progress"},
                    "priority": {"name": "High"},
                    "assigned_to": {"name": "鈴木"},
                    "fixed_version": {"name": "Sprint 3"},
                    "due_date": "2026-06-30",
                    "updated_on": "2026-06-14T00:00:00Z",
                }
            ],
            "total_count": 1,
        }

    async def get_issue_detail(self, issue_id: int) -> dict:
        return {
            "id": issue_id,
            "subject": "月次カレンダーの性能劣化を調査する",
            "tracker": {"name": "Bug"},
            "status": {"name": "In Progress"},
            "priority": {"name": "High"},
            "assigned_to": {"name": "鈴木"},
            "fixed_version": {"name": "Sprint 3"},
            "due_date": "2026-06-30",
            "updated_on": "2026-06-14T00:00:00Z",
            "description": "初期描画が遅く、月末の勤怠確認に支障がある。",
            "journals": [
                {"notes": "古いコメント", "created_on": "2026-06-10T00:00:00Z"},
                {"notes": "原因は isHoliday() を各セルで毎回呼んでいること。", "created_on": "2026-06-11T00:00:00Z"},
            ],
        }


class PmStatsConnector:
    async def list_issues(self, query: dict) -> dict:
        status = query.get("status_id")
        issues = []
        if status == "open":
            issues = [
                {
                    "id": 20,
                    "subject": "遅れている issue",
                    "status": {"name": "In Progress"},
                    "priority": {"name": "High"},
                    "assigned_to": {"name": "鈴木"},
                    "updated_on": "2026-01-01T00:00:00Z",
                    "due_date": "2026-01-05",
                }
            ]
        elif status == "closed":
            issues = [
                {
                    "id": 21,
                    "subject": "完了した issue",
                    "status": {"name": "Closed"},
                    "priority": {"name": "Normal"},
                    "assigned_to": {"name": "佐藤"},
                    "updated_on": "2026-06-14T00:00:00Z",
                }
            ]
        return {"issues": issues, "total_count": len(issues)}


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


def test_ai_index_freshness_reports_stale_orphan_and_missing():
    with get_connection() as conn:
        conn.execute("DELETE FROM issue_embeddings")
        conn.execute(
            """
            INSERT INTO issue_embeddings(issue_id, subject, body, embedding, indexed_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (1, "stale issue", "", b"0", "2000-01-01T00:00:00+00:00"),
        )
        conn.execute(
            """
            INSERT INTO issue_embeddings(issue_id, subject, body, embedding, indexed_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (2, "orphan issue", "", b"0", "2026-06-14T00:00:00+00:00"),
        )
        conn.commit()

    app.dependency_overrides[get_connector] = lambda: FreshnessConnector()
    try:
        resp = client.get("/api/ai/index/freshness")
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200
    data = resp.json()
    assert data["indexed_count"] == 2
    assert data["current_count"] == 2
    assert data["stale_count"] == 1
    assert data["orphan_count"] == 1
    assert data["missing_count"] == 1
    assert data["samples"]["stale"][0]["issue_id"] == 1
    assert data["samples"]["orphan"][0]["issue_id"] == 2
    assert data["samples"]["missing"][0]["issue_id"] == 3


def test_pm_stats_reports_timings_and_cache():
    pm_router._pm_stats_cache = None
    pm_router._pm_stats_cache_at = 0
    app.dependency_overrides[get_connector] = lambda: PmStatsConnector()
    try:
        first = client.get("/api/pm/stats")
        second = client.get("/api/pm/stats")
    finally:
        app.dependency_overrides.clear()
        pm_router._pm_stats_cache = None
        pm_router._pm_stats_cache_at = 0

    assert first.status_code == 200
    first_data = first.json()
    assert first_data["cache"]["hit"] is False
    assert {t["name"] for t in first_data["timings"]} >= {
        "pm.stats.fetch_open",
        "pm.stats.fetch_closed",
        "pm.stats.aggregate",
        "pm.stats.total",
    }
    assert first_data["assignee_load"] == [{"name": "鈴木", "count": 1}]

    assert second.status_code == 200
    second_data = second.json()
    assert second_data["cache"]["hit"] is True
    assert second_data["timings"][0]["name"] == "pm.stats.cache_hit"


@pytest.mark.asyncio
async def test_build_index_stores_description_and_recent_comments(monkeypatch):
    with get_connection() as conn:
        conn.execute("DELETE FROM issue_embeddings")
        conn.commit()

    monkeypatch.setattr(issue_index, "encode", lambda texts: [np.array([1.0, 0.0], dtype=np.float32) for _ in texts])
    timings = []

    built = await issue_index.build_index(DetailIndexConnector(), force=True, timings=timings)

    assert built == 1
    assert any(t["name"] == "semantic.build.fetch_issue_details" for t in timings)
    with get_connection() as conn:
        row = conn.execute("SELECT subject, body FROM issue_embeddings WHERE issue_id = 10").fetchone()

    assert row["subject"] == "月次カレンダーの性能劣化を調査する"
    assert "説明:" in row["body"]
    assert "初期描画が遅く" in row["body"]
    assert "直近コメント:" in row["body"]
    assert "isHoliday()" in row["body"]
    assert "担当: 鈴木" in row["body"]
    assert "バージョン: Sprint 3" in row["body"]
    assert "期日: 2026-06-30" in row["body"]


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
    assert "session_id" in data
    assert "references" in data
    assert isinstance(data["references"], list)


def test_chat_sessions_list_and_detail(monkeypatch):
    with get_connection() as conn:
        conn.execute("DELETE FROM conversations")
        conn.execute("DELETE FROM chat_sessions")
        conn.commit()

    monkeypatch.setattr(chat_router, "run_agent", _fake_run_agent)
    first = client.post("/api/chat", json={
        "question": "今日まず何からやればいい？",
        "session_id": "session-alpha",
        "role": "developer",
    })
    second = client.post("/api/chat", json={
        "question": "PM判断待ちをまとめて",
        "session_id": "session-beta",
        "role": "pm",
    })

    assert first.status_code == 200
    assert first.json()["session_id"] == "session-alpha"
    assert second.status_code == 200

    sessions = client.get("/api/chat/sessions").json()["sessions"]
    session_ids = [s["session_id"] for s in sessions]
    assert session_ids == ["session-beta", "session-alpha"]
    alpha = next(s for s in sessions if s["session_id"] == "session-alpha")
    assert alpha["title"] == "今日まず何からやればいい？"
    assert alpha["role"] == "developer"
    assert alpha["message_count"] == 2
    assert alpha["related_issue_ids"] == []
    assert alpha["last_proposal_action"] is None

    detail = client.get("/api/chat/sessions/session-alpha")
    assert detail.status_code == 200
    data = detail.json()
    assert data["session"]["session_id"] == "session-alpha"
    assert [m["role"] for m in data["messages"]] == ["user", "assistant"]
    assert data["messages"][0]["content"] == "今日まず何からやればいい？"
    assert data["messages"][0]["payload"] is None
    assert data["messages"][1]["content"] == "今日の優先候補を確認しました。"
    assert data["messages"][1]["payload"]["answer"] == "今日の優先候補を確認しました。"

    missing = client.get("/api/chat/sessions/missing")
    assert missing.status_code == 404


def test_chat_session_detail_restores_assistant_payload(monkeypatch):
    with get_connection() as conn:
        conn.execute("DELETE FROM conversations")
        conn.execute("DELETE FROM chat_sessions")
        conn.commit()

    monkeypatch.setattr(chat_router, "run_agent", _fake_run_agent)
    resp = client.post("/api/chat", json={
        "question": "#1208 にコメントを追加して: 確認済みです",
        "session_id": "session-proposal",
        "role": "developer",
    })
    assert resp.status_code == 200

    detail = client.get("/api/chat/sessions/session-proposal")
    assert detail.status_code == 200
    messages = detail.json()["messages"]
    assistant = messages[1]
    assert assistant["role"] == "assistant"
    assert assistant["content"] == "確認待ちの提案を作成しました。"
    assert assistant["payload"]["session_id"] == "session-proposal"
    assert assistant["payload"]["proposal"]["action"] == "comment"
    assert assistant["payload"]["proposal"]["issue_id"] == 1208


def test_chat_session_list_summarizes_payload_metadata(monkeypatch):
    with get_connection() as conn:
        conn.execute("DELETE FROM conversations")
        conn.execute("DELETE FROM chat_sessions")
        conn.commit()

    async def fake_agent(question, messages, role, connector, **kwargs):
        if "proposal" in question:
            return {
                "answer": "確認待ちの提案を作成しました。",
                "references": [{"type": "issue", "id": 1358, "title": "関連 issue"}],
                "clarification": None,
                "proposal": {
                    "status": "confirmation_required",
                    "action": "bulk_update",
                    "issue_ids": [1208, 1358],
                    "change_summary": "2 件を Feedback にします",
                    "draft": "",
                    "reason": "確認待ちを揃える",
                },
            }
        return {
            "answer": "#1401 を確認しました。",
            "references": [{"type": "issue", "id": 1401, "title": "参照 issue"}],
            "clarification": None,
            "proposal": None,
        }

    monkeypatch.setattr(chat_router, "run_agent", fake_agent)
    proposal = client.post("/api/chat", json={
        "question": "proposal session",
        "session_id": "session-with-proposal",
    })
    reference = client.post("/api/chat", json={
        "question": "reference session",
        "session_id": "session-with-reference",
    })
    assert proposal.status_code == 200
    assert reference.status_code == 200

    sessions = client.get("/api/chat/sessions").json()["sessions"]
    by_id = {session["session_id"]: session for session in sessions}
    assert by_id["session-with-proposal"]["related_issue_ids"] == [1208, 1358]
    assert by_id["session-with-proposal"]["last_proposal_action"] == "bulk_update"
    assert by_id["session-with-reference"]["related_issue_ids"] == [1401]
    assert by_id["session-with-reference"]["last_proposal_action"] is None


def test_chat_uses_stored_session_context(monkeypatch):
    with get_connection() as conn:
        conn.execute("DELETE FROM conversations")
        conn.execute("DELETE FROM chat_sessions")
        conn.execute(
            "INSERT INTO chat_sessions(session_id, title, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            ("ctx-a", "ctx", "developer", "2026-06-14T00:00:00+00:00", "2026-06-14T00:00:00+00:00"),
        )
        conn.execute(
            "INSERT INTO chat_sessions(session_id, title, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            ("ctx-b", "other", "developer", "2026-06-14T00:00:00+00:00", "2026-06-14T00:00:00+00:00"),
        )
        conn.execute(
            "INSERT INTO conversations(session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
            ("ctx-a", "user", "前回の質問", "2026-06-14T00:00:00+00:00"),
        )
        conn.execute(
            "INSERT INTO conversations(session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
            ("ctx-a", "assistant", "前回の回答", "2026-06-14T00:00:01+00:00"),
        )
        conn.execute(
            "INSERT INTO conversations(session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
            ("ctx-b", "user", "別セッションの質問", "2026-06-14T00:00:00+00:00"),
        )
        conn.commit()

    captured = {}

    async def fake_agent(question, messages, role, connector, **kwargs):
        captured["messages"] = messages
        return {"answer": "文脈を確認しました。", "references": [], "clarification": None, "proposal": None}

    monkeypatch.setattr(chat_router, "run_agent", fake_agent)
    resp = client.post("/api/chat", json={
        "question": "続きは？",
        "session_id": "ctx-a",
        "messages": [{"role": "user", "content": "frontend fallback"}],
    })

    assert resp.status_code == 200
    assert captured["messages"] == [
        {"role": "user", "content": "前回の質問"},
        {"role": "assistant", "content": "前回の回答"},
    ]
    assert all("別セッション" not in m["content"] for m in captured["messages"])


def test_chat_context_is_trimmed(monkeypatch):
    with get_connection() as conn:
        conn.execute("DELETE FROM conversations")
        conn.execute("DELETE FROM chat_sessions")
        conn.execute(
            "INSERT INTO chat_sessions(session_id, title, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            ("ctx-long", "long", "developer", "2026-06-14T00:00:00+00:00", "2026-06-14T00:00:00+00:00"),
        )
        for i in range(14):
            conn.execute(
                "INSERT INTO conversations(session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
                (
                    "ctx-long",
                    "user" if i % 2 == 0 else "assistant",
                    f"message-{i}",
                    f"2026-06-14T00:00:{i:02d}+00:00",
                ),
            )
        conn.commit()

    captured = {}

    async def fake_agent(question, messages, role, connector, **kwargs):
        captured["messages"] = messages
        return {"answer": "trimmed", "references": [], "clarification": None, "proposal": None}

    monkeypatch.setattr(chat_router, "run_agent", fake_agent)
    resp = client.post("/api/chat", json={"question": "続き", "session_id": "ctx-long"})

    assert resp.status_code == 200
    assert len(captured["messages"]) == chat_router.MAX_CONTEXT_MESSAGES
    assert captured["messages"][0]["content"] == "message-4"
    assert captured["messages"][-1]["content"] == "message-13"


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


def test_execute_bulk_status_update_mock():
    connector = TrackingConnector()
    app.dependency_overrides[get_connector] = lambda: connector
    try:
        resp = client.post("/api/proposals/bulk_update", json={
            "issue_ids": [1208, 1207, 1208],
            "action": "status_change",
            "new_status_id": 3,
            "new_status_name": "Feedback",
            "reason": "停滞 issue を確認待ちに戻す",
        })
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200
    data = resp.json()
    assert data["issue_ids"] == [1208, 1207]
    assert data["fields"] == {"status_id": 3}
    assert connector.updates == [
        (1208, {"status_id": 3}),
        (1207, {"status_id": 3}),
    ]
    assert data["log"]["action"] == "bulk_status_change"


def test_execute_bulk_update_rejects_more_than_20():
    resp = client.post("/api/proposals/bulk_update", json={
        "issue_ids": list(range(1, 22)),
        "action": "assignee_change",
        "new_assigned_to_id": 5,
    })
    assert resp.status_code == 400
    assert resp.json()["detail"]["category"] == "validation"


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


@pytest.mark.asyncio
async def test_bulk_update_tool_returns_confirmation_and_rejects_large_sets():
    connector = ReferenceConnector()

    proposal = json.loads(await execute_tool("bulk_update", {
        "issue_ids": [1208, 1207, 1208],
        "action": "assignee_change",
        "new_assigned_to_id": 5,
        "new_assigned_to_name": "田中 健太",
    }, connector, None))
    too_many = json.loads(await execute_tool("bulk_update", {
        "issue_ids": list(range(1, 22)),
        "action": "status_change",
        "new_status_id": 3,
        "new_status_name": "Feedback",
    }, connector, None))

    assert proposal["confirmation_required"] is True
    assert proposal["issue_ids"] == [1208, 1207]
    assert proposal["action"] == "assignee_change"
    assert "20 件以下" in too_many["error"]


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
