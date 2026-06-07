#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_FORGE_WIRING_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-forge-real-data-wiring.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-risk-object-source-audit.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-risk-object-source-audit.md"
);

const SOURCE_FILES = {
  frontendRiskSurfaces: "frontend/apps/os-shell/src/pages/forge/county-studio/utils/riskSurfaces.ts",
  frontendCommandCenter: "frontend/apps/os-shell/src/pages/forge/county-studio/components/RiskSurfaceCommandCenter.tsx",
  backendHealth: "backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs",
  backendSegmentDerivation: "backend/src/TerraFusion.Core/Services/CountyStudySegmentDerivationService.cs"
};

export const RISK_OBJECT_CLASSIFICATIONS = [
  "GENERATED",
  "DEV_DERIVED_FROM_REAL_INPUTS",
  "SEEDED_RISK_OBJECTS",
  "SYNC_DERIVED_RISK_OBJECTS",
  "FALLBACK_RISK_OBJECTS",
  "UNKNOWN_RISK_OBJECTS"
];

const REAL_INPUT_CLASSIFICATIONS = new Set([
  "AUTHORITATIVE",
  "SYNC_DERIVED",
  "SEEDED",
  "PARTIAL_SEEDED",
  "SYNC_DERIVED_GEOMETRY",
  "SEEDED_GEOMETRY"
]);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
  } catch {
    return "";
  }
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function findSurface(report, surfaceName) {
  return (report?.surfaces ?? []).find((surface) => surface.surface === surfaceName) ?? null;
}

function normalizeClassification(value, fallback = "UNKNOWN_RISK_OBJECTS") {
  const normalized = String(value ?? fallback).trim().toUpperCase();
  return normalized || fallback;
}

function has(text, pattern) {
  return pattern.test(text);
}

export function scanCountyStudioRiskObjectSources() {
  const frontendRiskSurfaces = readText(SOURCE_FILES.frontendRiskSurfaces);
  const frontendCommandCenter = readText(SOURCE_FILES.frontendCommandCenter);
  const backendHealth = readText(SOURCE_FILES.backendHealth);
  const backendSegmentDerivation = readText(SOURCE_FILES.backendSegmentDerivation);
  const allText = [
    frontendRiskSurfaces,
    frontendCommandCenter,
    backendHealth,
    backendSegmentDerivation
  ].join("\n");

  return {
    frontendRiskSurfaceUsesSegments: has(frontendRiskSurfaces, /CountySegmentDto/),
    frontendGroupsRiskRowsFromSegments:
      has(frontendRiskSurfaces, /buildRows\s*\(/) && has(frontendRiskSurfaces, /weightedAverage\s*\(/),
    frontendLedgerConsumesRiskSurfaceRows:
      has(frontendCommandCenter, /buildRiskSurfaceCommandCenter/) && has(frontendCommandCenter, /UnifiedRiskLedger/),
    backendHealthUsesCountySegments:
      has(backendHealth, /_db\.CountySegments/) && has(backendHealth, /BuildSegmentAlert/),
    backendHealthComputesCompositeRisk:
      has(backendHealth, /ComputeCompositeRisk/) && has(backendHealth, /CoefficientOfDispersion/),
    segmentDerivationUsesProperties: has(backendSegmentDerivation, /_db\.Properties/),
    segmentDerivationUsesCamaCharacteristics: has(backendSegmentDerivation, /_db\.CamaCharacteristics/),
    segmentDerivationUsesComparableSales: has(backendSegmentDerivation, /_db\.ComparableSales/),
    segmentDerivationUsesPacsValuation: has(backendSegmentDerivation, /PacsValuation/),
    persistedRiskObjectTableFound: has(allText, /county[_-]?studio[_-]?risk[_-]?objects/i),
    persistedRiskObjectClassification: null,
    persistedRiskObjectTable: null,
    mockOrFixtureRiskPathFound: has(allText, /\bmock(?:Risk|Objects?)|\bfixture(?:Risk|Objects?)/i),
    fallbackRiskPathFound: has(allText, /fallback(?:Risk|Objects?)/i),
    generatedPlaceholderRiskPathFound: has(allText, /generatedPlaceholderRisk|syntheticRisk|demoRisk/i),
    sourceFiles: { ...SOURCE_FILES }
  };
}

function realInputSurfaces(forgeWiringReport) {
  const required = [
    "parcel/property identity source",
    "property characteristics source",
    "valuation metrics source",
    "ratio-study context source",
    "geometry/map context source"
  ];

  return required.map((surfaceName) => {
    const surface = findSurface(forgeWiringReport, surfaceName);
    const classification = String(surface?.classification ?? "UNKNOWN").toUpperCase();
    return {
      surface: surfaceName,
      classification,
      observedCount: surface?.observedCount ?? null,
      realDevReady: REAL_INPUT_CLASSIFICATIONS.has(classification)
    };
  });
}

function deterministicSourceProven(scan) {
  return scan?.frontendRiskSurfaceUsesSegments === true
    && scan?.frontendGroupsRiskRowsFromSegments === true
    && scan?.backendHealthUsesCountySegments === true
    && scan?.backendHealthComputesCompositeRisk === true
    && scan?.segmentDerivationUsesProperties === true
    && scan?.segmentDerivationUsesCamaCharacteristics === true
    && scan?.segmentDerivationUsesComparableSales === true
    && scan?.segmentDerivationUsesPacsValuation === true
    && scan?.mockOrFixtureRiskPathFound !== true
    && scan?.fallbackRiskPathFound !== true
    && scan?.generatedPlaceholderRiskPathFound !== true;
}

function classifyRiskSource({ riskSurface, sourceScan, realInputs }) {
  if (sourceScan?.persistedRiskObjectTableFound === true) {
    return normalizeClassification(
      sourceScan.persistedRiskObjectClassification,
      riskSurface?.classification === "SYNC_DERIVED" ? "SYNC_DERIVED_RISK_OBJECTS" : "SEEDED_RISK_OBJECTS"
    );
  }

  if (sourceScan?.fallbackRiskPathFound === true) return "FALLBACK_RISK_OBJECTS";

  const allInputsReal = realInputs.every((surface) => surface.realDevReady);
  if (allInputsReal && deterministicSourceProven(sourceScan)) {
    return "DEV_DERIVED_FROM_REAL_INPUTS";
  }

  if (sourceScan?.generatedPlaceholderRiskPathFound === true) return "GENERATED";
  if (riskSurface?.classification === "GENERATED") return "GENERATED";
  return "UNKNOWN_RISK_OBJECTS";
}

function statusFor(classification) {
  switch (classification) {
    case "DEV_DERIVED_FROM_REAL_INPUTS":
      return "RISK_OBJECT_SOURCE_AUDITED_DEV_DERIVED";
    case "SYNC_DERIVED_RISK_OBJECTS":
      return "RISK_OBJECT_SOURCE_AUDITED_SYNC_DERIVED";
    case "SEEDED_RISK_OBJECTS":
      return "RISK_OBJECT_SOURCE_AUDITED_SEEDED";
    case "FALLBACK_RISK_OBJECTS":
      return "RISK_OBJECT_SOURCE_AUDITED_FALLBACK";
    case "GENERATED":
      return "RISK_OBJECT_SOURCE_AUDITED_GENERATED";
    default:
      return "RISK_OBJECT_SOURCE_AUDITED_UNKNOWN";
  }
}

function sourcePathFor(riskSurface, sourceScan) {
  return {
    frontendFile: riskSurface?.frontendFile ?? SOURCE_FILES.frontendCommandCenter,
    apiRoute: riskSurface?.apiRoute ?? "GET /county-study/studies/{studyId}/health-summary",
    backendServiceOrController:
      riskSurface?.backendServiceOrController ?? "CountyStudyHealthService + risk surface derivation",
    dbTableOrView:
      sourceScan?.persistedRiskObjectTable
        ?? riskSurface?.dbTableOrView
        ?? "CountySegments / derived risk metrics",
    joinKey: riskSurface?.joinKey ?? "studyId + segmentId + riskObjectId",
    countyId: riskSurface?.countyId ?? "19190019-1919-1919-1919-191919191919",
    taxYear: riskSurface?.taxYear ?? 2026,
    studyId: riskSurface?.studyId ?? "runtime-selected-study"
  };
}

function failureReasonFor(classification, sourceScan) {
  if (classification === "DEV_DERIVED_FROM_REAL_INPUTS") {
    return "Risk objects are deterministic development derivations from real Benton segment, valuation, ratio, CAMA, and TerraAtlas geometry inputs; production proof still requires canonical reconciliation.";
  }
  if (classification === "SYNC_DERIVED_RISK_OBJECTS" || classification === "SEEDED_RISK_OBJECTS") {
    return "Risk objects have a concrete persisted source for development, but production proof still requires canonical reconciliation and same-study row lineage.";
  }
  if (classification === "FALLBACK_RISK_OBJECTS") {
    return "Risk objects are served by a fallback path and cannot support production or operational proof.";
  }
  if (sourceScan?.generatedPlaceholderRiskPathFound === true) {
    return "Risk objects remain generated placeholder output; deterministic real-input derivation was not proven.";
  }
  return "Risk objects remain generated or unproven because deterministic derivation from real inputs was not fully established.";
}

function requiredProofFor(classification) {
  if (classification === "DEV_DERIVED_FROM_REAL_INPUTS") {
    return "Recompute risk objects from canonical Benton valuation, CAMA, sales, segment, and geometry rows; prove same-study map/ledger/inspector alignment before production proof.";
  }
  if (classification === "SYNC_DERIVED_RISK_OBJECTS" || classification === "SEEDED_RISK_OBJECTS") {
    return "Prove persisted risk object rows against canonical Benton expected counts, join keys, source input lineage, and same-study map/ledger/inspector alignment.";
  }
  return "Replace generated/fallback/unknown risk objects with deterministic real-input derivation or a persisted seeded/sync-derived risk source.";
}

export function buildCountyStudioRiskObjectSourceAuditReport({
  forgeWiringReport = null,
  sourceScan = null,
  generatedAtUtc = new Date().toISOString()
} = {}) {
  const riskSurface = findSurface(forgeWiringReport, "risk object source");
  const scan = sourceScan ?? scanCountyStudioRiskObjectSources();
  const inputs = realInputSurfaces(forgeWiringReport);
  const classification = classifyRiskSource({ riskSurface, sourceScan: scan, realInputs: inputs });
  const sourcePath = sourcePathFor(riskSurface, scan);

  return {
    generatedAtUtc,
    gate: "county-studio-risk-object-source-audit",
    status: statusFor(classification),
    classification,
    decisions: {
      riskObjectsRequiredForForgeDev: true,
      riskObjectsRequiredForProductionProof: true,
      riskObjectsCanBeDevDerived: classification === "DEV_DERIVED_FROM_REAL_INPUTS",
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    sourcePath,
    evidence: {
      realInputSurfaces: inputs,
      sourceScan: scan,
      currentForgeWiringClassification: riskSurface?.classification ?? "UNKNOWN",
      observedRiskObjectCount: riskSurface?.observedCount ?? null
    },
    failureReason: failureReasonFor(classification, scan),
    requiredProofToUpgrade: requiredProofFor(classification),
    validFollowUps: [
      "Reclassify risk objects as DEV_DERIVED_FROM_REAL_INPUTS if deterministic real-input derivation remains proven.",
      "Wire risk objects to a real seeded/sync-derived persisted source if one exists.",
      "Keep risk objects GENERATED and degraded for Forge dev if synthetic placeholders remain."
    ],
    boundaries: [
      "This audit does not touch County Studio UI.",
      "This audit does not invent risk objects.",
      "This audit does not add mock or fallback risk data.",
      "This audit does not mutate TerraFusion Sync.",
      "This audit does not change DB seeding.",
      "This audit does not set productionProofAllowed=true.",
      "This audit does not set operationalProofAllowed=true."
    ]
  };
}

export function renderCountyStudioRiskObjectSourceAuditMarkdown(report) {
  const lines = [
    "# County Studio Risk Object Source Derivation Audit",
    "",
    `Generated: ${report.generatedAtUtc}`,
    `Status: ${report.status}`,
    `Classification: ${report.classification}`,
    "",
    "## Decisions",
    "",
    `- riskObjectsRequiredForForgeDev=${report.decisions.riskObjectsRequiredForForgeDev}`,
    `- riskObjectsRequiredForProductionProof=${report.decisions.riskObjectsRequiredForProductionProof}`,
    `- riskObjectsCanBeDevDerived=${report.decisions.riskObjectsCanBeDevDerived}`,
    `- productionProofAllowed=${report.decisions.productionProofAllowed}`,
    `- operationalProofAllowed=${report.decisions.operationalProofAllowed}`,
    "",
    "## Source Path",
    "",
    `- frontendFile: ${report.sourcePath.frontendFile}`,
    `- apiRoute: ${report.sourcePath.apiRoute}`,
    `- backendServiceOrController: ${report.sourcePath.backendServiceOrController}`,
    `- dbTableOrView: ${report.sourcePath.dbTableOrView}`,
    `- joinKey: ${report.sourcePath.joinKey}`,
    `- countyId: ${report.sourcePath.countyId}`,
    `- taxYear: ${report.sourcePath.taxYear}`,
    `- studyId: ${report.sourcePath.studyId}`,
    "",
    "## Real Input Surfaces",
    "",
    "| Surface | Classification | Observed Count | Real Dev Ready |",
    "| --- | --- | --- | --- |"
  ];

  report.evidence.realInputSurfaces.forEach((surface) => {
    lines.push(
      `| ${surface.surface} | ${surface.classification} | ${JSON.stringify(surface.observedCount)} | ${surface.realDevReady} |`
    );
  });

  lines.push(
    "",
    "## Finding",
    "",
    report.failureReason,
    "",
    "## Required Proof To Upgrade",
    "",
    report.requiredProofToUpgrade,
    "",
    "## Valid Follow-Ups",
    ""
  );
  report.validFollowUps.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Boundaries", "");
  report.boundaries.forEach((item) => lines.push(`- ${item}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    forgeWiring: DEFAULT_FORGE_WIRING_JSON,
    sourceScan: null,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--forge-wiring") args.forgeWiring = path.resolve(argv[++i]);
    else if (arg === "--source-scan") args.sourceScan = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildCountyStudioRiskObjectSourceAuditReport({
    forgeWiringReport: readJson(args.forgeWiring),
    sourceScan: args.sourceScan ? readJson(args.sourceScan) : null
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderCountyStudioRiskObjectSourceAuditMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        status: report.status,
        classification: report.classification,
        riskObjectsCanBeDevDerived: report.decisions.riskObjectsCanBeDevDerived,
        productionProofAllowed: report.decisions.productionProofAllowed,
        operationalProofAllowed: report.decisions.operationalProofAllowed,
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
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
