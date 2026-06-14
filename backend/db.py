import os
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(os.getenv("DB_PATH", "/app/data/airedmaine.db"))


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS experience_notes (
                id          TEXT PRIMARY KEY,
                created_at  TEXT NOT NULL,
                role        TEXT NOT NULL,
                moment      TEXT NOT NULL,
                signal      TEXT NOT NULL,
                note        TEXT NOT NULL,
                next_action TEXT NOT NULL DEFAULT ''
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role       TEXT NOT NULL,
                content    TEXT NOT NULL,
                payload    TEXT,
                created_at TEXT NOT NULL
            )
        """)
        try:
            conn.execute("ALTER TABLE conversations ADD COLUMN payload TEXT")
        except Exception:
            pass  # column already exists
        conn.execute("CREATE INDEX IF NOT EXISTS idx_conv_session ON conversations(session_id)")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                session_id    TEXT PRIMARY KEY,
                title         TEXT NOT NULL,
                role          TEXT NOT NULL,
                created_at    TEXT NOT NULL,
                updated_at    TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at)")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS issue_embeddings (
                issue_id   INTEGER PRIMARY KEY,
                subject    TEXT NOT NULL,
                body       TEXT NOT NULL DEFAULT '',
                embedding  BLOB NOT NULL,
                indexed_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                username        TEXT NOT NULL UNIQUE,
                display_name    TEXT NOT NULL,
                role            TEXT NOT NULL CHECK(role IN ('developer', 'pm')),
                redmine_user_id INTEGER,
                created_at      TEXT NOT NULL
            )
        """)
        try:
            conn.execute("ALTER TABLE users ADD COLUMN redmine_user_id INTEGER")
        except Exception:
            pass  # column already exists
        conn.commit()


def get_all_users() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT username, display_name, role, redmine_user_id FROM users ORDER BY id"
        ).fetchall()
    return [dict(r) for r in rows]


def upsert_chat_session(session_id: str, title: str, role: str) -> None:
    now = _now()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO chat_sessions(session_id, title, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                updated_at=excluded.updated_at,
                role=excluded.role
            """,
            (session_id, title, role, now, now),
        )
        conn.commit()


def update_chat_session_title(session_id: str, title: str) -> bool:
    with get_connection() as conn:
        result = conn.execute(
            """
            UPDATE chat_sessions
            SET title = ?, updated_at = ?
            WHERE session_id = ?
            """,
            (title, _now(), session_id),
        )
        conn.commit()
    return result.rowcount > 0


def add_conversation_message(session_id: str, role: str, content: str, payload: dict | None = None) -> None:
    payload_text = json.dumps(payload, ensure_ascii=False, default=str) if payload is not None else None
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO conversations(session_id, role, content, payload, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (session_id, role, content, payload_text, _now()),
        )
        conn.commit()


def list_chat_sessions(limit: int = 50) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                s.session_id,
                s.title,
                s.role,
                s.created_at,
                s.updated_at,
                COUNT(c.id) AS message_count
            FROM chat_sessions s
            LEFT JOIN conversations c ON c.session_id = s.session_id
            GROUP BY s.session_id
            ORDER BY s.updated_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    sessions = [dict(r) for r in rows]
    for session in sessions:
        session.update(_session_payload_summary(session["session_id"]))
    return sessions


def get_chat_session(session_id: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT
                s.session_id,
                s.title,
                s.role,
                s.created_at,
                s.updated_at,
                COUNT(c.id) AS message_count
            FROM chat_sessions s
            LEFT JOIN conversations c ON c.session_id = s.session_id
            WHERE s.session_id = ?
            GROUP BY s.session_id
            """,
            (session_id,),
        ).fetchone()
    if not row:
        return None
    session = dict(row)
    session.update(_session_payload_summary(session_id))
    return session


def get_conversation_messages(session_id: str) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, role, content, payload, created_at
            FROM conversations
            WHERE session_id = ?
            ORDER BY id ASC
            """,
            (session_id,),
        ).fetchall()
    return [_conversation_row(r) for r in rows]


def _conversation_row(row: sqlite3.Row) -> dict:
    result = dict(row)
    payload = result.get("payload")
    if not payload:
        result["payload"] = None
        return result
    try:
        result["payload"] = json.loads(payload)
    except json.JSONDecodeError:
        result["payload"] = None
    return result


def _session_payload_summary(session_id: str) -> dict:
    messages = get_conversation_messages(session_id)
    issue_ids: list[int] = []
    last_proposal_action: str | None = None

    for message in messages:
        payload = message.get("payload")
        if not isinstance(payload, dict):
            continue
        for issue_id in _payload_issue_ids(payload):
            if issue_id not in issue_ids:
                issue_ids.append(issue_id)
        proposal = payload.get("proposal")
        if isinstance(proposal, dict) and proposal.get("action"):
            last_proposal_action = str(proposal["action"])

    return {
        "related_issue_ids": issue_ids[:5],
        "last_proposal_action": last_proposal_action,
    }


def _payload_issue_ids(payload: dict) -> list[int]:
    issue_ids: list[int] = []

    proposal = payload.get("proposal")
    if isinstance(proposal, dict):
        _append_issue_id(issue_ids, proposal.get("issue_id"))
        _append_issue_id(issue_ids, (proposal.get("target_issue") or {}).get("id"))
        _append_issue_id(issue_ids, proposal.get("related_issue_id"))
        for issue_id in proposal.get("issue_ids") or []:
            _append_issue_id(issue_ids, issue_id)
        for target in proposal.get("issue_targets") or []:
            if isinstance(target, dict):
                _append_issue_id(issue_ids, target.get("id"))

    for ref in payload.get("references") or []:
        if isinstance(ref, dict) and ref.get("type") == "issue":
            _append_issue_id(issue_ids, ref.get("id"))

    return issue_ids


def _append_issue_id(issue_ids: list[int], value: object) -> None:
    try:
        issue_id = int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return
    if issue_id > 0 and issue_id not in issue_ids:
        issue_ids.append(issue_id)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
