import { spawn } from "node:child_process";
import fs from "node:fs";

const cmd = process.argv[2];
const args = process.argv.slice(3);

if (!cmd) {
  console.error("usage: node scripts/ci/run_with_log.mjs <cmd> [args...]");
  process.exit(2);
}

const logPath = "ci_governance_proof.log";
const out = fs.createWriteStream(logPath, { flags: "w" });

const child = spawn(cmd, args, { shell: true });

child.stdout.on("data", (data) => {
  process.stdout.write(data);
  out.write(data);
});

child.stderr.on("data", (data) => {
  process.stderr.write(data);
  out.write(data);
});

child.on("close", (code) => {
  out.end();
  process.exit(code ?? 1);
});
