import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createRedmineConnector, RedmineApiError } from "./redmineConnector.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = normalize(join(__dirname, "../.."));
const publicDir = join(rootDir, "src/public");

loadDotEnv();

const port = Number(process.env.PORT || 5173);
const redmine = createRedmineConnector({
  baseUrl: process.env.REDMINE_BASE_URL,
  apiKey: process.env.REDMINE_API_KEY
});

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (url.pathname === "/api/config") {
      return sendJson(res, {
        ...redmine.getConfig(),
        setup: [
          ".env に REDMINE_BASE_URL を設定する",
          ".env に REDMINE_API_KEY を設定する",
          "Redmine の管理画面で REST API を有効にする",
          "Redmine の個人設定から API キーを取得する"
        ]
      });
    }

    if (url.pathname === "/api/issues") {
      return handleIssues(url, res);
    }

    if (url.pathname === "/api/chat" && req.method === "POST") {
      return handleChat(req, res);
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    return sendJson(res, { error: "Internal server error" }, 500);
  }
});

server.listen(port, () => {
  console.log(`AIRedmine is running at http://localhost:${port}`);
  if (redmine.getConfig().mode === "mock") {
    console.log("REDMINE_BASE_URL or REDMINE_API_KEY is not set. Using mock data.");
  }
});

async function handleIssues(url, res) {
  try {
    return sendJson(res, await redmine.listIssues(url.searchParams));
  } catch (error) {
    if (error instanceof RedmineApiError) {
      res.writeHead(error.status, { "Content-Type": error.contentType });
      return res.end(error.body);
    }
    throw error;
  }
}

async function handleChat(req, res) {
  const body = await readJsonBody(req);
  const question = String(body.question || "").trim();

  if (!question) {
    return sendJson(res, { error: "question is required" }, 400);
  }

  try {
    const [issues, knowledge] = await Promise.all([
      redmine.listIssues(new URLSearchParams({
        assigned_to_id: "me",
        status_id: "*",
        limit: "100"
      })),
      readKnowledgeBase()
    ]);

    return sendJson(res, buildChatResponse(question, issues.issues || [], knowledge));
  } catch (error) {
    if (error instanceof RedmineApiError) {
      res.writeHead(error.status, { "Content-Type": error.contentType });
      return res.end(error.body);
    }
    throw error;
  }
}

async function serveStatic(pathname, res) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = normalize(join(publicDir, safePath));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  try {
    const content = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    return res.end(content);
  } catch {
    const content = await readFile(join(publicDir, "index.html"));
    res.writeHead(200, {
      "Content-Type": mimeTypes[".html"],
      "Cache-Control": "no-store"
    });
    return res.end(content);
  }
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function readKnowledgeBase() {
  const files = [
    "README.md",
    "docs/roadmap.md",
    "docs/issues.md",
    "docs/issueslog.md"
  ];

  const entries = await Promise.all(files.map(async (path) => {
    try {
      const content = await readFile(join(rootDir, path), "utf8");
      return { path, content };
    } catch {
      return { path, content: "" };
    }
  }));

  return entries;
}

function buildChatResponse(question, issues, knowledge) {
  const normalized = question.toLowerCase();
  const updateIntent = isUpdateRequest(normalized);
  const requestedIssueId = extractIssueId(question);
  const requestedIssue = requestedIssueId
    ? issues.find((issue) => issue.id === requestedIssueId)
    : null;
  const staleIssues = issues.filter((issue) => daysSince(issue.updated_on) >= 5);
  const pmIssues = issues.filter((issue) => includesAny(issue.subject, ["pm判断", "判断待ち", "確認待ち"]));
  const highPriorityIssues = issues.filter(isHighPriority);
  const rankedIssues = [...issues].sort((a, b) => issueScore(b) - issueScore(a));
  const references = [];
  let answer = "";

  if (requestedIssueId && !requestedIssue) {
    answer = `#${requestedIssueId} に該当する issue は、現在取得できる Redmine issue の中では見つかりませんでした。番号、担当、状態フィルタを確認してください。`;
  } else if (requestedIssue) {
    answer = issueSpecificAnswer(question, requestedIssue);
    references.push(issueReference(requestedIssue));
  } else if (includesAny(normalized, ["今日", "まず", "何から", "優先"])) {
    const target = rankedIssues[0];
    answer = target
      ? `今日まず見るなら #${target.id}「${target.subject}」です。優先度、更新日、判断待ちや停滞の兆候を合わせると、最初に状況を整理する価値があります。`
      : "現在の条件では未完了 issue が見つかりませんでした。";
    if (target) references.push(issueReference(target));
  } else if (includesAny(normalized, ["リスク", "止ま", "停滞", "遅れ"])) {
    answer = staleIssues.length
      ? `停滞リスクは ${staleIssues.length} 件あります。特に ${staleIssues.slice(0, 3).map((issue) => `#${issue.id}`).join(", ")} は更新日を確認し、止まっている理由を明確にしたいです。`
      : "5日以上更新されていない issue は見つかりませんでした。";
    references.push(...staleIssues.slice(0, 3).map(issueReference));
  } else if (includesAny(normalized, ["pm", "判断", "定例", "会議"])) {
    answer = pmIssues.length
      ? `PM が確認すべき判断待ちは ${pmIssues.length} 件あります。次の定例では ${pmIssues.slice(0, 3).map((issue) => `#${issue.id}「${issue.subject}」`).join("、")} を扱うとよさそうです。`
      : "PM 判断待ちとして目立つ issue は見つかりませんでした。";
    references.push(...pmIssues.slice(0, 3).map(issueReference));
  } else if (includesAny(normalized, ["高優先", "urgent", "high"])) {
    answer = highPriorityIssues.length
      ? `高優先度 issue は ${highPriorityIssues.length} 件あります。作業順は ${highPriorityIssues.slice(0, 3).map((issue) => `#${issue.id}`).join(" -> ")} の順で確認するのがよさそうです。`
      : "高優先度 issue は見つかりませんでした。";
    references.push(...highPriorityIssues.slice(0, 3).map(issueReference));
  } else {
    const docRefs = findKnowledgeReferences(question, knowledge);
    answer = docRefs.length
      ? "関連する知識ベースを見つけました。Redmine issue の状態と合わせて、背景や方針を確認できます。"
      : "質問に対して、Redmine の未完了 issue と docs の知識ベースを確認しました。より具体的に issue 番号、リスク、今日の作業、PM判断などを聞くと絞り込めます。";
    references.push(...docRefs);
    if (rankedIssues[0]) references.push(issueReference(rankedIssues[0]));
  }

  if (updateIntent) {
    const proposal = buildUpdateProposal(question, requestedIssue || references.find((reference) => reference.type === "issue"), issues);
    return {
      answer: `${answer}\n\n更新系の依頼として扱います。AIRedmine はここでは Redmine を直接更新せず、確認待ちの更新案だけを作成します。`,
      references: uniqueReferences(references),
      proposal
    };
  }

  return {
    answer,
    references: uniqueReferences(references),
    proposal: null
  };
}

function extractIssueId(question) {
  const patterns = [
    /#(\d+)/u,
    /\bissue\s*(\d+)\b/iu,
    /\bチケット\s*(\d+)\b/u,
    /\bissue番号\s*(\d+)\b/iu
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match) return Number(match[1]);
  }

  return null;
}

function isUpdateRequest(normalized) {
  if (includesAny(normalized, ["クローズして", "close", "閉じて"])) return true;
  if (includesAny(normalized, ["コメント案", "コメントを書", "投稿して"])) return true;
  if (includesAny(normalized, ["ステータス変更案", "ステータスを", "状態を変更"])) return true;
  if (includesAny(normalized, ["更新案", "反映して", "下書き", "作って"])) return true;
  return false;
}

function issueSpecificAnswer(question, issue) {
  const normalized = question.toLowerCase();
  const status = issue.status?.name || "Unknown";
  const priority = issue.priority?.name || "Normal";
  const updated = daysSince(issue.updated_on);
  const base = `#${issue.id}「${issue.subject}」は、状態が ${status}、優先度が ${priority}、最終更新が ${updated} 日前の issue です。`;

  if (includesAny(normalized, ["背景", "なぜ", "context", "理由"])) {
    return `${base}\n\n背景を確認するには、Redmine の説明、コメント履歴、関連 docs を見る必要があります。現時点では、件名と状態から作業上の意味を整理すると「${issueIntent(issue)}」です。`;
  }

  if (includesAny(normalized, ["次", "アクション", "どうする", "何を"])) {
    return `${base}\n\n次アクションは「${nextIssueAction(issue)}」です。判断や仕様確認が含まれる場合は、実装より先に人間が確認する項目を明確にしてください。`;
  }

  if (includesAny(normalized, ["クローズ", "close", "完了", "閉じ"])) {
    return `${base}\n\nクローズ可否は、完了条件、テスト結果、残リスク、Redmine コメントが揃っているかで判断してください。AIRedmine は直接クローズせず、確認待ちの更新案として扱います。`;
  }

  return `${base}\n\nこの issue について、背景、次アクション、クローズ可否のどれを確認したいかを指定すると、さらに絞って回答できます。`;
}

function issueIntent(issue) {
  const subject = issue.subject || "";
  if (includesAny(subject, ["pm判断", "判断待ち"])) return "PM の判断が後続作業を左右する issue";
  if (includesAny(subject, ["仕様", "確認待ち", "承認"])) return "仕様や承認境界を揃える必要がある issue";
  if (includesAny(subject, ["停滞", "リスク"])) return "停滞理由を確認して再度動かす必要がある issue";
  if (includesAny(subject, ["クローズ候補", "完了"])) return "完了条件とテスト結果を確認する issue";
  if (isHighPriority(issue)) return "優先度が高く、早めに着手条件を確認したい issue";
  return "内容を確認して次の作業またはコメント更新に進む issue";
}

function nextIssueAction(issue) {
  const subject = issue.subject || "";
  if (includesAny(subject, ["pm判断", "判断待ち"])) return "判断材料を整理し、PM が決める選択肢を明確にする";
  if (includesAny(subject, ["仕様", "確認待ち", "承認"])) return "要求仕様、機能仕様、テスト仕様の未確定点を洗い出す";
  if (includesAny(subject, ["停滞", "リスク"])) return "止まっている理由と次に動かす担当を確認する";
  if (includesAny(subject, ["クローズ候補", "完了"])) return "テスト結果と完了条件を照合し、クローズ可否を判定する";
  if (isHighPriority(issue)) return "着手条件とブロッカーを確認し、今日の作業に入れるか判断する";
  return "内容と最新コメントを確認し、実装またはコメント更新に進む";
}

function buildUpdateProposal(question, target, issues) {
  const normalized = question.toLowerCase();
  const targetIssue = resolveProposalIssue(target, issues);
  const action = classifyUpdateAction(normalized);

  return {
    status: "confirmation_required",
    title: proposalTitle(action),
    action,
    targetIssue: targetIssue ? issueReference(targetIssue) : null,
    changeSummary: proposalChangeSummary(action, targetIssue),
    draft: proposalDraft(action, targetIssue),
    reason: "自然言語対話からの更新依頼は、人間の確認後に反映する必要があります。",
    checklist: proposalChecklist(action),
    nextStep: "Milestone 4 の Redmine 更新前確認フローで、差分、理由、影響範囲を確認します。"
  };
}

function resolveProposalIssue(target, issues) {
  if (!target) return null;
  if (target.subject) return target;
  if (target.type === "issue") return issues.find((issue) => issue.id === target.id) || null;
  return null;
}

function classifyUpdateAction(normalized) {
  if (includesAny(normalized, ["クローズ", "close", "完了", "閉じ"])) return "close_candidate";
  if (includesAny(normalized, ["ステータス", "状態", "進行中", "完了に", "resolved"])) return "status_change";
  return "comment";
}

function proposalTitle(action) {
  if (action === "close_candidate") return "クローズ確認案";
  if (action === "status_change") return "ステータス変更案";
  return "Redmine コメント案";
}

function proposalChangeSummary(action, issue) {
  const target = issue ? `#${issue.id}「${issue.subject}」` : "対象 issue";
  if (action === "close_candidate") return `${target} をクローズ候補として確認します。`;
  if (action === "status_change") return `${target} のステータス変更候補を確認します。`;
  return `${target} に作業状況コメントを追加する候補です。`;
}

function proposalDraft(action, issue) {
  if (!issue) {
    return "対象 issue を確認したうえで、変更内容、理由、確認済み事項を記載してください。";
  }

  if (action === "close_candidate") {
    return [
      `#${issue.id} のクローズ候補です。`,
      `確認した完了条件: ${nextIssueAction(issue)}`,
      "確認したテスト結果: 未記入",
      "残リスク: 未記入",
      "クローズ前に、PMまたは担当者の最終確認をお願いします。"
    ].join("\n");
  }

  if (action === "status_change") {
    return [
      `#${issue.id} のステータス変更候補です。`,
      `現在の状態: ${issue.status?.name || "Unknown"}`,
      `変更理由: ${issueIntent(issue)}`,
      `次アクション: ${nextIssueAction(issue)}`,
      "変更先ステータスは、Redmine 上で確認してから選択してください。"
    ].join("\n");
  }

  return [
    `#${issue.id} の作業状況コメント案です。`,
    `現在の見立て: ${issueIntent(issue)}`,
    `次アクション: ${nextIssueAction(issue)}`,
    "確認事項: 完了条件、テスト結果、残リスクを追記してください。"
  ].join("\n");
}

function proposalChecklist(action) {
  if (action === "close_candidate") {
    return [
      "完了条件を満たしている",
      "テスト結果が記録されている",
      "残リスクが許容されている",
      "関係者の確認が済んでいる"
    ];
  }

  if (action === "status_change") {
    return [
      "変更先ステータスが正しい",
      "変更理由が説明できる",
      "担当者と関係者への影響が確認されている"
    ];
  }

  return [
    "コメント内容が事実に基づいている",
    "次アクションが明確である",
    "Redmine に書くべき情報だけが含まれている"
  ];
}

function findKnowledgeReferences(question, knowledge) {
  const words = queryTerms(question);

  return knowledge
    .flatMap((entry) => docSections(entry).map((section) => {
      const score = sectionScore(section, words);
      return {
        type: "doc",
        id: `${entry.path}#${section.heading}`,
        title: entry.path,
        source: "docs",
        heading: section.heading,
        excerpt: sectionExcerpt(section, words),
        score
      };
    }))
    .filter((entry) => entry.score > 0 && entry.excerpt)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function docSections(entry) {
  const sections = [];
  let current = {
    heading: entry.path,
    lines: []
  };

  for (const line of entry.content.split(/\r?\n/)) {
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      if (current.lines.length) sections.push(current);
      current = {
        heading: heading[2].trim(),
        lines: [line]
      };
      continue;
    }

    current.lines.push(line);
  }

  if (current.lines.length) sections.push(current);
  return sections.map((section) => ({
    ...section,
    body: section.lines.filter(Boolean).join("\n")
  }));
}

function sectionScore(section, words) {
  const heading = section.heading.toLowerCase();
  const body = section.body.toLowerCase();
  return words.reduce((score, word) => {
    const normalized = word.toLowerCase();
    if (heading.includes(normalized)) score += 5;
    if (body.includes(normalized)) score += 2;
    return score;
  }, 0);
}

function queryTerms(question) {
  const normalized = question.toLowerCase();
  const terms = normalized
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 2);
  const knownTerms = [
    "自然言語",
    "対話",
    "方針",
    "ロードマップ",
    "issue",
    "redmine",
    "知識ベース",
    "更新",
    "更新確認",
    "確認",
    "承認",
    "下書き",
    "根拠",
    "pm",
    "開発者"
  ];

  for (const term of knownTerms) {
    if (normalized.includes(term.toLowerCase())) terms.push(term.toLowerCase());
  }

  return [...new Set(terms)];
}

function sectionExcerpt(section, words) {
  const lines = section.body.split(/\r?\n/).filter(Boolean);
  const matched = lines.find((line) => {
    const normalized = line.toLowerCase();
    return words.some((word) => normalized.includes(word));
  });
  return (matched || lines[0] || "").slice(0, 180);
}

function uniqueReferences(references) {
  const seen = new Set();
  return references.filter((reference) => {
    const key = `${reference.type}:${reference.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function issueReference(issue) {
  return {
    type: "issue",
    id: issue.id,
    title: `#${issue.id} ${issue.subject}`,
    status: issue.status?.name || "Unknown",
    priority: issue.priority?.name || "Normal",
    project: issue.project?.name || "No project",
    assignee: issue.assigned_to?.name || "未割り当て",
    updated: issue.updated_on || null,
    updatedLabel: formatReferenceDate(issue.updated_on),
    reason: issueIntent(issue)
  };
}

function formatReferenceDate(value) {
  if (!value) return "更新日不明";
  const days = daysSince(value);
  if (days <= 0) return "今日更新";
  return `${days}日前に更新`;
}

function issueScore(issue) {
  let score = 0;
  if (isHighPriority(issue)) score += 30;
  if (daysSince(issue.updated_on) >= 5) score += 20;
  if (includesAny(issue.subject, ["pm判断", "判断待ち"])) score += 30;
  if (includesAny(issue.subject, ["仕様", "確認待ち"])) score += 20;
  if (includesAny(issue.subject, ["停滞", "リスク"])) score += 20;
  return score;
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

function loadDotEnv() {
  const envPath = join(rootDir, ".env");
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Missing .env is fine; the app will use mock data.
  }
}
