"""Semantic issue index: build embeddings from Redmine issues and search by meaning."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import numpy as np

from db import get_connection
from services.embedder import encode, encode_one, to_blob, from_blob, cosine_similarity_matrix, is_model_loaded


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def index_count() -> int:
    with get_connection() as conn:
        row = conn.execute("SELECT COUNT(*) FROM issue_embeddings").fetchone()
    return row[0] if row else 0


def index_summary() -> dict:
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT
                COUNT(*) AS count,
                MIN(issue_id) AS min_issue_id,
                MAX(issue_id) AS max_issue_id,
                MIN(indexed_at) AS oldest_indexed_at,
                MAX(indexed_at) AS newest_indexed_at
            FROM issue_embeddings
            """
        ).fetchone()
    return dict(row) if row else {
        "count": 0,
        "min_issue_id": None,
        "max_issue_id": None,
        "oldest_indexed_at": None,
        "newest_indexed_at": None,
    }


async def freshness_report(connector: Any, sample_limit: int = 10) -> dict:
    issues = await _fetch_all_issues(connector)
    current_by_id = {int(issue["id"]): issue for issue in issues if issue.get("id") is not None}

    with get_connection() as conn:
        rows = conn.execute(
            "SELECT issue_id, subject, indexed_at FROM issue_embeddings ORDER BY issue_id"
        ).fetchall()

    indexed_by_id = {int(row["issue_id"]): dict(row) for row in rows}
    stale = []
    fresh = 0

    for issue_id, indexed in indexed_by_id.items():
        current = current_by_id.get(issue_id)
        if not current:
            continue
        current_updated = current.get("updated_on")
        if current_updated and _parse_iso(current_updated) > _parse_iso(indexed["indexed_at"]):
            stale.append({
                "issue_id": issue_id,
                "indexed_subject": indexed["subject"],
                "current_subject": current.get("subject"),
                "indexed_at": indexed["indexed_at"],
                "updated_on": current_updated,
            })
        else:
            fresh += 1

    orphan = [
        {
            "issue_id": issue_id,
            "subject": indexed["subject"],
            "indexed_at": indexed["indexed_at"],
        }
        for issue_id, indexed in indexed_by_id.items()
        if issue_id not in current_by_id
    ]
    missing = [
        {
            "issue_id": issue_id,
            "subject": issue.get("subject"),
            "updated_on": issue.get("updated_on"),
        }
        for issue_id, issue in current_by_id.items()
        if issue_id not in indexed_by_id
    ]

    return {
        "ready": bool(indexed_by_id),
        "indexed_count": len(indexed_by_id),
        "current_count": len(current_by_id),
        "fresh_count": fresh,
        "stale_count": len(stale),
        "orphan_count": len(orphan),
        "missing_count": len(missing),
        "oldest_indexed_at": min((row["indexed_at"] for row in indexed_by_id.values()), default=None),
        "newest_indexed_at": max((row["indexed_at"] for row in indexed_by_id.values()), default=None),
        "samples": {
            "stale": stale[:sample_limit],
            "orphan": orphan[:sample_limit],
            "missing": missing[:sample_limit],
        },
    }


async def _fetch_all_issues(connector: Any) -> list[dict]:
    """ページネーションで全 issue を取得する。"""
    all_issues: list[dict] = []
    offset = 0
    page_size = 100
    while True:
        result = await connector.list_issues({
            "status_id": "*",
            "limit": page_size,
            "offset": offset,
        })
        page = result.get("issues", [])
        all_issues.extend(page)
        total = result.get("total_count", 0)
        offset += len(page)
        if offset >= total or not page:
            break
    return all_issues


async def _fetch_index_issues(
    connector: Any,
    issues: list[dict],
    timings: list[dict] | None = None,
) -> list[dict]:
    if not hasattr(connector, "get_issue_detail"):
        return issues

    started = datetime.now(timezone.utc)
    detailed: list[dict] = []
    for issue in issues:
        detail = await connector.get_issue_detail(issue["id"])
        detailed.append(detail or issue)
    _append_timing(timings, "semantic.build.fetch_issue_details", started, {"count": len(detailed)})
    return detailed


async def build_index(connector: Any, force: bool = False, timings: list[dict] | None = None) -> int:
    """
    Redmine から全 issue を取得して埋め込みインデックスを構築する。
    force=True の場合は既存のエントリを洗い替える。
    force=False の場合はインデックスが空のときのみ実行。
    Returns: 登録件数
    """
    if not force and index_count() > 0:
        return index_count()

    started = datetime.now(timezone.utc)
    issues = await _fetch_all_issues(connector)
    _append_timing(timings, "semantic.build.fetch_issues", started)
    if not issues:
        return 0
    issues = await _fetch_index_issues(connector, issues, timings)

    texts = [_issue_text(i) for i in issues]
    model_was_loaded = is_model_loaded()
    started = datetime.now(timezone.utc)
    embeddings = encode(texts)
    _append_timing(timings, "semantic.build.encode", started, {"model_was_loaded": model_was_loaded})

    now = _now()
    started = datetime.now(timezone.utc)
    with get_connection() as conn:
        if force:
            conn.execute("DELETE FROM issue_embeddings")
        for issue, vec in zip(issues, embeddings):
            conn.execute(
                """
                INSERT INTO issue_embeddings (issue_id, subject, body, embedding, indexed_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(issue_id) DO UPDATE SET
                    subject=excluded.subject,
                    body=excluded.body,
                    embedding=excluded.embedding,
                    indexed_at=excluded.indexed_at
                """,
                (
                    issue["id"],
                    issue.get("subject") or "",
                    _issue_body(issue),
                    to_blob(vec),
                    now,
                ),
            )
        conn.commit()
    _append_timing(timings, "semantic.build.write_db", started, {"count": len(issues)})

    return len(issues)


def search(query: str, top_k: int = 10, timings: list[dict] | None = None) -> list[dict]:
    """
    クエリに意味的に近い issue を返す。
    インデックスが空の場合は空リストを返す。
    """
    started = datetime.now(timezone.utc)
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT issue_id, subject, body, embedding FROM issue_embeddings"
        ).fetchall()
    _append_timing(timings, "semantic.search.read_db", started, {"rows": len(rows)})

    if not rows:
        return []

    started = datetime.now(timezone.utc)
    ids = [r["issue_id"] for r in rows]
    subjects = [r["subject"] for r in rows]
    matrix = np.stack([from_blob(r["embedding"]) for r in rows])
    _append_timing(timings, "semantic.search.decode_embeddings", started, {"rows": len(rows)})

    model_was_loaded = is_model_loaded()
    started = datetime.now(timezone.utc)
    q_vec = encode_one(query)
    _append_timing(timings, "semantic.search.encode_query", started, {"model_was_loaded": model_was_loaded})

    started = datetime.now(timezone.utc)
    scores = cosine_similarity_matrix(q_vec, matrix)

    top_indices = np.argsort(scores)[::-1][:top_k]
    results = [
        {
            "id": ids[i],
            "subject": subjects[i],
            "score": float(scores[i]),
        }
        for i in top_indices
        if scores[i] > 0.3  # 類似度が低すぎるものは除外
    ]
    _append_timing(timings, "semantic.search.rank", started, {"matched": len(results)})
    return results


def _append_timing(timings: list[dict] | None, name: str, started: datetime, extra: dict | None = None) -> None:
    if timings is None:
        return
    elapsed = datetime.now(timezone.utc) - started
    timings.append({
        "name": name,
        "duration_ms": round(elapsed.total_seconds() * 1000, 1),
        **(extra or {}),
    })


def _issue_text(issue: dict) -> str:
    """埋め込みのテキスト表現。"""
    sections = [
        _field_line("件名", issue.get("subject")),
        _field_line("種別", _named(issue.get("tracker"))),
        _field_line("状態", _named(issue.get("status"))),
        _field_line("優先度", _named(issue.get("priority"))),
        _field_line("担当", _named(issue.get("assigned_to"))),
        _field_line("バージョン", _named(issue.get("fixed_version"))),
        _field_line("期日", issue.get("due_date")),
    ]
    description = _truncate(issue.get("description") or "", 1200)
    if description:
        sections.extend(["", "説明:", description])

    comments = _recent_comment_lines(issue.get("journals") or [])
    if comments:
        sections.extend(["", "直近コメント:", *comments])

    return "\n".join(part for part in sections if part is not None).strip()


def _issue_body(issue: dict) -> str:
    return _issue_text(issue)


def _parse_iso(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _named(value: dict | None) -> str:
    return (value or {}).get("name") or ""


def _field_line(label: str, value: Any) -> str | None:
    text = str(value or "").strip()
    return f"{label}: {text}" if text else None


def _recent_comment_lines(journals: list[dict], limit: int = 5) -> list[str]:
    lines = []
    budget = 2000
    for journal in [j for j in journals if j.get("notes")][-limit:]:
        note = _truncate(journal.get("notes") or "", min(400, budget))
        if not note:
            continue
        prefix = journal.get("created_on") or "date unknown"
        line = f"- {prefix}: {note}"
        lines.append(line)
        budget -= len(note)
        if budget <= 0:
            break
    return lines


def _truncate(value: str, limit: int) -> str:
    text = " ".join(value.split())
    if len(text) <= limit:
        return text
    return text[:limit].rstrip() + "..."
