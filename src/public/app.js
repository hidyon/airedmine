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
const pmOverview = document.querySelector("#pmOverview");
const workGuide = document.querySelector("#workGuide");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatOutput = document.querySelector("#chatOutput");

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

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  askChat(chatInput.value);
});

document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", () => {
    chatInput.value = button.dataset.question || "";
    askChat(chatInput.value);
  });
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

async function askChat(question) {
  const trimmed = question.trim();
  if (!trimmed) return;

  chatOutput.innerHTML = `<div class="empty-state">考えています...</div>`;
  let data;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question: trimmed })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Chat API error: ${response.status} ${body.slice(0, 120)}`);
    }

    data = await response.json();
  } catch (error) {
    console.error(error);
    chatOutput.innerHTML = `<div class="error-state">回答を取得できませんでした。${escapeHtml(error.message || "Redmine 接続とアプリサーバーの状態を確認してください。")}</div>`;
    return;
  }

  try {
    renderChatAnswer(trimmed, data);
  } catch (error) {
    console.error(error);
    chatOutput.innerHTML = `<div class="error-state">回答の表示に失敗しました。${escapeHtml(error.message || "画面を更新してもう一度試してください。")}</div>`;
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
  renderWorkGuide(filteredIssues);
  renderPmOverview(filteredIssues);
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

function renderPmOverview(issues) {
  const staleIssues = issues.filter((issue) => daysSince(issue.updated_on) >= 5);
  const highPriorityIssues = issues.filter((issue) => isHighPriority(issue));
  const pmDecisionIssues = issues.filter((issue) => includesAny(issue.subject, ["pm判断", "判断待ち", "確認待ち"]));
  const specQualityIssues = issues.filter((issue) => includesAny(issue.subject, ["仕様", "ズレ", "未記載", "クローズ候補"]));
  const riskIssues = issues
    .map(analyzeIssue)
    .filter((analysis) => ["PM判断待ち", "停滞リスク", "仕様確認", "高優先度"].includes(analysis.category))
    .sort((a, b) => b.score - a.score);
  const workload = Object.entries(countBy(issues, (issue) => issue.assigned_to?.name || "未割り当て"))
    .sort((a, b) => b[1] - a[1]);
  const priorities = Object.entries(countBy(issues, (issue) => issue.priority?.name || "Normal"))
    .sort((a, b) => b[1] - a[1]);

  const observations = [
    observationTemplate({
      label: "PM判断待ち",
      count: pmDecisionIssues.length,
      description: "判断が止まると後続作業に影響します。",
      issues: pmDecisionIssues
    }),
    observationTemplate({
      label: "停滞候補",
      count: staleIssues.length,
      description: "5日以上更新がない issue です。",
      issues: staleIssues
    }),
    observationTemplate({
      label: "高優先度",
      count: highPriorityIssues.length,
      description: "優先度が High 以上の issue です。",
      issues: highPriorityIssues
    }),
    observationTemplate({
      label: "情報品質",
      count: specQualityIssues.length,
      description: "仕様ズレやテスト未記載など確認が必要です。",
      issues: specQualityIssues
    })
  ];

  pmOverview.innerHTML = `
    <div class="pm-observations">
      ${observations.join("")}
    </div>
    <div class="pm-decision-board">
      <article class="pm-focus">
        <div class="pm-focus-heading">
          <div>
            <p class="eyebrow">Decision queue</p>
            <h4>PMが今日確認すること</h4>
          </div>
          <strong>${riskIssues.length}</strong>
        </div>
        ${riskIssues.length ? riskIssues.slice(0, 4).map(pmRiskTemplate).join("") : `<p class="pm-empty">確認すべきリスク候補はありません。</p>`}
      </article>
      <div class="pm-side-panels">
        <article class="pm-breakdown">
          <h4>担当者負荷</h4>
          ${workload.length ? workload.map(([label, count]) => barTemplate(label, count, issues.length)).join("") : `<p class="pm-empty">表示対象がありません。</p>`}
        </article>
        <article class="pm-breakdown">
          <h4>優先度の偏り</h4>
          ${priorities.length ? priorities.map(([label, count]) => barTemplate(label, count, issues.length)).join("") : `<p class="pm-empty">表示対象がありません。</p>`}
        </article>
      </div>
    </div>
    <article class="pm-stale-list">
      <div>
        <p class="eyebrow">Stale issues</p>
        <h4>未更新 issue</h4>
      </div>
      <div class="pm-stale-items">
        ${staleIssues.length ? staleIssues.slice(0, 5).map(staleTemplate).join("") : `<p class="pm-empty">5日以上更新されていない issue はありません。</p>`}
      </div>
    </article>
  `;
}

function renderWorkGuide(issues) {
  const openIssues = issues.filter((issue) => !issue.status?.is_closed);
  const analyses = openIssues.map(analyzeIssue).sort((a, b) => b.score - a.score);
  const recommended = analyses[0];
  const nextCandidates = analyses.slice(1, 4);

  if (!recommended) {
    workGuide.innerHTML = `
      <div class="empty-state">現在の条件では作業候補がありません。</div>
    `;
    return;
  }

  workGuide.innerHTML = `
    <article class="guide-primary">
      <div class="guide-rank">1</div>
      <div class="guide-content">
        <p class="guide-label">${escapeHtml(recommended.category)}</p>
        <h4>${issueLink(recommended.issue)}</h4>
        <p>${escapeHtml(recommended.nextAction)}</p>
        <div class="guide-split">
          <div>
            <span>AIの根拠</span>
            <p>${escapeHtml(recommended.reason)}</p>
          </div>
          <div>
            <span>人間が確認</span>
            <p>${escapeHtml(recommended.humanCheck)}</p>
          </div>
        </div>
      </div>
    </article>
    <div class="guide-secondary">
      ${nextCandidates.map(candidateTemplate).join("")}
    </div>
  `;
}

function candidateTemplate(candidate) {
  return `
    <article class="guide-candidate">
      <span>${escapeHtml(candidate.category)}</span>
      <strong>#${candidate.issue.id} ${escapeHtml(candidate.issue.subject)}</strong>
      <p>${escapeHtml(candidate.nextAction)}</p>
    </article>
  `;
}

function renderChatAnswer(question, data) {
  const references = data.references || [];
  const proposal = data.proposal;

  chatOutput.innerHTML = `
    <article class="chat-answer">
      <div class="chat-question">
        <span>質問</span>
        <strong>${escapeHtml(question)}</strong>
      </div>
      <div class="chat-response">
        <span>回答</span>
        <p>${escapeHtml(data.answer || "回答はありません。")}</p>
      </div>
      <div class="chat-references">
        <span>根拠</span>
        ${references.length ? references.map(referenceTemplate).join("") : `<p>参照候補はありません。</p>`}
      </div>
      ${proposal ? proposalTemplate(proposal) : ""}
    </article>
  `;
}

function referenceTemplate(reference) {
  if (reference.type === "issue") {
    const url = state.baseUrl ? `${state.baseUrl}/issues/${reference.id}` : null;
    const title = escapeHtml(reference.title || `#${reference.id}`);
    return `
      <a class="chat-reference" href="${url || "#"}" ${url ? `target="_blank" rel="noreferrer"` : ""}>
        <strong>${title}</strong>
        <span>${escapeHtml(reference.status || "Unknown")} / ${escapeHtml(reference.priority || "Normal")}</span>
      </a>
    `;
  }

  return `
    <div class="chat-reference">
      <strong>${escapeHtml(reference.title || reference.id || "doc")}</strong>
      <span>${escapeHtml(reference.excerpt || "")}</span>
    </div>
  `;
}

function proposalTemplate(proposal) {
  return `
    <div class="chat-proposal">
      <span>確認待ちの更新案</span>
      <strong>${escapeHtml(proposal.title || "Redmine 更新案")}</strong>
      <p>${escapeHtml(proposal.reason || "")}</p>
      <p>${escapeHtml(proposal.nextStep || "")}</p>
    </div>
  `;
}

function observationTemplate({ label, count, description, issues }) {
  const topIssues = issues.slice(0, 2);
  const issueList = topIssues.length
    ? topIssues.map((issue) => `<li>#${issue.id} ${escapeHtml(issue.subject)}</li>`).join("")
    : "<li>該当なし</li>";

  return `
    <article class="observation">
      <div class="observation-topline">
        <span>${escapeHtml(label)}</span>
        <strong>${count}</strong>
      </div>
      <p>${escapeHtml(description)}</p>
      <ul>${issueList}</ul>
    </article>
  `;
}

function pmRiskTemplate(analysis) {
  return `
    <section class="pm-risk-item">
      <div>
        <span>${escapeHtml(analysis.category)}</span>
        <strong>${issueLink(analysis.issue)}</strong>
      </div>
      <p>${escapeHtml(analysis.humanCheck)}</p>
    </section>
  `;
}

function barTemplate(label, count, total) {
  const ratio = total ? Math.round((count / total) * 100) : 0;
  return `
    <div class="pm-bar-row">
      <div class="pm-bar-label">
        <span>${escapeHtml(label)}</span>
        <strong>${count}</strong>
      </div>
      <div class="pm-bar-track" aria-label="${escapeHtml(label)} ${count}件">
        <div style="width: ${ratio}%"></div>
      </div>
    </div>
  `;
}

function staleTemplate(issue) {
  return `
    <section class="pm-stale-item">
      <strong>${issueLink(issue)}</strong>
      <span>${daysSince(issue.updated_on)}日未更新 / ${escapeHtml(issue.assigned_to?.name || "未割り当て")}</span>
    </section>
  `;
}

function renderIssues(issues) {
  if (issues.length === 0) {
    issueList.innerHTML = `<div class="empty-state">条件に一致するチケットはありません。</div>`;
    return;
  }

  issueList.innerHTML = issues.map((issue) => {
    const analysis = analyzeIssue(issue);
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
        <div class="issue-agent">
          <div>
            <span>AI要約</span>
            <p>${escapeHtml(analysis.summary)}</p>
          </div>
          <div>
            <span>次アクション</span>
            <p>${escapeHtml(analysis.nextAction)}</p>
          </div>
          <div>
            <span>人間が確認</span>
            <p>${escapeHtml(analysis.humanCheck)}</p>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function analyzeIssue(issue) {
  const subject = issue.subject || "";
  const status = issue.status?.name || "Unknown";
  const priority = issue.priority?.name || "Normal";
  const staleDays = daysSince(issue.updated_on);
  const closed = Boolean(issue.status?.is_closed);
  let score = 10;
  let category = "作業候補";
  let summary = `${status} の ${priority} issue です。`;
  let nextAction = "内容を確認し、必要なら実装またはコメント更新に進みます。";
  let humanCheck = "完了条件と最新コメントを確認してください。";
  let reason = `状態は ${status}、優先度は ${priority}、更新は ${formatRelative(issue.updated_on)} です。`;

  if (closed) {
    return {
      issue,
      score: 0,
      category: "完了済み",
      summary: "完了済みとして扱えます。",
      nextAction: "必要なら完了理由や関連ドキュメントを確認します。",
      humanCheck: "再オープン条件がないかだけ確認してください。",
      reason
    };
  }

  if (isHighPriority(issue)) score += 28;
  if (staleDays >= 5) score += 22;
  if (includesAny(subject, ["pm判断", "判断待ち"])) {
    score += 34;
    category = "PM判断待ち";
    summary = "後続作業を止めやすい判断待ち issue です。";
    nextAction = "判断材料を整理し、PMが決めるべき選択肢を明確にします。";
    humanCheck = "リリース方針、優先順位、影響範囲の判断を確認してください。";
    reason = "件名にPM判断待ちが含まれ、高優先度または停滞の可能性があります。";
  } else if (includesAny(subject, ["仕様", "確認待ち", "承認境界"])) {
    score += 26;
    category = "仕様確認";
    summary = "実装前に仕様や確認境界を揃える必要がある issue です。";
    nextAction = "要求仕様、機能仕様、テスト仕様の未確定点を洗い出します。";
    humanCheck = "仕様の決定者と、Redmineへ反映すべき内容を確認してください。";
    reason = "件名に仕様または確認待ちが含まれています。";
  } else if (includesAny(subject, ["停滞", "リスク"]) || staleDays >= 7) {
    score += 24;
    category = "停滞リスク";
    summary = "更新が古く、放置すると作業計画に影響しそうな issue です。";
    nextAction = "止まっている理由を特定し、次に動かす人か判断を明確にします。";
    humanCheck = "本当に止まっているのか、Redmine外で進んでいないか確認してください。";
    reason = `更新が ${staleDays} 日前で、停滞検知の対象です。`;
  } else if (includesAny(subject, ["クローズ候補", "完了"]) || status.toLowerCase().includes("resolved")) {
    score += 18;
    category = "クローズ候補";
    summary = "完了に近く、クローズ判定に進めそうな issue です。";
    nextAction = "テスト結果と完了条件を照合し、クローズ可否を判定します。";
    humanCheck = "テスト結果、残リスク、Redmineコメントが揃っているか確認してください。";
    reason = "状態または件名から完了確認に近いと判断しました。";
  } else if (isHighPriority(issue)) {
    category = "高優先度";
    summary = "優先度が高く、早めに次アクションを決めたい issue です。";
    nextAction = "着手条件とブロッカーを確認し、今日の作業に入れるか判断します。";
    humanCheck = "他の高優先度 issue との順序を確認してください。";
    reason = `優先度が ${priority} です。`;
  }

  return { issue, score, category, summary, nextAction, humanCheck, reason };
}

function issueLink(issue) {
  const title = `#${issue.id} ${escapeHtml(issue.subject || "No subject")}`;
  if (!state.baseUrl) return title;
  const url = `${state.baseUrl}/issues/${issue.id}`;
  return `<a href="${url}" target="_blank" rel="noreferrer">${title}</a>`;
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

function isHighPriority(issue) {
  const priority = issue.priority?.name?.toLowerCase() || "";
  return priority.includes("high") || priority.includes("urgent") || priority.includes("immediate");
}

function includesAny(value, keywords) {
  const normalized = String(value || "").toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function daysSince(value) {
  if (!value) return 0;
  const date = new Date(value);
  return Math.floor((Date.now() - date.getTime()) / 86400000);
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
