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
 * - ping: end-to-end read-only tool invocation through TerraPilot ToolRunner
 * - conference: validate and print the deterministic WACO cold-open plan
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
      "  ping       Run read-only TerraPilot ping slice",
      "  conference Validate and print the local-only WACO conference workspace",
      "",
      "Examples:",
      "  pnpm canon:doctor",
      "  pnpm canon:gatefast",
      "  pnpm canon:gatefast --dry",
      "  pnpm canon:ping",
      "",
    ].join("\n") + "\n",
  );
}

function icon(ok) {
  return ok ? "PASS" : "FAIL";
}

function parseJsonStrict(label, s) {
  try {
    return JSON.parse(s);
  } catch (err) {
    const msg = err?.message ?? String(err);
    throw new Error(`${label}: invalid JSON (${msg})`);
  }
}

function requireKeys(label, obj, keys) {
  if (!obj || typeof obj !== "object") {
    throw new Error(`${label}: expected object`);
  }
  const missing = keys.filter((k) => !(k in obj));
  if (missing.length) {
    throw new Error(`${label}: missing keys: ${missing.join(", ")}`);
  }
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function validatePingNormalized(normalized) {
  requireKeys("normalized result", normalized, ["ok", "ts", "echo", "toolId", "inputCount"]);
  if (typeof normalized.ok !== "boolean") {
    throw new Error("normalized result: ok must be boolean");
  }
  if (!isNonEmptyString(normalized.ts)) {
    throw new Error("normalized result: ts must be non-empty string");
  }
  if (!isNonEmptyString(normalized.echo)) {
    throw new Error("normalized result: echo must be non-empty string");
  }
  if (!isNonEmptyString(normalized.toolId)) {
    throw new Error("normalized result: toolId must be non-empty string");
  }
  if (typeof normalized.inputCount !== "number") {
    throw new Error("normalized result: inputCount must be number");
  }
}

function valueAfterFlag(flags, name, fallback) {
  const idx = flags.indexOf(name);
  if (idx === -1) return fallback;
  return flags[idx + 1] ?? fallback;
}

function resolveManifest(cwd, flags) {
  const provided = valueAfterFlag(flags, "--manifest", undefined);
  if (!provided) return path.resolve(cwd, "tools/registry/terrapilot.tools.json");
  return path.resolve(cwd, provided);
}

function loadConferenceWorkspace(cwd) {
  const manifestPath = path.resolve(
    cwd,
    "frontend/apps/os-shell/src/config/conferenceWorkspace.json",
  );
  const raw = fs.readFileSync(manifestPath, "utf8");
  const manifest = parseJsonStrict("conference workspace", raw);
  if (manifest.schemaVersion !== 1 || manifest.startup?.mode !== "cold") {
    throw new Error("conference workspace: unsupported schema or startup mode");
  }
  if (manifest.startup.networkPolicy !== "local-only") {
    throw new Error("conference workspace: network policy must be local-only");
  }
  if (!Array.isArray(manifest.views) || manifest.views.length === 0) {
    throw new Error("conference workspace: views must be non-empty");
  }
  const ids = new Set();
  for (const view of manifest.views) {
    if (
      !view ||
      typeof view.id !== "string" ||
      ids.has(view.id) ||
      typeof view.route !== "string" ||
      !view.route.startsWith("/") ||
      view.route.startsWith("//")
    ) {
      throw new Error("conference workspace: invalid or duplicate view");
    }
    ids.add(view.id);
  }
  return manifest;
}

async function runPingLive(cwd, flags) {
  const pilotModuleUrl = pathToFileURL(path.resolve(cwd, "os-platform/core/pilot/index.js")).href;
  const pilotModule = await import(pilotModuleUrl);
  const pilot = pilotModule.default || pilotModule;

  const { ToolRegistry, ToolRunner, registerPhase84Handlers } = pilot;
  const registry = new ToolRegistry();
  await registry.initialize(resolveManifest(cwd, flags));

  const runner = new ToolRunner({ registry });
  registerPhase84Handlers(runner);

  const context = {
    countyId: "benton",
    userId: "canon-ping",
    roles: ["appraiser"],
    mode: "muse",
  };

  const echo = valueAfterFlag(flags, "--echo", "pong");
  const params = {
    county: "benton",
    modelId: "res_avm_v3",
    asOfYear: 2025,
  };

  const startedAt = new Date().toISOString();
  const toolResult = await runner.run("explain_model_inputs", params, context);
  const output = {
    ok: true,
    ts: startedAt,
    echo,
    toolId: toolResult.toolId,
    inputCount: Array.isArray(toolResult.result?.inputs) ? toolResult.result.inputs.length : 0,
  };

  return { ok: true, output, raw: toolResult };
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

  if (cmd === "ping") {
    const started = new Date().toISOString();
    const echo = valueAfterFlag(flags, "--echo", "pong");

    if (dry) {
      const report = {
        tool: "terracanon-ping",
        version: 1,
        startedAt: started,
        dryRun: true,
        overallOk: true,
        result: { ok: true, ts: "DRY", echo },
      };
      if (json) {
        print(JSON.stringify(report, null, 2) + "\n");
      } else {
        print("=== Canon Ping ===\n");
        print(`Started: ${started}\n`);
        print("Mode: DRY\n\n");
        print("PASS system.ping\n");
        print("PASS Overall: PASS\n");
      }
      process.exit(0);
    }

    let live;
    let overallOk = false;
    let failure = "";
    try {
      live = await runPingLive(process.cwd(), flags);
      overallOk = !!live.ok;
    } catch (err) {
      overallOk = false;
      failure = err?.message ?? String(err);
    }

    if (json) {
      if (!overallOk) {
        const payload = {
          tool: "terracanon-ping",
          version: 1,
          startedAt: started,
          dryRun: false,
          overallOk: false,
          error: failure,
          raw: null,
          normalized: null,
        };
        print(JSON.stringify(payload, null, 2) + "\n");
        process.exit(1);
      }

      let toolRunnerPayload;
      let normalized;
      try {
        const rawJson = JSON.stringify(live.raw);
        toolRunnerPayload = parseJsonStrict("toolrunner output", rawJson);
        const normalizedSource =
          toolRunnerPayload?.normalized ?? toolRunnerPayload?.result ?? live.output;
        const normalizedJson = JSON.stringify(normalizedSource);
        normalized = parseJsonStrict("normalized result", normalizedJson);
        validatePingNormalized(normalized);
      } catch (err) {
        const payload = {
          tool: "terracanon-ping",
          version: 1,
          startedAt: started,
          dryRun: false,
          overallOk: false,
          error: err?.message ?? String(err),
          raw: live?.raw ?? null,
          normalized: null,
        };
        print(JSON.stringify(payload, null, 2) + "\n");
        process.exit(1);
      }

      const payload = {
        tool: "terracanon-ping",
        version: 1,
        startedAt: started,
        dryRun: false,
        overallOk: true,
        raw: toolRunnerPayload,
        normalized,
      };
      print(JSON.stringify(payload, null, 2) + "\n");
      process.exit(0);
    }

    print("=== Canon Ping ===\n");
    print(`Started: ${started}\n`);
    print("Mode: LIVE\n\n");
    print(`${icon(overallOk)} system.ping\n`);
    print(`\n${icon(overallOk)} Overall: ${overallOk ? "PASS" : "FAIL"}\n`);
    if (overallOk) {
      print("\n--- normalized output ---\n");
      print(JSON.stringify(live.output, null, 2) + "\n");
    } else {
      eprint(`\n${failure}\n`);
    }
    process.exit(overallOk ? 0 : 1);
  }

  if (cmd === "conference") {
    const started = new Date().toISOString();
    try {
      const workspace = loadConferenceWorkspace(process.cwd());
      const report = {
        tool: "terracanon-conference",
        version: 1,
        startedAt: started,
        overallOk: true,
        workspace,
      };
      if (json) {
        print(JSON.stringify(report, null, 2) + "\n");
      } else {
        print("=== TerraCanon WACO Conference Workspace ===\n");
        print(`Started: ${started}\n`);
        print("Mode: COLD\n");
        print("Network policy: LOCAL-ONLY\n\n");
        for (const view of workspace.views) {
          print(`PASS ${view.id} -> ${view.route} (${view.moduleId})\n`);
        }
        print("\nPASS conference manifest\n");
      }
      process.exit(0);
    } catch (err) {
      const message = err?.message ?? String(err);
      if (json) {
        print(JSON.stringify({
          tool: "terracanon-conference",
          version: 1,
          startedAt: started,
          overallOk: false,
          error: message,
        }, null, 2) + "\n");
      } else {
        eprint(`FAIL conference manifest: ${message}\n`);
      }
      process.exit(1);
    }
  }

  eprint(`Unknown command: ${cmd}\n\n`);
  help();
  process.exit(1);
}

const invokedAsScript = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsScript) {
  void main();
}
