/**
 * tf ship – shipping protocol (push, PR, auto-merge)
 *
 * Delegates to tools/dev/tf-ship.mjs
 *
 * Flags:
 *   --dry-run     Print actions without executing
 *   --fast        Minimal local gates
 *   --force       Bypass diff size gate
 *   --skip-local  Skip local gates (not recommended)
 */

import path from "node:path";
import { delegate } from "../lib/spawn-delegate.mjs";

function printHelp() {
  const lines = [
    "",
    "tf ship – shipping protocol (push, PR, auto-merge)",
    "",
    "Usage:  tf ship [flags]",
    "",
    "Flags:",
    "  --dry-run      Print actions without executing",
    "  --fast         Minimal local gates (build + unit only)",
    "  --force        Bypass diff size gate",
    "  --skip-local   Skip local gates (not recommended)",
    "",
  ];
  process.stdout.write(lines.join("\n") + "\n");
}

export default async function ship({ root, flags, rest, argv }) {
  if (flags.help) { printHelp(); return 0; }

  const scriptPath = path.join(root, "tools", "dev", "tf-ship.mjs");

  // Pass through all original flags to tf-ship
  const passArgs = [];
  if (flags.dry) passArgs.push("--dry-run");
  // Also pass any raw flags from rest
  for (const arg of rest) {
    if (arg.startsWith("--")) passArgs.push(arg);
  }

  return delegate("node", [scriptPath, ...passArgs], { cwd: root });
}
