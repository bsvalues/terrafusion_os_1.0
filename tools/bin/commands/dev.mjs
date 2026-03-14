/**
 * tf dev – start development servers
 *
 * Subcommands:
 *   (none)     Start full stack (backend + frontend)
 *   frontend   Start frontend dev server only
 *   backend    Start backend API only
 *   modules    Start module launcher (dev-os.mjs)
 *   pilot      Start TerraPilot runtime
 */

import { delegate, npmScript } from "../lib/spawn-delegate.mjs";

const SUBS = {
  frontend: { desc: "Frontend dev server (Vite)", script: "dev:frontend" },
  backend:  { desc: "Backend API (dotnet watch)", script: "dev:backend" },
  modules:  { desc: "Module launcher (dev-os.mjs)", script: "dev:os:modules" },
  pilot:    { desc: "TerraPilot runtime", script: "dev:pilot" },
};

function printHelp() {
  const lines = [
    "",
    "tf dev – start development servers",
    "",
    "Usage:  tf dev [subcommand]",
    "",
    "Subcommands:",
    "  (none)       Start full stack (backend + frontend)",
  ];
  for (const [name, sub] of Object.entries(SUBS)) {
    lines.push(`  ${name.padEnd(12)} ${sub.desc}`);
  }
  lines.push("");
  process.stdout.write(lines.join("\n") + "\n");
}

export default async function dev({ root, flags, rest }) {
  if (flags.help) { printHelp(); return 0; }

  const sub = rest[0];

  if (!sub) {
    // Full stack
    return npmScript("dev", [], { cwd: root });
  }

  const entry = SUBS[sub];
  if (!entry) {
    process.stderr.write(`Unknown dev subcommand: ${sub}\n`);
    printHelp();
    return 1;
  }

  return npmScript(entry.script, [], { cwd: root });
}
