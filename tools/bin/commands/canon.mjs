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
  release:  { desc: "Verify, record or show a historical native product receipt" },
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

export default async function canon({ root, flags, rest, argv }) {
  if (rest[0] === "release") {
    const { runReleaseCloseout } = await import("../../canon/release-closeout.mjs");
    // Preserve raw arguments: the top-level parser collapses duplicate boolean flags.
    const raw = Array.isArray(argv) && argv.length > 2 ? argv.slice(2) : ["canon", ...rest,
      ...(flags.json ? ["--json"] : []), ...(flags.dry ? ["--dry"] : []),
      ...(flags.help ? ["--help"] : []), ...(flags.verbose ? ["--verbose"] : [])];
    const releaseIndex = raw.indexOf("release");
    const prefix = raw.slice(0, releaseIndex).filter(arg => arg !== "canon");
    const { code, result } = await runReleaseCloseout([...raw.slice(releaseIndex + 1), ...prefix]);
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return code;
  }
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
