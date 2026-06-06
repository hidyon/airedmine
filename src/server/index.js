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

    return serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    return sendJson(res, { error: "Internal server error" }, 500);
  }
});

server.listen(port, () => {
  console.log(`Airedmaine is running at http://localhost:${port}`);
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
