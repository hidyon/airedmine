import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { demoApiRoute, developerUser, issue1327, pmUser, viewport } from "./demo-browser-fixtures.mjs";

const appUrlArg = argValue("--app-url");
const appUrl = trimTrailingSlash(appUrlArg || process.env.AIREDMINE_SCREENSHOT_APP_URL || "http://127.0.0.1:5174");
const shouldStartServer = !appUrlArg && !process.env.AIREDMINE_SCREENSHOT_APP_URL;
const outDir = new URL("../docs/screenshots/", import.meta.url).pathname;

let server = null;

try {
  if (shouldStartServer) server = await startFrontendServer();

  const browser = await chromium.launch({ headless: true });
  await captureChat(browser);
  await captureDeveloperDashboard(browser);
  await captureDeveloperSemantic(browser);
  await capturePmDashboard(browser);
  await capturePmDashboardStats(browser);
  await capturePmChatEmpty(browser);
  await captureAudit(browser);
  await browser.close();

  console.log(`Screenshots written to ${outDir}`);
} finally {
  if (server) stopServer(server);
}

async function captureChat(browser) {
  const page = await newPage(browser, developerUser);
  await page.goto(`${appUrl}/developer/chat`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "全履歴" }).click();
  await page.getByText("Sprint 3 リリース判断").click();
  await page.getByText("ステータス変更提案").waitFor();
  await page.getByRole("button", { name: /#1327 月次勤怠/ }).last().click();
  await page.getByText("#1327 詳細").waitFor();
  await page.screenshot({ path: `${outDir}/developer-chat.png` });
  await page.close();
}

async function captureDeveloperDashboard(browser) {
  const page = await newPage(browser, developerUser);
  await page.goto(`${appUrl}/developer/dashboard`, { waitUntil: "networkidle" });
  await page.getByText("ブロッカー").waitFor();
  await page.getByRole("button", { name: /#1327/ }).click();
  await page.getByText("#1327 詳細").waitFor();
  await page.screenshot({ path: `${outDir}/developer-dashboard.png` });
  await page.close();
}

async function captureDeveloperSemantic(browser) {
  const page = await newPage(browser, developerUser);
  await page.goto(`${appUrl}/developer/chat`, { waitUntil: "networkidle" });
  await page.getByText("パフォーマンス相談の関連 issue").click();
  await page.getByText("意味的に近い").waitFor();
  await page.screenshot({ path: `${outDir}/developer-semantic.png` });
  await page.close();
}

async function capturePmDashboard(browser) {
  const page = await newPage(browser, pmUser);
  await page.goto(`${appUrl}/pm/dashboard`, { waitUntil: "networkidle" });
  await page.getByText(issue1327.subject).first().click();
  await page.getByText("#1327 詳細").waitFor();
  await page.waitForTimeout(1800); // recharts のバーンダウン描画アニメーション完了を待つ
  await page.screenshot({ path: `${outDir}/pm-dashboard.png` });
  await page.close();
}

async function capturePmDashboardStats(browser) {
  const page = await newPage(browser, pmUser);
  await page.goto(`${appUrl}/pm/dashboard`, { waitUntil: "networkidle" });
  await page.getByText("優先度サマリー").waitFor();
  // 統計部にフォーカスするため、メインのスクロールコンテナを最下部まで送る。
  await page.evaluate(() => {
    for (const el of document.querySelectorAll(".overflow-y-auto")) {
      if (el.clientHeight > 400 && el.scrollHeight > el.clientHeight) {
        el.scrollTop = el.scrollHeight;
      }
    }
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/pm-dashboard-stats.png` });
  await page.close();
}

async function capturePmChatEmpty(browser) {
  const page = await newPage(browser, pmUser);
  await page.goto(`${appUrl}/developer/chat`, { waitUntil: "networkidle" });
  await page.getByText("質問候補").waitFor();
  await page.getByText("PM 向け").waitFor();
  await page.screenshot({ path: `${outDir}/pm-chat-empty.png` });
  await page.close();
}

async function captureAudit(browser) {
  const page = await newPage(browser, pmUser);
  await page.goto(`${appUrl}/audit`, { waitUntil: "networkidle" });
  await page.getByText("validation", { exact: true }).waitFor();
  await page.screenshot({ path: `${outDir}/audit-view.png` });
  await page.close();
}

async function newPage(browser, user) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.addInitScript(({ user }) => {
    localStorage.setItem("airedmine_token", "screenshot-token");
    localStorage.setItem("airedmine_user", JSON.stringify(user));
  }, { user });
  await page.route("**/api/**", demoApiRoute);
  return page;
}

async function startFrontendServer() {
  const frontendDir = fileURLToPath(new URL("../frontend", import.meta.url));
  const child = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5174"], {
    cwd: frontendDir,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  await waitForUrl(appUrl, 20000, child, () => output);
  return child;
}

function stopServer(child) {
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

async function waitForUrl(url, timeoutMs, child = null, output = () => "") {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child?.exitCode != null) {
      throw new Error(`Frontend dev server exited with ${child.exitCode}\n${output()}`);
    }
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server is still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}\n${output()}`);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
