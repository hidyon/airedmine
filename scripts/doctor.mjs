import { existsSync, readFileSync } from "node:fs";
import { detectCompose, getRunningComposeServices } from "./compose-utils.mjs";

const appUrl = trimTrailingSlash(process.env.AIREDMINE_APP_URL || "http://localhost:5173");
const redmineUrl = trimTrailingSlash(process.env.REDMINE_PUBLIC_URL || "http://localhost:3000");
const env = loadEnvFile();
const results = [];

await checkNode();
await checkCompose();
await checkEnv();
await checkServices();
await checkAppConfig();
await checkIssuesApi();

printResults();

if (results.some((result) => result.level === "fail")) {
  process.exitCode = 1;
}

async function checkNode() {
  const major = Number(process.versions.node.split(".")[0]);
  addResult({
    name: "Node.js",
    level: major >= 20 ? "pass" : "fail",
    detail: `v${process.versions.node}`,
    hint: "Node.js 20 以上を使ってください。"
  });
}

async function checkCompose() {
  try {
    const compose = await detectCompose();
    addResult({
      name: "Docker Compose command",
      level: compose.isV2 ? "pass" : "warn",
      detail: compose.version,
      hint: "Compose v2 の docker compose が推奨です。docker-compose v1 でも当面はフォールバックします。"
    });
  } catch (error) {
    addResult({
      name: "Docker Compose command",
      level: "fail",
      detail: error.message,
      hint: "Docker Compose をインストールしてください。"
    });
  }
}

async function checkEnv() {
  const missing = [];
  if (!env.exists) missing.push(".env");
  if (!env.values.REDMINE_API_KEY) missing.push("REDMINE_API_KEY");

  addResult({
    name: ".env",
    level: missing.length ? "fail" : "pass",
    detail: missing.length ? `Missing: ${missing.join(", ")}` : "REDMINE_API_KEY is set",
    hint: "Redmine の個人設定から API キーを取得し、.env に REDMINE_API_KEY を設定してください。"
  });
}

async function checkServices() {
  try {
    const running = new Set(await getRunningComposeServices());
    const required = ["app", "redmine", "redmine-db"];
    const missing = required.filter((service) => !running.has(service));
    addResult({
      name: "Compose services",
      level: missing.length ? "fail" : "pass",
      detail: missing.length ? `Not running: ${missing.join(", ")}` : `Running: ${required.join(", ")}`,
      hint: "docker compose up -d または docker-compose up -d を実行してください。"
    });
  } catch (error) {
    addResult({
      name: "Compose services",
      level: "fail",
      detail: error.message,
      hint: "Docker daemon と Compose project の状態を確認してください。"
    });
  }
}

async function checkAppConfig() {
  try {
    const data = await fetchJson(`${appUrl}/api/config`);
    addResult({
      name: "AIRedmine config",
      level: data.connected ? "pass" : "fail",
      detail: `mode=${data.mode} connected=${Boolean(data.connected)} redmine=${data.baseUrl || "none"}`,
      hint: "app コンテナに REDMINE_API_KEY が渡っているか、Redmine REST API が有効か確認してください。"
    });
  } catch (error) {
    addResult({
      name: "AIRedmine config",
      level: "fail",
      detail: error.message,
      hint: `AIRedmine app が ${appUrl} で起動しているか確認してください。`
    });
  }
}

async function checkIssuesApi() {
  try {
    const data = await fetchJson(`${appUrl}/api/issues?status_id=open`);
    addResult({
      name: "AIRedmine issues API",
      level: Array.isArray(data.issues) ? "pass" : "fail",
      detail: Array.isArray(data.issues) ? `issues=${data.issues.length}` : "issues array not found",
      hint: "Redmine の REST API、API キー、対象 project / issue を確認してください。"
    });
  } catch (error) {
    addResult({
      name: "AIRedmine issues API",
      level: "fail",
      detail: error.message,
      hint: "Redmine API キー、REST API 有効化、接続先 URL を確認してください。"
    });
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} ${text.slice(0, 160)}`);
  }
  return JSON.parse(text);
}

function loadEnvFile() {
  const path = ".env";
  const values = {};
  if (!existsSync(path)) return { exists: false, values };

  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    values[key] = value;
  }

  return { exists: true, values };
}

function addResult(result) {
  results.push(result);
}

function printResults() {
  console.log("AIRedmine doctor");
  for (const result of results) {
    const label = result.level === "pass" ? "OK " : result.level === "warn" ? "WARN" : "NG ";
    console.log(`${label} ${result.name}: ${result.detail}`);
    if (result.level !== "pass" && result.hint) {
      console.log(`     next: ${result.hint}`);
    }
  }
  console.log(`URLs: app=${appUrl} redmine=${redmineUrl}`);
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
