export const viewport = { width: 1440, height: 980 };

export const developerUser = {
  user_id: 1,
  username: "tanaka",
  display_name: "田中 健太",
  role: "developer",
  redmine_user_id: 5,
};

export const pmUser = {
  user_id: 2,
  username: "nakamura",
  display_name: "中村 雄二",
  role: "pm",
  redmine_user_id: 9,
};

export const sessions = [
  {
    session_id: "demo-main",
    title: "Sprint 3 リリース判断",
    role: "developer",
    created_at: "2026-06-14T00:00:00+00:00",
    updated_at: "2026-06-14T10:10:00+00:00",
    archived_at: null,
    message_count: 4,
    related_issue_ids: [1327, 1358],
    last_proposal_action: "status_change",
  },
  {
    session_id: "demo-archived",
    title: "完了済み: 勤怠締め相談",
    role: "developer",
    created_at: "2026-06-13T00:00:00+00:00",
    updated_at: "2026-06-13T18:30:00+00:00",
    archived_at: "2026-06-14T09:00:00+00:00",
    message_count: 6,
    related_issue_ids: [1401],
    last_proposal_action: "comment",
  },
  {
    session_id: "demo-pm",
    title: "PM 判断待ちの整理",
    role: "pm",
    created_at: "2026-06-12T00:00:00+00:00",
    updated_at: "2026-06-12T17:20:00+00:00",
    archived_at: null,
    message_count: 3,
    related_issue_ids: [1420, 1424],
    last_proposal_action: null,
  },
];

export const issue1327 = issue({
  id: 1327,
  subject: "月次勤怠カレンダーの初期描画パフォーマンス改善",
  status: "In Progress",
  priority: "High",
  assignee: "田中 健太",
  description: "月末の勤怠確認でカレンダー初期描画が 3 秒を超える。祝日判定と集計 API の呼び出し回数を見直す。",
});

export const issue1358 = issue({
  id: 1358,
  subject: "iOS Safari の日付ピッカー表示バグ",
  status: "Feedback",
  priority: "High",
  assignee: "佐藤 誠",
  description: "承認画面で日付ピッカーが画面外にはみ出す。モバイル利用者への影響が大きい。",
});

export const issue1401 = issue({
  id: 1401,
  subject: "勤怠締め処理の完了確認",
  status: "Closed",
  priority: "Normal",
  assignee: "山田 真由美",
  description: "勤怠締め処理が正常に完了したことを確認する。",
});

export const issue1420 = issue({
  id: 1420,
  subject: "承認フロー差し戻し通知の文言確認",
  status: "New",
  priority: "Urgent",
  assignee: "中村 雄二",
  description: "差し戻し通知の文言が PM 判断待ちになっている。",
});

export const issue1424 = issue({
  id: 1424,
  subject: "月末締めバッチのリトライ設計",
  status: "In Progress",
  priority: "High",
  assignee: "伊藤 大輔",
  description: "月末締めバッチ失敗時のリトライ方針を決める。",
});

export const issuesById = {
  1327: issue1327,
  1358: issue1358,
  1401: issue1401,
  1420: issue1420,
  1424: issue1424,
};

export const chatDetail = {
  session: sessions[0],
  messages: [
    {
      id: 1,
      role: "user",
      content: "Sprint 3 のリリース判断で残っているリスクを整理して",
      payload: null,
      created_at: "2026-06-14T10:00:00+00:00",
    },
    {
      id: 2,
      role: "assistant",
      content: "月次勤怠カレンダーと iOS Safari の表示バグが判断ポイントです。",
      created_at: "2026-06-14T10:01:00+00:00",
      payload: {
        session_id: "demo-main",
        answer: "Sprint 3 は **#1327** の初期描画遅延と **#1358** の iOS Safari 表示バグが主なリスクです。#1327 は Feedback に戻して、性能計測結果の追記を依頼するのがよさそうです。",
        clarification: null,
        tool_calls: ["list_issues", "get_issue", "list_issue_statuses", "change_status"],
        references: [
          ref(issue1327, "リリース判断に影響する性能リスク"),
          ref(issue1358, "モバイル承認フローの残リスク"),
        ],
        proposal: {
          status: "confirmation_required",
          action: "status_change",
          issue_id: 1327,
          title: "ステータス変更提案",
          change_summary: "#1327 を Feedback に戻し、計測結果の追記を依頼します。",
          new_status_id: 4,
          new_status_name: "Feedback",
          reason: "リリース判定前に性能計測の根拠を揃えるため",
        },
      },
    },
  ],
};

export const pmStats = {
  stalled: [
    { id: 1327, subject: issue1327.subject, updated_on: "2026-06-05", assignee: "田中 健太" },
    { id: 1358, subject: issue1358.subject, updated_on: "2026-06-06", assignee: "佐藤 誠" },
  ],
  assignee_load: [
    { name: "田中 健太", count: 12 },
    { name: "佐藤 誠", count: 9 },
    { name: "伊藤 大輔", count: 7 },
    { name: "山田 真由美", count: 5 },
  ],
  priority_summary: [
    { name: "Urgent", count: 3 },
    { name: "High", count: 18 },
    { name: "Normal", count: 42 },
    { name: "Low", count: 6 },
  ],
  closed_this_week: 14,
  overdue: [
    { id: 1420, subject: issue1420.subject, due_date: "2026-06-10", assignee: "中村 雄二" },
    { id: 1424, subject: issue1424.subject, due_date: "2026-06-11", assignee: "伊藤 大輔" },
  ],
};

export const burndown = {
  days: 14,
  baseline: 82,
  series: Array.from({ length: 14 }, (_, i) => ({
    date: `2026-06-${String(i + 1).padStart(2, "0")}`,
    open: 82 - i * 3 + (i > 8 ? 4 : 0),
    ideal: 82 - i * 4,
  })),
};

export const auditLogs = {
  logs: [
    {
      id: "log-success-1",
      created_at: "2026-06-14T10:20:00+00:00",
      actor: "browser-user",
      issue_id: 1327,
      target_title: issue1327.subject,
      action: "status_change",
      draft: "Feedback: 性能計測の根拠を追記するため",
      result: "success",
      message: "Redmine issue #1327 を更新しました。",
    },
    {
      id: "log-failure-1",
      created_at: "2026-06-14T10:12:00+00:00",
      actor: "browser-user",
      issue_id: 1358,
      target_title: issue1358.subject,
      action: "due_date",
      draft: "2026-06-01: 過去日期日を設定しようとしました",
      result: "failure",
      message: "Redmine API validation error",
      category: "validation",
      retryable: false,
      status: 422,
    },
    {
      id: "log-success-2",
      created_at: "2026-06-14T09:42:00+00:00",
      actor: "browser-user",
      issue_id: 1401,
      target_title: issue1401.subject,
      action: "comment",
      draft: "締め処理の確認が完了しました。",
      result: "success",
      message: "Redmine コメントを追加しました。",
    },
  ],
};

export async function demoApiRoute(route) {
  const url = new URL(route.request().url());
  const path = url.pathname;
  if (!path.startsWith("/api/")) return route.continue();
  if (path === "/api/chat/sessions") {
    const includeArchived = url.searchParams.get("include_archived") === "true";
    return fulfill(route, { sessions: includeArchived ? sessions : sessions.filter((s) => !s.archived_at) });
  }
  if (path === "/api/chat/sessions/demo-main") return fulfill(route, chatDetail);

  const issueMatch = path.match(/^\/api\/issues\/(\d+)$/);
  if (issueMatch) return fulfill(route, issuesById[issueMatch[1]] ?? {});

  if (path === "/api/pm/burndown") return fulfill(route, burndown);
  if (path === "/api/pm/stats") return fulfill(route, pmStats);
  if (path === "/api/proposals/logs") return fulfill(route, auditLogs);
  if (path === "/api/proposals/update") {
    return fulfill(route, { ok: true, issue_id: 1327, action: "status_change" });
  }
  if (path === "/api/config") {
    return fulfill(route, {
      connected: true,
      mode: "redmine",
      base_url: "http://redmine:3000",
      missing: [],
      diagnostics: { category: "ready", message: "ready", next_actions: [] },
      setup: [],
    });
  }
  return fulfill(route, {});
}

function fulfill(route, data) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(data),
  });
}

function issue({ id, subject, status, priority, assignee, description }) {
  return {
    id,
    subject,
    project: { id: 1, name: "kintai-next" },
    tracker: { id: 1, name: "Feature" },
    status: { id: 3, name: status },
    priority: { id: 4, name: priority },
    assigned_to: { id: 5, name: assignee },
    fixed_version: { id: 3, name: "Sprint 3" },
    due_date: "2026-06-21",
    updated_on: "2026-06-14T09:30:00Z",
    description,
    journals: [
      {
        id: 1,
        user: { id: 9, name: "中村 雄二" },
        notes: "Sprint 3 のリリース判定までに計測結果を追記してください。",
        created_on: "2026-06-13T02:00:00Z",
      },
      {
        id: 2,
        user: { id: 5, name: "田中 健太" },
        notes: "祝日判定のメモ化で初期描画が 1.8 秒まで改善しました。",
        created_on: "2026-06-14T03:30:00Z",
      },
    ],
  };
}

function ref(detail, reason) {
  return {
    type: "issue",
    id: detail.id,
    title: detail.subject,
    status: detail.status.name,
    priority: detail.priority.name,
    project: detail.project.name,
    assignee: detail.assigned_to.name,
    updated: detail.updated_on,
    updated_label: "06/14 18:30",
    reason,
    journal_count: detail.journals.length,
  };
}
