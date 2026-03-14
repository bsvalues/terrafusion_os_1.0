/**
 * tf canon – governance gates (delegates to tools/canon/canon.mjs)
 *
 * Subcommands:
 *   doctor     Health report
 *   gatefast   Minimal safe gates
 *   ping       TerraPilot read-only ping
 */

import path from "node:path";
import { delegate } from "../lib/spawn-delegate.mjs";

const SUBS = {
  doctor:   { desc: "Health report" },
  gatefast: { desc: "Minimal safe gates (doctor + naming lint)" },
  ping:     { desc: "TerraPilot read-only ping" },
};

function printHelp() {
  const lines = [
    "",
    "tf canon – governance gates",
    "",
    "Usage:  tf canon <subcommand> [flags]",
    "",
    "Subcommands:",
  ];
  for (const [name, sub] of Object.entries(SUBS)) {
    lines.push(`  ${name.padEnd(12)} ${sub.desc}`);
  }
  lines.push("");
  lines.push("Flags:");
  lines.push("  --json       JSON output");
  lines.push("  --dry        Dry-run mode");
  lines.push("");
  process.stdout.write(lines.join("\n") + "\n");
}

export default async function canon({ root, flags, rest }) {
  if (flags.help || !rest[0]) { printHelp(); return 0; }

  const sub = rest[0];
  if (!SUBS[sub]) {
    process.stderr.write(`Unknown canon subcommand: ${sub}\n`);
    printHelp();
    return 1;
  }

  const scriptPath = path.join(root, "tools", "canon", "canon.mjs");
  const passArgs = [scriptPath, sub];
  if (flags.json) passArgs.push("--json");
  if (flags.dry) passArgs.push("--dry");

  return delegate("node", passArgs, { cwd: root });
}
