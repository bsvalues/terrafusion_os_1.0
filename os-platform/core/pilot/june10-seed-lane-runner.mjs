#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_CONTROL_PLANE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-control-plane.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-lane.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-lane.latest.md"
);

export function buildSeedLanePlan() {
  return [
    {
      id: "seed_receipts",
      script: "june10-seed-receipt-validator.mjs",
      purpose: "Validate real seed receipts if any exist."
    },
    {
      id: "seed_wave_plan",
      script: "june10-seed-wave-planner.mjs",
      purpose: "Refresh first-wave representative county plan."
    },
    {
      id: "seed_work_order_pack",
      script: "june10-seed-work-order-pack.mjs",
      purpose: "Refresh executable first-wave work orders."
    },
    {
      id: "seed_receipt_template_pack",
      script: "june10-seed-receipt-template-pack.mjs",
      purpose: "Refresh template-only receipt shapes."
    },
    {
      id: "seed_execution_status",
      script: "june10-seed-execution-status.mjs",
      purpose: "Refresh execution status from work orders and receipts."
    },
    {
      id: "seed_control_plane",
      script: "june10-seed-control-plane.mjs",
      purpose: "Verify seed control-plane artifacts agree."
    }
  ];
}

function scriptPath(step) {
  return path.join(repoRoot, "os-platform", "core", "pilot", step.script);
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function runStep(step) {
  const result = spawnSync(process.execPath, [scriptPath(step)], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  return {
    ...step,
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}

export function buildSeedLaneReport({ plan, commandResults, controlPlane, dryRun }) {
  const blockers = [];
  const failedCommands = (commandResults ?? []).filter((result) => result.exitCode !== 0);

  for (const result of failedCommands) {
    blockers.push(`${result.id} failed with exit code ${result.exitCode}.`);
  }

  if (dryRun) {
    blockers.push("Dry run only; seed lane commands were not executed.");
  }

  if (controlPlane && controlPlane.summary?.runtimeClaimAllowed !== false) {
    blockers.push("runtimeClaimAllowed must remain false.");
  }

  if (!dryRun && controlPlane?.passed !== true) {
    blockers.push("Seed control plane did not pass.");
  }

  const summary = {
    commandsPlanned: plan.length,
    commandsRun: commandResults?.length ?? 0,
    commandsPassed: (commandResults ?? []).filter((result) => result.exitCode === 0).length,
    commandsFailed: failedCommands.length,
    workOrders: controlPlane?.summary?.workOrders ?? null,
    receiptsFound: controlPlane?.summary?.receiptsFound ?? null,
    blockers: blockers.length,
    runtimeClaimAllowed: false
  };

  return {
    generatedAtUtc: new Date().toISOString(),
    mode: dryRun ? "DRY_RUN" : "RUN",
    passed: !dryRun && blockers.length === 0,
    summary,
    commands:
      commandResults?.length > 0
        ? commandResults
        : plan.map((step) => ({ ...step, exitCode: null, stdout: "", stderr: "" })),
    controlPlane: controlPlane ?? null,
    blockers,
    rules: [
      "This lane runner refreshes seed control artifacts only.",
      "It must not access source systems, mutate TerraFusion DB, or imply runtime readiness.",
      "Runtime claims remain blocked unless separate load, API, and UI proof gates pass.",
      "Dry-run output is a command plan, not evidence."
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 38-County Seed Lane",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Mode: ${report.mode}`,
    `Passed: ${report.passed}`,
    `Dry run: ${report.mode === "DRY_RUN"}`,
    "",
    "## Summary",
    "",
    `- Commands planned: ${report.summary.commandsPlanned}`,
    `- Commands run: ${report.summary.commandsRun}`,
    `- Commands passed: ${report.summary.commandsPassed}`,
    `- Commands failed: ${report.summary.commandsFailed}`,
    `- Work orders: ${report.summary.workOrders ?? "n/a"}`,
    `- Receipts found: ${report.summary.receiptsFound ?? "n/a"}`,
    `- Runtime claim allowed: ${report.summary.runtimeClaimAllowed}`,
    `- Blockers: ${report.summary.blockers}`,
    "",
    "## Commands",
    "",
    "| Step | Script | Exit | Purpose |",
    "|---|---|---:|---|"
  ];

  for (const command of report.commands) {
    lines.push([command.id, `\`${command.script}\``, command.exitCode ?? "n/a", command.purpose].join(" | "));
  }

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) {
    lines.push("- None");
  } else {
    report.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
  }

  lines.push("", "## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    controlPlanePath: DEFAULT_CONTROL_PLANE,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--control-plane") args.controlPlanePath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const plan = buildSeedLanePlan();
  const commandResults = args.dryRun ? [] : plan.map((step) => runStep(step));
  const controlPlane = args.dryRun ? null : readJson(args.controlPlanePath);
  const report = buildSeedLaneReport({
    plan,
    commandResults,
    controlPlane,
    dryRun: args.dryRun
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        mode: report.mode,
        passed: report.passed,
        commandsRun: report.summary.commandsRun,
        commandsFailed: report.summary.commandsFailed,
        blockers: report.summary.blockers,
        runtimeClaimAllowed: report.summary.runtimeClaimAllowed
      },
      null,
      2
    )
  );

  if (!report.passed) {
    process.exitCode = args.dryRun ? 0 : 2;
  }

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
