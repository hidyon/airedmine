import { detectCompose, getRunningComposeServices } from "./compose-utils.mjs";

const appUrl = trimTrailingSlash(process.env.AIREDMINE_APP_URL || "http://localhost:5173");
const redmineUrl = trimTrailingSlash(process.env.REDMINE_PUBLIC_URL || "http://localhost:3000");
const requiredServices = ["app", "redmine", "redmine-db"];
const results = [];

await checkComposeServices();
await checkHttp("AIRedmine HTTP", appUrl, { expect: (response) => response.ok });
await checkHttp("Redmine HTTP", redmineUrl, { expect: (response) => response.ok });
await checkJson("AIRedmine config API", `${appUrl}/api/config`, {
  expect: (data) => typeof data.connected === "boolean" && data.mode
});
await checkJson("AIRedmine issues API", `${appUrl}/api/issues?status_id=open`, {
  expect: (data) => Array.isArray(data.issues)
});

printResults();

if (results.some((result) => !result.ok)) {
  process.exitCode = 1;
}

async function checkComposeServices() {
  try {
    const compose = await detectCompose();
    const running = new Set(await getRunningComposeServices());
    const missing = requiredServices.filter((service) => !running.has(service));

    addResult({
      name: "Docker Compose services",
      ok: missing.length === 0,
      detail: missing.length
        ? `Not running: ${missing.join(", ")}`
        : `${compose.label}: running ${requiredServices.join(", ")}`
    });
  } catch (error) {
    addResult({
      name: "Docker Compose services",
      ok: false,
      detail: error.message
    });
  }
}

async function checkHttp(name, url, { expect }) {
  try {
    const response = await fetch(url);
    addResult({
      name,
      ok: expect(response),
      detail: `${response.status} ${response.statusText} ${url}`
    });
  } catch (error) {
    addResult({
      name,
      ok: false,
      detail: `${error.message} ${url}`
    });
  }
}

async function checkJson(name, url, { expect }) {
  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : null;
    addResult({
      name,
      ok: response.ok && expect(data || {}),
      detail: response.ok
        ? summarizeJson(data)
        : `${response.status} ${response.statusText}`
    });
  } catch (error) {
    addResult({
      name,
      ok: false,
      detail: `${error.message} ${url}`
    });
  }
}

function addResult(result) {
  results.push(result);
}

function printResults() {
  console.log("AIRedmine healthcheck");
  for (const result of results) {
    console.log(`${result.ok ? "OK " : "NG "} ${result.name}: ${result.detail}`);
  }
}

function summarizeJson(data) {
  if (!data || typeof data !== "object") return "JSON response received";
  if (Array.isArray(data.issues)) return `issues=${data.issues.length}`;
  if (data.mode) return `mode=${data.mode} connected=${Boolean(data.connected)}`;
  return "JSON response received";
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
