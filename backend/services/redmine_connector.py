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
        "updated_on": issue.get("updated_on"),
    }


def _normalize_issue_detail(issue: dict) -> dict:
    return {
        **_normalize_issue(issue),
        "description": issue.get("description", ""),
        "due_date": issue.get("due_date"),
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
