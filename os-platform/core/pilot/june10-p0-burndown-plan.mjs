#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_LEDGER = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-ship-blocker-ledger.latest.json"
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
  "june10-p0-burndown-plan.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-p0-burndown-plan.latest.md"
);

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function sequenceRank(source) {
  const ordered = [
    "productLoadLedger",
    "bentonPilotClosure",
    "redTeam:runtime_lineage",
    "redTeam:benton_realism",
    "redTeam:governance_posture",
    "launchControl"
  ];
  const index = ordered.indexOf(source);
  if (index >= 0) return index;
  return 100;
}

function dependenciesFor(source) {
  if (source === "productLoadLedger") return [];
  if (source === "bentonPilotClosure") return ["productLoadLedger"];
  if (source === "redTeam:runtime_lineage") return ["productLoadLedger"];
  if (source === "redTeam:benton_realism") return ["bentonPilotClosure"];
  if (source === "redTeam:governance_posture") return ["productLoadLedger", "bentonPilotClosure"];
  if (source === "launchControl") return ["productLoadLedger", "bentonPilotClosure", "redTeam:runtime_lineage"];
  return [];
}

function statusFor(source, blockedBy) {
  if (source === "productLoadLedger") return "WAITING_EXTERNAL_SYNC_DB";
  if (source === "launchControl") return "BLOCKED_BY_P0";
  if (blockedBy.length > 0) return "BLOCKED_BY_DEPENDENCY";
  return "READY_FOR_CODEX";
}

function syncIntakeStatusFor(syncEvidenceIntake) {
  return syncEvidenceIntake?.intakeStatus ?? "missing";
}

function nextUnblockCommandFor(syncEvidenceIntake, fallback) {
  return syncEvidenceIntake?.nextCommands?.[0] ?? fallback ?? null;
}

function itemFromGroup(group, index, syncEvidenceIntake = null) {
  const blockedBy = dependenciesFor(group.source);
  const item = {
    sequence: index + 1,
    source: group.source,
    status: statusFor(group.source, blockedBy),
    ownerLane: group.ownerLane,
    blockedBy,
    proofCommand: group.nextCommand,
    requiredResolution: group.requiredResolution,
    blockerCount: group.blockerCount,
    firstBlocker: group.blockers?.[0] ?? null,
    stopCondition: group.source === "launchControl" || group.source.startsWith("redTeam:")
  };

  if (group.source === "productLoadLedger" && syncEvidenceIntake) {
    item.status = syncIntakeStatusFor(syncEvidenceIntake);
    item.syncEvidenceIntakeStatus = syncIntakeStatusFor(syncEvidenceIntake);
    item.syncEvidenceBlockers = syncEvidenceIntake.summary?.blockers ?? syncEvidenceIntake.blockers?.length ?? null;
    item.nextUnblockCommand = nextUnblockCommandFor(syncEvidenceIntake, group.nextCommand);
    item.firstBlocker = syncEvidenceIntake.blockers?.[0] ?? item.firstBlocker;
  }

  return item;
}

export function buildJune10P0BurndownPlan({ ledger, syncEvidenceIntake = null }) {
  if (!ledger) {
    return {
      generatedAtUtc: new Date().toISOString(),
      launchVerdict: "NO_GO",
      summary: {
        p0Items: 0,
        deferredNonP0Items: 0,
        waitingExternalItems: 0,
        blockedItems: 0,
        readyForCodexItems: 0
      },
      planBlockers: ["June 10 ship-blocker ledger is missing."],
      executionQueue: [],
      deferredItems: [],
      rules: [
        "Generate the ship-blocker ledger before building a P0 burndown plan.",
        "No June 10 GO decision is possible without a P0 burndown artifact."
      ]
    };
  }

  const groups = ledger.blockerGroups ?? [];
  const p0Groups = groups
    .filter((group) => group.priority === "P0")
    .sort((a, b) => sequenceRank(a.source) - sequenceRank(b.source) || a.source.localeCompare(b.source));
  const executionQueue = p0Groups.map((group, index) => itemFromGroup(group, index, syncEvidenceIntake));
  const deferredItems = groups
    .filter((group) => group.priority !== "P0")
    .map((group) => ({
      source: group.source,
      priority: group.priority,
      ownerLane: group.ownerLane,
      proofCommand: group.nextCommand,
      blockerCount: group.blockerCount,
      reason: "Deferred until P0 launch blockers clear."
    }));

  return {
    generatedAtUtc: new Date().toISOString(),
    launchVerdict: ledger.launchVerdict ?? "UNKNOWN",
    summary: {
      p0Items: executionQueue.length,
      deferredNonP0Items: deferredItems.length,
      waitingExternalItems: executionQueue.filter((item) =>
        ["WAITING_EXTERNAL_SYNC_DB", "WAITING_SYNC_DB_EVIDENCE"].includes(item.status)
      ).length,
      blockedItems: executionQueue.filter((item) => item.status.startsWith("BLOCKED")).length,
      readyForCodexItems: executionQueue.filter((item) => item.status === "READY_FOR_CODEX").length,
      syncEvidenceIntakeStatus: syncIntakeStatusFor(syncEvidenceIntake),
      syncEvidenceBlockers: syncEvidenceIntake?.summary?.blockers ?? syncEvidenceIntake?.blockers?.length ?? null
    },
    planBlockers: executionQueue.length === 0 ? ["No P0 items found; launch-control evidence may be stale."] : [],
    executionQueue,
    deferredItems,
    rules: [
      "This is a burn-down plan, not a readiness pass.",
      "P0 items are the only active June 10 lane until cleared.",
      "Product runtime claims stay blocked while any P0 item remains unresolved.",
      "External Sync/DB work must produce proof artifacts before dependent Codex work can close.",
      "P1 work is deferred unless it directly clears a P0 blocker."
    ]
  };
}

function renderMarkdown(plan) {
  const lines = [
    "# June 10 P0 Burndown Plan",
    "",
    `Generated: ${plan.generatedAtUtc}`,
    "",
    `Launch verdict: ${plan.launchVerdict}`,
    "",
    "## Summary",
    "",
    `- P0 items: ${plan.summary.p0Items}`,
    `- Deferred non-P0 items: ${plan.summary.deferredNonP0Items}`,
    `- Waiting external items: ${plan.summary.waitingExternalItems}`,
    `- Blocked items: ${plan.summary.blockedItems}`,
    `- Ready for Codex items: ${plan.summary.readyForCodexItems}`,
    `- Sync evidence intake status: ${plan.summary.syncEvidenceIntakeStatus}`,
    `- Sync evidence blockers: ${plan.summary.syncEvidenceBlockers ?? "unknown"}`,
    "",
    "## Execution Queue",
    "",
    "| Seq | Source | Status | Owner lane | Blocked by | Proof command | Next unblock command |",
    "|---:|---|---|---|---|---|---|"
  ];

  for (const item of plan.executionQueue) {
    lines.push(
      [
        item.sequence,
        item.source,
        item.status,
        item.ownerLane,
        item.blockedBy.length ? item.blockedBy.join(", ") : "-",
        item.proofCommand ? `\`${item.proofCommand}\`` : "-",
        item.nextUnblockCommand ? `\`${item.nextUnblockCommand}\`` : "-"
      ].join(" | ")
    );
  }

  lines.push("", "## Plan Blockers", "");
  if (plan.planBlockers.length === 0) lines.push("- None");
  else plan.planBlockers.forEach((blocker) => lines.push(`- ${blocker}`));

  lines.push("", "## Deferred Items", "");
  if (plan.deferredItems.length === 0) {
    lines.push("- None");
  } else {
    plan.deferredItems.forEach((item) =>
      lines.push(`- ${item.priority} ${item.source}: ${item.reason} Proof: \`${item.proofCommand ?? "none"}\``)
    );
  }

  lines.push("", "## Rules", "");
  plan.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    ledgerPath: DEFAULT_LEDGER,
    syncIntakePath: DEFAULT_SYNC_INTAKE,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--ledger") args.ledgerPath = path.resolve(argv[++i]);
    else if (arg === "--sync-intake") args.syncIntakePath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const plan = buildJune10P0BurndownPlan({
    ledger: readJson(args.ledgerPath, null),
    syncEvidenceIntake: readJson(args.syncIntakePath, null)
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(plan, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(plan));
  }

  console.log(
    JSON.stringify(
      {
        launchVerdict: plan.launchVerdict,
        p0Items: plan.summary.p0Items,
        waitingExternalItems: plan.summary.waitingExternalItems,
        blockedItems: plan.summary.blockedItems,
        syncEvidenceIntakeStatus: plan.summary.syncEvidenceIntakeStatus,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  return plan;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
