import re
from datetime import datetime, timezone
from typing import Any

from services.knowledge_base import find_references


# ── helpers ──────────────────────────────────────────────────────────────────

def _includes_any(value: str | None, keywords: list[str]) -> bool:
    normalized = (value or "").lower()
    return any(kw.lower() in normalized for kw in keywords)


def _days_since(value: str | None) -> int:
    if not value:
        return 0
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return max(0, (datetime.now(timezone.utc) - dt).days)
    except ValueError:
        return 0


def _format_reference_date(value: str | None) -> str:
    if not value:
        return "更新日不明"
    days = _days_since(value)
    return "今日更新" if days <= 0 else f"{days}日前に更新"


def _is_high_priority(issue: dict) -> bool:
    priority = ((issue.get("priority") or {}).get("name") or "").lower()
    return any(p in priority for p in ("high", "urgent", "immediate"))


def _issue_score(issue: dict) -> int:
    score = 0
    if _is_high_priority(issue):
        score += 30
    if _days_since(issue.get("updated_on")) >= 5:
        score += 20
    subject = issue.get("subject", "")
    if _includes_any(subject, ["pm判断", "判断待ち"]):
        score += 30
    if _includes_any(subject, ["仕様", "確認待ち"]):
        score += 20
    if _includes_any(subject, ["停滞", "リスク"]):
        score += 20
    return score


def _issue_intent(issue: dict) -> str:
    subject = issue.get("subject", "")
    if _includes_any(subject, ["pm判断", "判断待ち"]):
        return "PM の判断が後続作業を左右する issue"
    if _includes_any(subject, ["仕様", "確認待ち", "承認"]):
        return "仕様や承認境界を揃える必要がある issue"
    if _includes_any(subject, ["停滞", "リスク"]):
        return "停滞理由を確認して再度動かす必要がある issue"
    if _includes_any(subject, ["クローズ候補", "完了"]):
        return "完了条件とテスト結果を確認する issue"
    if _is_high_priority(issue):
        return "優先度が高く、早めに着手条件を確認したい issue"
    return "内容を確認して次の作業またはコメント更新に進む issue"


def _next_issue_action(issue: dict) -> str:
    subject = issue.get("subject", "")
    if _includes_any(subject, ["pm判断", "判断待ち"]):
        return "判断材料を整理し、PM が決める選択肢を明確にする"
    if _includes_any(subject, ["仕様", "確認待ち", "承認"]):
        return "要求仕様、機能仕様、テスト仕様の未確定点を洗い出す"
    if _includes_any(subject, ["停滞", "リスク"]):
        return "止まっている理由と次に動かす担当を確認する"
    if _includes_any(subject, ["クローズ候補", "完了"]):
        return "テスト結果と完了条件を照合し、クローズ可否を判定する"
    if _is_high_priority(issue):
        return "着手条件とブロッカーを確認し、今日の作業に入れるか判断する"
    return "内容と最新コメントを確認し、実装またはコメント更新に進む"


def _issue_reference(issue: dict, detail: dict | None = None) -> dict:
    return {
        "type": "issue",
        "id": issue["id"],
        "title": f"#{issue['id']} {issue.get('subject', '')}",
        "status": (issue.get("status") or {}).get("name", "Unknown"),
        "priority": (issue.get("priority") or {}).get("name", "Normal"),
        "project": (issue.get("project") or {}).get("name", "No project"),
        "assignee": (issue.get("assigned_to") or {}).get("name", "未割り当て"),
        "updated": issue.get("updated_on"),
        "updated_label": _format_reference_date(issue.get("updated_on")),
        "reason": _issue_intent(issue),
        "journal_count": len(detail.get("journals", [])) if detail else None,
    }


def _unique_references(refs: list[dict]) -> list[dict]:
    seen: set[str] = set()
    result = []
    for ref in refs:
        key = f"{ref['type']}:{ref['id']}"
        if key not in seen:
            seen.add(key)
            result.append(ref)
    return result


# ── intent / clarification ────────────────────────────────────────────────────

def extract_issue_id(question: str) -> int | None:
    patterns = [
        r"#(\d+)",
        r"\bissue\s*(\d+)\b",
        r"\bチケット\s*(\d+)\b",
        r"\bissue番号\s*(\d+)\b",
    ]
    for pattern in patterns:
        m = re.search(pattern, question, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return None


def _is_update_request(normalized: str) -> bool:
    if _includes_any(normalized, ["クローズして", "close", "閉じて"]):
        return True
    if _includes_any(normalized, ["コメント案", "コメントを書", "コメントを追加", "投稿して"]):
        return True
    if _includes_any(normalized, ["ステータス変更案", "ステータスを", "状態を変更"]):
        return True
    if _includes_any(normalized, ["更新案", "更新して", "反映して", "下書き", "作って"]):
        return True
    return False


def is_clarification_needed(question: str) -> bool:
    normalized = question.lower()
    if not _is_update_request(normalized):
        return False
    if extract_issue_id(question) is None:
        return True
    if _includes_any(normalized, ["なんか", "適当に", "何か", "とりあえず", "なんでも", "いい感じに"]):
        return True
    return False


def build_clarification_response(question: str) -> dict:
    normalized = question.lower()
    has_issue_id = extract_issue_id(question) is not None

    if not has_issue_id:
        message = "どの issue を更新するか指定されていません。issue 番号を含めて依頼してください。"
        hints = [
            "「#番号 に〜」のように issue 番号を含めてください",
            "コメントを追加する場合は内容も一緒に書くと正確に更新案を作れます",
            "例: 「#1208 にコメントを追加して: ブロッカーが解消しました」",
            "例: 「#1205 をクローズ候補にして」",
        ]
        if _includes_any(normalized, ["コメント", "comment"]):
            hints[1] = "コメントの内容も「: 〜」で追記すると、そのまま下書きになります"
    else:
        message = "更新の内容が明確でないため、確認が必要です。"
        hints = [
            "何をしたいか（コメント追加・ステータス変更・クローズなど）を具体的に書いてください",
            "コメントを追加する場合は「: 内容」を末尾に追記してください",
            "例: 「#1208 にコメントを追加して: 確認済みです」",
        ]

    return {
        "answer": None,
        "clarification": {"type": "clarification_required", "message": message, "hints": hints},
        "references": [],
        "proposal": None,
    }


# ── answer building ───────────────────────────────────────────────────────────

def _issue_specific_answer(question: str, issue: dict) -> str:
    normalized = question.lower()
    status = (issue.get("status") or {}).get("name", "Unknown")
    priority = (issue.get("priority") or {}).get("name", "Normal")
    updated = _days_since(issue.get("updated_on"))
    base = f"#{issue['id']}「{issue.get('subject', '')}」は、状態が {status}、優先度が {priority}、最終更新が {updated} 日前の issue です。"

    if _includes_any(normalized, ["背景", "なぜ", "context", "理由"]):
        return f"{base}\n\n背景を確認するには、Redmine の説明、コメント履歴、関連 docs を見る必要があります。現時点では、件名と状態から作業上の意味を整理すると「{_issue_intent(issue)}」です。"
    if _includes_any(normalized, ["次", "アクション", "どうする", "何を"]):
        return f"{base}\n\n次アクションは「{_next_issue_action(issue)}」です。判断や仕様確認が含まれる場合は、実装より先に人間が確認する項目を明確にしてください。"
    if _includes_any(normalized, ["クローズ", "close", "完了", "閉じ"]):
        return f"{base}\n\nクローズ可否は、完了条件、テスト結果、残リスク、Redmine コメントが揃っているかで判断してください。AIRedmine は直接クローズせず、確認待ちの更新案として扱います。"
    return f"{base}\n\nこの issue について、背景、次アクション、クローズ可否のどれを確認したいかを指定すると、さらに絞って回答できます。"


def _issue_specific_answer_with_detail(question: str, issue: dict, detail: dict) -> str:
    normalized = question.lower()
    journals = detail.get("journals", [])
    latest = journals[-1] if journals else None
    status = (issue.get("status") or {}).get("name", "Unknown")
    priority = (issue.get("priority") or {}).get("name", "Normal")
    updated = _days_since(issue.get("updated_on"))
    base = f"#{issue['id']}「{issue.get('subject', '')}」は、状態が {status}、優先度が {priority}、最終更新が {updated} 日前の issue です。"

    if _includes_any(normalized, ["背景", "なぜ", "context", "理由"]):
        desc = detail.get("description", "")
        desc_part = f"\n\n説明: {desc[:200]}{'…' if len(desc) > 200 else ''}" if desc else ""
        comment_part = ""
        if latest:
            notes = latest["notes"]
            user = (latest.get("user") or {}).get("name", "不明")
            comment_part = f"\n\n最新コメント（{user}）: {notes[:200]}{'…' if len(notes) > 200 else ''}"
        return f"{base}{desc_part}{comment_part}\n\nコメント履歴が {len(journals)} 件あります。"

    if _includes_any(normalized, ["次", "アクション", "どうする", "何を"]):
        if latest:
            user = (latest.get("user") or {}).get("name", "不明")
            age = _days_since(latest.get("created_on"))
            comment_part = f"最新コメント（{age} 日前、{user}）: 「{latest['notes'][:120]}」"
        else:
            comment_part = "まだコメントがありません。"
        return f"{base}\n\n{comment_part}\n\n次アクションは「{_next_issue_action(issue)}」です。"

    if _includes_any(normalized, ["クローズ", "close", "完了", "閉じ"]):
        return f"{base}\n\nコメント履歴 {len(journals)} 件。クローズ可否は、完了条件・テスト結果・残リスクが揃っているかで判断してください。AIRedmine は直接クローズせず、確認待ちの更新案として扱います。"

    return _issue_specific_answer(question, issue)


# ── proposal building ─────────────────────────────────────────────────────────

def _classify_update_action(normalized: str) -> str:
    if _includes_any(normalized, ["クローズ", "close", "完了", "閉じ"]):
        return "close_candidate"
    if _includes_any(normalized, ["ステータス", "状態", "進行中", "完了に", "resolved"]):
        return "status_change"
    return "comment"


def _proposal_title(action: str) -> str:
    return {"close_candidate": "クローズ確認案", "status_change": "ステータス変更案"}.get(action, "Redmine コメント案")


def _proposal_change_summary(action: str, issue: dict | None) -> str:
    target = f"#{issue['id']}「{issue.get('subject', '')}」" if issue else "対象 issue"
    return {
        "close_candidate": f"{target} をクローズ候補として確認します。",
        "status_change": f"{target} のステータス変更候補を確認します。",
    }.get(action, f"{target} に作業状況コメントを追加する候補です。")


def _proposal_draft(action: str, issue: dict | None) -> str:
    if not issue:
        return "対象 issue を確認したうえで、変更内容、理由、確認済み事項を記載してください。"
    if action == "close_candidate":
        return "\n".join([
            f"#{issue['id']} のクローズ候補です。",
            f"確認した完了条件: {_next_issue_action(issue)}",
            "確認したテスト結果: 未記入",
            "残リスク: 未記入",
            "クローズ前に、PMまたは担当者の最終確認をお願いします。",
        ])
    if action == "status_change":
        status_name = (issue.get("status") or {}).get("name", "Unknown")
        return "\n".join([
            f"#{issue['id']} のステータス変更候補です。",
            f"現在の状態: {status_name}",
            f"変更理由: {_issue_intent(issue)}",
            f"次アクション: {_next_issue_action(issue)}",
            "変更先ステータスは、Redmine 上で確認してから選択してください。",
        ])
    return "\n".join([
        f"#{issue['id']} の作業状況コメント案です。",
        f"現在の見立て: {_issue_intent(issue)}",
        f"次アクション: {_next_issue_action(issue)}",
        "確認事項: 完了条件、テスト結果、残リスクを追記してください。",
    ])


def _proposal_checklist(action: str) -> list[str]:
    if action == "close_candidate":
        return ["完了条件を満たしている", "テスト結果が記録されている", "残リスクが許容されている", "関係者の確認が済んでいる"]
    if action == "status_change":
        return ["変更先ステータスが正しい", "変更理由が説明できる", "担当者と関係者への影響が確認されている"]
    return ["コメント内容が事実に基づいている", "次アクションが明確である", "Redmine に書くべき情報だけが含まれている"]


def _build_update_proposal(question: str, target_issue: dict | None, issues: list[dict]) -> dict:
    normalized = question.lower()
    issue = target_issue
    if issue and not issue.get("subject"):
        issue = next((i for i in issues if i["id"] == issue.get("id")), None)

    action = _classify_update_action(normalized)
    return {
        "status": "confirmation_required",
        "title": _proposal_title(action),
        "action": action,
        "target_issue": _issue_reference(issue) if issue else None,
        "change_summary": _proposal_change_summary(action, issue),
        "draft": _proposal_draft(action, issue),
        "reason": "自然言語対話からの更新依頼は、人間の確認後に反映する必要があります。",
        "checklist": _proposal_checklist(action),
        "next_step": "更新案を確認し、差分・理由・影響範囲を確認してから Redmine に反映します。",
    }


# ── main entry point ──────────────────────────────────────────────────────────

def build_chat_response(
    question: str,
    issues: list[dict],
    knowledge: list[dict],
    requested_detail: dict | None = None,
) -> dict[str, Any]:
    if is_clarification_needed(question):
        return build_clarification_response(question)

    normalized = question.lower()
    update_intent = _is_update_request(normalized)
    requested_issue_id = extract_issue_id(question)
    requested_issue: dict | None = None

    if requested_issue_id is not None:
        requested_issue = next((i for i in issues if i["id"] == requested_issue_id), None)
        if requested_issue is None and requested_detail:
            requested_issue = {
                "id": requested_detail["id"],
                "subject": requested_detail.get("subject", ""),
                "status": requested_detail.get("status"),
                "priority": requested_detail.get("priority"),
                "assigned_to": requested_detail.get("assigned_to"),
                "updated_on": requested_detail.get("updated_on"),
            }

    stale_issues = [i for i in issues if _days_since(i.get("updated_on")) >= 5]
    pm_issues = [i for i in issues if _includes_any(i.get("subject"), ["pm判断", "判断待ち", "確認待ち"])]
    high_priority = [i for i in issues if _is_high_priority(i)]
    ranked = sorted(issues, key=_issue_score, reverse=True)
    references: list[dict] = []
    answer = ""

    if requested_issue_id is not None and requested_issue is None:
        answer = f"#{requested_issue_id} に該当する issue は、現在取得できる Redmine issue の中では見つかりませんでした。番号、担当、状態フィルタを確認してください。"
    elif requested_issue is not None:
        answer = (
            _issue_specific_answer_with_detail(question, requested_issue, requested_detail)
            if requested_detail
            else _issue_specific_answer(question, requested_issue)
        )
        references.append(_issue_reference(requested_issue, requested_detail))
    elif _includes_any(normalized, ["今日", "まず", "何から", "優先"]):
        target = ranked[0] if ranked else None
        answer = (
            f"今日まず見るなら #{target['id']}「{target.get('subject', '')}」です。優先度、更新日、判断待ちや停滞の兆候を合わせると、最初に状況を整理する価値があります。"
            if target
            else "現在の条件では未完了 issue が見つかりませんでした。"
        )
        if target:
            references.append(_issue_reference(target))
    elif _includes_any(normalized, ["リスク", "止ま", "停滞", "遅れ"]):
        answer = (
            f"停滞リスクは {len(stale_issues)} 件あります。特に {', '.join('#' + str(i['id']) for i in stale_issues[:3])} は更新日を確認し、止まっている理由を明確にしたいです。"
            if stale_issues
            else "5日以上更新されていない issue は見つかりませんでした。"
        )
        references.extend(_issue_reference(i) for i in stale_issues[:3])
    elif _includes_any(normalized, ["pm", "判断", "定例", "会議"]):
        answer = (
            f"PM が確認すべき判断待ちは {len(pm_issues)} 件あります。次の定例では {', '.join('#' + str(i['id']) + '「' + i.get('subject', '') + '」' for i in pm_issues[:3])} を扱うとよさそうです。"
            if pm_issues
            else "PM 判断待ちとして目立つ issue は見つかりませんでした。"
        )
        references.extend(_issue_reference(i) for i in pm_issues[:3])
    elif _includes_any(normalized, ["高優先", "urgent", "high"]):
        answer = (
            f"高優先度 issue は {len(high_priority)} 件あります。作業順は {' -> '.join('#' + str(i['id']) for i in high_priority[:3])} の順で確認するのがよさそうです。"
            if high_priority
            else "高優先度 issue は見つかりませんでした。"
        )
        references.extend(_issue_reference(i) for i in high_priority[:3])
    else:
        doc_refs = find_references(question, knowledge)
        answer = (
            "関連する知識ベースを見つけました。Redmine issue の状態と合わせて、背景や方針を確認できます。"
            if doc_refs
            else "質問に対して、Redmine の未完了 issue と docs の知識ベースを確認しました。より具体的に issue 番号、リスク、今日の作業、PM判断などを聞くと絞り込めます。"
        )
        references.extend(doc_refs)
        if ranked:
            references.append(_issue_reference(ranked[0]))

    if update_intent:
        first_issue_ref = next((r for r in references if r.get("type") == "issue"), None)
        proposal_target = requested_issue or (
            next((i for i in issues if i["id"] == first_issue_ref["id"]), None) if first_issue_ref else None
        )
        proposal = _build_update_proposal(question, proposal_target, issues)
        return {
            "answer": f"{answer}\n\n更新系の依頼として扱います。AIRedmine はここでは Redmine を直接更新せず、確認待ちの更新案だけを作成します。",
            "references": _unique_references(references),
            "proposal": proposal,
        }

    return {
        "answer": answer,
        "references": _unique_references(references),
        "proposal": None,
    }
