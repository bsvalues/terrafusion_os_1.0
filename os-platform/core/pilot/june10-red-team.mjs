#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_READINESS = path.join(repoRoot, "generated", "truth", "june10-readiness-packet.json");
const DEFAULT_SEED_LANE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-lane.latest.json"
);
const DEFAULT_BENTON_ATTEMPT = path.join(repoRoot, "evidence", "2026-05-13-benton-full-corpus-ATTEMPT.json");
const DEFAULT_COVERAGE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "washington-39-county-coverage.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-red-team.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-red-team.latest.md"
);

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function addAttack(attacks, surface, severity, attack, evidence, failureMoment) {
  attacks.push({
    surface,
    severity,
    attack,
    evidence,
    likelyFailureMoment: failureMoment
  });
}

function verdictFor(attacks, readiness) {
  if (readiness?.status === "FAIL") return "RED";
  if (attacks.some((attack) => attack.severity === "CRITICAL")) return "RED";
  if (attacks.some((attack) => attack.severity === "HIGH")) return "YELLOW";
  return "GREEN";
}

export function buildJune10RedTeamReport({ readiness, seedLane, bentonCorpusAttempt, coverage }) {
  const attacks = [];
  const shipBlockers = readiness?.shipBlockers ?? [];
  const terraFusionDb = readiness?.summary?.terraFusionDb ?? {};
  const countyScope = readiness?.summary?.countyScope ?? {};
  const bentonPilot = readiness?.summary?.bentonPilot ?? {};
  const seedSummary = seedLane?.summary ?? {};
  const bentonSummary = bentonCorpusAttempt?.summary ?? {};

  if (readiness?.status === "FAIL" || shipBlockers.length > 0) {
    addAttack(
      attacks,
      "governance_posture",
      "CRITICAL",
      "Final readiness packet is failing, so any production approval claim outruns the proof record.",
      `${shipBlockers.length} ship blocker(s); readiness status ${readiness?.status ?? "missing"}.`,
      "Executive or IT reviewer asks for go/no-go evidence and the packet says FAIL."
    );
  }

  if (terraFusionDb.productLoadLedgerPassed === false || terraFusionDb.lineageProven === 0) {
    addAttack(
      attacks,
      "runtime_lineage",
      "CRITICAL",
      "Rows may exist in TerraFusion DB, but product-load lineage is not proven enough for audit-grade trust.",
      `lineageProven=${terraFusionDb.lineageProven ?? "unknown"}; rowsExistLineageUnproven=${terraFusionDb.rowsExistLineageUnproven ?? "unknown"}.`,
      "State auditor asks when each product table was loaded and which receipt proves it."
    );
  }

  if (bentonCorpusAttempt?.verdict?.sealed === false || bentonSummary.runStatus === "Interrupted") {
    addAttack(
      attacks,
      "benton_realism",
      "CRITICAL",
      "Benton full-corpus proof is an ATTEMPT, not a seal; six-lane completion and API readback are not proven.",
      `runStatus=${bentonSummary.runStatus ?? "unknown"}; lanesCompleted=${bentonSummary.lanesCompleted ?? "unknown"}; sealed=${bentonCorpusAttempt?.verdict?.sealed ?? "missing"}.`,
      "Benton staff asks whether the full corpus is complete and API-verified."
    );
  }

  if (bentonPilot.pilotClosureStatus === "FAIL" || bentonPilot.pilotClosureProofDetailPassed === false) {
    addAttack(
      attacks,
      "uat_survivability",
      "HIGH",
      "Benton pilot closure is not passing, so end-to-end UAT can fail even if individual data checks pass.",
      `pilotClosureStatus=${bentonPilot.pilotClosureStatus ?? "unknown"}.`,
      "Operator tries to complete the Benton workflow from data load through closure."
    );
  }

  if (seedSummary.receiptsFound === 0) {
    addAttack(
      attacks,
      "county_trust",
      "HIGH",
      "The 38-county seed lane has work orders and templates but no actual source receipts yet.",
      `workOrders=${seedSummary.workOrders ?? "unknown"}; receiptsFound=${seedSummary.receiptsFound ?? "unknown"}.`,
      "A county asks whether its data was actually acquired, loaded, or smoke-tested."
    );
  }

  if (countyScope.prohibit39CountyRuntimeClaim !== true || countyScope.runtimeCandidateScope === "runtime_scope_requires_review") {
    addAttack(
      attacks,
      "overclaim_risk",
      "HIGH",
      "County-scope language is still easy to overread as statewide runtime readiness.",
      `runtimeCandidateScope=${countyScope.runtimeCandidateScope ?? "unknown"}; runtimeCandidateProven=${countyScope.runtimeCandidateProven ?? "unknown"}.`,
      "Leadership repeats a 39-county runtime claim and a reviewer asks for county-by-county proof."
    );
  }

  if (coverage?.status === "PASS_WITH_LIMITATIONS") {
    addAttack(
      attacks,
      "source_inventory",
      "MEDIUM",
      "Coverage proof is registry/source-decision proof only, not ingestion, normalization, geometry, API, or UI proof.",
      coverage.limitations?.[0] ?? "Coverage artifact reports limitations.",
      "Reviewer mistakes source-decision coverage for loaded runtime data."
    );
  }

  const verdict = verdictFor(attacks, readiness);
  const summary = {
    verdict,
    attacks: attacks.length,
    criticalAttacks: attacks.filter((attack) => attack.severity === "CRITICAL").length,
    highAttacks: attacks.filter((attack) => attack.severity === "HIGH").length,
    shipBlockers: shipBlockers.length,
    seedReceiptsFound: seedSummary.receiptsFound ?? null,
    seedRuntimeClaimAllowed: seedSummary.runtimeClaimAllowed ?? null,
    bentonCorpusSealed: bentonCorpusAttempt?.verdict?.sealed ?? null,
    readinessStatus: readiness?.status ?? "missing"
  };

  return {
    generatedAtUtc: new Date().toISOString(),
    verdict,
    summary,
    credibilityAttacks: attacks,
    likelyFailureMoments: attacks.map((attack) => attack.likelyFailureMoment),
    highestRiskNarratives: [
      "Production ready before the readiness packet passes.",
      "Benton full corpus is complete before a sealed verification exists.",
      "39 counties are runtime-ready before receipt, API, and UI proof exists.",
      "Rows in TerraFusion DB imply lineage-proven product loads.",
      "Templates or work orders imply real acquisition evidence."
    ],
    trustCollapseScenarios: [
      "A county asks for table load receipts and the product-load ledger cannot produce them.",
      "A live Benton UAT path reaches closure and the closure packet still reports FAIL.",
      "A reviewer compares 39-county marketing language against zero seed receipts.",
      "A taxpayer challenges a valuation explanation that depends on fallback or recommendation-backed evidence.",
      "An IT reviewer asks for API readback from the corpus drain and the artifact shows unauthorized or incomplete readback."
    ],
    bannedNarratives: [
      "39 counties are runtime-ready",
      "Benton full corpus is sealed",
      "TerraFusion is production approved",
      "All data flows end to end",
      "Official county-certified valuation is ready",
      "Seed templates prove county acquisition"
    ],
    requiredContainmentPosture: [
      "Treat the readiness packet failure as authoritative until it passes.",
      "Treat Benton corpus evidence as ATTEMPT only until sealed.",
      "Treat the 38-county lane as governed acquisition preparation until real receipts pass.",
      "Do not claim runtime readiness from source registry coverage, templates, or work orders.",
      "Require product-load receipts before making product data confidence claims."
    ],
    safestPublicFraming:
      "TerraFusion is in controlled readiness execution. The governance gates are operating, Benton is the primary runtime pilot closure lane, and the 38-county seed lane is prepared but not promoted. Production and statewide runtime claims remain blocked until the proof gates pass.",
    requiredProofArtifacts: [
      "Passing June 10 readiness packet.",
      "Passing TerraFusion DB product-load ledger with ProductLoadReceipts evidence.",
      "Sealed Benton full-corpus verification, not ATTEMPT.",
      "Passing Benton runtime pilot closure.",
      "At least one real 38-county seed receipt passing the validator.",
      "API proof and UI smoke for every promoted non-Benton county.",
      "County-scope artifact showing no fake 39-county runtime claim."
    ],
    sourceArtifacts: {
      readinessStatus: readiness?.status ?? "missing",
      seedLanePassed: seedLane?.passed ?? null,
      bentonCorpusRunStatus: bentonSummary.runStatus ?? null,
      coverageStatus: coverage?.status ?? null
    }
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Credibility Attack Report",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Verdict: ${report.verdict}`,
    "",
    "## Summary",
    "",
    `- Attacks: ${report.summary.attacks}`,
    `- Critical attacks: ${report.summary.criticalAttacks}`,
    `- High attacks: ${report.summary.highAttacks}`,
    `- Ship blockers: ${report.summary.shipBlockers}`,
    `- Seed receipts found: ${report.summary.seedReceiptsFound ?? "unknown"}`,
    `- Benton corpus sealed: ${report.summary.bentonCorpusSealed ?? "unknown"}`,
    `- Readiness status: ${report.summary.readinessStatus}`,
    "",
    "## Credibility Attacks",
    "",
    "| Surface | Severity | Attack | Evidence |",
    "|---|---|---|---|"
  ];

  for (const attack of report.credibilityAttacks) {
    lines.push([attack.surface, attack.severity, attack.attack, attack.evidence].join(" | "));
  }

  lines.push("", "## Banned Narratives", "");
  report.bannedNarratives.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Required Containment Posture", "");
  report.requiredContainmentPosture.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Required Proof Artifacts", "");
  report.requiredProofArtifacts.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Safest Public Framing", "", report.safestPublicFraming);

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    readinessPath: DEFAULT_READINESS,
    seedLanePath: DEFAULT_SEED_LANE,
    bentonAttemptPath: DEFAULT_BENTON_ATTEMPT,
    coveragePath: DEFAULT_COVERAGE,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--readiness") args.readinessPath = path.resolve(argv[++i]);
    else if (arg === "--seed-lane") args.seedLanePath = path.resolve(argv[++i]);
    else if (arg === "--benton-attempt") args.bentonAttemptPath = path.resolve(argv[++i]);
    else if (arg === "--coverage") args.coveragePath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildJune10RedTeamReport({
    readiness: readJson(args.readinessPath, null),
    seedLane: readJson(args.seedLanePath, null),
    bentonCorpusAttempt: readJson(args.bentonAttemptPath, null),
    coverage: readJson(args.coveragePath, null)
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        verdict: report.verdict,
        attacks: report.summary.attacks,
        criticalAttacks: report.summary.criticalAttacks,
        shipBlockers: report.summary.shipBlockers,
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
