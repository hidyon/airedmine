from collections import Counter
from datetime import date, timedelta
from time import perf_counter
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from services.redmine_connector import RedmineConnector, RedmineApiError
from dependencies import get_connector
from fastapi import HTTPException

router = APIRouter()
ConnectorDep = Annotated[RedmineConnector, Depends(get_connector)]
PM_STATS_CACHE_TTL_SECONDS = 15
_pm_stats_cache: dict | None = None
_pm_stats_cache_at = 0.0


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

    # プロジェクト全体ではなく進行中スプリントに絞る（実プロジェクトのスプリントバーンダウンに近づける）。
    # 進行中スプリント = status open で due_date が最も近い未来の version。
    # 判定できなければ open issue が最も多い version にフォールバックする。
    project_id = _first_project_id(open_issues, closed_issues)
    versions: list[dict] = []
    if project_id is not None:
        try:
            versions = (await connector.list_versions(str(project_id))).get("versions", [])
        except RedmineApiError:
            versions = []

    sprint = _current_sprint(versions, open_issues)
    if sprint is not None:
        sprint_id, sprint_name = sprint
        open_issues = [i for i in open_issues if _version_id(i) == sprint_id]
        closed_issues = [i for i in closed_issues if _version_id(i) == sprint_id]
    else:
        sprint_name = None

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

    return {"days": days, "baseline": baseline, "series": series, "sprint": sprint_name}


def _version_id(issue: dict) -> int | None:
    return (issue.get("fixed_version") or {}).get("id")


def _first_project_id(*issue_lists: list[dict]) -> int | None:
    for issues in issue_lists:
        for issue in issues:
            pid = (issue.get("project") or {}).get("id")
            if pid is not None:
                return pid
    return None


def _current_sprint(versions: list[dict], open_issues: list[dict]) -> tuple[int, str | None] | None:
    """進行中スプリントを返す。

    1. status open で due_date を持つ version のうち、今日以降で最も近い締切のもの。
       未来が無ければ最も新しい過去の open sprint。
    2. version 情報が無ければ open issue が最も多い version にフォールバック。
    """
    today = date.today()
    dated = [
        (due, v)
        for v in versions
        if v.get("status") == "open" and (due := _parse_date(v.get("due_date"))) is not None
    ]
    upcoming = [t for t in dated if t[0] >= today]
    if upcoming:
        v = min(upcoming, key=lambda t: t[0])[1]
        return v.get("id"), v.get("name")
    if dated:
        v = max(dated, key=lambda t: t[0])[1]
        return v.get("id"), v.get("name")

    counts: Counter[int] = Counter(
        vid for i in open_issues if (vid := _version_id(i)) is not None
    )
    if not counts:
        return None
    sprint_id = counts.most_common(1)[0][0]
    name = next(
        ((i.get("fixed_version") or {}).get("name")
         for i in open_issues if _version_id(i) == sprint_id),
        None,
    )
    return sprint_id, name


@router.get("/api/pm/stats")
async def pm_stats(connector: ConnectorDep) -> dict:
    global _pm_stats_cache, _pm_stats_cache_at

    started_total = perf_counter()
    if _pm_stats_cache and perf_counter() - _pm_stats_cache_at < PM_STATS_CACHE_TTL_SECONDS:
        cached = {
            **_pm_stats_cache,
            "cache": {"hit": True, "ttl_seconds": PM_STATS_CACHE_TTL_SECONDS},
        }
        cached["timings"] = [_timing("pm.stats.cache_hit", started_total)]
        return cached

    today = date.today()
    seven_days_ago = today - timedelta(days=7)
    timings = []

    try:
        started = perf_counter()
        open_issues = await _fetch_all(connector, {"status_id": "open", "limit": 100})
        timings.append(_timing("pm.stats.fetch_open", started, {"count": len(open_issues)}))

        started = perf_counter()
        closed_issues = await _fetch_all(connector, {
            "status_id": "closed",
            "limit": 100,
            "sort": "updated_on:desc",
        })
        timings.append(_timing("pm.stats.fetch_closed", started, {"count": len(closed_issues)}))
    except RedmineApiError as exc:
        raise HTTPException(status_code=exc.status, detail={"error": str(exc)}) from exc

    started = perf_counter()
    # 停滞: 7 日以上更新なし
    stalled = []
    for issue in open_issues:
        updated = _parse_date(issue.get("updated_on"))
        if updated and updated <= seven_days_ago:
            stalled.append({
                "id": issue["id"],
                "subject": issue.get("subject", ""),
                "updated_on": (issue.get("updated_on") or "")[:10],
                "assignee": (issue.get("assigned_to") or {}).get("name"),
            })
    stalled.sort(key=lambda x: x["updated_on"])
    stalled = stalled[:20]

    # 担当者別負荷
    assignee_counts: dict[str, int] = {}
    for issue in open_issues:
        name = (issue.get("assigned_to") or {}).get("name") or "未割り当て"
        assignee_counts[name] = assignee_counts.get(name, 0) + 1
    assignee_load = sorted(
        [{"name": k, "count": v} for k, v in assignee_counts.items()],
        key=lambda x: -x["count"],
    )

    # 優先度サマリー
    priority_counts: dict[str, int] = {}
    for issue in open_issues:
        name = (issue.get("priority") or {}).get("name") or "Normal"
        priority_counts[name] = priority_counts.get(name, 0) + 1
    priority_order = ["Urgent", "High", "Normal", "Low"]
    priority_summary = [{"name": p, "count": priority_counts[p]} for p in priority_order if p in priority_counts]
    for name, count in priority_counts.items():
        if name not in priority_order:
            priority_summary.append({"name": name, "count": count})

    # 今週のクローズ数 (updated_on で代用)
    closed_this_week = sum(
        1 for issue in closed_issues
        if (d := _parse_date(issue.get("updated_on"))) and d >= seven_days_ago
    )

    # 期限切れ
    overdue = []
    for issue in open_issues:
        due = _parse_date(issue.get("due_date"))
        if due and due < today:
            overdue.append({
                "id": issue["id"],
                "subject": issue.get("subject", ""),
                "due_date": (issue.get("due_date") or "")[:10],
                "assignee": (issue.get("assigned_to") or {}).get("name"),
            })
    overdue.sort(key=lambda x: x["due_date"])
    overdue = overdue[:20]
    timings.append(_timing("pm.stats.aggregate", started, {
        "open_count": len(open_issues),
        "closed_count": len(closed_issues),
    }))
    timings.append(_timing("pm.stats.total", started_total))

    response = {
        "stalled": stalled,
        "assignee_load": assignee_load,
        "priority_summary": priority_summary,
        "closed_this_week": closed_this_week,
        "overdue": overdue,
        "cache": {"hit": False, "ttl_seconds": PM_STATS_CACHE_TTL_SECONDS},
        "timings": timings,
    }
    _pm_stats_cache = response
    _pm_stats_cache_at = perf_counter()
    return response


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


def _timing(name: str, started: float, extra: dict | None = None) -> dict:
    return {
        "name": name,
        "duration_ms": round((perf_counter() - started) * 1000, 1),
        **(extra or {}),
    }
