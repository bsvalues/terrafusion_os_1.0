#!/usr/bin/env node
/**
 * TerraCanon Doctor
 * Read-only repo health report:
 * - repo clean/dirty
 * - type-check
 * - phase83 tools test
 *
 * Safety invariant:
 * - This script MUST NOT write to disk.
 * - No temp files, no edits, no formatting, no lockfile mutation.
 */

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const DEFAULT_GATES = [
  {
    id: "repo_clean",
    label: "repo clean",
    required: true,
    run: async (ctx) => {
      const res = ctx.exec("git", ["status", "--porcelain"]);
      const clean = res.ok && res.stdout.trim().length === 0;
      return {
        ok: clean,
        detail: clean ? "clean" : "dirty",
        meta: clean ? {} : { porcelain: res.stdout.trim().split("\n").slice(0, 10) },
      };
    },
  },
  {
    id: "type_check",
    label: "pnpm run type-check",
    required: true,
    run: async (ctx) => {
      const res = ctx.exec("pnpm", ["run", "type-check"]);
      return { ok: res.ok, detail: res.ok ? "pass" : "fail", meta: trimMeta(res) };
    },
  },
  {
    id: "phase83_tools",
    label: "phase83 tools test",
    required: true,
    run: async (ctx) => {
      const res = ctx.exec("node", ["--test", "os-platform/core/tests/phase83-tools.test.mjs"]);
      return { ok: res.ok, detail: res.ok ? "pass" : "fail", meta: trimMeta(res) };
    },
  },
];

function nowIso() {
  return new Date().toISOString();
}

function parseArgs(argv) {
  const flags = new Set(argv.slice(2));
  return {
    dry: flags.has("--dry"),
    json: flags.has("--json"),
    verbose: flags.has("--verbose"),
  };
}

function isWindows() {
  return process.platform === "win32";
}

function exec(cmd, args) {
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    stdio: "pipe",
    shell: isWindows(),
    env: process.env,
  });

  return {
    ok: (res.status ?? 1) === 0,
    code: res.status ?? 1,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
  };
}

function trimMeta(res) {
  const max = 2000;
  const o = (res.stdout || "").trim();
  const e = (res.stderr || "").trim();
  return {
    code: res.code,
    stdout: o.length > max ? `${o.slice(0, max)}...(truncated)` : o,
    stderr: e.length > max ? `${e.slice(0, max)}...(truncated)` : e,
  };
}

function icon(ok) {
  return ok ? "✅" : "❌";
}

export async function runDoctor({
  argv = process.argv,
  gates = DEFAULT_GATES,
  execImpl = exec,
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) {
  const args = parseArgs(argv);
  const startedAt = nowIso();

  const ctx = {
    exec: args.dry ? () => ({ ok: true, code: 0, stdout: "", stderr: "" }) : execImpl,
  };

  const results = [];
  for (const gate of gates) {
    const t0 = Date.now();
    let outcome;
    try {
      outcome = await gate.run(ctx);
    } catch (err) {
      outcome = {
        ok: false,
        detail: "exception",
        meta: { message: err?.message ?? String(err) },
      };
    }
    const ms = Date.now() - t0;
    results.push({
      id: gate.id,
      label: gate.label,
      required: !!gate.required,
      ok: !!outcome.ok,
      detail: outcome.detail ?? "",
      ms,
      meta: args.verbose ? (outcome.meta ?? {}) : undefined,
    });
  }

  const requiredFailed = results.filter((r) => r.required && !r.ok);
  const overallOk = requiredFailed.length === 0;

  const report = {
    tool: "terracanon-doctor",
    version: 1,
    startedAt,
    dryRun: args.dry,
    overallOk,
    results,
  };

  if (args.json) {
    stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    stdout.write("=== Canon Health Report ===\n");
    stdout.write(`Started: ${startedAt}\n`);
    stdout.write(`Mode: ${args.dry ? "DRY (no commands executed)" : "LIVE"}\n\n`);

    for (const r of results) {
      stdout.write(`${icon(r.ok)} ${r.label} (${r.ms}ms)\n`);
      if (!r.ok && r.detail) stdout.write(`   -> ${r.detail}\n`);
    }

    stdout.write("\n");
    stdout.write(`${overallOk ? "✅" : "❌"} Overall: ${overallOk ? "PASS" : "FAIL"}\n`);
    if (!overallOk) {
      stderr.write(`Failed required gates: ${requiredFailed.map((r) => r.id).join(", ")}\n`);
    }
  }

  return overallOk ? 0 : 1;
}

async function main() {
  const code = await runDoctor();
  process.exitCode = code;
}

const invokedAsScript = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsScript) {
  void main();
}
