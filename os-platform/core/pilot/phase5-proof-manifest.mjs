#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/phase5-proof-manifest.latest.json"
);

function parseArgs(argv) {
  const args = argv.slice(2);
  const readValue = (flag, fallback) => {
    const index = args.indexOf(flag);
    return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
  };

  return {
    outPath: readValue("--out", process.env.PHASE5_PROOF_OUT || DEFAULT_OUT_PATH),
  };
}

function runCommand(command, args, env = process.env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
      process.stderr.write(chunk);
    });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

async function fileExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { outPath } = parseArgs(process.argv);
  const evidence = {
    generatedAt: new Date().toISOString(),
    checks: [],
    summary: { ok: false, failures: 0 },
    scope: "Phase 5 proof manifest for Benton sync, comps, and UI operator evidence",
  };

  const record = (name, ok, detail, payload) => {
    evidence.checks.push({ name, ok, detail, payload });
    if (!ok) evidence.summary.failures += 1;
    const stream = ok ? process.stdout : process.stderr;
    stream.write(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}\n`);
  };

  const syncResult = await runCommand("node", ["os-platform/core/pilot/benton-sync-proof.mjs"], process.env);
  record("proof.benton.sync", syncResult.code === 0, `exit=${syncResult.code}`, {
    stdout: syncResult.stdout,
    stderr: syncResult.stderr,
  });

  const compsResult = await runCommand("node", ["os-platform/core/pilot/benton-comps-proof.mjs"], process.env);
  record("proof.benton.comps", compsResult.code === 0, `exit=${compsResult.code}`, {
    stdout: compsResult.stdout,
    stderr: compsResult.stderr,
  });

  const uiResult = await runCommand("pnpm", ["-C", "frontend", "test", "--", "--runInBand", "apps/os-shell/src/__tests__/workbench/PropertyForge.test.tsx"], process.env);
  record("proof.propertyforge.ui", uiResult.code === 0, `exit=${uiResult.code}`, {
    stdout: uiResult.stdout,
    stderr: uiResult.stderr,
  });

  const uiDocPath = path.resolve(process.cwd(), "docs/recovery/PHASE4_WORKBENCH_PROOF.md");
  const uiDocExists = await fileExists(uiDocPath);
  record("proof.propertyforge.doc", uiDocExists, uiDocExists ? "present" : "missing", { path: uiDocPath });

  evidence.summary.ok = evidence.summary.failures === 0;

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  process.stdout.write(`Evidence written to ${outPath}\n`);
  process.exitCode = evidence.summary.ok ? 0 : 1;
}

await main();
