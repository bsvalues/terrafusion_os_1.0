#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const READY_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 750;

function parseArgs(argv) {
  const flags = new Set(argv.slice(2));
  return {
    once: flags.has("--once"),
  };
}

function prefixOutput(name, stream, writer) {
  if (!stream) return;
  stream.on("data", (chunk) => {
    const text = chunk.toString();
    const normalized = text.replace(/\r?\n/g, `\n[${name}] `);
    writer.write(`[${name}] ${normalized}`);
  });
}

function getPnpmInvocation(pnpmArgs) {
  if (process.platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", `pnpm ${pnpmArgs.join(" ")}`],
    };
  }

  return {
    command: "pnpm",
    args: pnpmArgs,
  };
}

function startProcess(name, command, args, stdio = ["ignore", "pipe", "pipe"]) {
  const child = spawn(command, args, {
    cwd: REPO_ROOT,
    env: process.env,
    shell: false,
    stdio,
  });

  prefixOutput(name, child.stdout, process.stdout);
  prefixOutput(name, child.stderr, process.stderr);

  return child;
}

async function waitForUrl(url, label, timeoutMs = READY_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) {
        return;
      }
    } catch {
      // Service is still warming up.
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for ${label} (${url})`);
}

function waitForExit(child) {
  return new Promise((resolve) => {
    child.once("close", (code) => resolve(code ?? 1));
  });
}

async function stopChildren(children) {
  const alive = children.filter((child) => child.exitCode === null);
  if (alive.length === 0) return;

  if (process.platform === "win32") {
    for (const child of alive) {
      try {
        const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
          stdio: "ignore",
          shell: false,
        });
        await waitForExit(killer);
      } catch {
        child.kill();
      }
    }
  } else {
    for (const child of alive) {
      child.kill();
    }
  }

  const settled = await Promise.race([
    Promise.all(alive.map((child) => waitForExit(child))),
    sleep(2_000),
  ]);

  if (!Array.isArray(settled)) {
    for (const child of alive) {
      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
    }
  }
}

async function runPreviewSmoke() {
  const invocation = getPnpmInvocation(["run", "preview:smoke"]);
  const smoke = spawn(invocation.command, invocation.args, {
    cwd: REPO_ROOT,
    env: process.env,
    shell: false,
    stdio: "inherit",
  });
  return waitForExit(smoke);
}

async function main() {
  const args = parseArgs(process.argv);
  const backendInvocation = getPnpmInvocation(["run", "dev:backend"]);
  const frontendInvocation = getPnpmInvocation(["run", "dev:frontend"]);
  const backend = startProcess("backend", backendInvocation.command, backendInvocation.args);
  const frontend = startProcess("frontend", frontendInvocation.command, frontendInvocation.args);
  const children = [backend, frontend];

  let shuttingDown = false;
  const shutdown = async (exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    await stopChildren(children);
    process.exit(exitCode);
  };

  process.on("SIGINT", () => {
    void shutdown(0);
  });
  process.on("SIGTERM", () => {
    void shutdown(0);
  });

  backend.once("exit", (code) => {
    if (!shuttingDown) {
      process.stderr.write(`[backend] exited unexpectedly (code ${code ?? "unknown"})\n`);
      void shutdown(1);
    }
  });
  frontend.once("exit", (code) => {
    if (!shuttingDown) {
      process.stderr.write(`[frontend] exited unexpectedly (code ${code ?? "unknown"})\n`);
      void shutdown(1);
    }
  });

  try {
    process.stdout.write("Waiting for backend /health...\n");
    await waitForUrl("http://localhost:5001/health", "backend health");
    process.stdout.write("Waiting for pilot /pilot/health...\n");
    await waitForUrl("http://localhost:5001/pilot/health", "pilot health");
    process.stdout.write("Waiting for frontend :5173...\n");
    await waitForUrl("http://localhost:5173", "frontend dev server");

    process.stdout.write("Running preview smoke checks...\n");
    const smokeExit = await runPreviewSmoke();
    if (smokeExit !== 0) {
      process.stderr.write(`preview:smoke failed with exit code ${smokeExit}\n`);
      await shutdown(smokeExit);
      return;
    }

    process.stdout.write("preview:smoke passed.\n");
    if (args.once) {
      await shutdown(0);
      return;
    }

    process.stdout.write("dev:preview is running. Press Ctrl+C to stop.\n");
    await new Promise(() => {});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`dev:preview failed: ${message}\n`);
    await shutdown(1);
  }
}

await main();
