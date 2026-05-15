#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-control-plane-refresh.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-control-plane-refresh.latest.md"
);
const DEFAULT_FRESHNESS = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-control-plane-freshness.latest.json"
);
const MAX_COMMAND_OUTPUT_CHARS = 6000;

function scriptPath(name) {
  return ["os-platform", "core", "pilot", name].join("/");
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function defaultRefreshSteps() {
  return [
    {
      id: "syncEvidenceIntake",
      label: "Sync evidence intake",
      command: "node",
      args: [scriptPath("june10-sync-evidence-intake.mjs")]
    },
    {
      id: "shipBlockerLedger",
      label: "Ship blocker ledger",
      command: "node",
      args: [scriptPath("june10-ship-blocker-ledger.mjs")]
    },
    {
      id: "p0Burndown",
      label: "P0 burndown",
      command: "node",
      args: [scriptPath("june10-p0-burndown-plan.mjs")]
    },
    {
      id: "launchControl",
      label: "Launch control",
      command: "node",
      args: [scriptPath("june10-launch-control.mjs")]
    },
    {
      id: "warRoomStatus",
      label: "War-room status",
      command: "node",
      args: [scriptPath("june10-war-room-status.mjs")],
      usesBootstrapFreshness: true
    },
    {
      id: "operatorCommandQueue",
      label: "Operator command queue",
      command: "node",
      args: [scriptPath("june10-operator-command-queue.mjs")]
    },
    {
      id: "controlPlaneFreshness",
      label: "Control-plane freshness",
      command: "node",
      args: [scriptPath("june10-control-plane-freshness.mjs")]
    }
  ];
}

function commandLineFor(step) {
  return [step.command, ...(step.args ?? [])].join(" ");
}

function redactCommandOutput(value) {
  const redacted = String(value ?? "")
    .replace(/\b(authorization\s*:\s*bearer)\s+\S+/gi, "$1 <redacted>")
    .replace(/\b(token|password|secret|api[_-]?key|connectionstring)\s*=\s*[^;\s]+/gi, "$1=<redacted>")
    .replace(/\b(password)\s*=\s*[^;]+/gi, "$1=<redacted>");
  if (redacted.length <= MAX_COMMAND_OUTPUT_CHARS) return redacted;

  const tail = redacted.slice(-MAX_COMMAND_OUTPUT_CHARS);
  return `[truncated ${redacted.length - MAX_COMMAND_OUTPUT_CHARS} chars]\n${tail}`;
}

function normalizeStep(step) {
  return {
    id: step.id,
    label: step.label,
    commandLine: step.commandLine ?? commandLineFor(step),
    usesBootstrapFreshness: Boolean(step.usesBootstrapFreshness),
    exitCode: step.exitCode ?? null,
    startedAtUtc: step.startedAtUtc ?? null,
    completedAtUtc: step.completedAtUtc ?? null,
    stdout: redactCommandOutput(step.stdout),
    stderr: redactCommandOutput(step.stderr)
  };
}

function refreshStatusFor({ steps, finalFreshness }) {
  if (steps.every((step) => step.exitCode === null)) return "PLANNED";
  if (steps.some((step) => step.exitCode !== 0)) return "FAIL";
  if (!finalFreshness) return "FAIL";
  if (finalFreshness.freshnessStatus !== "FRESH") return "FAIL";
  return "PASS";
}

function blockersFor({ steps, finalFreshness, refreshStatus }) {
  const blockers = [];

  steps
    .filter((step) => step.exitCode !== null && step.exitCode !== 0)
    .forEach((step) => blockers.push(`${step.id} exited ${step.exitCode}.`));

  if (refreshStatus !== "PLANNED" && !finalFreshness) {
    blockers.push("Final control-plane freshness artifact was not produced.");
  }

  if (finalFreshness && finalFreshness.freshnessStatus !== "FRESH") {
    blockers.push(`Final control-plane freshness is ${finalFreshness.freshnessStatus}.`);
    (finalFreshness.blockers ?? []).forEach((blocker) => blockers.push(blocker));
  }

  return blockers;
}

export function buildJune10ControlPlaneRefresh({ steps, finalFreshness }) {
  const normalizedSteps = steps.map(normalizeStep);
  const refreshStatus = refreshStatusFor({ steps: normalizedSteps, finalFreshness });
  const blockers = blockersFor({ steps: normalizedSteps, finalFreshness, refreshStatus });

  return {
    generatedAtUtc: new Date().toISOString(),
    refreshStatus: blockers.length === 0 ? refreshStatus : "FAIL",
    summary: {
      totalSteps: normalizedSteps.length,
      executedSteps: normalizedSteps.filter((step) => step.exitCode !== null).length,
      failedSteps: normalizedSteps.filter((step) => step.exitCode !== null && step.exitCode !== 0).length,
      finalFreshnessStatus: finalFreshness?.freshnessStatus ?? "missing",
      finalFreshnessBlockers: finalFreshness?.summary?.blockers ?? null
    },
    steps: normalizedSteps,
    blockers,
    rules: [
      "This runner refreshes only June 10 control-plane artifacts.",
      "It does not run DB, Sync, runtime, or product-load commands.",
      "The war-room step uses a temporary freshness bootstrap so a stale starting point cannot deadlock recovery.",
      "Final control-plane freshness is the authoritative result of the refresh."
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Control-Plane Refresh",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Refresh status: ${report.refreshStatus}`,
    "",
    "## Summary",
    "",
    `- Total steps: ${report.summary.totalSteps}`,
    `- Executed steps: ${report.summary.executedSteps}`,
    `- Failed steps: ${report.summary.failedSteps}`,
    `- Final freshness status: ${report.summary.finalFreshnessStatus}`,
    `- Final freshness blockers: ${report.summary.finalFreshnessBlockers ?? "unknown"}`,
    "",
    "## Steps",
    "",
    "| Step | Exit | Bootstrap freshness | Command |",
    "|---|---:|---:|---|"
  ];

  report.steps.forEach((step) => {
    lines.push(
      `${step.id} | ${step.exitCode ?? "planned"} | ${step.usesBootstrapFreshness} | \`${step.commandLine}\``
    );
  });

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) lines.push("- None");
  else report.blockers.forEach((blocker) => lines.push(`- ${blocker}`));

  lines.push("", "## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function bootstrapFreshnessPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tf-june10-refresh-"));
  const filePath = path.join(dir, "bootstrap-freshness.json");
  writeJson(filePath, {
    generatedAtUtc: new Date().toISOString(),
    freshnessStatus: "FRESH",
    summary: { blockers: 0 },
    blockers: [],
    rules: ["Temporary bootstrap input for ordered control-plane refresh only."]
  });
  return filePath;
}

function stepArgsFor(step, bootstrapPath) {
  if (!step.usesBootstrapFreshness) return step.args;
  return [...step.args, "--freshness", bootstrapPath];
}

function displayArgsFor(step) {
  if (!step.usesBootstrapFreshness) return step.args;
  return [...step.args, "--freshness", "<bootstrap-freshness>"];
}

function runRefreshSteps() {
  const bootstrapPath = bootstrapFreshnessPath();
  const completed = [];

  for (const step of defaultRefreshSteps()) {
    const args = stepArgsFor(step, bootstrapPath);
    const startedAtUtc = new Date().toISOString();
    const result = spawnSync(step.command, args, {
      cwd: repoRoot,
      encoding: "utf8",
      windowsHide: true
    });
    const completedAtUtc = new Date().toISOString();

    completed.push({
      ...step,
      args,
      commandLine: [step.command, ...displayArgsFor(step)].join(" "),
      exitCode: result.status ?? 1,
      startedAtUtc,
      completedAtUtc,
      stdout: result.stdout ?? "",
      stderr: result.stderr || result.error?.message || ""
    });

    if ((result.status ?? 1) !== 0) break;
  }

  return completed;
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const steps = args.dryRun ? defaultRefreshSteps() : runRefreshSteps();
  const finalFreshness = args.dryRun ? null : readJson(DEFAULT_FRESHNESS, null);
  const report = buildJune10ControlPlaneRefresh({ steps, finalFreshness });

  fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
  fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(args.outMd, renderMarkdown(report));

  console.log(
    JSON.stringify(
      {
        refreshStatus: report.refreshStatus,
        executedSteps: report.summary.executedSteps,
        finalFreshnessStatus: report.summary.finalFreshnessStatus,
        blockers: report.blockers.length,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  if (report.refreshStatus === "FAIL") process.exitCode = 1;
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
