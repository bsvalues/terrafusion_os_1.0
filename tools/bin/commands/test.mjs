/**
 * tf test – run test suites
 *
 * Subcommands:
 *   (none)     Run unit tests (default)
 *   unit       Run unit tests
 *   all        Run all test suites
 *   governed   Run governed tests (type-check + phase83)
 *   canon      Run canon test suite
 *   naming     Run naming lint tests
 *   watch      Start test watcher
 */

import { npmScript } from "../lib/spawn-delegate.mjs";

const SUBS = {
  unit:     { desc: "Unit tests (vitest)", script: "test:unit" },
  all:      { desc: "All test suites", script: "test:all" },
  governed: { desc: "Governed tests (type-check + phase83)", script: "test:governed" },
  canon:    { desc: "Canon test suite", script: "test:canon-gatefast" },
  naming:   { desc: "Naming lint tests", script: "test:naming" },
  watch:    { desc: "Test watcher (vitest)", script: "test:watch" },
};

function printHelp() {
  const lines = [
    "",
    "tf test – run test suites",
    "",
    "Usage:  tf test [subcommand]",
    "",
    "Subcommands:",
    "  (none)       Run unit tests (default)",
  ];
  for (const [name, sub] of Object.entries(SUBS)) {
    lines.push(`  ${name.padEnd(12)} ${sub.desc}`);
  }
  lines.push("");
  process.stdout.write(lines.join("\n") + "\n");
}

export default async function test({ root, flags, rest }) {
  if (flags.help) { printHelp(); return 0; }

  const sub = rest[0] ?? "unit";
  const entry = SUBS[sub];

  if (!entry) {
    process.stderr.write(`Unknown test subcommand: ${sub}\n`);
    printHelp();
    return 1;
  }

  return npmScript(entry.script, [], { cwd: root });
}
