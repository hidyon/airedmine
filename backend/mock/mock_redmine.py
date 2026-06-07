from datetime import datetime, timezone, timedelta


def _date_ago(now: datetime, days: int = 0, hours: int = 0, minutes: int = 0) -> str:
    delta = timedelta(days=days, hours=hours, minutes=minutes)
    return (now - delta).isoformat()


def get_mock_issues() -> list[dict]:
    now = datetime.now(timezone.utc)
    return [
        {
            "id": 1208,
            "subject": "認証 API の仕様確認待ちを解消する",
            "project": {"id": 1, "name": "Agent Experience"},
            "tracker": {"id": 2, "name": "Feature"},
            "status": {"id": 4, "name": "Feedback"},
            "priority": {"id": 5, "name": "Urgent"},
            "assigned_to": {"id": 7, "name": "You"},
            "updated_on": _date_ago(now, hours=2),
        },
        {
            "id": 1207,
            "subject": "PM判断待ち: リリース対象から通知連携を外すか決める",
            "project": {"id": 2, "name": "Release Planning"},
            "tracker": {"id": 3, "name": "Task"},
            "status": {"id": 1, "name": "New"},
            "priority": {"id": 4, "name": "High"},
            "assigned_to": {"id": 7, "name": "You"},
            "updated_on": _date_ago(now, hours=5),
        },
        {
            "id": 1206,
            "subject": "Redmine コメント履歴から未回答質問を抽出する",
            "project": {"id": 1, "name": "Agent Experience"},
            "tracker": {"id": 2, "name": "Feature"},
            "status": {"id": 2, "name": "In Progress"},
            "priority": {"id": 4, "name": "High"},
            "assigned_to": {"id": 7, "name": "You"},
            "updated_on": _date_ago(now, days=1),
        },
        {
            "id": 1205,
            "subject": "停滞リスク: 請求 CSV 修正のレビューが止まっている",
            "project": {"id": 3, "name": "Billing"},
            "tracker": {"id": 1, "name": "Bug"},
            "status": {"id": 2, "name": "In Progress"},
            "priority": {"id": 3, "name": "Normal"},
            "assigned_to": {"id": 7, "name": "You"},
            "updated_on": _date_ago(now, days=6),
        },
        {
            "id": 1204,
            "subject": "仕様書と Redmine 説明のズレを確認する",
            "project": {"id": 4, "name": "Knowledge Base"},
            "tracker": {"id": 3, "name": "Task"},
            "status": {"id": 1, "name": "New"},
            "priority": {"id": 3, "name": "Normal"},
            "assigned_to": {"id": 7, "name": "You"},
            "updated_on": _date_ago(now, days=9),
        },
        {
            "id": 1203,
            "subject": "テスト結果未記載のクローズ候補を確認する",
            "project": {"id": 1, "name": "Agent Experience"},
            "tracker": {"id": 1, "name": "Bug"},
            "status": {"id": 3, "name": "Resolved"},
            "priority": {"id": 4, "name": "High"},
            "assigned_to": {"id": 7, "name": "You"},
            "updated_on": _date_ago(now, days=2),
        },
        {
            "id": 1202,
            "subject": "自然言語対話の最初の質問例を整理する",
            "project": {"id": 4, "name": "Knowledge Base"},
            "tracker": {"id": 3, "name": "Task"},
            "status": {"id": 5, "name": "Closed"},
            "priority": {"id": 2, "name": "Low"},
            "assigned_to": {"id": 7, "name": "You"},
            "updated_on": _date_ago(now, days=3),
        },
        {
            "id": 1201,
            "subject": "接続状態パネルでモックデータ表示を明示する",
            "project": {"id": 1, "name": "Agent Experience"},
            "tracker": {"id": 2, "name": "Feature"},
            "status": {"id": 5, "name": "Closed"},
            "priority": {"id": 3, "name": "Normal"},
            "assigned_to": {"id": 7, "name": "You"},
            "updated_on": _date_ago(now, days=4),
        },
    ]


def _get_mock_details() -> dict[int, dict]:
    now = datetime.now(timezone.utc)
    return {
        1208: {
            "description": "認証 API の §3.2 パラメータ仕様について、ドキュメントの記述が古くなっている可能性がある。担当者に確認し、最新仕様を Redmine に反映してからテストを進める。",
            "journals": [
                {"id": 101, "user": {"id": 3, "name": "田中"}, "notes": "§3.2 のトークン有効期限についてドキュメントオーナーに質問を送りました。返信待ちです。", "created_on": _date_ago(now, days=3)},
                {"id": 102, "user": {"id": 7, "name": "You"}, "notes": "返信がまだ来ていないため、今週中に再確認します。ブロッカーになっています。", "created_on": _date_ago(now, hours=4)},
            ],
        },
        1207: {
            "description": "v2.1 リリースで通知連携機能を含めるか決定が必要。含める場合は工数が +3 日、外す場合は次バージョンへ持ち越し。PM が最終判断する。",
            "journals": [
                {"id": 201, "user": {"id": 2, "name": "PM 鈴木"}, "notes": "通知連携はスコープ外にする案が出ています。ステークホルダーと調整中。", "created_on": _date_ago(now, days=2)},
                {"id": 202, "user": {"id": 7, "name": "You"}, "notes": "判断が出次第、チケットを更新します。", "created_on": _date_ago(now, hours=6)},
            ],
        },
        1206: {
            "description": "Redmine の journals を解析し、未回答の質問を抽出する機能を追加する。「？」で終わる文や「確認お願いします」を含むコメントを検出対象とする。",
            "journals": [
                {"id": 301, "user": {"id": 7, "name": "You"}, "notes": "コメント取得の API 調査を完了。journals の notes フィールドを解析すれば実装可能。", "created_on": _date_ago(now, days=1)},
            ],
        },
        1205: {
            "description": "請求 CSV の金額フォーマットに不具合があり、税込み金額が正しく出力されない。修正済みだがレビューが止まっている。",
            "journals": [
                {"id": 401, "user": {"id": 5, "name": "レビュワー 佐藤"}, "notes": "フォーマット修正は確認しました。テストケースの追加を要望します。", "created_on": _date_ago(now, days=7)},
                {"id": 402, "user": {"id": 7, "name": "You"}, "notes": "テストケースを追加しました。再レビューをお願いします。", "created_on": _date_ago(now, days=6)},
            ],
        },
        1204: {
            "description": "仕様書 v1.4 と Redmine の issue 説明が一致していない箇所がある。特に認証フローと API レスポンス形式について確認が必要。",
            "journals": [
                {"id": 501, "user": {"id": 7, "name": "You"}, "notes": "仕様書 §5 と issue #1208 の説明に矛盾を発見。docs 側を更新するか Redmine を更新するか確認が必要。", "created_on": _date_ago(now, days=8)},
            ],
        },
        1203: {
            "description": "バグ修正が完了し、テスト済み。クローズ候補として挙がっているが、テスト結果の記録が Redmine に残っていない。",
            "journals": [
                {"id": 601, "user": {"id": 7, "name": "You"}, "notes": "単体テストと結合テストを実施。すべてパス。クローズしてよいか確認をお願いします。", "created_on": _date_ago(now, days=2)},
            ],
        },
        1202: {
            "description": "AI エージェントが自然言語対話の起点として提示する質問例を整理する。開発者向けと PM 向けを分けて定義。",
            "journals": [
                {"id": 701, "user": {"id": 7, "name": "You"}, "notes": "質問例を 5 パターン定義し、UI に反映しました。完了。", "created_on": _date_ago(now, days=3)},
            ],
        },
        1201: {
            "description": "モックデータで起動している場合に、実 Redmine 接続との違いをユーザーが明確に分かるようにする。",
            "journals": [
                {"id": 801, "user": {"id": 7, "name": "You"}, "notes": "接続状態パネルを追加し、モックと実接続を区別して表示するようにしました。完了。", "created_on": _date_ago(now, days=4)},
            ],
        },
    }


def _matches_status(issue: dict, status_id: str) -> bool:
    if status_id in ("*", "all"):
        return True
    name = (issue["status"]["name"] or "").lower()
    if status_id == "closed":
        return name == "closed"
    if status_id == "open":
        return name != "closed"
    return str(issue["status"]["id"]) == status_id


def list_mock_issues(params: dict) -> dict:
    status_id = params.get("status_id", "open")
    limit = int(params.get("limit", 100))

    issues = [i for i in get_mock_issues() if _matches_status(i, status_id)]
    issues.sort(key=lambda i: i["updated_on"] or "", reverse=True)
    issues = issues[:limit]

    return {
        "issues": issues,
        "total_count": len(issues),
        "offset": 0,
        "limit": limit,
    }


def get_mock_issue_detail(issue_id: int) -> dict | None:
    issues = get_mock_issues()
    base = next((i for i in issues if i["id"] == issue_id), None)
    if base is None:
        return None
    details = _get_mock_details()
    extra = details.get(issue_id, {"description": "", "journals": []})
    return {**base, **extra}
