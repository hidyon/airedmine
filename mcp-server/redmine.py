"""Redmine REST API への薄い非同期クライアント。

MCP サーバー専用。backend/services/redmine_connector.py のロジックを踏襲しつつ、
mock 依存を持たず実 Redmine への接続のみを扱う。
"""
import os
from typing import Any

import httpx


class RedmineError(Exception):
    def __init__(self, message: str, status: int = 0):
        super().__init__(message)
        self.status = status


class RedmineClient:
    def __init__(self, base_url: str | None = None, api_key: str | None = None):
        self.base_url = (base_url or os.getenv("REDMINE_BASE_URL") or "").rstrip("/")
        self.api_key = api_key or os.getenv("REDMINE_API_KEY") or ""

    def _ensure_configured(self) -> None:
        missing = []
        if not self.base_url:
            missing.append("REDMINE_BASE_URL")
        if not self.api_key:
            missing.append("REDMINE_API_KEY")
        if missing:
            raise RedmineError(f"環境変数が未設定です: {', '.join(missing)}")

    def _headers(self, write: bool = False) -> dict[str, str]:
        headers = {"Accept": "application/json", "X-Redmine-API-Key": self.api_key}
        if write:
            headers["Content-Type"] = "application/json"
        return headers

    async def _request(self, method: str, path: str, **kwargs) -> httpx.Response:
        self._ensure_configured()
        url = f"{self.base_url}{path}"
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.request(method, url, **kwargs)
        except httpx.RequestError as exc:
            raise RedmineError(f"Redmine への接続に失敗しました: {exc}", 503) from exc
        if resp.status_code == 404:
            raise RedmineError("対象が見つかりません", 404)
        if not resp.is_success:
            raise RedmineError(
                f"Redmine API エラー ({resp.status_code}): {resp.text[:300]}",
                resp.status_code,
            )
        return resp

    async def list_issues(
        self,
        status_id: str = "open",
        assigned_to_id: str | None = None,
        limit: int = 25,
    ) -> dict:
        params: dict[str, str] = {
            "status_id": status_id,
            "limit": str(limit),
            "sort": "updated_on:desc",
        }
        if assigned_to_id:
            params["assigned_to_id"] = assigned_to_id
        resp = await self._request("GET", "/issues.json", params=params, headers=self._headers())
        data = resp.json()
        return {
            "total_count": data.get("total_count", 0),
            "issues": [_summarize(i) for i in data.get("issues", [])],
        }

    async def get_issue(self, issue_id: int) -> dict:
        resp = await self._request(
            "GET",
            f"/issues/{issue_id}.json",
            params={"include": "journals"},
            headers=self._headers(),
        )
        return _detail(resp.json()["issue"])

    async def search_issues(self, query: str, limit: int = 25) -> dict:
        resp = await self._request(
            "GET",
            "/search.json",
            params={"q": query, "issues": "1", "limit": str(limit)},
            headers=self._headers(),
        )
        results = resp.json().get("results", [])
        return {
            "matched": len(results),
            "issues": [
                {"id": r.get("id"), "title": r.get("title"), "url": r.get("url")}
                for r in results
            ],
        }

    async def create_issue(self, fields: dict[str, Any]) -> dict:
        payload = {"issue": {k: v for k, v in fields.items() if v is not None}}
        resp = await self._request(
            "POST", "/issues.json", json=payload, headers=self._headers(write=True)
        )
        issue = resp.json().get("issue", {})
        return {"created": True, "issue": _summarize(issue)}

    async def add_comment(self, issue_id: int, notes: str) -> dict:
        await self._request(
            "PUT",
            f"/issues/{issue_id}.json",
            json={"issue": {"notes": notes}},
            headers=self._headers(write=True),
        )
        return {"updated": True, "issue_id": issue_id}

    async def update_issue(self, issue_id: int, fields: dict[str, Any]) -> dict:
        clean = {k: v for k, v in fields.items() if v is not None}
        await self._request(
            "PUT",
            f"/issues/{issue_id}.json",
            json={"issue": clean},
            headers=self._headers(write=True),
        )
        return {"updated": True, "issue_id": issue_id, "fields": clean}


def _summarize(i: dict) -> dict:
    return {
        "id": i.get("id"),
        "subject": i.get("subject"),
        "status": (i.get("status") or {}).get("name"),
        "priority": (i.get("priority") or {}).get("name"),
        "assigned_to": (i.get("assigned_to") or {}).get("name"),
        "updated_on": i.get("updated_on"),
    }


def _detail(i: dict) -> dict:
    journals = [
        {
            "user": (j.get("user") or {}).get("name"),
            "notes": j["notes"],
            "created_on": j.get("created_on"),
        }
        for j in i.get("journals", [])
        if j.get("notes")
    ]
    return {
        **_summarize(i),
        "project": (i.get("project") or {}).get("name"),
        "description": (i.get("description") or "")[:1500],
        "due_date": i.get("due_date"),
        "journals": journals[-10:],
    }
