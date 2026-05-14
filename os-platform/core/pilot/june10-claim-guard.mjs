#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

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
  "june10-claim-guard.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-claim-guard.latest.md"
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  if (!filePath) return "";
  return fs.readFileSync(filePath, "utf8");
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function findNarrativeHits(text, bannedNarratives) {
  const haystack = normalize(text);
  if (!haystack) return [];

  return bannedNarratives
    .filter((narrative) => haystack.includes(normalize(narrative)))
    .map((narrative) => ({
      matchedNarrative: narrative,
      severity: "BLOCKER",
      reason: "Proposed text contains a banned June 10 narrative."
    }));
}

function guardStatusFor(redTeam, proposedClaimFindings) {
  if (!redTeam || redTeam.verdict === "RED") return "LOCKED";
  if (proposedClaimFindings.length > 0) return "LOCKED";
  if (redTeam.verdict === "YELLOW") return "REVIEW_REQUIRED";
  return "CLEAR";
}

export function buildJune10ClaimGuardReport({ redTeam, proposedClaimsText = "" }) {
  const bannedNarratives = redTeam?.bannedNarratives ?? [];
  const proposedClaimFindings = findNarrativeHits(proposedClaimsText, bannedNarratives);
  const guardStatus = guardStatusFor(redTeam, proposedClaimFindings);
  const publicClaimsAllowed = guardStatus === "CLEAR";

  const blockedClaims = bannedNarratives.map((claim) => ({
    claim,
    reason: "Blocked until required proof artifacts pass and red-team verdict clears."
  }));

  const summary = {
    redTeamVerdict: redTeam?.verdict ?? "missing",
    guardStatus,
    publicClaimsAllowed,
    bannedNarratives: bannedNarratives.length,
    proposedClaimViolations: proposedClaimFindings.length,
    shipBlockers: redTeam?.summary?.shipBlockers ?? null,
    seedReceiptsFound: redTeam?.summary?.seedReceiptsFound ?? null,
    bentonCorpusSealed: redTeam?.summary?.bentonCorpusSealed ?? null
  };

  return {
    generatedAtUtc: new Date().toISOString(),
    guardStatus,
    publicClaimsAllowed,
    summary,
    allowedFraming: redTeam?.safestPublicFraming ?? "No public framing is approved until red-team evidence exists.",
    blockedClaims,
    proposedClaimFindings,
    requiredContainmentPosture: redTeam?.requiredContainmentPosture ?? [
      "Generate the June 10 red-team report before approving launch claims."
    ],
    requiredProofArtifacts: redTeam?.requiredProofArtifacts ?? ["Passing June 10 red-team report."],
    rules: [
      "The claim guard approves language only; it does not prove runtime readiness.",
      "Banned narratives remain blocked until the red-team verdict clears.",
      "Templates, work orders, and source registry coverage are not data-loaded proof.",
      "Public claims must stay inside the allowed framing while guardStatus is LOCKED or REVIEW_REQUIRED."
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Claim Guard",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Guard status: ${report.guardStatus}`,
    `Public claims allowed: ${report.publicClaimsAllowed}`,
    "",
    "## Summary",
    "",
    `- Red-team verdict: ${report.summary.redTeamVerdict}`,
    `- Banned narratives: ${report.summary.bannedNarratives}`,
    `- Proposed claim violations: ${report.summary.proposedClaimViolations}`,
    `- Ship blockers: ${report.summary.shipBlockers ?? "unknown"}`,
    `- Seed receipts found: ${report.summary.seedReceiptsFound ?? "unknown"}`,
    `- Benton corpus sealed: ${report.summary.bentonCorpusSealed ?? "unknown"}`,
    "",
    "## Allowed Framing",
    "",
    report.allowedFraming,
    "",
    "## Blocked Claims",
    ""
  ];

  report.blockedClaims.forEach((claim) => lines.push(`- ${claim.claim}: ${claim.reason}`));

  lines.push("", "## Proposed Claim Findings", "");
  if (report.proposedClaimFindings.length === 0) {
    lines.push("- None");
  } else {
    report.proposedClaimFindings.forEach((finding) =>
      lines.push(`- ${finding.matchedNarrative}: ${finding.reason}`)
    );
  }

  lines.push("", "## Required Proof Artifacts", "");
  report.requiredProofArtifacts.forEach((artifact) => lines.push(`- ${artifact}`));

  lines.push("", "## Required Containment Posture", "");
  report.requiredContainmentPosture.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    redTeamPath: DEFAULT_RED_TEAM,
    claimsPath: null,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--red-team") args.redTeamPath = path.resolve(argv[++i]);
    else if (arg === "--claims") args.claimsPath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildJune10ClaimGuardReport({
    redTeam: readJson(args.redTeamPath),
    proposedClaimsText: readText(args.claimsPath)
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        guardStatus: report.guardStatus,
        publicClaimsAllowed: report.publicClaimsAllowed,
        proposedClaimViolations: report.summary.proposedClaimViolations,
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
