"""Redmine REST API への薄い非同期クライアント。

MCP サーバー専用。backend/services/redmine_connector.py のロジックを踏襲しつつ、
mock 依存を持たず実 Redmine への接続のみを扱う。
"""
import os
from typing import Any

import httpx

from identity import current_switch_user


def _switch_user_enabled() -> bool:
    return os.getenv("REDMINE_SWITCH_USER", "").lower() in ("1", "true", "yes")


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
        # HTTP モード: 認証ユーザーとして操作する（API キーは admin 権限が前提）。
        # stdio モードでは解決結果が None なので従来どおり単一キーで動く。
        if _switch_user_enabled():
            login = current_switch_user()
            if login:
                headers["X-Redmine-Switch-User"] = login
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
        offset: int = 0,
        sort: str = "updated_on:desc",
    ) -> dict:
        params: dict[str, str] = {
            "status_id": status_id,
            "limit": str(limit),
            "sort": sort,
        }
        if assigned_to_id:
            params["assigned_to_id"] = assigned_to_id
        if offset:
            params["offset"] = str(offset)
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

    async def list_projects(self, limit: int = 100) -> dict:
        resp = await self._request(
            "GET", "/projects.json", params={"limit": str(limit)}, headers=self._headers()
        )
        data = resp.json()
        return {
            "total_count": data.get("total_count", 0),
            "projects": [
                {"id": p.get("id"), "identifier": p.get("identifier"), "name": p.get("name")}
                for p in data.get("projects", [])
            ],
        }

    async def list_issue_statuses(self) -> dict:
        resp = await self._request("GET", "/issue_statuses.json", headers=self._headers())
        return {
            "statuses": [
                {"id": s.get("id"), "name": s.get("name"), "is_closed": bool(s.get("is_closed"))}
                for s in resp.json().get("issue_statuses", [])
            ]
        }

    async def list_priorities(self) -> dict:
        resp = await self._request(
            "GET", "/enumerations/issue_priorities.json", headers=self._headers()
        )
        return {
            "priorities": [
                {"id": p.get("id"), "name": p.get("name")}
                for p in resp.json().get("issue_priorities", [])
            ]
        }

    async def list_users(self, limit: int = 100) -> dict:
        try:
            resp = await self._request(
                "GET", "/users.json", params={"limit": str(limit)}, headers=self._headers()
            )
        except RedmineError as exc:
            if exc.status in (401, 403):
                raise RedmineError(
                    "ユーザー一覧の取得には管理者権限の API キーが必要です", exc.status
                ) from exc
            raise
        return {
            "users": [
                {
                    "id": u.get("id"),
                    "login": u.get("login"),
                    "name": f"{u.get('firstname', '')} {u.get('lastname', '')}".strip(),
                }
                for u in resp.json().get("users", [])
            ]
        }

    async def list_versions(self, project_id: str) -> dict:
        resp = await self._request(
            "GET", f"/projects/{project_id}/versions.json", headers=self._headers()
        )
        return {
            "versions": [
                {
                    "id": v.get("id"),
                    "name": v.get("name"),
                    "status": v.get("status"),
                    "due_date": v.get("due_date"),
                }
                for v in resp.json().get("versions", [])
            ]
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

    async def add_relation(
        self, issue_id: int, related_issue_id: int, relation_type: str = "relates"
    ) -> dict:
        resp = await self._request(
            "POST",
            f"/issues/{issue_id}/relations.json",
            json={"relation": {"issue_to_id": related_issue_id, "relation_type": relation_type}},
            headers=self._headers(write=True),
        )
        rel = resp.json().get("relation", {})
        return {
            "created": True,
            "relation": {
                "id": rel.get("id"),
                "issue_id": rel.get("issue_id"),
                "issue_to_id": rel.get("issue_to_id"),
                "relation_type": rel.get("relation_type"),
            },
        }

    async def update_issue(self, issue_id: int, fields: dict[str, Any]) -> dict:
        clean = {k: v for k, v in fields.items() if v is not None}
        await self._request(
            "PUT",
            f"/issues/{issue_id}.json",
            json={"issue": clean},
            headers=self._headers(write=True),
        )
        return {"updated": True, "issue_id": issue_id, "fields": clean}


# backend/services/redmine_connector.py の _normalize_issue と同じ形状を返す
# （生のネスト objects を保持）。これにより backend が MCP をツール源に一本化しても、
# PM 集計・バーンダウン・issue 詳細がそのまま計算できる。
def _summarize(i: dict) -> dict:
    return {
        "id": i.get("id"),
        "subject": i.get("subject", ""),
        "project": i.get("project"),
        "tracker": i.get("tracker"),
        "status": i.get("status"),
        "priority": i.get("priority"),
        "assigned_to": i.get("assigned_to"),
        "fixed_version": i.get("fixed_version"),
        "due_date": i.get("due_date"),
        "updated_on": i.get("updated_on"),
    }


def _detail(i: dict) -> dict:
    return {
        **_summarize(i),
        "description": i.get("description", ""),
        "journals": [
            {
                "id": j["id"],
                "user": j.get("user"),
                "notes": j.get("notes", ""),
                "created_on": j.get("created_on"),
            }
            for j in i.get("journals", [])
            if j.get("notes")
        ],
    }
