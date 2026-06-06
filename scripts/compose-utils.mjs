import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function detectCompose() {
  try {
    const result = await execFileAsync("docker", ["compose", "version"]);
    return {
      command: "docker",
      args: ["compose"],
      label: "docker compose",
      version: result.stdout.trim() || result.stderr.trim(),
      isV2: true
    };
  } catch {
    const result = await execFileAsync("docker-compose", ["--version"]);
    return {
      command: "docker-compose",
      args: [],
      label: "docker-compose",
      version: result.stdout.trim() || result.stderr.trim(),
      isV2: false
    };
  }
}

export async function runCompose(args, options = {}) {
  const compose = await detectCompose();
  return execFileAsync(compose.command, [...compose.args, ...args], options);
}

export async function getRunningComposeServices() {
  const { stdout } = await runCompose([
    "ps",
    "--services",
    "--filter",
    "status=running"
  ]);

  return stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}
