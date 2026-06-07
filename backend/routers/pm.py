from datetime import date, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from services.redmine_connector import RedmineConnector, RedmineApiError
from dependencies import get_connector
from fastapi import HTTPException

router = APIRouter()
ConnectorDep = Annotated[RedmineConnector, Depends(get_connector)]


@router.get("/api/pm/burndown")
async def burndown(connector: ConnectorDep, days: int = Query(default=14, ge=7, le=90)) -> dict:
    today = date.today()
    start = today - timedelta(days=days)

    try:
        open_issues = await _fetch_all(connector, {"status_id": "open", "limit": 100})
        closed_issues = await _fetch_all(connector, {
            "status_id": "closed",
            "limit": 100,
            "sort": "updated_on:asc",
        })
    except RedmineApiError as exc:
        raise HTTPException(status_code=exc.status, detail={"error": str(exc)}) from exc

    # close 日を updated_on で代用（期間内のもののみ）
    closed_in_range: list[tuple[date, dict]] = []
    for issue in closed_issues:
        updated = _parse_date(issue.get("updated_on"))
        if updated and updated >= start:
            closed_in_range.append((updated, issue))

    # 起点: 現在 open + 期間内に close されたもの
    baseline = len(open_issues) + len(closed_in_range)

    # 日別系列を作成
    series = []
    for i in range(days + 1):
        d = start + timedelta(days=i)
        closed_by_day = sum(1 for cd, _ in closed_in_range if cd <= d)
        open_count = baseline - closed_by_day
        ideal = round(baseline * (1 - i / days))
        series.append({
            "date": d.isoformat(),
            "open": max(open_count, 0),
            "ideal": max(ideal, 0),
        })

    return {"days": days, "baseline": baseline, "series": series}


async def _fetch_all(connector: RedmineConnector, params: dict) -> list[dict]:
    issues = []
    offset = 0
    limit = int(params.get("limit", 100))
    while True:
        res = await connector.list_issues({**params, "offset": offset, "limit": limit})
        batch = res.get("issues", [])
        issues.extend(batch)
        total = res.get("total_count", 0)
        offset += len(batch)
        if offset >= total or not batch:
            break
    return issues


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None
