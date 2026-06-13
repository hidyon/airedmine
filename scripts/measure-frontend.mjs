import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";

const args = parseArgs(process.argv.slice(2));
const appUrl = trimTrailingSlash(args.appUrl || process.env.AIREDMINE_APP_URL || "http://localhost:5173");
const browserPath = args.browserPath || process.env.BROWSER_PATH || findBrowser();
const timeoutMs = Number.parseInt(args.timeoutMs || "20000", 10);

const targets = [
  { name: "Chat", path: "/developer/chat", role: "developer" },
  { name: "Developer Dashboard", path: "/developer/dashboard", role: "developer" },
  { name: "PM Dashboard", path: "/pm/dashboard", role: "pm" },
  { name: "Audit", path: "/audit", role: "developer" }
];

if (!browserPath) {
  console.error("Frontend measurement needs Chrome/Chromium.");
  console.error("Set BROWSER_PATH=/path/to/chrome or install chromium/google-chrome.");
  process.exit(1);
}

const userDataDir = mkdtempSync(join(tmpdir(), "airedmine-chrome-"));
const browser = spawn(browserPath, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-dev-shm-usage",
  `--user-data-dir=${userDataDir}`,
  "--remote-debugging-port=0",
  "about:blank"
], { stdio: ["ignore", "ignore", "pipe"] });

let browserExited = false;
browser.on("exit", () => {
  browserExited = true;
});

try {
  const wsUrl = await waitForDevtoolsUrl(browser, timeoutMs);
  const { port } = new URL(wsUrl);
  const results = [];

  for (const target of targets) {
    const pageWsUrl = await createPage(Number(port));
    const client = await CdpClient.connect(pageWsUrl);
    try {
      results.push(await measureTarget(client, target));
    } finally {
      client.close();
    }
  }

  printResults(results);
  if (results.some((r) => r.error)) process.exitCode = 1;
} finally {
  if (!browserExited) browser.kill("SIGTERM");
  rmSync(userDataDir, { recursive: true, force: true });
}

async function measureTarget(client, target) {
  const apiRequests = new Map();
  const apiResults = [];
  let loadMs = null;

  client.on("Network.requestWillBeSent", (params) => {
    if (!params.request?.url?.includes("/api/")) return;
    apiRequests.set(params.requestId, {
      url: params.request.url,
      method: params.request.method,
      started: params.timestamp
    });
  });

  client.on("Network.loadingFinished", (params) => {
    const req = apiRequests.get(params.requestId);
    if (!req) return;
    apiResults.push({
      method: req.method,
      path: new URL(req.url).pathname,
      duration_ms: round((params.timestamp - req.started) * 1000)
    });
    apiRequests.delete(params.requestId);
  });

  client.on("Network.loadingFailed", (params) => {
    const req = apiRequests.get(params.requestId);
    if (!req) return;
    apiResults.push({
      method: req.method,
      path: new URL(req.url).pathname,
      duration_ms: round((params.timestamp - req.started) * 1000),
      failed: true
    });
    apiRequests.delete(params.requestId);
  });

  const started = performance.now();
  const loadPromise = client.waitFor("Page.loadEventFired", timeoutMs).then(() => {
    loadMs = round(performance.now() - started);
  });

  await client.send("Page.enable");
  await client.send("Network.enable");
  await client.send("Runtime.enable");
  await client.send("Page.addScriptToEvaluateOnNewDocument", {
    source: sessionScript(target.role)
  });
  await client.send("Page.navigate", { url: `${appUrl}${target.path}` });
  await loadPromise;

  const readyMs = await waitForReady(client, started);
  const apiTotalMs = round(apiResults.reduce((sum, req) => sum + req.duration_ms, 0));
  const apiSlowest = [...apiResults].sort((a, b) => b.duration_ms - a.duration_ms)[0] || null;

  return {
    name: target.name,
    path: target.path,
    role: target.role,
    load_ms: loadMs,
    ready_ms: readyMs,
    api_count: apiResults.length,
    api_total_ms: apiTotalMs,
    slowest_api: apiSlowest,
    apis: apiResults
  };
}

async function waitForReady(client, started) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const text = document.body?.innerText || "";
        const hasLoading = /読み込み中|統計データ読み込み中/.test(text);
        const hasLogin = location.pathname === "/login";
        return { ready: !hasLoading && !hasLogin, path: location.pathname, text: text.slice(0, 120) };
      })()`,
      returnByValue: true
    });
    const value = result.result?.value;
    if (value?.ready) return round(performance.now() - started);
    await sleep(100);
  }
  throw new Error("Timed out waiting for frontend ready state");
}

async function createPage(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  if (!response.ok) throw new Error(`Failed to create page: ${response.status} ${response.statusText}`);
  const data = await response.json();
  return data.webSocketDebuggerUrl;
}

function sessionScript(role) {
  const user = role === "pm"
    ? { user_id: 6, username: "nakamura", display_name: "中村 雄二", role: "pm", redmine_user_id: 9 }
    : { user_id: 1, username: "admin", display_name: "Redmine Admin", role: "developer", redmine_user_id: 1 };
  return `
    localStorage.setItem("airedmine_token", "frontend-perf-token");
    localStorage.setItem("airedmine_user", ${JSON.stringify(JSON.stringify(user))});
  `;
}

function printResults(results) {
  console.log("AIRedmine frontend performance measurement");
  console.log(`app_url=${appUrl}`);
  console.log("");
  console.log("| View | path | load ms | ready ms | API count | API total ms | slowest API |");
  console.log("| --- | --- | ---: | ---: | ---: | ---: | --- |");
  for (const result of results) {
    const slowest = result.slowest_api
      ? `${result.slowest_api.method} ${result.slowest_api.path} ${result.slowest_api.duration_ms}ms`
      : "";
    console.log(`| ${result.name} | ${result.path} | ${result.load_ms} | ${result.ready_ms} | ${result.api_count} | ${result.api_total_ms} | ${slowest} |`);
  }
}

async function waitForDevtoolsUrl(child, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out waiting for DevTools endpoint")), timeout);
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      const match = chunk.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Browser exited before DevTools endpoint was ready: ${code}`));
    });
  });
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
    this.buffer = Buffer.alloc(0);
    socket.on("data", (data) => this.handleData(data));
    socket.on("error", (error) => {
      for (const { reject } of this.pending.values()) reject(error);
      this.pending.clear();
    });
  }

  static async connect(wsUrl) {
    const url = new URL(wsUrl);
    const socket = net.createConnection({ host: url.hostname, port: Number(url.port) });
    await new Promise((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
    });
    const key = randomBytes(16).toString("base64");
    socket.write([
      `GET ${url.pathname}${url.search} HTTP/1.1`,
      `Host: ${url.host}`,
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Key: ${key}`,
      "Sec-WebSocket-Version: 13",
      "",
      ""
    ].join("\r\n"));
    await waitForHandshake(socket, key);
    return new CdpClient(socket);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    this.socket.write(encodeFrame(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  waitFor(method, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(method, handler);
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeout);
      const handler = (params) => {
        clearTimeout(timer);
        this.off(method, handler);
        resolve(params);
      };
      this.on(method, handler);
    });
  }

  on(method, handler) {
    const handlers = this.handlers.get(method) || new Set();
    handlers.add(handler);
    this.handlers.set(method, handlers);
  }

  off(method, handler) {
    this.handlers.get(method)?.delete(handler);
  }

  close() {
    this.socket.end();
  }

  handleData(data) {
    this.buffer = Buffer.concat([this.buffer, data]);
    while (true) {
      const decoded = decodeFrame(this.buffer);
      if (!decoded) return;
      this.buffer = this.buffer.subarray(decoded.consumed);
      const message = JSON.parse(decoded.payload);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        message.error ? reject(new Error(message.error.message)) : resolve(message.result);
      } else if (message.method) {
        for (const handler of this.handlers.get(message.method) || []) handler(message.params);
      }
    }
  }
}

function waitForHandshake(socket, key) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      if (!buffer.includes("\r\n\r\n")) return;
      socket.off("data", onData);
      const expected = createHash("sha1")
        .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
        .digest("base64");
      if (!buffer.includes("101 Switching Protocols") || !buffer.includes(expected)) {
        reject(new Error("WebSocket handshake failed"));
        return;
      }
      resolve();
    };
    socket.on("data", onData);
    socket.once("error", reject);
  });
}

function encodeFrame(payload) {
  const data = Buffer.from(payload);
  const mask = randomBytes(4);
  const header = [];
  header.push(0x81);
  if (data.length < 126) {
    header.push(0x80 | data.length);
  } else if (data.length < 65536) {
    header.push(0x80 | 126, data.length >> 8, data.length & 0xff);
  } else {
    throw new Error("CDP frame too large");
  }
  const masked = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 1) masked[i] = data[i] ^ mask[i % 4];
  return Buffer.concat([Buffer.from(header), mask, masked]);
}

function decodeFrame(buffer) {
  if (buffer.length < 2) return null;
  const first = buffer[0];
  const opcode = first & 0x0f;
  if (opcode === 0x8) return { payload: "", consumed: buffer.length };
  let length = buffer[1] & 0x7f;
  let offset = 2;
  if (length === 126) {
    if (buffer.length < 4) return null;
    length = buffer.readUInt16BE(2);
    offset = 4;
  } else if (length === 127) {
    if (buffer.length < 10) return null;
    const high = buffer.readUInt32BE(2);
    const low = buffer.readUInt32BE(6);
    if (high !== 0) throw new Error("CDP frame too large");
    length = low;
    offset = 10;
  }
  if (buffer.length < offset + length) return null;
  return {
    payload: buffer.subarray(offset, offset + length).toString("utf8"),
    consumed: offset + length
  };
}

function findBrowser() {
  const candidates = [
    "chromium",
    "chromium-browser",
    "google-chrome",
    "google-chrome-stable",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ];
  for (const candidate of candidates) {
    const result = spawnSync("sh", ["-lc", `command -v "${candidate}"`], { encoding: "utf8" });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  }
  return "";
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (const arg of rawArgs) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    parsed[key] = match[2];
  }
  return parsed;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
