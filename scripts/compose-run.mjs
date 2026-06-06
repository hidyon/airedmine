import { spawn } from "node:child_process";
import { detectCompose } from "./compose-utils.mjs";

const compose = await detectCompose();
const args = [...compose.args, ...process.argv.slice(2)];

console.log(`Using ${compose.label}`);

const child = spawn(compose.command, args, {
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exitCode = code || 0;
});
