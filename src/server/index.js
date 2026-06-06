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
        status_id: "open",
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
  const updateIntent = includesAny(normalized, ["更新", "コメント", "投稿", "クローズ", "close", "ステータス変更", "反映"]);
  const staleIssues = issues.filter((issue) => daysSince(issue.updated_on) >= 5);
  const pmIssues = issues.filter((issue) => includesAny(issue.subject, ["pm判断", "判断待ち", "確認待ち"]));
  const highPriorityIssues = issues.filter(isHighPriority);
  const rankedIssues = [...issues].sort((a, b) => issueScore(b) - issueScore(a));
  const references = [];
  let answer = "";

  if (includesAny(normalized, ["今日", "まず", "何から", "優先"])) {
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
    return {
      answer: `${answer}\n\n更新系の依頼として扱います。AIRedmine はここでは Redmine を直接更新せず、確認待ちの更新案だけを作成します。`,
      references: uniqueReferences(references),
      proposal: {
        status: "confirmation_required",
        title: "Redmine 更新案",
        action: "comment_or_status_update",
        reason: "自然言語対話からの更新依頼は、人間の確認後に反映する必要があります。",
        nextStep: "Milestone 4 の Redmine 更新前確認フローで、差分、理由、影響範囲を確認します。"
      }
    };
  }

  return {
    answer,
    references: uniqueReferences(references),
    proposal: null
  };
}

function findKnowledgeReferences(question, knowledge) {
  const words = queryTerms(question);

  return knowledge
    .map((entry) => ({
      type: "doc",
      id: entry.path,
      title: entry.path,
      excerpt: excerptFor(entry.content, words)
    }))
    .filter((entry) => entry.excerpt)
    .slice(0, 3);
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
    "確認",
    "承認",
    "pm",
    "開発者"
  ];

  for (const term of knownTerms) {
    if (normalized.includes(term.toLowerCase())) terms.push(term.toLowerCase());
  }

  return [...new Set(terms)];
}

function excerptFor(content, words) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  const matched = lines.find((line) => {
    const normalized = line.toLowerCase();
    return words.some((word) => normalized.includes(word));
  });
  return matched ? matched.slice(0, 160) : "";
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
    priority: issue.priority?.name || "Normal"
  };
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
