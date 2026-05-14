#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_READINESS = path.join(repoRoot, "generated", "truth", "june10-readiness-packet.json");
const DEFAULT_RED_TEAM = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-red-team.latest.json"
);
const DEFAULT_CLAIM_GUARD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-claim-guard.latest.json"
);
const DEFAULT_SEED_LANE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-lane.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-launch-control.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-launch-control.latest.md"
);

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function launchVerdictFor({ readiness, redTeam, claimGuard, seedLane }) {
  if (!readiness || !redTeam || !claimGuard || !seedLane) return "NO_GO";
  if (readiness.status !== "PASS") return "NO_GO";
  if (redTeam.verdict === "RED") return "NO_GO";
  if (claimGuard.guardStatus === "LOCKED" || claimGuard.publicClaimsAllowed !== true) return "NO_GO";
  if (seedLane.summary?.runtimeClaimAllowed !== false) return "NO_GO";
  if (seedLane.passed !== true) return "NO_GO";
  if (redTeam.verdict === "YELLOW" || claimGuard.guardStatus === "REVIEW_REQUIRED") return "HOLD_FOR_REVIEW";
  return "GO";
}

export function buildJune10LaunchControlReport({ readiness, redTeam, claimGuard, seedLane }) {
  const launchVerdict = launchVerdictFor({ readiness, redTeam, claimGuard, seedLane });
  const shipBlockers = readiness?.shipBlockers ?? [];
  const stopConditions = [];

  if (!readiness) stopConditions.push("June 10 readiness packet is missing.");
  else if (readiness.status !== "PASS") stopConditions.push("June 10 readiness packet is not passing.");

  if (!redTeam) stopConditions.push("June 10 red-team report is missing.");
  else if (redTeam.verdict === "RED") stopConditions.push("Credibility red-team verdict is RED.");

  if (!claimGuard) stopConditions.push("June 10 claim guard is missing.");
  else if (claimGuard.guardStatus === "LOCKED") stopConditions.push("Launch claim guard is LOCKED.");

  if (!seedLane) stopConditions.push("38-county seed lane packet is missing.");
  else if (seedLane.summary?.runtimeClaimAllowed !== false) stopConditions.push("Seed lane runtime claim guard is not false.");
  else if (seedLane.passed !== true) stopConditions.push("38-county seed lane is not passing its control-plane checks.");

  const nextCommands = unique([
    ...(readiness?.executionQueue ?? []).map((item) => item.nextCommand),
    ...(launchVerdict === "NO_GO"
      ? ["pnpm run truth:june10-red-team", "pnpm run truth:june10-claim-guard"]
      : [])
  ]);

  const requiredProofArtifacts = unique([
    ...(claimGuard?.requiredProofArtifacts ?? []),
    ...(redTeam?.requiredProofArtifacts ?? [])
  ]);

  const summary = {
    launchVerdict,
    readinessStatus: readiness?.status ?? "missing",
    shipBlockers: shipBlockers.length,
    redTeamVerdict: redTeam?.verdict ?? "missing",
    criticalAttacks: redTeam?.summary?.criticalAttacks ?? null,
    claimGuardStatus: claimGuard?.guardStatus ?? "missing",
    publicClaimsAllowed: claimGuard?.publicClaimsAllowed ?? false,
    seedLanePassed: seedLane?.passed ?? null,
    seedReceiptsFound: seedLane?.summary?.receiptsFound ?? null,
    seedRuntimeClaimAllowed: seedLane?.summary?.runtimeClaimAllowed ?? null,
    stopConditions: stopConditions.length
  };

  return {
    generatedAtUtc: new Date().toISOString(),
    launchVerdict,
    summary,
    approvedExternalFraming:
      claimGuard?.allowedFraming ??
      "No external framing is approved until the claim guard and red-team artifacts exist.",
    stopConditions,
    nextCommands,
    requiredProofArtifacts,
    shipBlockers: shipBlockers.slice(0, 20),
    rules: [
      "Launch control is an executive control packet, not runtime proof.",
      "NO_GO means no production approval, public readiness claim, or statewide runtime claim.",
      "Claim guard language is the maximum allowed public framing while launchVerdict is not GO.",
      "A GO verdict requires passing readiness, non-RED red-team posture, unlocked claim guard, and seed-lane claim safety."
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Launch Control",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Launch verdict: ${report.launchVerdict}`,
    "",
    "## Summary",
    "",
    `- Readiness status: ${report.summary.readinessStatus}`,
    `- Ship blockers: ${report.summary.shipBlockers}`,
    `- Red-team verdict: ${report.summary.redTeamVerdict}`,
    `- Critical attacks: ${report.summary.criticalAttacks ?? "unknown"}`,
    `- Claim guard status: ${report.summary.claimGuardStatus}`,
    `- Public claims allowed: ${report.summary.publicClaimsAllowed}`,
    `- Seed lane passed: ${report.summary.seedLanePassed ?? "unknown"}`,
    `- Seed receipts found: ${report.summary.seedReceiptsFound ?? "unknown"}`,
    `- Seed runtime claim allowed: ${report.summary.seedRuntimeClaimAllowed ?? "unknown"}`,
    "",
    "## Approved External Framing",
    "",
    report.approvedExternalFraming,
    "",
    "## Stop Conditions",
    ""
  ];

  if (report.stopConditions.length === 0) {
    lines.push("- None");
  } else {
    report.stopConditions.forEach((condition) => lines.push(`- ${condition}`));
  }

  lines.push("", "## Next Commands", "");
  if (report.nextCommands.length === 0) {
    lines.push("- None");
  } else {
    report.nextCommands.forEach((command) => lines.push(`- \`${command}\``));
  }

  lines.push("", "## Required Proof Artifacts", "");
  report.requiredProofArtifacts.forEach((artifact) => lines.push(`- ${artifact}`));

  lines.push("", "## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    readinessPath: DEFAULT_READINESS,
    redTeamPath: DEFAULT_RED_TEAM,
    claimGuardPath: DEFAULT_CLAIM_GUARD,
    seedLanePath: DEFAULT_SEED_LANE,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--readiness") args.readinessPath = path.resolve(argv[++i]);
    else if (arg === "--red-team") args.redTeamPath = path.resolve(argv[++i]);
    else if (arg === "--claim-guard") args.claimGuardPath = path.resolve(argv[++i]);
    else if (arg === "--seed-lane") args.seedLanePath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildJune10LaunchControlReport({
    readiness: readJson(args.readinessPath, null),
    redTeam: readJson(args.redTeamPath, null),
    claimGuard: readJson(args.claimGuardPath, null),
    seedLane: readJson(args.seedLanePath, null)
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
        readinessStatus: report.summary.readinessStatus,
        shipBlockers: report.summary.shipBlockers,
        stopConditions: report.summary.stopConditions,
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
