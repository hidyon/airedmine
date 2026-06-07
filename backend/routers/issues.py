from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from services.redmine_connector import RedmineConnector, RedmineApiError
from dependencies import get_connector

router = APIRouter()
ConnectorDep = Annotated[RedmineConnector, Depends(get_connector)]


@router.get("/api/issues")
async def list_issues(
    connector: ConnectorDep,
    assigned_to_id: str = Query(default="me"),
    status_id: str = Query(default="open"),
    limit: int = Query(default=100),
    sort: str = Query(default="updated_on:desc"),
) -> dict:
    try:
        return await connector.list_issues({
            "assigned_to_id": assigned_to_id,
            "status_id": status_id,
            "limit": limit,
            "sort": sort,
        })
    except RedmineApiError as exc:
        raise HTTPException(status_code=exc.status, detail=_redmine_error_payload(exc, "Redmine issues fetch failed")) from exc


@router.get("/api/issues/{issue_id}")
async def get_issue(issue_id: int, connector: ConnectorDep) -> dict:
    try:
        detail = await connector.get_issue_detail(issue_id)
    except RedmineApiError as exc:
        raise HTTPException(status_code=exc.status, detail=_redmine_error_payload(exc)) from exc
    if detail is None:
        raise HTTPException(status_code=404, detail={"error": f"Issue #{issue_id} not found"})
    return detail


def _redmine_error_payload(exc: RedmineApiError, label: str = "Redmine error") -> dict:
    body = exc.body[:240]
    category = _error_category(exc.status, body)
    return {
        "error": label,
        "message": _error_message(category, exc.status),
        "category": category,
        "retryable": category in ("connection", "server", "rate_limit"),
        "status": exc.status,
        "detail": body,
    }


def _error_category(status: int, body: str) -> str:
    if status in (401, 403):
        return "auth"
    if status == 404:
        return "not_found"
    if status == 422:
        return "validation"
    if status == 429:
        return "rate_limit"
    if status >= 500:
        return "server"
    if "failed to fetch" in body.lower():
        return "connection"
    return "unknown"


def _error_message(category: str, status: int) -> str:
    messages = {
        "auth": "Redmine の認証または権限を確認してください。",
        "not_found": "対象 issue が見つかりません。番号や参照権限を確認してください。",
        "validation": "Redmine が更新内容を受け付けませんでした。下書きの内容を確認してください。",
        "rate_limit": "Redmine 側の制限に達した可能性があります。少し待って再試行してください。",
        "server": "Redmine サーバー側でエラーが発生しました。状態を確認して再試行してください。",
        "connection": "Redmine に接続できません。アプリサーバーと Redmine の状態を確認してください。",
    }
    return messages.get(category, f"Redmine 更新に失敗しました。HTTP {status} を確認してください。")
