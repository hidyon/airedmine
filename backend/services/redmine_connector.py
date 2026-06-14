import os
from typing import Any
import httpx

from mock.mock_redmine import list_mock_issues, get_mock_issue_detail


class RedmineApiError(Exception):
    def __init__(self, message: str, status: int, body: str = "", content_type: str = "text/plain"):
        super().__init__(message)
        self.status = status
        self.body = body
        self.content_type = content_type


class RedmineConnector:
    def __init__(self, base_url: str | None = None, api_key: str | None = None):
        self._base_url = (base_url or "").rstrip("/")
        self._api_key = api_key or ""

    @property
    def is_connected(self) -> bool:
        return bool(self._base_url and self._api_key)

    @property
    def mode(self) -> str:
        return "redmine" if self.is_connected else "mock"

    @property
    def base_url(self) -> str | None:
        return self._base_url or None

    @property
    def missing(self) -> list[str]:
        result = []
        if not self._base_url:
            result.append("REDMINE_BASE_URL")
        if not self._api_key:
            result.append("REDMINE_API_KEY")
        return result

    def _headers(self) -> dict[str, str]:
        return {"Accept": "application/json", "X-Redmine-API-Key": self._api_key}

    async def list_issues(self, params: dict[str, Any]) -> dict:
        if not self.is_connected:
            return list_mock_issues(params)

        query: dict[str, str] = {
            "status_id": params.get("status_id", "open"),
            "limit": str(params.get("limit", 100)),
            "sort": params.get("sort", "updated_on:desc"),
        }
        assigned = params.get("assigned_to_id", "")
        if assigned:
            query["assigned_to_id"] = assigned
        offset = params.get("offset", 0)
        if offset:
            query["offset"] = str(offset)
        url = f"{self._base_url}/issues.json"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params=query, headers=self._headers(), timeout=10)
        except httpx.RequestError as exc:
            raise RedmineApiError("Redmine connection error", 503, str(exc)) from exc

        if not resp.is_success:
            raise RedmineApiError(f"Redmine API error: {resp.status_code}", resp.status_code, resp.text, resp.headers.get("content-type", ""))

        data = resp.json()
        return {
            "issues": [_normalize_issue(i) for i in data.get("issues", [])],
            "total_count": data.get("total_count", 0),
            "offset": data.get("offset", 0),
            "limit": data.get("limit", int(query["limit"])),
        }

    async def get_issue_detail(self, issue_id: int) -> dict | None:
        if not self.is_connected:
            return get_mock_issue_detail(issue_id)

        url = f"{self._base_url}/issues/{issue_id}.json"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params={"include": "journals"}, headers=self._headers(), timeout=10)
        except httpx.RequestError as exc:
            raise RedmineApiError("Redmine connection error", 503, str(exc)) from exc

        if resp.status_code == 404:
            return None
        if not resp.is_success:
            raise RedmineApiError(f"Redmine API error: {resp.status_code}", resp.status_code, resp.text)

        return _normalize_issue_detail(resp.json()["issue"])

    async def add_issue_comment(self, issue_id: int, notes: str) -> dict:
        if not self.is_connected:
            return {"mode": "mock", "issue_id": issue_id, "notes": notes, "updated": True}

        url = f"{self._base_url}/issues/{issue_id}.json"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.put(url, json={"issue": {"notes": notes}}, headers={**self._headers(), "Content-Type": "application/json"}, timeout=10)
        except httpx.RequestError as exc:
            raise RedmineApiError("Redmine connection error", 503, str(exc)) from exc

        if not resp.is_success:
            raise RedmineApiError(f"Redmine API error: {resp.status_code}", resp.status_code, resp.text)

        return {"mode": "redmine", "issue_id": issue_id, "updated": True}

    async def list_projects(self) -> dict:
        if not self.is_connected:
            return {"projects": [{"id": 1, "identifier": "mock", "name": "Mock Project"}], "total_count": 1}
        url = f"{self._base_url}/projects.json"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params={"limit": "100"}, headers=self._headers(), timeout=10)
        except httpx.RequestError as exc:
            raise RedmineApiError("Redmine connection error", 503, str(exc)) from exc
        if not resp.is_success:
            raise RedmineApiError(f"Redmine API error: {resp.status_code}", resp.status_code, resp.text)
        data = resp.json()
        return {
            "projects": [
                {"id": p.get("id"), "identifier": p.get("identifier"), "name": p.get("name")}
                for p in data.get("projects", [])
            ],
            "total_count": data.get("total_count", 0),
        }

    async def list_issue_statuses(self) -> dict:
        if not self.is_connected:
            return {"statuses": [
                {"id": 1, "name": "New", "is_closed": False},
                {"id": 2, "name": "In Progress", "is_closed": False},
                {"id": 3, "name": "Feedback", "is_closed": False},
                {"id": 4, "name": "Resolved", "is_closed": False},
                {"id": 5, "name": "Closed", "is_closed": True},
            ]}
        url = f"{self._base_url}/issue_statuses.json"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, headers=self._headers(), timeout=10)
        except httpx.RequestError as exc:
            raise RedmineApiError("Redmine connection error", 503, str(exc)) from exc
        if not resp.is_success:
            raise RedmineApiError(f"Redmine API error: {resp.status_code}", resp.status_code, resp.text)
        return {
            "statuses": [
                {"id": s.get("id"), "name": s.get("name"), "is_closed": bool(s.get("is_closed"))}
                for s in resp.json().get("issue_statuses", [])
            ]
        }

    async def list_priorities(self) -> dict:
        if not self.is_connected:
            return {"priorities": [
                {"id": 1, "name": "Low"},
                {"id": 2, "name": "Normal"},
                {"id": 3, "name": "High"},
                {"id": 4, "name": "Urgent"},
            ]}
        url = f"{self._base_url}/enumerations/issue_priorities.json"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, headers=self._headers(), timeout=10)
        except httpx.RequestError as exc:
            raise RedmineApiError("Redmine connection error", 503, str(exc)) from exc
        if not resp.is_success:
            raise RedmineApiError(f"Redmine API error: {resp.status_code}", resp.status_code, resp.text)
        return {
            "priorities": [
                {"id": p.get("id"), "name": p.get("name")}
                for p in resp.json().get("issue_priorities", [])
            ]
        }

    async def list_users(self) -> dict:
        if not self.is_connected:
            return {"users": [
                {"id": 1, "login": "admin", "name": "Redmine Admin"},
                {"id": 5, "login": "tanaka", "name": "田中 健太"},
                {"id": 6, "login": "sato", "name": "佐藤 誠"},
                {"id": 7, "login": "ito", "name": "伊藤 大輔"},
                {"id": 8, "login": "yamada", "name": "山田 真由美"},
                {"id": 9, "login": "nakamura", "name": "中村 雄二"},
            ]}
        url = f"{self._base_url}/users.json"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params={"limit": "100"}, headers=self._headers(), timeout=10)
        except httpx.RequestError as exc:
            raise RedmineApiError("Redmine connection error", 503, str(exc)) from exc
        if resp.status_code in (401, 403):
            raise RedmineApiError("Redmine API error: user list requires admin API key", resp.status_code, resp.text)
        if not resp.is_success:
            raise RedmineApiError(f"Redmine API error: {resp.status_code}", resp.status_code, resp.text)
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
        if not self.is_connected:
            return {"versions": []}
        url = f"{self._base_url}/projects/{project_id}/versions.json"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, headers=self._headers(), timeout=10)
        except httpx.RequestError as exc:
            raise RedmineApiError("Redmine connection error", 503, str(exc)) from exc
        if resp.status_code == 404:
            return {"versions": []}
        if not resp.is_success:
            raise RedmineApiError(f"Redmine API error: {resp.status_code}", resp.status_code, resp.text)
        return {
            "versions": [
                {"id": v.get("id"), "name": v.get("name"), "status": v.get("status")}
                for v in resp.json().get("versions", [])
            ]
        }

    async def add_relation(self, issue_id: int, related_issue_id: int, relation_type: str) -> dict:
        if not self.is_connected:
            return {"mode": "mock", "issue_id": issue_id, "related_issue_id": related_issue_id, "relation_type": relation_type, "created": True}
        url = f"{self._base_url}/issues/{issue_id}/relations.json"
        payload = {"relation": {"issue_to_id": related_issue_id, "relation_type": relation_type}}
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    url,
                    json=payload,
                    headers={**self._headers(), "Content-Type": "application/json"},
                    timeout=10,
                )
        except httpx.RequestError as exc:
            raise RedmineApiError("Redmine connection error", 503, str(exc)) from exc
        if not resp.is_success:
            raise RedmineApiError(f"Redmine API error: {resp.status_code}", resp.status_code, resp.text)
        return {"mode": "redmine", "issue_id": issue_id, "related_issue_id": related_issue_id, "relation_type": relation_type, "created": True}

    async def create_issue(self, fields: dict) -> dict:
        clean = {k: v for k, v in fields.items() if v is not None}
        if not self.is_connected:
            return {"mode": "mock", "issue": {"id": 0, **clean}, "created": True}

        url = f"{self._base_url}/issues.json"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    url,
                    json={"issue": clean},
                    headers={**self._headers(), "Content-Type": "application/json"},
                    timeout=10,
                )
        except httpx.RequestError as exc:
            raise RedmineApiError("Redmine connection error", 503, str(exc)) from exc

        if not resp.is_success:
            raise RedmineApiError(f"Redmine API error: {resp.status_code}", resp.status_code, resp.text)

        issue = resp.json().get("issue", {})
        return {"mode": "redmine", "issue": _normalize_issue(issue), "created": True}

    async def update_issue(self, issue_id: int, fields: dict) -> dict:
        if not self.is_connected:
            return {"mode": "mock", "issue_id": issue_id, "fields": fields, "updated": True}

        url = f"{self._base_url}/issues/{issue_id}.json"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.put(
                    url,
                    json={"issue": fields},
                    headers={**self._headers(), "Content-Type": "application/json"},
                    timeout=10,
                )
        except httpx.RequestError as exc:
            raise RedmineApiError("Redmine connection error", 503, str(exc)) from exc

        if not resp.is_success:
            raise RedmineApiError(f"Redmine API error: {resp.status_code}", resp.status_code, resp.text)

        return {"mode": "redmine", "issue_id": issue_id, "updated": True}


def _normalize_issue(issue: dict) -> dict:
    return {
        "id": issue["id"],
        "subject": issue.get("subject", ""),
        "project": issue.get("project"),
        "tracker": issue.get("tracker"),
        "status": issue.get("status"),
        "priority": issue.get("priority"),
        "assigned_to": issue.get("assigned_to"),
        "fixed_version": issue.get("fixed_version"),
        "due_date": issue.get("due_date"),
        "updated_on": issue.get("updated_on"),
    }


def _normalize_issue_detail(issue: dict) -> dict:
    return {
        **_normalize_issue(issue),
        "description": issue.get("description", ""),
        "journals": [
            {
                "id": j["id"],
                "user": j.get("user"),
                "notes": j.get("notes", ""),
                "created_on": j.get("created_on"),
            }
            for j in issue.get("journals", [])
            if j.get("notes")
        ],
    }


def create_connector() -> RedmineConnector:
    return RedmineConnector(
        base_url=os.getenv("REDMINE_BASE_URL"),
        api_key=os.getenv("REDMINE_API_KEY"),
    )
