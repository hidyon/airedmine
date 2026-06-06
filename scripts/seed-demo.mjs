import { runCompose } from "./compose-utils.mjs";

console.log("Seeding AIRedmine demo data into Redmine...");

try {
  const result = await runCompose([
    "exec",
    "-T",
    "redmine",
    "bundle",
    "exec",
    "rails",
    "runner",
    "/demo-scripts/seed-demo.rb"
  ], {
    maxBuffer: 1024 * 1024
  });

  if (result.stdout.trim()) console.log(maskSecrets(result.stdout.trim()));
  if (result.stderr.trim()) console.error(result.stderr.trim());
  console.log("Demo data seed completed. Restart the app service after updating .env if needed.");
} catch (error) {
  console.error("Demo data seed failed.");
  console.error(error.stdout || error.message);
  if (error.stderr) console.error(error.stderr);
  process.exitCode = 1;
}

function maskSecrets(value) {
  return value.replace(/("api_key"\s*:\s*")([^"]+)(")/g, "$1***$3");
}
