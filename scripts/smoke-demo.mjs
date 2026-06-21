import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { demoApiRoute, developerUser, issue1327, pmUser, viewport } from "./demo-browser-fixtures.mjs";

const appUrlArg = argValue("--app-url");
const appUrl = trimTrailingSlash(appUrlArg || process.env.AIREDMINE_SMOKE_APP_URL || "http://127.0.0.1:5175");
const shouldStartServer = !appUrlArg && !process.env.AIREDMINE_SMOKE_APP_URL;

let server = null;
let browser = null;

try {
  if (shouldStartServer) server = await startFrontendServer();

  browser = await chromium.launch({ headless: true });
  await smokeChat(browser);
  await smokeChatStartSuggestions(browser);
  await smokePmDashboard(browser);
  await smokeAudit(browser);

  console.log("Demo smoke test passed: Chat, PM Dashboard, Audit");
} finally {
  if (browser) await browser.close();
  if (server) stopServer(server);
}

async function smokeChat(browserInstance) {
  const page = await newPage(browserInstance, developerUser);
  await page.goto(`${appUrl}/developer/chat`, { waitUntil: "networkidle" });
  await visible(page.getByText("Chat", { exact: true }), "Chat view title");
  await page.getByRole("button", { name: "全履歴" }).click();
  await page.getByText("Sprint 3 リリース判断").click();
  await visible(page.getByText("ステータス変更提案"), "proposal card");
  await page.getByRole("button", { name: "実行" }).click();
  await visible(page.getByText("Audit を確認"), "proposal audit follow-up");
  await page.getByRole("button", { name: "#1327 詳細" }).click();
  await visible(page.getByText("#1327 詳細"), "Chat issue detail panel");
  await page.close();
}

async function smokeChatStartSuggestions(browserInstance) {
  const developerPage = await newPage(browserInstance, developerUser);
  await developerPage.goto(`${appUrl}/developer/chat`, { waitUntil: "networkidle" });
  await visible(developerPage.getByText("質問候補"), "developer prompt suggestions");
  await developerPage.getByText("今日の優先順").first().click();
  await expectInputValue(developerPage, "私の今日の issue を優先順に教えて");
  await developerPage.close();

  const pmPage = await newPage(browserInstance, pmUser);
  await pmPage.goto(`${appUrl}/developer/chat`, { waitUntil: "networkidle" });
  await visible(pmPage.getByText("PM 向け"), "pm prompt suggestions");
  await pmPage.getByText("定例アジェンダ").first().click();
  await expectInputValue(pmPage, "期限切れ・停滞・Urgent をまとめて次の定例アジェンダにして");
  await pmPage.close();
}

async function smokePmDashboard(browserInstance) {
  const page = await newPage(browserInstance, pmUser);
  await page.goto(`${appUrl}/pm/dashboard`, { waitUntil: "networkidle" });
  await visible(page.getByText("PM Dashboard", { exact: true }), "PM Dashboard title");
  await visible(page.getByText("担当者別 Open Issue 数"), "assignee load panel");
  await visible(page.getByText("期限切れ Issue"), "overdue panel");
  await page.getByText(issue1327.subject).first().click();
  await visible(page.getByText("#1327 詳細"), "PM issue detail panel");
  await page.close();
}

async function smokeAudit(browserInstance) {
  const page = await newPage(browserInstance, pmUser);
  await page.goto(`${appUrl}/audit`, { waitUntil: "networkidle" });
  await visible(page.getByText("Audit", { exact: true }), "Audit title");
  await visible(page.locator("span").filter({ hasText: /^成功$/ }), "success audit result");
  await visible(page.locator("span").filter({ hasText: /^失敗$/ }), "failure audit result");
  await visible(page.getByText("validation", { exact: true }), "validation category");
  await page.close();
}

async function visible(locator, label) {
  await locator.first().waitFor({ state: "visible", timeout: 10000 }).catch((error) => {
    throw new Error(`Expected visible: ${label}\n${error.message}`);
  });
}

async function expectInputValue(page, value) {
  const input = page.getByPlaceholder(/issue の状況や更新依頼/);
  await input.waitFor({ state: "visible", timeout: 10000 });
  const current = await input.inputValue();
  if (current !== value) {
    throw new Error(`Expected prompt input value "${value}", got "${current}"`);
  }
}

async function newPage(browserInstance, user) {
  const page = await browserInstance.newPage({ viewport, deviceScaleFactor: 1 });
  await page.addInitScript(({ user: currentUser }) => {
    localStorage.setItem("airedmine_token", "smoke-token");
    localStorage.setItem("airedmine_user", JSON.stringify(currentUser));
  }, { user });
  await page.route("**/api/**", demoApiRoute);
  return page;
}

async function startFrontendServer() {
  const frontendDir = fileURLToPath(new URL("../frontend", import.meta.url));
  const child = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5175"], {
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
