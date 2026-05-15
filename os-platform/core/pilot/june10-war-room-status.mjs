#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_LAUNCH_CONTROL = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-launch-control.latest.json"
);
const DEFAULT_P0_BURNDOWN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-p0-burndown-plan.latest.json"
);
const DEFAULT_FRESHNESS = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-control-plane-freshness.latest.json"
);
const DEFAULT_SYNC_INTAKE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-sync-evidence-intake.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-war-room-status.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-war-room-status.latest.md"
);

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function firstActiveP0(p0Burndown) {
  return p0Burndown?.executionQueue?.[0] ?? null;
}

function activeLaneFor({ freshness, syncEvidenceIntake, activeP0 }) {
  if (freshness?.freshnessStatus && freshness.freshnessStatus !== "FRESH") return "CONTROL_PLANE_STALE";
  if (syncEvidenceIntake?.intakeStatus === "WAITING_SYNC_DB_EVIDENCE") return "WAITING_SYNC_DB_EVIDENCE";
  return activeP0?.status ?? "NO_ACTIVE_P0";
}

function firstUnblockCommandFor({ activeLane, launchControl, activeP0 }) {
  if (activeLane === "CONTROL_PLANE_STALE") return "pnpm run truth:june10-control-plane-refresh";
  return activeP0?.nextUnblockCommand ?? launchControl?.firstUnblockCommand ?? null;
}

function stopWorkFor({ activeLane, launchControl }) {
  const stopWork = [
    "Do not claim June 10 production approval.",
    "Do not claim statewide or 39-county runtime readiness.",
    "Do not bypass launch-control stop conditions."
  ];

  if (activeLane === "CONTROL_PLANE_STALE") {
    stopWork.push("Do not use launch-control output until freshness is restored.");
  }

  if (activeLane === "WAITING_SYNC_DB_EVIDENCE") {
    stopWork.push("Do not run Benton closure until Sync evidence intake is accepted.");
  }

  if (launchControl?.summary?.readyForCodexP0Items === 0) {
    stopWork.push("Do not start new Codex P0 closure work until the first unblock command passes.");
  }

  return stopWork;
}

export function buildJune10WarRoomStatus({ launchControl, p0Burndown, freshness, syncEvidenceIntake }) {
  const activeP0 = firstActiveP0(p0Burndown);
  const activeLane = activeLaneFor({ freshness, syncEvidenceIntake, activeP0 });
  const firstUnblockCommand = firstUnblockCommandFor({ activeLane, launchControl, activeP0 });

  return {
    generatedAtUtc: new Date().toISOString(),
    warRoomVerdict: launchControl?.launchVerdict ?? "NO_GO",
    activeLane,
    firstUnblockCommand,
    activeP0,
    summary: {
      launchVerdict: launchControl?.launchVerdict ?? "missing",
      readinessStatus: launchControl?.summary?.readinessStatus ?? "missing",
      stopConditions: launchControl?.summary?.stopConditions ?? null,
      p0Items: p0Burndown?.summary?.p0Items ?? null,
      readyForCodexP0Items: p0Burndown?.summary?.readyForCodexItems ?? launchControl?.summary?.readyForCodexP0Items ?? null,
      syncEvidenceIntakeStatus: syncEvidenceIntake?.intakeStatus ?? launchControl?.summary?.syncEvidenceIntakeStatus ?? "missing",
      syncEvidenceBlockers: syncEvidenceIntake?.summary?.blockers ?? launchControl?.summary?.syncEvidenceBlockers ?? null,
      controlPlaneFreshness: freshness?.freshnessStatus ?? "missing",
      controlPlaneFreshnessBlockers: freshness?.summary?.blockers ?? null
    },
    stopWork: stopWorkFor({ activeLane, launchControl }),
    allowedFraming:
      launchControl?.approvedExternalFraming ??
      "No external framing is approved until launch-control evidence exists.",
    nextCommands: [
      firstUnblockCommand,
      ...(launchControl?.nextCommands ?? []).filter((command) => command !== firstUnblockCommand),
      "pnpm run truth:june10-war-room-status"
    ].filter(Boolean),
    rules: [
      "This packet is an operator status card; it does not prove runtime data.",
      "The first unblock command is the only active next action while launch verdict is NO_GO.",
      "Stop-work instructions override feature work, UI polish, and speculative expansion.",
      "Allowed framing is inherited from launch control and must not be expanded here."
    ]
  };
}

function renderMarkdown(status) {
  const lines = [
    "# June 10 War Room Status",
    "",
    `Generated: ${status.generatedAtUtc}`,
    "",
    `War-room verdict: ${status.warRoomVerdict}`,
    `Active lane: ${status.activeLane}`,
    `First unblock command: ${status.firstUnblockCommand ? `\`${status.firstUnblockCommand}\`` : "None"}`,
    "",
    "## Summary",
    "",
    `- Readiness status: ${status.summary.readinessStatus}`,
    `- Stop conditions: ${status.summary.stopConditions ?? "unknown"}`,
    `- P0 items: ${status.summary.p0Items ?? "unknown"}`,
    `- Ready-for-Codex P0 items: ${status.summary.readyForCodexP0Items ?? "unknown"}`,
    `- Sync evidence intake status: ${status.summary.syncEvidenceIntakeStatus}`,
    `- Sync evidence blockers: ${status.summary.syncEvidenceBlockers ?? "unknown"}`,
    `- Control-plane freshness: ${status.summary.controlPlaneFreshness}`,
    "",
    "## Active P0",
    "",
    status.activeP0
      ? `- ${status.activeP0.source}: ${status.activeP0.status} (${status.activeP0.ownerLane ?? "owner unknown"})`
      : "- None",
    "",
    "## Stop Work",
    ""
  ];

  status.stopWork.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Next Commands", "");
  status.nextCommands.forEach((command) => lines.push(`- \`${command}\``));

  lines.push("", "## Allowed Framing", "", status.allowedFraming);

  lines.push("", "## Rules", "");
  status.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    launchControlPath: DEFAULT_LAUNCH_CONTROL,
    p0BurndownPath: DEFAULT_P0_BURNDOWN,
    freshnessPath: DEFAULT_FRESHNESS,
    syncIntakePath: DEFAULT_SYNC_INTAKE,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--launch-control") args.launchControlPath = path.resolve(argv[++i]);
    else if (arg === "--p0-burndown") args.p0BurndownPath = path.resolve(argv[++i]);
    else if (arg === "--freshness") args.freshnessPath = path.resolve(argv[++i]);
    else if (arg === "--sync-intake") args.syncIntakePath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const status = buildJune10WarRoomStatus({
    launchControl: readJson(args.launchControlPath, null),
    p0Burndown: readJson(args.p0BurndownPath, null),
    freshness: readJson(args.freshnessPath, null),
    syncEvidenceIntake: readJson(args.syncIntakePath, null)
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(status, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(status));
  }

  console.log(
    JSON.stringify(
      {
        warRoomVerdict: status.warRoomVerdict,
        activeLane: status.activeLane,
        firstUnblockCommand: status.firstUnblockCommand,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  return status;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
