const state = {
  issues: [],
  query: "",
  status: "open",
  connected: false,
  baseUrl: null,
  config: null,
  issueError: null
};

const issueList = document.querySelector("#issueList");
const metrics = document.querySelector("#metrics");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const refreshButton = document.querySelector("#refreshButton");
const connectionStatus = document.querySelector("#connectionStatus");
const setupPanel = document.querySelector("#setupPanel");

searchInput.addEventListener("input", () => {
  state.query = searchInput.value.trim().toLowerCase();
  render();
});

statusFilter.addEventListener("change", () => {
  state.status = statusFilter.value;
  loadIssues();
});

refreshButton.addEventListener("click", () => {
  loadIssues();
});

init();

async function init() {
  await loadConfig();
  await loadIssues();
}

async function loadConfig() {
  const response = await fetch("/api/config");
  const config = await response.json();
  state.connected = config.connected;
  state.baseUrl = config.baseUrl;
  state.config = config;
  renderConnection();
}

async function loadIssues() {
  issueList.innerHTML = `<div class="empty-state">読み込み中...</div>`;

  try {
    const params = new URLSearchParams({
      status_id: state.status,
      assigned_to_id: "me",
      limit: "100"
    });
    const response = await fetch(`/api/issues?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Redmine API error: ${response.status}`);
    }
    const data = await response.json();
    state.issues = data.issues || [];
    state.issueError = null;
    render();
  } catch (error) {
    console.error(error);
    state.issueError = error;
    renderConnection();
    issueList.innerHTML = `<div class="error-state">チケットを取得できませんでした。Redmine の URL、API キー、REST API 設定を確認してください。</div>`;
  }
}

function render() {
  const filteredIssues = state.issues.filter((issue) => {
    if (!state.query) return true;
    return [
      issue.subject,
      issue.project?.name,
      issue.status?.name,
      issue.assigned_to?.name,
      issue.priority?.name,
      issue.tracker?.name
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(state.query);
  });

  renderMetrics(filteredIssues);
  renderConnection();
  renderIssues(filteredIssues);
}

function renderConnection() {
  if (!state.config) {
    connectionStatus.textContent = "接続確認中";
    setupPanel.innerHTML = "";
    return;
  }

  if (state.issueError) {
    connectionStatus.textContent = "Redmine API エラー";
    setupPanel.innerHTML = `
      <div class="setup-content setup-error">
        <div>
          <p class="eyebrow">Connection</p>
          <h3>Redmine からチケットを取得できません</h3>
          <p>接続先 URL、API キー、Redmine の REST API 設定を確認してください。</p>
        </div>
        ${state.baseUrl ? `<a class="text-link" href="${escapeHtml(state.baseUrl)}" target="_blank" rel="noreferrer">Redmine を開く</a>` : ""}
      </div>
    `;
    return;
  }

  if (state.connected) {
    connectionStatus.textContent = `接続中: ${state.baseUrl}`;
    setupPanel.innerHTML = `
      <div class="setup-content setup-ready">
        <div>
          <p class="eyebrow">Connection</p>
          <h3>実 Redmine に接続中</h3>
          <p>表示中のチケットは Redmine REST API から取得しています。</p>
        </div>
        <a class="text-link" href="${escapeHtml(state.baseUrl)}" target="_blank" rel="noreferrer">Redmine を開く</a>
      </div>
    `;
    return;
  }

  const missing = state.config.missing?.length
    ? state.config.missing.map((key) => `<code>${escapeHtml(key)}</code>`).join(", ")
    : "なし";

  connectionStatus.textContent = "モックデータ表示中";
  setupPanel.innerHTML = `
    <div class="setup-content setup-mock">
      <div>
        <p class="eyebrow">Connection</p>
        <h3>モックデータで体験中</h3>
        <p>実 Redmine に接続するには .env に ${missing} を設定し、Redmine 側で REST API を有効にしてください。</p>
      </div>
      <ol class="setup-steps">
        ${(state.config.setup || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
      </ol>
    </div>
  `;
}

function renderMetrics(issues) {
  const statusCounts = countBy(issues, (issue) => issue.status?.name || "Unknown");
  const highPriority = issues.filter((issue) => {
    const priority = issue.priority?.name?.toLowerCase() || "";
    return priority.includes("high") || priority.includes("urgent") || priority.includes("immediate");
  }).length;

  const updatedToday = issues.filter((issue) => {
    const updated = new Date(issue.updated_on);
    const today = new Date();
    return updated.toDateString() === today.toDateString();
  }).length;

  const topStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0];

  metrics.innerHTML = [
    metricTemplate("表示中", issues.length),
    metricTemplate("今日更新", updatedToday),
    metricTemplate("高優先度", highPriority),
    metricTemplate(topStatus?.[0] || "状態", topStatus?.[1] || 0)
  ].join("");
}

function renderIssues(issues) {
  if (issues.length === 0) {
    issueList.innerHTML = `<div class="empty-state">条件に一致するチケットはありません。</div>`;
    return;
  }

  issueList.innerHTML = issues.map((issue) => {
    const issueUrl = state.baseUrl ? `${state.baseUrl}/issues/${issue.id}` : null;
    const title = escapeHtml(issue.subject || "No subject");
    const heading = issueUrl
      ? `<a class="issue-title" href="${issueUrl}" target="_blank" rel="noreferrer">${title}</a>`
      : `<p class="issue-title">${title}</p>`;

    return `
      <article class="issue-card">
        <div class="issue-id">#${issue.id}</div>
        <div>
          ${heading}
          <div class="issue-meta">
            <span>${escapeHtml(issue.project?.name || "No project")}</span>
            <span>${escapeHtml(issue.tracker?.name || "Issue")}</span>
            <span>${escapeHtml(issue.priority?.name || "Normal")}</span>
            <span>更新 ${formatRelative(issue.updated_on)}</span>
          </div>
        </div>
        <span class="pill">${escapeHtml(issue.status?.name || "Unknown")}</span>
      </article>
    `;
  }).join("");
}

function metricTemplate(label, value) {
  return `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function formatRelative(value) {
  if (!value) return "不明";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
