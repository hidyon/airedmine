import time
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from models import (
    AddRelationRequest,
    BulkUpdateRequest,
    CommentProposalRequest,
    CreateIssueRequest,
    UpdateProposalRequest,
)
from services.redmine_connector import RedmineConnector, RedmineApiError
from dependencies import get_connector
from routers.issues import _redmine_error_payload

router = APIRouter()
ConnectorDep = Annotated[RedmineConnector, Depends(get_connector)]

_update_logs: list[dict] = []
_log_seq = 0


@router.post("/api/proposals/comment")
async def execute_comment(request: CommentProposalRequest, connector: ConnectorDep) -> dict:
    global _log_seq

    issue_id = request.issue_id or (request.target_issue or {}).get("id")
    notes = (request.notes or request.draft or "").strip()

    if not issue_id or not notes:
        raise HTTPException(status_code=400, detail={
            "error": "issue_id and notes are required",
            "category": "validation",
            "retryable": False,
        })

    target_title = (request.target_issue or {}).get("title", f"#{issue_id}")
    log_base = {
        "id": f"log-{int(time.time() * 1000)}-{_log_seq}",
        "created_at": _now_iso(),
        "actor": "browser-user",
        "issue_id": issue_id,
        "target_title": target_title,
        "action": "comment",
        "draft": notes,
    }
    _log_seq += 1

    try:
        result = await connector.add_issue_comment(issue_id, notes)
        log = _record_log({**log_base, "result": "success", "message": "Redmine コメントを追加しました。"})
        return {**result, "message": "Redmine コメントを追加しました。", "log": log}
    except RedmineApiError as exc:
        payload = _redmine_error_payload(exc)
        log = _record_log(_failure_log(log_base, payload))
        raise HTTPException(status_code=exc.status, detail={**payload, "log": log}) from exc


@router.post("/api/proposals/update")
async def execute_update(request: UpdateProposalRequest, connector: ConnectorDep) -> dict:
    global _log_seq

    fields: dict = {}
    label: str
    if request.action == "status_change" and request.new_status_id is not None:
        fields["status_id"] = request.new_status_id
        label = request.new_status_name or str(request.new_status_id)
    elif request.action == "assignee_change" and request.new_assigned_to_id is not None:
        fields["assigned_to_id"] = request.new_assigned_to_id
        label = request.new_assigned_to_name or str(request.new_assigned_to_id)
    elif request.action == "due_date" and request.new_due_date:
        fields["due_date"] = request.new_due_date
        label = request.new_due_date
    elif request.action == "priority" and request.new_priority_id is not None:
        fields["priority_id"] = request.new_priority_id
        label = request.new_priority_name or str(request.new_priority_id)
    elif request.action == "done_ratio" and request.new_done_ratio is not None:
        if not 0 <= request.new_done_ratio <= 100:
            raise HTTPException(status_code=400, detail={"error": "done_ratio must be 0-100", "category": "validation", "retryable": False})
        fields["done_ratio"] = request.new_done_ratio
        label = f"{request.new_done_ratio}%"
    elif request.action == "version" and request.new_version_id is not None:
        fields["fixed_version_id"] = request.new_version_id
        label = request.new_version_name or str(request.new_version_id)
    else:
        raise HTTPException(status_code=400, detail={"error": "invalid action or missing fields"})
    log_base = {
        "id": f"log-{int(time.time() * 1000)}-{_log_seq}",
        "created_at": _now_iso(),
        "actor": "browser-user",
        "issue_id": request.issue_id,
        "target_title": f"#{request.issue_id}",
        "action": request.action,
        "draft": f"{label}: {request.reason or ''}",
    }
    _log_seq += 1

    try:
        result = await connector.update_issue(request.issue_id, fields)
        log = _record_log({**log_base, "result": "success", "message": f"Redmine issue #{request.issue_id} を更新しました。"})
        return {**result, "message": f"Redmine issue #{request.issue_id} を更新しました。", "log": log}
    except RedmineApiError as exc:
        payload = _redmine_error_payload(exc)
        log = _record_log(_failure_log(log_base, payload))
        raise HTTPException(status_code=exc.status, detail={**payload, "log": log}) from exc


@router.post("/api/proposals/create_issue")
async def execute_create_issue(request: CreateIssueRequest, connector: ConnectorDep) -> dict:
    global _log_seq

    subject = request.subject.strip()
    project_id = request.project_id.strip()
    if not subject or not project_id:
        raise HTTPException(status_code=400, detail={
            "error": "project_id and subject are required",
            "category": "validation",
            "retryable": False,
        })

    fields = {
        "project_id": project_id,
        "subject": subject,
        "description": request.description,
        "assigned_to_id": request.assigned_to_id,
        "priority_id": request.priority_id,
        "due_date": request.due_date,
    }
    log_base = {
        "id": f"log-{int(time.time() * 1000)}-{_log_seq}",
        "created_at": _now_iso(),
        "actor": "browser-user",
        "issue_id": 0,
        "target_title": subject,
        "action": "create_issue",
        "draft": request.description or "",
    }
    _log_seq += 1

    try:
        result = await connector.create_issue(fields)
        new_id = (result.get("issue") or {}).get("id", 0)
        message = f"Redmine issue #{new_id} を作成しました。" if new_id else "Redmine issue を作成しました（mock）。"
        log = _record_log({**log_base, "issue_id": new_id, "result": "success", "message": message})
        return {**result, "message": message, "log": log}
    except RedmineApiError as exc:
        payload = _redmine_error_payload(exc)
        log = _record_log(_failure_log(log_base, payload))
        raise HTTPException(status_code=exc.status, detail={**payload, "log": log}) from exc


@router.post("/api/proposals/add_relation")
async def execute_add_relation(request: AddRelationRequest, connector: ConnectorDep) -> dict:
    global _log_seq

    log_base = {
        "id": f"log-{int(time.time() * 1000)}-{_log_seq}",
        "created_at": _now_iso(),
        "actor": "browser-user",
        "issue_id": request.issue_id,
        "target_title": f"#{request.issue_id}",
        "action": "add_relation",
        "draft": f"{request.relation_type} #{request.related_issue_id}: {request.reason or ''}",
    }
    _log_seq += 1

    try:
        result = await connector.add_relation(request.issue_id, request.related_issue_id, request.relation_type)
        message = f"#{request.issue_id} と #{request.related_issue_id} を関連付けました。"
        log = _record_log({**log_base, "result": "success", "message": message})
        return {**result, "message": message, "log": log}
    except RedmineApiError as exc:
        payload = _redmine_error_payload(exc)
        log = _record_log(_failure_log(log_base, payload))
        raise HTTPException(status_code=exc.status, detail={**payload, "log": log}) from exc


@router.post("/api/proposals/bulk_update")
async def execute_bulk_update(request: BulkUpdateRequest, connector: ConnectorDep) -> dict:
    global _log_seq

    issue_ids = _unique_issue_ids(request.issue_ids)
    if not issue_ids:
        raise HTTPException(status_code=400, detail={
            "error": "issue_ids are required",
            "category": "validation",
            "retryable": False,
        })
    if len(issue_ids) > 20:
        raise HTTPException(status_code=400, detail={
            "error": "bulk update supports up to 20 issues",
            "category": "validation",
            "retryable": False,
        })

    fields, label = _bulk_update_fields(request)
    log_base = {
        "id": f"log-{int(time.time() * 1000)}-{_log_seq}",
        "created_at": _now_iso(),
        "actor": "browser-user",
        "issue_id": issue_ids[0],
        "target_title": f"{len(issue_ids)} issues",
        "action": f"bulk_{request.action}",
        "draft": f"{label}: {request.reason or ''}",
    }
    _log_seq += 1

    results = []
    try:
        for issue_id in issue_ids:
            results.append(await connector.update_issue(issue_id, fields))
        message = f"{len(issue_ids)} 件の Redmine issue を一括更新しました。"
        log = _record_log({**log_base, "result": "success", "message": message})
        return {
            "updated": True,
            "issue_ids": issue_ids,
            "fields": fields,
            "results": results,
            "message": message,
            "log": log,
        }
    except RedmineApiError as exc:
        payload = _redmine_error_payload(exc)
        log = _record_log(_failure_log({
            **log_base,
            "draft": f"{label}: {len(results)}/{len(issue_ids)} updated before failure",
        }, payload))
        raise HTTPException(status_code=exc.status, detail={**payload, "log": log}) from exc


@router.get("/api/proposals/logs")
async def get_logs() -> dict:
    return {"logs": _update_logs[:20]}


def _record_log(entry: dict) -> dict:
    _update_logs.insert(0, entry)
    if len(_update_logs) > 50:
        del _update_logs[50:]
    return entry


def _failure_log(log_base: dict, payload: dict) -> dict:
    return {
        **log_base,
        "result": "failure",
        "message": payload["message"],
        "category": payload.get("category"),
        "retryable": payload.get("retryable"),
        "status": payload.get("status"),
        "detail": payload.get("detail"),
    }


def _now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def _bulk_update_fields(request: BulkUpdateRequest) -> tuple[dict, str]:
    if request.action == "status_change" and request.new_status_id is not None:
        return {"status_id": request.new_status_id}, request.new_status_name or str(request.new_status_id)
    if request.action == "assignee_change" and request.new_assigned_to_id is not None:
        return {"assigned_to_id": request.new_assigned_to_id}, request.new_assigned_to_name or str(request.new_assigned_to_id)
    raise HTTPException(status_code=400, detail={
        "error": "invalid bulk action or missing fields",
        "category": "validation",
        "retryable": False,
    })


def _unique_issue_ids(values: list[int]) -> list[int]:
    issue_ids: list[int] = []
    seen: set[int] = set()
    for value in values:
        issue_id = int(value)
        if issue_id <= 0 or issue_id in seen:
            continue
        issue_ids.append(issue_id)
        seen.add(issue_id)
    return issue_ids
