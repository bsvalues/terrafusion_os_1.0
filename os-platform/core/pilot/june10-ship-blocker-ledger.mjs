#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_READINESS = path.join(repoRoot, "generated", "truth", "june10-readiness-packet.json");
const DEFAULT_LAUNCH_CONTROL = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-launch-control.latest.json"
);
const DEFAULT_RED_TEAM = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-red-team.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-ship-blocker-ledger.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-ship-blocker-ledger.latest.md"
);

const SOURCE_DEFAULTS = {
  productLoadLedger: {
    priority: "P0",
    ownerLane: "Claude Code / Sync DB, audited by Codex",
    nextCommand: "pnpm run truth:terrafusion-db-product-load-ledger",
    requiredResolution: "Prove TerraFusion DB product-load receipts for runtime tables."
  },
  bentonPilotClosure: {
    priority: "P0",
    ownerLane: "Codex after Benton data gates are green",
    nextCommand: "pnpm run truth:benton-runtime-pilot-closure",
    requiredResolution: "Prove Benton runtime pilot closure with passing data gates."
  },
  crosswalk: {
    priority: "P1",
    ownerLane: "Codex",
    nextCommand: "pnpm run truth:washington-39-county-data-crosswalk",
    requiredResolution: "Align county scope with proof-backed runtime readiness."
  },
  runtimeCandidateSet: {
    priority: "P1",
    ownerLane: "Codex after runtime registration ledger refresh",
    nextCommand: "pnpm run truth:runtime-candidate-set",
    requiredResolution: "Recompute runtime candidates from evidence only."
  },
  launchControl: {
    priority: "P0",
    ownerLane: "Codex",
    nextCommand: "pnpm run truth:june10-launch-control",
    requiredResolution: "Clear launch-control stop conditions."
  }
};

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function groupBySource(blockers) {
  const groups = new Map();
  for (const blocker of blockers ?? []) {
    const source = blocker.source ?? "unknown";
    if (!groups.has(source)) groups.set(source, []);
    groups.get(source).push(blocker.message ?? String(blocker));
  }
  return groups;
}

function queueBySource(readiness) {
  const map = new Map();
  for (const item of readiness?.executionQueue ?? []) {
    if (item.source) map.set(item.source, item);
  }
  return map;
}

function priorityRank(priority) {
  return { P0: 0, P1: 1, P2: 2, P3: 3 }[priority] ?? 9;
}

function sourceRank(source) {
  const ordered = ["productLoadLedger", "bentonPilotClosure", "crosswalk", "runtimeCandidateSet", "launchControl"];
  const index = ordered.indexOf(source);
  if (index >= 0) return index;
  if (source.startsWith("redTeam:")) return 50;
  return 100;
}

function groupFromSource(source, messages, queue) {
  const defaults = SOURCE_DEFAULTS[source] ?? {
    priority: "P2",
    ownerLane: "Codex",
    nextCommand: null,
    requiredResolution: "Investigate and clear blocker."
  };
  const queueItem = queue.get(source);

  return {
    source,
    priority: defaults.priority,
    ownerLane: queueItem?.ownerLane ?? defaults.ownerLane,
    nextCommand: queueItem?.nextCommand ?? defaults.nextCommand,
    requiredResolution: queueItem?.requiredResolution ?? defaults.requiredResolution,
    blockerCount: messages.length,
    blockers: messages
  };
}

function launchControlGroup(launchControl) {
  const stopConditions = launchControl?.stopConditions ?? [];
  if (stopConditions.length === 0) return null;
  const defaults = SOURCE_DEFAULTS.launchControl;
  return {
    source: "launchControl",
    priority: defaults.priority,
    ownerLane: defaults.ownerLane,
    nextCommand: defaults.nextCommand,
    requiredResolution: defaults.requiredResolution,
    blockerCount: stopConditions.length,
    blockers: stopConditions
  };
}

function redTeamGroups(redTeam) {
  return (redTeam?.credibilityAttacks ?? [])
    .filter((attack) => attack.severity === "CRITICAL" || attack.severity === "HIGH")
    .map((attack) => ({
      source: `redTeam:${attack.surface}`,
      priority: attack.severity === "CRITICAL" ? "P0" : "P1",
      ownerLane: "Codex / launch-control review",
      nextCommand: "pnpm run truth:june10-red-team",
      requiredResolution: "Clear or contain the credibility attack before public readiness claims.",
      blockerCount: 1,
      blockers: [attack.attack]
    }));
}

export function buildJune10ShipBlockerLedger({ readiness, launchControl, redTeam }) {
  const queue = queueBySource(readiness);
  const groups = [];

  for (const [source, messages] of groupBySource(readiness?.shipBlockers)) {
    groups.push(groupFromSource(source, messages, queue));
  }

  const launchGroup = launchControlGroup(launchControl);
  if (launchGroup) groups.push(launchGroup);
  groups.push(...redTeamGroups(redTeam));

  groups.sort(
    (a, b) =>
      priorityRank(a.priority) - priorityRank(b.priority) ||
      sourceRank(a.source) - sourceRank(b.source) ||
      b.blockerCount - a.blockerCount ||
      a.source.localeCompare(b.source)
  );

  return {
    generatedAtUtc: new Date().toISOString(),
    launchVerdict: launchControl?.launchVerdict ?? "UNKNOWN",
    readinessStatus: readiness?.status ?? "missing",
    redTeamVerdict: redTeam?.verdict ?? "missing",
    summary: {
      blockerGroups: groups.length,
      readinessBlockers: readiness?.shipBlockers?.length ?? 0,
      launchStopConditions: launchControl?.stopConditions?.length ?? 0,
      criticalRedTeamAttacks: (redTeam?.credibilityAttacks ?? []).filter((attack) => attack.severity === "CRITICAL").length,
      p0Groups: groups.filter((group) => group.priority === "P0").length,
      p1Groups: groups.filter((group) => group.priority === "P1").length
    },
    blockerGroups: groups,
    rules: [
      "This ledger prioritizes blockers; it does not clear them.",
      "P0 blockers must clear before June 10 GO can be considered.",
      "Launch-control stop conditions and red-team critical attacks are ship blockers.",
      "Owner lanes describe execution responsibility; proof commands are the required verification surface."
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Ship Blocker Ledger",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Launch verdict: ${report.launchVerdict}`,
    `Readiness status: ${report.readinessStatus}`,
    `Red-team verdict: ${report.redTeamVerdict}`,
    "",
    "## Summary",
    "",
    `- Blocker groups: ${report.summary.blockerGroups}`,
    `- Readiness blockers: ${report.summary.readinessBlockers}`,
    `- Launch stop conditions: ${report.summary.launchStopConditions}`,
    `- Critical red-team attacks: ${report.summary.criticalRedTeamAttacks}`,
    `- P0 groups: ${report.summary.p0Groups}`,
    `- P1 groups: ${report.summary.p1Groups}`,
    "",
    "## Blocker Groups",
    "",
    "| Priority | Source | Count | Owner lane | Next command |",
    "|---|---|---:|---|---|"
  ];

  for (const group of report.blockerGroups) {
    lines.push(
      [
        group.priority,
        group.source,
        group.blockerCount,
        group.ownerLane,
        group.nextCommand ? `\`${group.nextCommand}\`` : "-"
      ].join(" | ")
    );
  }

  lines.push("", "## Details", "");
  for (const group of report.blockerGroups) {
    lines.push(`### ${group.priority} ${group.source}`, "", `Owner: ${group.ownerLane}`, "");
    lines.push(`Required resolution: ${group.requiredResolution}`, "");
    group.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
    lines.push("");
  }

  lines.push("## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    readinessPath: DEFAULT_READINESS,
    launchControlPath: DEFAULT_LAUNCH_CONTROL,
    redTeamPath: DEFAULT_RED_TEAM,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--readiness") args.readinessPath = path.resolve(argv[++i]);
    else if (arg === "--launch-control") args.launchControlPath = path.resolve(argv[++i]);
    else if (arg === "--red-team") args.redTeamPath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildJune10ShipBlockerLedger({
    readiness: readJson(args.readinessPath, null),
    launchControl: readJson(args.launchControlPath, null),
    redTeam: readJson(args.redTeamPath, null)
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        launchVerdict: report.launchVerdict,
        blockerGroups: report.summary.blockerGroups,
        p0Groups: report.summary.p0Groups,
        readinessBlockers: report.summary.readinessBlockers,
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
