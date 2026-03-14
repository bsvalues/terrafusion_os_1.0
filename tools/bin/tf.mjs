#!/usr/bin/env node
/**
 * TerraFusion CLI – unified entry point
 *
 * Usage:  node tools/bin/tf.mjs <command> [options]
 *
 * Commands:
 *   version   Print TerraFusion OS version
 *   doctor    Run health checks (delegates to canon doctor)
 *   status    Show workspace status (node, git, ports)
 *
 * Global options:
 *   --json    Machine-readable JSON output
 *   --dry     Dry-run mode (no side-effects)
 *   --help    Show this help
 *
 * Zero external dependencies – uses only Node built-ins.
 */

import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

// ── Arg parsing ──────────────────────────────────────────────

function parseArgs(argv) {
  const raw = argv.slice(2);
  const flags = { json: false, dry: false, help: false, verbose: false };
  const positional = [];

  for (const arg of raw) {
    if (arg === "--json") flags.json = true;
    else if (arg === "--dry") flags.dry = true;
    else if (arg === "--help" || arg === "-h") flags.help = true;
    else if (arg === "--verbose" || arg === "-v") flags.verbose = true;
    else positional.push(arg);
  }

  return { command: positional[0] ?? null, rest: positional.slice(1), flags };
}

// ── Command registry ─────────────────────────────────────────

const COMMANDS = {
  version: {
    desc: "Print TerraFusion OS version",
    load: () => import("./commands/version.mjs"),
  },
  doctor: {
    desc: "Run health checks (delegates to canon doctor)",
    load: () => import("./commands/doctor.mjs"),
  },
  status: {
    desc: "Show workspace status (node, git, ports)",
    load: () => import("./commands/status.mjs"),
  },
  dev: {
    desc: "Start development servers",
    load: () => import("./commands/dev.mjs"),
  },
  test: {
    desc: "Run test suites",
    load: () => import("./commands/test.mjs"),
  },
  build: {
    desc: "Build the project",
    load: () => import("./commands/build.mjs"),
  },
  ship: {
    desc: "Ship protocol (push, PR, auto-merge)",
    load: () => import("./commands/ship.mjs"),
  },
  canon: {
    desc: "Governance gates",
    load: () => import("./commands/canon.mjs"),
  },
  inspect: {
    desc: "Agent-first discovery (scripts, ports, modules, tools)",
    load: () => import("./commands/inspect.mjs"),
  },
  repl: {
    desc: "Interactive CLI session",
    load: () => import("./commands/repl.mjs"),
  },
  format: {
    desc: "Run formatters",
    load: () => import("./commands/format.mjs"),
  },
  lint: {
    desc: "Run linters",
    load: () => import("./commands/lint.mjs"),
  },
  metrics: {
    desc: "Show workspace metrics",
    load: () => import("./commands/metrics.mjs"),
  },
};

// ── Help ─────────────────────────────────────────────────────

function printHelp() {
  const lines = [
    "",
    "TerraFusion CLI",
    "",
    "Usage:  tf <command> [options]",
    "",
    "Commands:",
  ];

  for (const [name, cmd] of Object.entries(COMMANDS)) {
    lines.push(`  ${name.padEnd(12)} ${cmd.desc}`);
  }

  lines.push("");
  lines.push("Options:");
  lines.push("  --json       Machine-readable JSON output");
  lines.push("  --dry        Dry-run mode (skip side-effects)");
  lines.push("  --verbose    Show extra detail");
  lines.push("  --help, -h   Show this help");
  lines.push("");

  process.stdout.write(lines.join("\n") + "\n");
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const { command, rest, flags } = parseArgs(process.argv);

  if (!command) {
    printHelp();
    process.exitCode = 0;
    return;
  }

  const entry = COMMANDS[command];
  if (!entry) {
    process.stderr.write(`Unknown command: ${command}\n`);
    process.stderr.write(`Run "tf --help" to see available commands.\n`);
    process.exitCode = 1;
    return;
  }

  const mod = await entry.load();
  const code = await mod.default({ root: ROOT, flags, rest, argv: process.argv });
  process.exitCode = code ?? 0;
}

const invokedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  main().catch((err) => {
    process.stderr.write(`tf: ${err.message}\n`);
    process.exitCode = 1;
  });
}
