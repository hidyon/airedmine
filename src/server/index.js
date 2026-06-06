import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = normalize(join(__dirname, "../.."));
const publicDir = join(rootDir, "src/public");

loadDotEnv();

const port = Number(process.env.PORT || 5173);
const redmineBaseUrl = trimTrailingSlash(process.env.REDMINE_BASE_URL || "");
const redmineApiKey = process.env.REDMINE_API_KEY || "";

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
        connected: Boolean(redmineBaseUrl && redmineApiKey),
        mode: redmineBaseUrl && redmineApiKey ? "redmine" : "mock",
        baseUrl: redmineBaseUrl || null,
        missing: getMissingConfig(),
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

    return serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    return sendJson(res, { error: "Internal server error" }, 500);
  }
});

server.listen(port, () => {
  console.log(`Airedmaine is running at http://localhost:${port}`);
  if (!redmineBaseUrl || !redmineApiKey) {
    console.log("REDMINE_BASE_URL or REDMINE_API_KEY is not set. Using mock data.");
  }
});

async function handleIssues(url, res) {
  if (!redmineBaseUrl || !redmineApiKey) {
    return sendJson(res, mockIssuesResponse(url));
  }

  const params = new URLSearchParams({
    assigned_to_id: url.searchParams.get("assigned_to_id") || "me",
    status_id: url.searchParams.get("status_id") || "open",
    limit: url.searchParams.get("limit") || "100",
    sort: url.searchParams.get("sort") || "updated_on:desc"
  });

  const redmineUrl = `${redmineBaseUrl}/issues.json?${params.toString()}`;
  const response = await fetch(redmineUrl, {
    headers: {
      "Accept": "application/json",
      "X-Redmine-API-Key": redmineApiKey
    }
  });

  const body = await response.text();
  res.writeHead(response.status, {
    "Content-Type": response.headers.get("content-type") || "application/json; charset=utf-8"
  });
  res.end(body);
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
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream"
    });
    return res.end(content);
  } catch {
    const content = await readFile(join(publicDir, "index.html"));
    res.writeHead(200, { "Content-Type": mimeTypes[".html"] });
    return res.end(content);
  }
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
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

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function getMissingConfig() {
  return [
    ["REDMINE_BASE_URL", redmineBaseUrl],
    ["REDMINE_API_KEY", redmineApiKey]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

function mockIssuesResponse(url) {
  const statusId = url.searchParams.get("status_id") || "open";
  const limit = Number(url.searchParams.get("limit") || 100);
  const allIssues = getMockIssues();
  const issues = allIssues
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
