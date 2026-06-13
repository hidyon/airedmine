const DEFAULT_API_URL = "http://localhost:8000";
const args = parseArgs(process.argv.slice(2));
const apiUrl = trimTrailingSlash(args.apiUrl || process.env.AIREDMINE_API_URL || DEFAULT_API_URL);
const runs = positiveInt(args.runs, 5);
const chatRuns = args.skipChat ? 0 : positiveInt(args.chatRuns, 1);

const conditions = {
  api_url: apiUrl,
  runs,
  chat_runs: chatRuns,
  node: process.version,
  measured_at: new Date().toISOString()
};

const results = [];

console.log("AIRedmine API performance measurement");
console.log(`api_url=${apiUrl} runs=${runs} chat_runs=${chatRuns}`);

let issueForDetail = null;
try {
  const list = await requestJson("/api/issues?assigned_to_id=*&status_id=*&limit=1&sort=updated_on:desc");
  conditions.seed_issues_total = list.data.total_count ?? null;
  issueForDetail = list.data.issues?.[0]?.id ?? null;
} catch (error) {
  conditions.seed_issues_total = null;
  results.push(errorResult("seed issue discovery", error));
}

const targets = [
  {
    name: "GET /api/issues",
    method: "GET",
    path: "/api/issues?assigned_to_id=*&status_id=*&limit=100&sort=updated_on:desc",
    runs
  },
  {
    name: "GET /api/issues/{id}",
    method: "GET",
    path: issueForDetail ? `/api/issues/${issueForDetail}` : null,
    runs
  },
  {
    name: "GET /api/pm/stats",
    method: "GET",
    path: "/api/pm/stats",
    runs
  },
  {
    name: "GET /api/proposals/logs",
    method: "GET",
    path: "/api/proposals/logs",
    runs
  },
  {
    name: "POST /api/chat",
    method: "POST",
    path: "/api/chat",
    runs: chatRuns,
    body: {
      question: "私の今日の issue を優先順に教えて",
      session_id: `perf-${Date.now()}`,
      role: "developer",
      messages: [],
      redmine_user_id: 1,
      display_name: "Redmine Admin"
    }
  }
];

for (const target of targets) {
  if (target.runs === 0) {
    results.push({ name: target.name, skipped: true, reason: "runs=0" });
    continue;
  }
  if (!target.path) {
    results.push({ name: target.name, skipped: true, reason: "issue id was not discovered" });
    continue;
  }
  results.push(await measureTarget(target));
}

printSummary(conditions, results);

if (results.some((result) => result.error_count > 0 || result.discovery_error)) {
  process.exitCode = 1;
}

async function measureTarget(target) {
  const samples = [];
  const errors = [];

  for (let i = 0; i < target.runs; i += 1) {
    const started = performance.now();
    try {
      const response = await fetch(`${apiUrl}${target.path}`, {
        method: target.method,
        headers: { "Content-Type": "application/json" },
        body: target.body ? JSON.stringify(target.body) : undefined
      });
      const text = await response.text();
      const durationMs = performance.now() - started;
      if (!response.ok) {
        errors.push(`${response.status} ${response.statusText}: ${text.slice(0, 180)}`);
      } else {
        samples.push(durationMs);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  return {
    name: target.name,
    method: target.method,
    path: target.path,
    samples,
    error_count: errors.length,
    errors: errors.slice(0, 3),
    stats: summarize(samples)
  };
}

async function requestJson(path) {
  const started = performance.now();
  const response = await fetch(`${apiUrl}${path}`);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 180)}`);
  }
  return { data: JSON.parse(text), duration_ms: performance.now() - started };
}

function summarize(samples) {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  return {
    count: sorted.length,
    avg_ms: round(sum / sorted.length),
    min_ms: round(sorted[0]),
    max_ms: round(sorted[sorted.length - 1]),
    p95_ms: round(percentile(sorted, 0.95))
  };
}

function percentile(sorted, fraction) {
  const index = Math.max(0, Math.ceil(sorted.length * fraction) - 1);
  return sorted[index];
}

function printSummary(currentConditions, currentResults) {
  console.log("");
  console.log("Conditions");
  console.log(JSON.stringify(currentConditions, null, 2));
  console.log("");
  console.log("Results");
  console.log("| API | count | avg ms | min ms | p95 ms | max ms | errors |");
  console.log("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const result of currentResults) {
    if (result.skipped) {
      console.log(`| ${result.name} | skipped |  |  |  |  | ${result.reason} |`);
      continue;
    }
    if (result.discovery_error) {
      console.log(`| ${result.name} | 0 |  |  |  |  | ${result.error} |`);
      continue;
    }
    const stats = result.stats;
    console.log(
      `| ${result.name} | ${stats?.count ?? 0} | ${stats?.avg_ms ?? ""} | ${stats?.min_ms ?? ""} | ${stats?.p95_ms ?? ""} | ${stats?.max_ms ?? ""} | ${result.error_count} |`
    );
    for (const error of result.errors || []) {
      console.log(`  error: ${result.name}: ${error}`);
    }
  }
}

function errorResult(name, error) {
  return {
    name,
    discovery_error: true,
    error: error.message
  };
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (const arg of rawArgs) {
    if (arg === "--skip-chat") {
      parsed.skipChat = true;
      continue;
    }
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    parsed[key] = match[2];
  }
  return parsed;
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
