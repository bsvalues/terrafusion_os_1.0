/**
 * tf build – build the project
 *
 * Subcommands:
 *   (none)     Build everything (backend + frontend)
 *   frontend   Build frontend only
 *   backend    Build backend only
 */

import { npmScript } from "../lib/spawn-delegate.mjs";

const SUBS = {
  frontend: { desc: "Build frontend (Vite → native-shell/ui/dist)", script: "frontend:build" },
  backend:  { desc: "Build backend (.NET Release)", script: "backend:build" },
};

function printHelp() {
  const lines = [
    "",
    "tf build – build the project",
    "",
    "Usage:  tf build [subcommand]",
    "",
    "Subcommands:",
    "  (none)       Build everything (backend + frontend)",
  ];
  for (const [name, sub] of Object.entries(SUBS)) {
    lines.push(`  ${name.padEnd(12)} ${sub.desc}`);
  }
  lines.push("");
  process.stdout.write(lines.join("\n") + "\n");
}

export default async function build({ root, flags, rest }) {
  if (flags.help) { printHelp(); return 0; }

  const sub = rest[0];

  if (!sub) {
    return npmScript("build", [], { cwd: root });
  }

  const entry = SUBS[sub];
  if (!entry) {
    process.stderr.write(`Unknown build subcommand: ${sub}\n`);
    printHelp();
    return 1;
  }

  return npmScript(entry.script, [], { cwd: root });
}
