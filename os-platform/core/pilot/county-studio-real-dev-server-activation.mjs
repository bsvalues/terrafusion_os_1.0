#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_READINESS_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "benton-real-dev-server-readiness.json"
);
const DEFAULT_DATA_TRUTH_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-r1-data-truth-gate.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-real-dev-server-activation.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-real-dev-server-activation.md"
);

const DEV_ALLOWED_CLASSIFICATIONS = new Set(["AUTHORITATIVE", "SYNC_DERIVED", "SEEDED", "PARTIAL_SEEDED"]);
const DEV_BLOCKING_CLASSIFICATIONS = new Set(["MOCK", "FIXTURE", "GENERATED", "FALLBACK", "UNKNOWN"]);
const ACTIVATION_DEPENDENCY_CHECKS = new Set([
  "backend health",
  "map data dependency status",
  "ledger data dependency status",
  "inspector data dependency status"
]);
const PRODUCTION_BLOCKING_CLASSIFICATIONS = new Set(["MOCK", "FIXTURE", "GENERATED", "FALLBACK", "UNKNOWN"]);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function normalizeClassification(value) {
  return String(value ?? "UNKNOWN").trim().toUpperCase();
}

function readinessDependencyBlockers(readinessReport) {
  const checks = Array.isArray(readinessReport?.checks) ? readinessReport.checks : [];
  return checks
    .filter((check) => ACTIVATION_DEPENDENCY_CHECKS.has(check.name))
    .filter((check) => {
      const classification = normalizeClassification(check.classification);
      return check.passed !== true || !DEV_ALLOWED_CLASSIFICATIONS.has(classification) || DEV_BLOCKING_CLASSIFICATIONS.has(classification);
    })
    .map((check) => `${check.name}: ${check.classification ?? "UNKNOWN"} cannot satisfy real dev activation.`);
}

function productionBlockedDependencies(dataTruthReport) {
  const proofAreas = Array.isArray(dataTruthReport?.proofAreas) ? dataTruthReport.proofAreas : [];
  return proofAreas
    .filter((area) => PRODUCTION_BLOCKING_CLASSIFICATIONS.has(normalizeClassification(area.classification)))
    .map((area) => ({
      area: area.area,
      classification: normalizeClassification(area.classification),
      reason: area.reason ?? "Production lineage remains unproven."
    }));
}

function activationBlockers(readinessReport) {
  const blockers = [];
  if (readinessReport?.decisions?.realDevServerAllowed !== true) {
    blockers.push("Benton real-dev readiness is not allowed.");
  }
  if (Array.isArray(readinessReport?.blockers)) {
    blockers.push(...readinessReport.blockers);
  }
  blockers.push(...readinessDependencyBlockers(readinessReport));
  return [...new Set(blockers)];
}

export function buildCountyStudioRealDevServerActivationReport({
  readinessReport = null,
  dataTruthReport = null,
  generatedAtUtc = new Date().toISOString()
} = {}) {
  const blockers = activationBlockers(readinessReport);
  const realDevActivationAllowed = readinessReport?.decisions?.realDevServerAllowed === true && blockers.length === 0;
  const status = realDevActivationAllowed ? "REAL_DEV_ACTIVATION_READY" : "REAL_DEV_ACTIVATION_BLOCKED";
  const blockedDependencies = productionBlockedDependencies(dataTruthReport);

  return {
    generatedAtUtc,
    gate: "county-studio-real-dev-server-activation",
    status,
    decisions: {
      realDevActivationAllowed,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    runPath: {
      prerequisiteCommand: "pnpm run proof:county-studio:benton-real-dev-server-readiness:db",
      activationCommand: "pnpm run proof:county-studio:real-dev-activation",
      launchCommand:
        "cross-env TF_COUNTY_STUDIO_DEV_DATA_MODE=real-benton TF_COUNTY_STUDIO_PRODUCTION_PROOF=false TF_COUNTY_STUDIO_OPERATIONAL_PROOF=false pnpm run dev"
    },
    readinessPosture: {
      status: readinessReport?.status ?? "UNKNOWN",
      realDevServerAllowed: readinessReport?.decisions?.realDevServerAllowed === true,
      productionProofAllowed: readinessReport?.decisions?.productionProofAllowed === true,
      operationalProofAllowed: readinessReport?.decisions?.operationalProofAllowed === true
    },
    dataTruthPosture: {
      status: dataTruthReport?.status ?? "UNKNOWN",
      productionProofAllowed: dataTruthReport?.claims?.productionProofAllowed === true,
      operationalProofAllowed: dataTruthReport?.claims?.operationalProofAllowed === true
    },
    productionBlockedDependencies: blockedDependencies,
    blockers,
    rules: [
      "Real dev activation requires the Benton real-dev readiness DB gate.",
      "Mock, fixture, generated, fallback, or unknown activation dependencies cannot satisfy real dev mode.",
      "Real dev mode is not production proof.",
      "Real dev mode is not operational proof."
    ],
    boundaries: [
      "This gate does not touch County Studio UI.",
      "This gate does not touch TerraFusion Sync.",
      "This gate does not touch DB seeding.",
      "This gate does not bypass evidence gates."
    ]
  };
}

export function renderCountyStudioRealDevServerActivationMarkdown(report) {
  const lines = [
    "# County Studio Real Dev Server Activation",
    "",
    `Generated: ${report.generatedAtUtc}`,
    `Status: ${report.status}`,
    "",
    "## Decision",
    "",
    `- Real Dev Activation: ${report.decisions.realDevActivationAllowed ? "ALLOWED" : "BLOCKED"}`,
    `- Production Proof: ${report.decisions.productionProofAllowed ? "ALLOWED" : "BLOCKED"}`,
    `- Operational Proof: ${report.decisions.operationalProofAllowed ? "ALLOWED" : "BLOCKED"}`,
    "",
    "## Run Path",
    "",
    `1. \`${report.runPath.prerequisiteCommand}\``,
    `2. \`${report.runPath.activationCommand}\``,
    `3. \`${report.runPath.launchCommand}\``,
    "",
    "## Readiness Posture",
    "",
    `- Status: ${report.readinessPosture.status}`,
    `- realDevServerAllowed: ${report.readinessPosture.realDevServerAllowed}`,
    `- productionProofAllowed: ${report.readinessPosture.productionProofAllowed}`,
    `- operationalProofAllowed: ${report.readinessPosture.operationalProofAllowed}`,
    "",
    "## Data Truth Posture",
    "",
    `- Status: ${report.dataTruthPosture.status}`,
    `- productionProofAllowed: ${report.dataTruthPosture.productionProofAllowed}`,
    `- operationalProofAllowed: ${report.dataTruthPosture.operationalProofAllowed}`,
    "",
    "## Production-Blocked Dependencies",
    "",
    "| Area | Classification | Reason |",
    "| --- | --- | --- |"
  ];

  if (report.productionBlockedDependencies.length === 0) {
    lines.push("| None | - | - |");
  } else {
    report.productionBlockedDependencies.forEach((item) => {
      lines.push(`| ${item.area} | ${item.classification} | ${String(item.reason).replaceAll("\n", " ")} |`);
    });
  }

  lines.push("", "## Activation Blockers", "");
  if (report.blockers.length === 0) {
    lines.push("- None");
  } else {
    report.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
  }

  lines.push("", "## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  lines.push("", "## Boundaries", "");
  report.boundaries.forEach((boundary) => lines.push(`- ${boundary}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    readiness: DEFAULT_READINESS_JSON,
    dataTruth: DEFAULT_DATA_TRUTH_JSON,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--readiness") args.readiness = path.resolve(argv[++i]);
    else if (arg === "--data-truth") args.dataTruth = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildCountyStudioRealDevServerActivationReport({
    readinessReport: readJson(args.readiness),
    dataTruthReport: readJson(args.dataTruth)
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderCountyStudioRealDevServerActivationMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        status: report.status,
        realDevActivationAllowed: report.decisions.realDevActivationAllowed,
        productionProofAllowed: report.decisions.productionProofAllowed,
        operationalProofAllowed: report.decisions.operationalProofAllowed,
        blockers: report.blockers.length,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  if (!report.decisions.realDevActivationAllowed) {
    process.exitCode = 1;
  }

  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
