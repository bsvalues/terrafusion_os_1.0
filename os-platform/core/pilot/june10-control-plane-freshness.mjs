#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_SYNC_INTAKE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-sync-evidence-intake.latest.json"
);
const DEFAULT_SHIP_BLOCKER_LEDGER = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-ship-blocker-ledger.latest.json"
);
const DEFAULT_P0_BURNDOWN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-p0-burndown-plan.latest.json"
);
const DEFAULT_LAUNCH_CONTROL = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-launch-control.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-control-plane-freshness.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-control-plane-freshness.latest.md"
);

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function timestampOf(artifact) {
  const value = artifact?.generatedAtUtc ?? artifact?.generatedAt ?? null;
  const time = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(time) ? time : null;
}

function chainItem(name, artifact) {
  return {
    name,
    present: Boolean(artifact),
    generatedAtUtc: artifact?.generatedAtUtc ?? artifact?.generatedAt ?? null
  };
}

function addOrderBlocker(blockers, earlierName, earlier, laterName, later) {
  const earlierTime = timestampOf(earlier);
  const laterTime = timestampOf(later);
  if (!earlier || !later) return;
  if (earlierTime === null) blockers.push(`${earlierName} has no generated timestamp.`);
  if (laterTime === null) blockers.push(`${laterName} has no generated timestamp.`);
  if (earlierTime !== null && laterTime !== null && laterTime < earlierTime) {
    blockers.push(`${laterName} is older than ${earlierName}.`);
  }
}

function firstUnblockCommandFrom(p0Burndown) {
  const first = (p0Burndown?.executionQueue ?? []).find((item) => item.nextUnblockCommand || item.proofCommand);
  return first?.nextUnblockCommand ?? first?.proofCommand ?? null;
}

function buildBlockers({ syncEvidenceIntake, shipBlockerLedger, p0Burndown, launchControl }) {
  const blockers = [];
  const required = { syncEvidenceIntake, shipBlockerLedger, p0Burndown, launchControl };

  for (const [name, artifact] of Object.entries(required)) {
    if (!artifact) blockers.push(`${name} artifact is missing.`);
  }

  addOrderBlocker(blockers, "syncEvidenceIntake", syncEvidenceIntake, "p0Burndown", p0Burndown);
  addOrderBlocker(blockers, "shipBlockerLedger", shipBlockerLedger, "p0Burndown", p0Burndown);
  addOrderBlocker(blockers, "p0Burndown", p0Burndown, "launchControl", launchControl);

  const intakeStatus = syncEvidenceIntake?.intakeStatus ?? "missing";
  if (p0Burndown && p0Burndown.summary?.syncEvidenceIntakeStatus !== intakeStatus) {
    blockers.push("P0 burndown does not reflect Sync evidence intake status.");
  }

  const intakeBlockers = syncEvidenceIntake?.summary?.blockers ?? null;
  if (
    p0Burndown &&
    intakeBlockers !== null &&
    p0Burndown.summary?.syncEvidenceBlockers !== intakeBlockers
  ) {
    blockers.push("P0 burndown does not reflect Sync evidence blocker count.");
  }

  if (launchControl && p0Burndown && launchControl.summary?.p0Items !== p0Burndown.summary?.p0Items) {
    blockers.push("Launch control does not reflect P0 item count.");
  }

  const firstUnblock = firstUnblockCommandFrom(p0Burndown);
  if (launchControl && firstUnblock && launchControl.firstUnblockCommand !== firstUnblock) {
    blockers.push("Launch control does not reflect the first P0 unblock command.");
  }

  return blockers;
}

export function buildJune10ControlPlaneFreshness({
  syncEvidenceIntake,
  shipBlockerLedger,
  p0Burndown,
  launchControl
}) {
  const blockers = buildBlockers({
    syncEvidenceIntake,
    shipBlockerLedger,
    p0Burndown,
    launchControl
  });
  const chain = [
    chainItem("syncEvidenceIntake", syncEvidenceIntake),
    chainItem("shipBlockerLedger", shipBlockerLedger),
    chainItem("p0Burndown", p0Burndown),
    chainItem("launchControl", launchControl)
  ];

  return {
    generatedAtUtc: new Date().toISOString(),
    freshnessStatus: blockers.length === 0 ? "FRESH" : "STALE",
    summary: {
      requiredArtifacts: chain.length,
      requiredArtifactsPresent: chain.filter((item) => item.present).length,
      blockers: blockers.length,
      launchVerdict: launchControl?.launchVerdict ?? "missing",
      p0Items: p0Burndown?.summary?.p0Items ?? null,
      syncEvidenceIntakeStatus: syncEvidenceIntake?.intakeStatus ?? "missing"
    },
    chain,
    blockers,
    rules: [
      "Freshness only proves generated control-plane artifacts agree with each other.",
      "Freshness does not clear launch blockers or prove runtime data.",
      "Launch control must be regenerated after P0 burn-down changes.",
      "P0 burn-down must be regenerated after Sync evidence intake or ship-blocker ledger changes."
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Control-Plane Freshness",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Freshness status: ${report.freshnessStatus}`,
    "",
    "## Summary",
    "",
    `- Required artifacts: ${report.summary.requiredArtifacts}`,
    `- Required artifacts present: ${report.summary.requiredArtifactsPresent}`,
    `- Blockers: ${report.summary.blockers}`,
    `- Launch verdict: ${report.summary.launchVerdict}`,
    `- P0 items: ${report.summary.p0Items ?? "unknown"}`,
    `- Sync evidence intake status: ${report.summary.syncEvidenceIntakeStatus}`,
    "",
    "## Chain",
    "",
    "| Artifact | Present | Generated |",
    "|---|---:|---|"
  ];

  report.chain.forEach((item) => lines.push(`${item.name} | ${item.present} | ${item.generatedAtUtc ?? "-"}`));

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) lines.push("- None");
  else report.blockers.forEach((blocker) => lines.push(`- ${blocker}`));

  lines.push("", "## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    syncIntakePath: DEFAULT_SYNC_INTAKE,
    shipBlockerLedgerPath: DEFAULT_SHIP_BLOCKER_LEDGER,
    p0BurndownPath: DEFAULT_P0_BURNDOWN,
    launchControlPath: DEFAULT_LAUNCH_CONTROL,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--sync-intake") args.syncIntakePath = path.resolve(argv[++i]);
    else if (arg === "--ship-blocker-ledger") args.shipBlockerLedgerPath = path.resolve(argv[++i]);
    else if (arg === "--p0-burndown") args.p0BurndownPath = path.resolve(argv[++i]);
    else if (arg === "--launch-control") args.launchControlPath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildJune10ControlPlaneFreshness({
    syncEvidenceIntake: readJson(args.syncIntakePath, null),
    shipBlockerLedger: readJson(args.shipBlockerLedgerPath, null),
    p0Burndown: readJson(args.p0BurndownPath, null),
    launchControl: readJson(args.launchControlPath, null)
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        freshnessStatus: report.freshnessStatus,
        requiredArtifactsPresent: report.summary.requiredArtifactsPresent,
        blockers: report.summary.blockers,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

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
