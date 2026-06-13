import { runCompose } from "./compose-utils.mjs";

const reset = process.argv.includes("--reset");

console.log(reset
  ? "Resetting and seeding AIRedmine demo data into Redmine..."
  : "Seeding AIRedmine demo data into Redmine...");

try {
  const args = [
    "exec",
    "-T"
  ];

  if (reset) {
    args.push("-e", "RESET_DEMO_PROJECT=1");
  }

  args.push(
    "redmine",
    "bundle",
    "exec",
    "rails",
    "runner",
    "/demo-scripts/seed-demo.rb"
  );

  const result = await runCompose(args, {
    maxBuffer: 1024 * 1024
  });

  if (result.stdout.trim()) console.log(maskSecrets(result.stdout.trim()));
  if (result.stderr.trim()) console.error(result.stderr.trim());
  console.log(reset
    ? "Demo data reset and seed completed. Restart the app service after updating .env if needed."
    : "Demo data seed completed. Restart the app service after updating .env if needed.");
} catch (error) {
  console.error(reset ? "Demo data reset failed." : "Demo data seed failed.");
  console.error(error.stdout || error.message);
  if (error.stderr) console.error(error.stderr);
  process.exitCode = 1;
}

function maskSecrets(value) {
  return value.replace(/("api_key"\s*:\s*")([^"]+)(")/g, "$1***$3");
}
