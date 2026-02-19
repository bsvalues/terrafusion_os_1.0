#!/usr/bin/env node
/**
 * TerraCanon CLI (deterministic core)
 *
 * Philosophy:
 * - Canon is the cockpit. Governance + workflows run locally first.
 * - No mutation unless explicitly allowed (future: TF_ALLOW_WRITE=1).
 *
 * Subcommands:
 * - doctor: delegates to existing doctor (supports --dry/--json)
 * - gatefast: runs minimal gates (doctor + naming lint if available)
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function isWindows() {
  return process.platform === "win32";
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    stdio: "pipe",
    shell: isWindows(),
    env: process.env,
    ...opts,
  });
  return {
    ok: (res.status ?? 1) === 0,
    code: res.status ?? 1,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
  };
}

function print(s) {
  process.stdout.write(s);
}

function eprint(s) {
  process.stderr.write(s);
}

function exists(rel) {
  return fs.existsSync(path.resolve(process.cwd(), rel));
}

function help() {
  print(
    [
      "TerraCanon CLI",
      "",
      "Usage:",
      "  node tools/canon/canon.mjs <command> [args]",
      "",
      "Commands:",
      "  doctor     Run Canon Doctor health report",
      "  gatefast   Run minimal safe gates (doctor + naming lint if available)",
      "",
      "Examples:",
      "  pnpm canon:doctor",
      "  pnpm canon:gatefast",
      "  pnpm canon:gatefast --dry",
      "",
    ].join("\n") + "\n",
  );
}

function icon(ok) {
  return ok ? "PASS" : "FAIL";
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === "-h" || cmd === "--help") {
    help();
    process.exit(0);
  }

  const flags = argv.slice(1);
  const dry = flags.includes("--dry");
  const json = flags.includes("--json");
  const passthrough = flags.filter((f) => f !== "--json");

  if (cmd === "doctor") {
    const res = run("node", ["tools/canon/doctor.mjs", ...flags]);
    print(res.stdout);
    eprint(res.stderr);
    process.exit(res.code);
  }

  if (cmd === "gatefast") {
    const started = new Date().toISOString();
    const steps = [];

    const doctorRes = run("node", ["tools/canon/doctor.mjs", ...passthrough]);
    steps.push({
      id: "doctor",
      label: "canon:doctor",
      ok: doctorRes.ok,
      code: doctorRes.code,
    });

    let namingRes = { ok: true, code: 0, stdout: "", stderr: "" };
    const namingPath = "tools/naming/naming-lint.mjs";
    const hasNaming = exists(namingPath);
    if (hasNaming) {
      if (dry) {
        namingRes = { ok: true, code: 0, stdout: "DRY: naming-lint skipped\n", stderr: "" };
      } else {
        const namingArgs = [namingPath, ...(json ? ["--json"] : [])];
        namingRes = run("node", namingArgs);
      }
      steps.push({
        id: "naming",
        label: "naming-lint",
        ok: namingRes.ok,
        code: namingRes.code,
      });
    } else {
      steps.push({
        id: "naming",
        label: "naming-lint (not installed)",
        ok: true,
        code: 0,
      });
    }

    const overallOk = steps.every((s) => s.ok);

    if (json) {
      const report = {
        tool: "terracanon-gatefast",
        version: 1,
        startedAt: started,
        dryRun: dry,
        overallOk,
        steps,
      };
      print(JSON.stringify(report, null, 2) + "\n");
      process.exit(overallOk ? 0 : 1);
    }

    print("=== Canon GateFast ===\n");
    print(`Started: ${started}\n`);
    print(`Mode: ${dry ? "DRY (minimal execution)" : "LIVE"}\n\n`);

    for (const s of steps) {
      print(`${icon(s.ok)} ${s.label}\n`);
    }

    print(`\n${icon(overallOk)} Overall: ${overallOk ? "PASS" : "FAIL"}\n`);

    print("\n--- doctor output ---\n");
    print(doctorRes.stdout);
    if (doctorRes.stderr) eprint(doctorRes.stderr);

    if (hasNaming) {
      print("\n--- naming output ---\n");
      print(namingRes.stdout);
      if (namingRes.stderr) eprint(namingRes.stderr);
    }

    process.exit(overallOk ? 0 : 1);
  }

  eprint(`Unknown command: ${cmd}\n\n`);
  help();
  process.exit(1);
}

const invokedAsScript = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsScript) {
  void main();
}
