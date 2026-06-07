#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
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
const DEFAULT_ACTIVATION_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-real-dev-server-activation.json"
);
const DEFAULT_FORGE_WIRING_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-forge-real-data-wiring.json"
);
const DEFAULT_GEOMETRY_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-terraatlas-geometry-evidence.json"
);
const DEFAULT_RISK_AUDIT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-risk-object-source-audit.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-r1-forge-dev-status.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-r1-forge-dev-status.md"
);
const DEFAULT_REFRESH_READINESS_COMMAND = [
  process.execPath,
  path.join(repoRoot, "os-platform", "core", "pilot", "benton-real-dev-server-readiness.mjs"),
  "--db-runtime",
  "docker"
];

export const REQUIRED_FORGE_DEV_PREFLIGHT_CHAIN = [
  "pnpm run proof:county-studio:real-dev-backend-health",
  "pnpm run proof:county-studio:benton-real-dev-server-readiness:db",
  "pnpm run proof:county-studio:real-dev-activation",
  "pnpm run proof:county-studio:forge-real-data-wiring",
  "pnpm run proof:county-studio:risk-object-source-audit"
];

const REQUIRED_RUN_COMMAND = "pnpm run dev:county-studio:real-benton";
const READY_RISK_CLASSIFICATIONS = new Set([
  "DEV_DERIVED_FROM_REAL_INPUTS",
  "SEEDED_RISK_OBJECTS",
  "SYNC_DERIVED_RISK_OBJECTS"
]);

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

function ownerDependency(readinessReport, activationReport, forgeWiringReport) {
  return activationReport?.forgeDevDependency?.ownerSupnumBackfill
    ?? readinessReport?.forgeDevDependency?.ownerSupnumBackfill
    ?? forgeWiringReport?.ownerIdentityDependency
    ?? null;
}

function ownerSupnumStatus(readinessReport, activationReport, forgeWiringReport) {
  const owner = ownerDependency(readinessReport, activationReport, forgeWiringReport);
  if (owner?.classification) return owner.classification;
  if (owner?.requiredForCountyStudioForgeDev === false || owner?.requiredForForgeDev === false) {
    return "NOT_REQUIRED_FOR_FORGE_DEV";
  }
  return "UNKNOWN";
}

function dataTruthStatus(activationReport, forgeWiringReport) {
  return activationReport?.dataTruthPosture?.status
    ?? forgeWiringReport?.dataTruthPosture?.status
    ?? "UNKNOWN";
}

function geometryStatus(geometryReport, forgeWiringReport) {
  return geometryReport?.classification
    ?? forgeWiringReport?.geometryEvidencePosture?.classification
    ?? "UNKNOWN";
}

function geometryReady(geometryReport, forgeWiringReport) {
  return geometryStatus(geometryReport, forgeWiringReport) === "SYNC_DERIVED_GEOMETRY"
    && (
      geometryReport?.decisions?.countyStudioUsesRealTerraAtlasGeometry === true
      || forgeWiringReport?.geometryEvidencePosture?.countyStudioUsesRealTerraAtlasGeometry === true
    );
}

function riskObjectStatus(riskAuditReport) {
  return riskAuditReport?.classification ?? "UNKNOWN";
}

function riskReady(riskAuditReport) {
  return READY_RISK_CLASSIFICATIONS.has(riskObjectStatus(riskAuditReport));
}

function productionBlockers({ dataTruth, geometry, risk, owner }) {
  const blockers = [
    "Canonical Benton source/count reconciliation remains required before production proof.",
    "CountyId, taxYear, studyId, parcel/property, valuation, ratio-study, and same-study map/ledger/inspector lineage must be reconciled against authoritative manifests.",
    "TerraAtlas geometry is wired for real dev, but production GIS proof still requires canonical TerraAtlas layer, boundary, neighborhood, segment, reval, taxing-district, and symbology lineage.",
    "Risk objects are acceptable for Forge dev only; production proof requires recomputation from canonical Benton source rows and same-study alignment."
  ];

  if (dataTruth !== "DATA_TRUTH_FAIL") {
    blockers.push(`Data truth status is ${dataTruth}; this consolidated artifact still does not promote production proof.`);
  }
  if (geometry !== "SYNC_DERIVED_GEOMETRY") {
    blockers.push(`Geometry status is ${geometry}; real TerraAtlas geometry must be wired before Forge dev readiness can be claimed.`);
  }
  if (!READY_RISK_CLASSIFICATIONS.has(risk)) {
    blockers.push(`Risk object status is ${risk}; risk objects must be dev-derived or real-sourced for Forge dev readiness.`);
  }
  if (owner !== "NOT_REQUIRED_FOR_FORGE_DEV") {
    blockers.push(`Owner-supnum status is ${owner}; owner identity must remain visible as a packet/ops dependency.`);
  }

  return blockers;
}

function operationalBlockers() {
  return [
    "Owner-supnum remains required for packet/ops proof, Dossier packets, Dais/notice/appeal identity, and operational owner references.",
    "Production proof must pass before operational proof can be claimed.",
    "Dossier evidence packets, Dais workflow creation, TerraTrace decision chain, and parcel/workbench handoff evidence remain operational proof requirements."
  ];
}

function buildBlockers({
  realDevServerAllowed,
  realDevActivationAllowed,
  coreForgeValuationWiringReady,
  geometryIsReady,
  riskIsReady,
  ownerStatus,
  liveReadinessRefresh
}) {
  const blockers = [];
  if (liveReadinessRefresh?.attempted === true && liveReadinessRefresh.exitCode !== 0) {
    blockers.push("Live readiness refresh failed; stale readiness evidence cannot allow Forge dev.");
    blockers.push("Benton real dev server evidence is not allowed because live readiness refresh failed.");
  }
  if (!realDevServerAllowed) blockers.push("Benton real dev server evidence is not allowed.");
  if (!realDevActivationAllowed) blockers.push("County Studio real dev activation is not ready.");
  if (!coreForgeValuationWiringReady) blockers.push("Core Forge valuation wiring is not ready.");
  if (!geometryIsReady) blockers.push("TerraAtlas geometry is not wired for County Studio Forge dev.");
  if (!riskIsReady) blockers.push("Risk objects are not dev-derived or real-sourced.");
  if (ownerStatus !== "NOT_REQUIRED_FOR_FORGE_DEV") {
    blockers.push("Owner-supnum dependency is not classified as NOT_REQUIRED_FOR_FORGE_DEV.");
  }
  return blockers;
}

export function buildCountyStudioR1ForgeDevStatusReport({
  readinessReport = null,
  activationReport = null,
  forgeWiringReport = null,
  geometryReport = null,
  riskAuditReport = null,
  liveReadinessRefresh = null,
  generatedAtUtc = new Date().toISOString()
} = {}) {
  const realDevServerAllowed = readinessReport?.decisions?.realDevServerAllowed === true;
  const realDevActivationAllowed = activationReport?.decisions?.realDevActivationAllowed === true;
  const coreForgeValuationWiringReady = forgeWiringReport?.decisions?.coreForgeValuationWiringReady === true;
  const geometry = geometryStatus(geometryReport, forgeWiringReport);
  const risk = riskObjectStatus(riskAuditReport);
  const owner = ownerSupnumStatus(readinessReport, activationReport, forgeWiringReport);
  const dataTruth = dataTruthStatus(activationReport, forgeWiringReport);
  const geometryIsReady = geometryReady(geometryReport, forgeWiringReport);
  const riskIsReady = riskReady(riskAuditReport);

  const blockers = buildBlockers({
    realDevServerAllowed,
    realDevActivationAllowed,
    coreForgeValuationWiringReady,
    geometryIsReady,
    riskIsReady,
    ownerStatus: owner,
    liveReadinessRefresh
  });
  const forgeDevAllowed = blockers.length === 0;

  return {
    generatedAtUtc,
    gate: "county-studio-r1-forge-dev-status",
    status: forgeDevAllowed ? "COUNTY_STUDIO_R1_FORGE_DEV_READY" : "COUNTY_STUDIO_R1_FORGE_DEV_BLOCKED",
    summary: {
      forgeDevAllowed,
      realDevActivationAllowed,
      productionProofAllowed: false,
      operationalProofAllowed: false,
      dataTruthStatus: dataTruth,
      geometryStatus: geometry,
      riskObjectStatus: risk,
      ownerSupnumStatus: owner,
      countyStudioMode: forgeDevAllowed ? "REAL_BENTON_FORGE_DEV" : "FORGE_DEV_BLOCKED",
      requiredRunCommand: REQUIRED_RUN_COMMAND,
      remainingProductionBlockers: productionBlockers({ dataTruth, geometry, risk, owner }),
      remainingOperationalBlockers: operationalBlockers()
    },
    requiredRunCommand: REQUIRED_RUN_COMMAND,
    preflightChain: REQUIRED_FORGE_DEV_PREFLIGHT_CHAIN,
    remainingProductionBlockers: productionBlockers({ dataTruth, geometry, risk, owner }),
    remainingOperationalBlockers: operationalBlockers(),
    runbook: {
      startRealBentonForgeDev: REQUIRED_RUN_COMMAND,
      requiredPreflightChain: REQUIRED_FORGE_DEV_PREFLIGHT_CHAIN,
      notProductionProof:
        "This is not production proof. It allows County Studio R1 to run as a real Benton-backed TerraForge valuation development surface only.",
      notOperationalProof:
        "This is not operational proof. Packet, Dais, Dossier, Trace, owner identity, and workflow evidence remain blocked.",
      ownerSupnumPosture:
        "Owner-supnum remains required for packet/ops proof, not current County Studio Forge valuation dev."
    },
    sourceArtifacts: {
      backendHealth: "os-platform/core/pilot/evidence/county-studio-real-dev-backend-health.json",
      readiness: "os-platform/core/pilot/evidence/benton-real-dev-server-readiness.json",
      activation: "os-platform/core/pilot/evidence/county-studio-real-dev-server-activation.json",
      forgeWiring: "os-platform/core/pilot/evidence/county-studio-forge-real-data-wiring.json",
      geometry: "os-platform/core/pilot/evidence/county-studio-terraatlas-geometry-evidence.json",
      riskAudit: "os-platform/core/pilot/evidence/county-studio-risk-object-source-audit.json"
    },
    liveReadinessRefresh: liveReadinessRefresh ?? {
      attempted: false,
      exitCode: null,
      command: null,
      interpretation: "Live readiness refresh was not requested for this in-memory report."
    },
    blockers,
    boundaries: [
      "This consolidation does not touch County Studio UI.",
      "This consolidation does not mutate TerraFusion Sync.",
      "This consolidation does not change DB seeding.",
      "This consolidation does not weaken any proof gate.",
      "This consolidation does not set productionProofAllowed=true.",
      "This consolidation does not set operationalProofAllowed=true.",
      "This consolidation does not hide packet/ops blockers."
    ]
  };
}

export function renderCountyStudioR1ForgeDevStatusMarkdown(report) {
  const lines = [
    "# County Studio R1 Forge Dev Status",
    "",
    `Generated: ${report.generatedAtUtc}`,
    `Status: ${report.status}`,
    "",
    "## Summary",
    "",
    `- forgeDevAllowed=${report.summary.forgeDevAllowed}`,
    `- realDevActivationAllowed=${report.summary.realDevActivationAllowed}`,
    `- productionProofAllowed=${report.summary.productionProofAllowed}`,
    `- operationalProofAllowed=${report.summary.operationalProofAllowed}`,
    `- dataTruthStatus=${report.summary.dataTruthStatus}`,
    `- geometryStatus=${report.summary.geometryStatus}`,
    `- riskObjectStatus=${report.summary.riskObjectStatus}`,
    `- ownerSupnumStatus=${report.summary.ownerSupnumStatus}`,
    `- countyStudioMode=${report.summary.countyStudioMode}`,
    `- requiredRunCommand=${report.summary.requiredRunCommand}`,
    "",
    "## Runbook",
    "",
    "Start County Studio real Benton Forge dev:",
    "",
    "```bash",
    report.runbook.startRealBentonForgeDev,
    "```",
    "",
    "Required preflight chain:",
    ""
  ];

  report.runbook.requiredPreflightChain.forEach((command) => lines.push(`- \`${command}\``));

  lines.push(
    "",
    report.runbook.notProductionProof,
    "",
    report.runbook.notOperationalProof,
    "",
    report.runbook.ownerSupnumPosture,
    "",
    "## Remaining Production Blockers",
    ""
  );
  report.remainingProductionBlockers.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Remaining Operational Blockers", "");
  report.remainingOperationalBlockers.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Source Artifacts", "");
  Object.entries(report.sourceArtifacts).forEach(([key, value]) => lines.push(`- ${key}: ${value}`));

  lines.push(
    "",
    "## Live Readiness Refresh",
    "",
    `- attempted: ${report.liveReadinessRefresh.attempted}`,
    `- exitCode: ${report.liveReadinessRefresh.exitCode ?? "n/a"}`,
    `- command: ${report.liveReadinessRefresh.command ?? "n/a"}`,
    `- interpretation: ${report.liveReadinessRefresh.interpretation}`
  );

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) {
    lines.push("- None");
  } else {
    report.blockers.forEach((item) => lines.push(`- ${item}`));
  }

  lines.push("", "## Boundaries", "");
  report.boundaries.forEach((item) => lines.push(`- ${item}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    readiness: DEFAULT_READINESS_JSON,
    activation: DEFAULT_ACTIVATION_JSON,
    forgeWiring: DEFAULT_FORGE_WIRING_JSON,
    geometry: DEFAULT_GEOMETRY_JSON,
    riskAudit: DEFAULT_RISK_AUDIT_JSON,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    refreshReadiness: true,
    refreshReadinessCommand: null,
    refreshReadinessTimeoutMs: 240000,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--readiness") args.readiness = path.resolve(argv[++i]);
    else if (arg === "--activation") args.activation = path.resolve(argv[++i]);
    else if (arg === "--forge-wiring") args.forgeWiring = path.resolve(argv[++i]);
    else if (arg === "--geometry") args.geometry = path.resolve(argv[++i]);
    else if (arg === "--risk-audit") args.riskAudit = path.resolve(argv[++i]);
    else if (arg === "--refresh-readiness-command") args.refreshReadinessCommand = argv[++i];
    else if (arg === "--refresh-readiness-timeout-ms") args.refreshReadinessTimeoutMs = Number(argv[++i]);
    else if (arg === "--no-refresh-readiness") args.refreshReadiness = false;
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

function refreshReadinessEvidence(args) {
  if (!args.refreshReadiness) {
    return {
      attempted: false,
      exitCode: null,
      command: null,
      stdout: "",
      stderr: "",
      interpretation: "Live readiness refresh was skipped by --no-refresh-readiness."
    };
  }

  const commandLabel = args.refreshReadinessCommand
    ?? DEFAULT_REFRESH_READINESS_COMMAND.map((part) => part.includes(" ") ? `"${part}"` : part).join(" ");
  const result = args.refreshReadinessCommand
    ? spawnSync(args.refreshReadinessCommand, {
        cwd: repoRoot,
        encoding: "utf8",
        shell: true,
        timeout: args.refreshReadinessTimeoutMs,
        killSignal: "SIGKILL"
      })
    : spawnSync(DEFAULT_REFRESH_READINESS_COMMAND[0], DEFAULT_REFRESH_READINESS_COMMAND.slice(1), {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: args.refreshReadinessTimeoutMs,
        killSignal: "SIGKILL"
      });
  const exitCode = result.status ?? 1;
  return {
    attempted: true,
    exitCode,
    timedOut: result.error?.code === "ETIMEDOUT",
    timeoutMs: args.refreshReadinessTimeoutMs,
    command: commandLabel,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    interpretation: result.error?.code === "ETIMEDOUT"
      ? "Live readiness refresh timed out; stale readiness evidence cannot allow Forge dev."
      : exitCode === 0
      ? "Live readiness refresh passed; consolidated status may use the refreshed readiness artifact."
      : "Live readiness refresh failed; stale readiness evidence cannot allow Forge dev."
  };
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const liveReadinessRefresh = refreshReadinessEvidence(args);
  const report = buildCountyStudioR1ForgeDevStatusReport({
    readinessReport: readJson(args.readiness),
    activationReport: readJson(args.activation),
    forgeWiringReport: readJson(args.forgeWiring),
    geometryReport: readJson(args.geometry),
    riskAuditReport: readJson(args.riskAudit),
    liveReadinessRefresh
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderCountyStudioR1ForgeDevStatusMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        status: report.status,
        forgeDevAllowed: report.summary.forgeDevAllowed,
        countyStudioMode: report.summary.countyStudioMode,
        productionProofAllowed: report.summary.productionProofAllowed,
        operationalProofAllowed: report.summary.operationalProofAllowed,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  if (report.status === "COUNTY_STUDIO_R1_FORGE_DEV_BLOCKED") {
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
