"""Semantic issue index: build embeddings from Redmine issues and search by meaning."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import numpy as np

from db import get_connection
from services.embedder import encode, encode_one, to_blob, from_blob, cosine_similarity_matrix


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def index_count() -> int:
    with get_connection() as conn:
        row = conn.execute("SELECT COUNT(*) FROM issue_embeddings").fetchone()
        return row[0] if row else 0


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


async def build_index(connector: Any, force: bool = False) -> int:
    """
    Redmine から全 issue を取得して埋め込みインデックスを構築する。
    既存のエントリは上書きする。force=False の場合はインデックスが空のときのみ実行。
    Returns: 登録件数
    """
    if not force and index_count() > 0:
        return index_count()

    issues = await _fetch_all_issues(connector)
    if not issues:
        return 0

    texts = [_issue_text(i) for i in issues]
    embeddings = encode(texts)

    now = _now()
    with get_connection() as conn:
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

    return len(issues)


def search(query: str, top_k: int = 10) -> list[dict]:
    """
    クエリに意味的に近い issue を返す。
    インデックスが空の場合は空リストを返す。
    """
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT issue_id, subject, body, embedding FROM issue_embeddings"
        ).fetchall()

    if not rows:
        return []

    ids = [r["issue_id"] for r in rows]
    subjects = [r["subject"] for r in rows]
    matrix = np.stack([from_blob(r["embedding"]) for r in rows])

    q_vec = encode_one(query)
    scores = cosine_similarity_matrix(q_vec, matrix)

    top_indices = np.argsort(scores)[::-1][:top_k]
    return [
        {
            "id": ids[i],
            "subject": subjects[i],
            "score": float(scores[i]),
        }
        for i in top_indices
        if scores[i] > 0.3  # 類似度が低すぎるものは除外
    ]


def _issue_text(issue: dict) -> str:
    """埋め込みのテキスト表現（件名 + ステータス + 優先度）。"""
    parts = [issue.get("subject") or ""]
    status = (issue.get("status") or {}).get("name")
    priority = (issue.get("priority") or {}).get("name")
    if status:
        parts.append(status)
    if priority:
        parts.append(priority)
    return " ".join(parts)


def _issue_body(issue: dict) -> str:
    status = (issue.get("status") or {}).get("name") or ""
    priority = (issue.get("priority") or {}).get("name") or ""
    return f"{status} {priority}".strip()
