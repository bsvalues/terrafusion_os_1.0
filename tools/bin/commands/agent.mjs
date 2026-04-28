/**
 * tf agent – founder entrypoint to the TerraFusion Local Agent CLI.
 *
 * Forwards every argument after `agent` verbatim to
 * os-platform/core/pilot/local-agent/cli.js without re-parsing flags.
 * The local-agent CLI owns its own arg grammar (including --repo-root).
 *
 * This file does NOT mutate the local-agent surface; it only delegates.
 */

import path from "node:path";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

export default async function agent({ root, argv }) {
  const localAgentCli = path.resolve(
    root,
    "os-platform",
    "core",
    "pilot",
    "local-agent",
    "cli.js",
  );

  if (!existsSync(localAgentCli)) {
    process.stderr.write(
      `tf agent: local-agent CLI not found at ${localAgentCli}\n` +
        `Run "pnpm run build:core-js" to generate it.\n`,
    );
    return 1;
  }

  // Locate the literal `agent` token in the original argv and forward
  // everything after it. This preserves --help, --json, and any other
  // flag the parent tf parser would otherwise consume.
  const idx = argv.indexOf("agent");
  const forwardArgs = idx >= 0 ? argv.slice(idx + 1) : [];

  const result = spawnSync(process.execPath, [localAgentCli, ...forwardArgs], {
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.error) {
    process.stderr.write(`tf agent: ${result.error.message}\n`);
    return 1;
  }

  return result.status ?? 1;
}
