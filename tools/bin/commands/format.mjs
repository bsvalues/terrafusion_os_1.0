/**
 * tf format – run formatters
 *
 * Subcommands:
 *   (none)     Run all formatters
 *   frontend   Run frontend formatter (Prettier)
 *   backend    Run backend formatter (dotnet format)
 */

import { npmScript } from "../lib/spawn-delegate.mjs";

const SUBS = {
  frontend: { desc: "Run frontend formatter (Prettier)", script: "format" },
  backend:  { desc: "Run backend formatter (dotnet format)", script: "dotnet:format" },
};

function printHelp() {
  const lines = [
    "",
    "tf format – run formatters",
    "",
    "Usage:  tf format [subcommand]",
    "",
    "Subcommands:",
    "  (none)       Run all formatters",
  ];
  for (const [name, sub] of Object.entries(SUBS)) {
    lines.push(`  ${name.padEnd(12)} ${sub.desc}`);
  }
  lines.push("");
  process.stdout.write(lines.join("\n") + "\n");
}

export default async function format({ root, flags, rest }) {
  if (flags.help) { printHelp(); return 0; }

  const sub = rest[0];

  if (!sub) {
    return npmScript("format", [], { cwd: root });
  }

  const entry = SUBS[sub];
  if (!entry) {
    process.stderr.write(`Unknown format subcommand: ${sub}\n`);
    printHelp();
    return 1;
  }

  return npmScript(entry.script, [], { cwd: root });
}
