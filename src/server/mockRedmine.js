export function listMockIssues({ statusId = "open", limit = 100 } = {}) {
  const issues = getMockIssues()
    .filter((issue) => matchesMockStatus(issue, statusId))
    .sort((a, b) => new Date(b.updated_on) - new Date(a.updated_on))
    .slice(0, limit);

  return {
    issues,
    total_count: issues.length,
    offset: 0,
    limit
  };
}

function getMockIssues() {
  const now = new Date();
  return [
    {
      id: 1208,
      subject: "認証 API の仕様確認待ちを解消する",
      project: { id: 1, name: "Agent Experience" },
      tracker: { id: 2, name: "Feature" },
      status: { id: 4, name: "Feedback" },
      priority: { id: 5, name: "Urgent" },
      assigned_to: { id: 7, name: "You" },
      updated_on: dateAgo(now, { hours: 2 })
    },
    {
      id: 1207,
      subject: "PM判断待ち: リリース対象から通知連携を外すか決める",
      project: { id: 2, name: "Release Planning" },
      tracker: { id: 3, name: "Task" },
      status: { id: 1, name: "New" },
      priority: { id: 4, name: "High" },
      assigned_to: { id: 7, name: "You" },
      updated_on: dateAgo(now, { hours: 5 })
    },
    {
      id: 1206,
      subject: "Redmine コメント履歴から未回答質問を抽出する",
      project: { id: 1, name: "Agent Experience" },
      tracker: { id: 2, name: "Feature" },
      status: { id: 2, name: "In Progress" },
      priority: { id: 4, name: "High" },
      assigned_to: { id: 7, name: "You" },
      updated_on: dateAgo(now, { days: 1 })
    },
    {
      id: 1205,
      subject: "停滞リスク: 請求 CSV 修正のレビューが止まっている",
      project: { id: 3, name: "Billing" },
      tracker: { id: 1, name: "Bug" },
      status: { id: 2, name: "In Progress" },
      priority: { id: 3, name: "Normal" },
      assigned_to: { id: 7, name: "You" },
      updated_on: dateAgo(now, { days: 6 })
    },
    {
      id: 1204,
      subject: "仕様書と Redmine 説明のズレを確認する",
      project: { id: 4, name: "Knowledge Base" },
      tracker: { id: 3, name: "Task" },
      status: { id: 1, name: "New" },
      priority: { id: 3, name: "Normal" },
      assigned_to: { id: 7, name: "You" },
      updated_on: dateAgo(now, { days: 9 })
    },
    {
      id: 1203,
      subject: "テスト結果未記載のクローズ候補を確認する",
      project: { id: 1, name: "Agent Experience" },
      tracker: { id: 1, name: "Bug" },
      status: { id: 3, name: "Resolved" },
      priority: { id: 4, name: "High" },
      assigned_to: { id: 7, name: "You" },
      updated_on: dateAgo(now, { days: 2 })
    },
    {
      id: 1202,
      subject: "自然言語対話の最初の質問例を整理する",
      project: { id: 4, name: "Knowledge Base" },
      tracker: { id: 3, name: "Task" },
      status: { id: 5, name: "Closed" },
      priority: { id: 2, name: "Low" },
      assigned_to: { id: 7, name: "You" },
      updated_on: dateAgo(now, { days: 3 })
    },
    {
      id: 1201,
      subject: "接続状態パネルでモックデータ表示を明示する",
      project: { id: 1, name: "Agent Experience" },
      tracker: { id: 2, name: "Feature" },
      status: { id: 5, name: "Closed" },
      priority: { id: 3, name: "Normal" },
      assigned_to: { id: 7, name: "You" },
      updated_on: dateAgo(now, { days: 4 })
    }
  ];
}

function matchesMockStatus(issue, statusId) {
  if (statusId === "*" || statusId === "all") return true;
  const statusName = issue.status.name.toLowerCase();
  if (statusId === "closed") return statusName === "closed";
  if (statusId === "open") return statusName !== "closed";
  return String(issue.status.id) === String(statusId);
}

function dateAgo(now, { days = 0, hours = 0, minutes = 0 }) {
  const ms = (days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60) * 1000;
  return new Date(now.getTime() - ms).toISOString();
}
