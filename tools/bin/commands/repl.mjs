/**
 * tf repl – interactive TerraFusion CLI session
 *
 * Type commands without re-typing "tf" each time.
 * Special commands:
 *   .help    Show available commands
 *   .json    Toggle JSON output mode
 *   .exit    Exit the REPL
 */

import readline from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  const lines = [
    "",
    "tf repl – interactive TerraFusion CLI session",
    "",
    "Usage:  tf repl",
    "",
    "Type any tf subcommand directly (e.g. 'status', 'doctor --dry').",
    "",
    "Special commands:",
    "  .help    Show this help",
    "  .json    Toggle JSON output mode",
    "  .exit    Exit the REPL",
    "",
  ];
  process.stdout.write(lines.join("\n") + "\n");
}

// Dynamically load the COMMANDS registry from tf.mjs would create a
// circular dependency, so we maintain a lightweight list here.
const COMMAND_NAMES = [
  "version", "doctor", "status", "dev", "test",
  "build", "ship", "canon", "inspect",
];

export default async function repl({ root, flags }) {
  if (flags.help) { printHelp(); return 0; }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "tf> ",
    completer: (line) => {
      const hits = COMMAND_NAMES.filter((c) => c.startsWith(line.trim()));
      return [hits.length ? hits : COMMAND_NAMES, line];
    },
  });

  let jsonMode = flags.json ?? false;

  process.stdout.write("\nTerraFusion REPL  (type .help for commands, .exit to quit)\n\n");
  rl.prompt();

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) { rl.prompt(); continue; }

    // Special dot-commands
    if (trimmed === ".exit" || trimmed === ".quit") {
      process.stdout.write("Bye.\n");
      rl.close();
      return 0;
    }
    if (trimmed === ".help") {
      process.stdout.write("Available commands: " + COMMAND_NAMES.join(", ") + "\n");
      process.stdout.write("Special: .json (toggle JSON mode), .exit\n");
      process.stdout.write(`JSON mode: ${jsonMode ? "ON" : "OFF"}\n`);
      rl.prompt();
      continue;
    }
    if (trimmed === ".json") {
      jsonMode = !jsonMode;
      process.stdout.write(`JSON mode: ${jsonMode ? "ON" : "OFF"}\n`);
      rl.prompt();
      continue;
    }

    // Parse as if it were tf <args>
    const parts = trimmed.split(/\s+/);
    const command = parts[0];
    const rest = parts.slice(1);

    // Build flags from rest
    const cmdFlags = { json: jsonMode, dry: false, help: false, verbose: false };
    const positional = [];
    for (const arg of rest) {
      if (arg === "--json") cmdFlags.json = true;
      else if (arg === "--dry") cmdFlags.dry = true;
      else if (arg === "--help" || arg === "-h") cmdFlags.help = true;
      else if (arg === "--verbose" || arg === "-v") cmdFlags.verbose = true;
      else positional.push(arg);
    }

    // Try to load the command (we're already inside commands/)
    try {
      const mod = await import(`./${command}.mjs`).catch(() => null);

      if (!mod) {
        process.stderr.write(`Unknown command: ${command}\n`);
        process.stderr.write(`Type .help to see available commands.\n`);
        rl.prompt();
        continue;
      }

      await mod.default({ root, flags: cmdFlags, rest: positional, argv: [] });
    } catch (err) {
      process.stderr.write(`Error: ${err.message}\n`);
    }

    rl.prompt();
  }

  return 0;
}
