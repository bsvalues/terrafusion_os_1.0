/**
 * tf lint – run linters
 *
 * Subcommands:
 *   (none)     Run all linters
 *   frontend   Run frontend linter (ESLint)
 *   backend    Run backend linter (dotnet format --verify-no-changes)
 */

import { npmScript } from "../lib/spawn-delegate.mjs";

const SUBS = {
  frontend: { desc: "Run frontend linter (ESLint)", script: "lint" },
  backend:  { desc: "Run backend linter (dotnet format check)", script: "dotnet:format:check" },
};

function printHelp() {
  const lines = [
    "",
    "tf lint – run linters",
    "",
    "Usage:  tf lint [subcommand]",
    "",
    "Subcommands:",
    "  (none)       Run all linters",
  ];
  for (const [name, sub] of Object.entries(SUBS)) {
    lines.push(`  ${name.padEnd(12)} ${sub.desc}`);
  }
  lines.push("");
  process.stdout.write(lines.join("\n") + "\n");
}

export default async function lint({ root, flags, rest }) {
  if (flags.help) { printHelp(); return 0; }

  const sub = rest[0];

  if (!sub) {
    return npmScript("lint", [], { cwd: root });
  }

  const entry = SUBS[sub];
  if (!entry) {
    process.stderr.write(`Unknown lint subcommand: ${sub}\n`);
    printHelp();
    return 1;
  }

  return npmScript(entry.script, [], { cwd: root });
}
