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
const DEFAULT_ACTIVATION_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-real-dev-server-activation.json"
);
const DEFAULT_DATA_TRUTH_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-r1-data-truth-gate.latest.json"
);
const DEFAULT_LINEAGE_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-r1-data-lineage-reconciliation.json"
);
const DEFAULT_GEOMETRY_EVIDENCE_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-terraatlas-geometry-evidence.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-forge-real-data-wiring.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-forge-real-data-wiring.md"
);

export const REQUIRED_FORGE_WIRING_SURFACES = [
  "parcel/property identity source",
  "property characteristics source",
  "valuation metrics source",
  "ratio-study context source",
  "risk object source",
  "geometry/map context source",
  "countyId/taxYear/studyId propagation",
  "fallback/mock/generated path scan",
  "owner identity dependency scan"
];

const REAL_DEV_CLASSIFICATIONS = new Set([
  "AUTHORITATIVE",
  "SYNC_DERIVED",
  "SEEDED",
  "PARTIAL_SEEDED",
  "SYNC_DERIVED_PARCEL_GEOMETRY",
  "SYNC_DERIVED_GEOMETRY",
  "SEEDED_GEOMETRY"
]);
const DISALLOWED_WIRING_CLASSIFICATIONS = new Set(["MOCK", "FIXTURE", "GENERATED", "FALLBACK", "UNKNOWN"]);
const CORE_FORGE_SURFACES = new Set([
  "parcel/property identity source",
  "property characteristics source",
  "valuation metrics source",
  "ratio-study context source"
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

function normalizeClassification(value, fallback = "UNKNOWN") {
  const normalized = String(value ?? fallback).trim().toUpperCase();
  return normalized || fallback;
}

function findInventory(lineageReport, surface) {
  return (lineageReport?.inventory ?? []).find((item) => item.surface === surface) ?? null;
}

function findProofArea(dataTruthReport, area) {
  return (dataTruthReport?.proofAreas ?? []).find((item) => item.area === area) ?? null;
}

function copySource(source, overrides = {}) {
  return {
    frontendFile: overrides.frontendFile ?? source?.frontendFile ?? "UNKNOWN",
    apiRoute: overrides.apiRoute ?? source?.apiRoute ?? "UNKNOWN",
    backendServiceOrController: overrides.backendServiceOrController ?? source?.backendServiceOrController ?? "UNKNOWN",
    dbTableOrView: overrides.dbTableOrView ?? source?.dbTableOrView ?? "UNKNOWN",
    joinKey: overrides.joinKey ?? source?.joinKey ?? "UNKNOWN",
    countyId: overrides.countyId ?? source?.countyId ?? "19190019-1919-1919-1919-191919191919",
    taxYear: overrides.taxYear ?? source?.taxYear ?? 2026,
    studyId: overrides.studyId ?? source?.studyId ?? "runtime-selected-study",
    observedCount: overrides.observedCount ?? source?.observedCount ?? null,
    failureReason: overrides.failureReason ?? source?.failureReason ?? "Production proof remains blocked.",
    requiredProofToUpgrade:
      overrides.requiredProofToUpgrade ?? source?.requiredProofToUpgrade ?? "Canonical production reconciliation remains required."
  };
}

function surfaceStatus(classification) {
  return REAL_DEV_CLASSIFICATIONS.has(classification)
    ? "REAL_DEV_WIRED_PRODUCTION_BLOCKED"
    : "WIRING_GAP_IDENTIFIED";
}

function wiringSurface({
  surface,
  sourceName,
  ownerLane = "Forge",
  classification,
  source = null,
  overrides = {},
  requiredForForgeDev = true
}) {
  const normalizedClassification = normalizeClassification(classification ?? source?.classification);
  const copied = copySource(source, overrides);
  const observedCount = overrides.observedCount ?? copied.observedCount;
  const failureReason = overrides.failureReason ?? copied.failureReason;
  const requiredProofToUpgrade = overrides.requiredProofToUpgrade ?? copied.requiredProofToUpgrade;
  return {
    surface,
    sourceName,
    frontendFile: copied.frontendFile,
    apiRoute: copied.apiRoute,
    backendServiceOrController: copied.backendServiceOrController,
    dbTableOrView: copied.dbTableOrView,
    ownerLane,
    classification: normalizedClassification,
    observedCount,
    joinKey: copied.joinKey,
    countyId: copied.countyId,
    taxYear: copied.taxYear,
    studyId: copied.studyId,
    requiredForForgeDev,
    productionProofAllowed: false,
    operationalProofAllowed: false,
    failureReason,
    requiredProofToUpgrade,
    status: surfaceStatus(normalizedClassification)
  };
}

function identityPropagationSurface(surfaces) {
  const primary = surfaces.filter((surface) => surface.requiredForForgeDev && surface.surface !== "geometry/map context source");
  const hasIdentity = primary.every((surface) => Boolean(surface.countyId) && Boolean(surface.taxYear) && Boolean(surface.studyId));
  return wiringSurface({
    surface: "countyId/taxYear/studyId propagation",
    sourceName: "County Studio Forge valuation context propagation",
    classification: hasIdentity ? "SYNC_DERIVED" : "UNKNOWN",
    overrides: {
      frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts",
      apiRoute: "County Studio route/query params and API payloads",
      backendServiceOrController: "CountyStudyController + CountyStudyHealthService",
      dbTableOrView: "runtime study context",
      joinKey: "countyId + taxYear + studyId",
      observedCount: primary.length,
      failureReason: hasIdentity
        ? "Runtime context is present for real dev; authoritative source manifest remains required for production proof."
        : "At least one Forge valuation surface is missing countyId, taxYear, or studyId.",
      requiredProofToUpgrade:
        "Prove countyId, taxYear, and studyId against the authoritative Benton study manifest and source-row lineage."
    }
  });
}

function ownerIdentitySurface(ownerDependency) {
  const requiredForForgeDev = ownerDependency?.requiredForCountyStudioForgeDev === true;
  const consumed = ownerDependency?.ownerIdentityConsumedByForgeSurfaces === true;
  const classification = requiredForForgeDev || consumed
    ? normalizeClassification(ownerDependency?.classification)
    : "NOT_REQUIRED_FOR_FORGE_DEV";

  return {
    surface: "owner identity dependency scan",
    sourceName: "County Studio Forge owner identity dependency audit",
    frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/**",
    apiRoute: "County Studio Forge valuation read paths",
    backendServiceOrController: "CountyStudyController / CountyStudyHealthService / CountyStudyInspectorService",
    dbTableOrView: "owner/account/supplement lineage",
    ownerLane: "Forge",
    classification,
    observedCount: null,
    joinKey: "ownerId/supNum only if a Forge surface consumes owner identity",
    countyId: "19190019-1919-1919-1919-191919191919",
    taxYear: 2026,
    studyId: "runtime-selected-study",
    requiredForForgeDev,
    requiredForCountyStudioForgeDev: requiredForForgeDev,
    requiredForPacketProof: ownerDependency?.requiredForPacketProof !== false,
    requiredForOperationalProof: ownerDependency?.requiredForOperationalProof !== false,
    ownerIdentityConsumedByForgeSurfaces: consumed,
    consumedSurfaces: Array.isArray(ownerDependency?.consumedSurfaces) ? ownerDependency.consumedSurfaces : [],
    ownerSupnumBackfillStatus: ownerDependency?.status ?? "UNKNOWN",
    ownerSupnumBackfillLatestFailedStatus: ownerDependency?.latestFailed?.status ?? null,
    productionProofAllowed: false,
    operationalProofAllowed: false,
    failureReason: requiredForForgeDev
      ? "A County Studio Forge surface consumes owner identity; owner-supnum lineage becomes a Forge dev blocker."
      : "Owner identity is not consumed by current County Studio Forge valuation surfaces; owner-supnum remains packet/ops proof blocker only.",
    requiredProofToUpgrade:
      "Only promote owner lineage after packet, Dossier, Dais, notice, appeal, and operational owner identity proof is reconciled.",
    status: requiredForForgeDev ? "WIRING_GAP_IDENTIFIED" : "NOT_REQUIRED_FOR_FORGE_DEV"
  };
}

function scanSurface(gaps) {
  return {
    surface: "fallback/mock/generated path scan",
    sourceName: "County Studio Forge data source classification scan",
    frontendFile: "os-platform/core/pilot/evidence/county-studio-r1-data-lineage-reconciliation.json",
    apiRoute: "evidence scan",
    backendServiceOrController: "county-studio-forge-real-data-wiring gate",
    dbTableOrView: "n/a",
    ownerLane: "Forge",
    classification: gaps.length > 0 ? "GENERATED" : "SYNC_DERIVED",
    observedCount: gaps.length,
    joinKey: "surface classification",
    countyId: "19190019-1919-1919-1919-191919191919",
    taxYear: 2026,
    studyId: "runtime-selected-study",
    requiredForForgeDev: false,
    productionProofAllowed: false,
    operationalProofAllowed: false,
    failureReason: gaps.length > 0
      ? "One or more Forge/consumed surfaces remain generated, fallback, fixture, mock, or unknown."
      : "No mock, fixture, generated, fallback, or unknown Forge wiring classifications were detected.",
    requiredProofToUpgrade:
      "Replace disallowed classifications with sync-derived/seeded/authoritative source lineage before production proof.",
    status: gaps.length > 0 ? "WIRING_GAP_IDENTIFIED" : "REAL_DEV_WIRED_PRODUCTION_BLOCKED"
  };
}

function buildSurfaces({ dataTruthReport, lineageReport, readinessReport, geometryEvidenceReport }) {
  const parcel = findInventory(lineageReport, "parcel/property identity");
  const valuation = findInventory(lineageReport, "valuation metrics");
  const risk = findInventory(lineageReport, "risk objects");
  const geometry = findInventory(lineageReport, "geometry/layers") ?? findInventory(lineageReport, "map");
  const ratioArea = findProofArea(dataTruthReport, "ratio study population");
  const ownerDependency = readinessReport?.forgeDevDependency?.ownerSupnumBackfill ?? {
    status: "UNKNOWN",
    classification: "UNKNOWN",
    requiredForCountyStudioForgeDev: false,
    requiredForPacketProof: true,
    requiredForOperationalProof: true,
    ownerIdentityConsumedByForgeSurfaces: false
  };

  const baseSurfaces = [
    wiringSurface({
      surface: "parcel/property identity source",
      sourceName: "Benton parcel/property identity",
      classification: parcel?.classification ?? findProofArea(dataTruthReport, "parcel/property source")?.classification,
      source: parcel
    }),
    wiringSurface({
      surface: "property characteristics source",
      sourceName: "Benton CAMA/property characteristics",
      classification: parcel?.classification ?? findProofArea(dataTruthReport, "parcel/property source")?.classification,
      source: parcel,
      overrides: {
        frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts",
        apiRoute: "GET /county-study/studies/{studyId}/segments + segment detail routes",
        backendServiceOrController: "CountyStudySegmentDerivationService / CountyStudyInspectorService",
        dbTableOrView: "truth_pacs.parcel_spine + CAMA characteristic columns + legacy_pacs_raw.property",
        joinKey: "countyId + taxYear + parcelId/APN",
        failureReason: "Property characteristics are sync-derived for Forge dev; canonical CAMA count/field reconciliation remains incomplete.",
        requiredProofToUpgrade:
          "Reconcile property characteristic fields and parcel joins against canonical Benton CAMA expectations."
      }
    }),
    wiringSurface({
      surface: "valuation metrics source",
      sourceName: "County Studio valuation and ratio metrics",
      classification: valuation?.classification ?? ratioArea?.classification,
      source: valuation
    }),
    wiringSurface({
      surface: "ratio-study context source",
      sourceName: "County Studio ratio-study population and study context",
      classification: ratioArea?.classification ?? valuation?.classification,
      source: valuation,
      overrides: {
        frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts",
        apiRoute: "GET /county-study/studies/{studyId}/statistics-compat + health-summary",
        backendServiceOrController: "CountyStudyHealthService / statistics compatibility API",
        dbTableOrView: "PACS valuation + comparable sales ratio-study population",
        joinKey: "countyId + taxYear + studyId + parcelId + saleId",
        failureReason: ratioArea?.reason ?? "Ratio-study context is real-dev readable but not production reconciled.",
        requiredProofToUpgrade:
          "Prove sale qualification, valuation rows, and ratio metrics against authoritative Benton source counts and direct recomputation."
      }
    }),
    wiringSurface({
      surface: "risk object source",
      sourceName: "County Studio risk objects",
      classification: risk?.classification ?? findProofArea(dataTruthReport, "risk objects")?.classification,
      source: risk
    }),
    wiringSurface({
      surface: "geometry/map context source",
      sourceName: "TerraAtlas geometry/map context consumed by County Studio",
      ownerLane: "Atlas",
      classification: geometryEvidenceReport?.parcelGeometryStatus
        ?? geometryEvidenceReport?.classification
        ?? geometry?.classification
        ?? findProofArea(dataTruthReport, "Atlas layers")?.classification,
      source: geometry,
      overrides: {
        apiRoute: geometryEvidenceReport?.sourcePath?.apiRoute,
        backendServiceOrController: geometryEvidenceReport?.sourcePath?.backendServiceOrController,
        dbTableOrView: geometryEvidenceReport?.sourcePath?.dbTableOrView,
        joinKey: geometryEvidenceReport?.sourcePath?.joinKey,
        observedCount: geometryEvidenceReport?.geometryCounts?.parcelGeometry,
        failureReason: geometryEvidenceReport?.finding,
        requiredProofToUpgrade: geometryEvidenceReport?.requiredProofToUpgrade
      }
    })
  ];

  const gaps = baseSurfaces
    .filter((surface) => DISALLOWED_WIRING_CLASSIFICATIONS.has(surface.classification))
    .map((surface) => ({
      surface: surface.surface,
      classification: surface.classification,
      failureReason: surface.failureReason,
      requiredProofToUpgrade: surface.requiredProofToUpgrade
    }));

  return [
    ...baseSurfaces,
    identityPropagationSurface(baseSurfaces),
    scanSurface(gaps),
    ownerIdentitySurface(ownerDependency)
  ];
}

function buildGaps(surfaces) {
  return surfaces
    .filter((surface) => surface.status === "WIRING_GAP_IDENTIFIED")
    .filter((surface) => surface.surface !== "fallback/mock/generated path scan")
    .map((surface) => ({
      surface: surface.surface,
      classification: surface.classification,
      failureReason: surface.failureReason,
      requiredProofToUpgrade: surface.requiredProofToUpgrade
    }));
}

export function buildCountyStudioForgeRealDataWiringReport({
  readinessReport = null,
  activationReport = null,
  dataTruthReport = null,
  lineageReport = null,
  geometryEvidenceReport = null,
  generatedAtUtc = new Date().toISOString()
} = {}) {
  const surfaces = buildSurfaces({ dataTruthReport, lineageReport, readinessReport, geometryEvidenceReport });
  const wiringGaps = buildGaps(surfaces);
  const activationReady = activationReport?.decisions?.realDevActivationAllowed === true;
  const realDevServerAllowed = readinessReport?.decisions?.realDevServerAllowed === true;
  const coreForgeValuationWiringReady = surfaces
    .filter((surface) => CORE_FORGE_SURFACES.has(surface.surface))
    .every((surface) => REAL_DEV_CLASSIFICATIONS.has(surface.classification));
  const ownerIdentityDependency = surfaces.find((surface) => surface.surface === "owner identity dependency scan");
  const blockers = [];

  if (!realDevServerAllowed) blockers.push("Benton real-dev server is not allowed.");
  if (!activationReady) blockers.push("County Studio real dev activation is not ready.");
  if (!coreForgeValuationWiringReady) blockers.push("At least one core Forge valuation surface is not wired to real dev data.");
  if (ownerIdentityDependency?.requiredForForgeDev === true) {
    blockers.push("Owner identity is consumed by a County Studio Forge surface and must be reconciled before Forge dev wiring can pass.");
  }

  const status = blockers.length > 0
    ? "FORGE_REAL_DATA_WIRING_BLOCKED"
    : wiringGaps.length > 0
      ? "FORGE_REAL_DATA_WIRING_VERIFIED_WITH_GAPS"
      : "FORGE_REAL_DATA_WIRING_VERIFIED";

  return {
    generatedAtUtc,
    gate: "county-studio-forge-real-data-wiring",
    status,
    decisions: {
      realDevServerAllowed,
      realDevActivationAllowed: activationReady,
      coreForgeValuationWiringReady,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    requiredSurfaces: REQUIRED_FORGE_WIRING_SURFACES,
    surfaces,
    ownerIdentityDependency,
    mockFallbackGeneratedScan: {
      disallowedClassifications: [...DISALLOWED_WIRING_CLASSIFICATIONS],
      disallowedVisibleHits: wiringGaps.filter((gap) => DISALLOWED_WIRING_CLASSIFICATIONS.has(gap.classification))
    },
    wiringGaps,
    dataTruthPosture: {
      status: dataTruthReport?.status ?? "UNKNOWN",
      productionProofAllowed: dataTruthReport?.claims?.productionProofAllowed === true,
      operationalProofAllowed: dataTruthReport?.claims?.operationalProofAllowed === true
    },
    lineagePosture: {
      status: lineageReport?.status ?? "UNKNOWN",
      productionProofAllowed: lineageReport?.decisions?.productionProofAllowed === true,
      operationalProofAllowed: lineageReport?.decisions?.operationalProofAllowed === true
    },
    geometryEvidencePosture: {
      status: geometryEvidenceReport?.status ?? "UNKNOWN",
      classification: geometryEvidenceReport?.classification ?? "UNKNOWN",
      parcelGeometryStatus: geometryEvidenceReport?.parcelGeometryStatus ?? "UNKNOWN",
      fullGisLayerTruthStatus: geometryEvidenceReport?.fullGisLayerTruthStatus ?? "UNKNOWN",
      mapOverlayStatus: geometryEvidenceReport?.mapOverlayStatus ?? "UNKNOWN",
      attributeOverlayStatus: geometryEvidenceReport?.attributeOverlayStatus ?? "UNKNOWN",
      riskOverlayAnchoring: geometryEvidenceReport?.riskOverlayAnchoring ?? "UNKNOWN",
      realGeometryExists: geometryEvidenceReport?.decisions?.realGeometryExists === true,
      countyStudioUsesRealParcelGeometry:
        geometryEvidenceReport?.decisions?.countyStudioUsesRealParcelGeometry === true,
      countyStudioUsesRealTerraAtlasGeometry:
        geometryEvidenceReport?.decisions?.countyStudioUsesRealTerraAtlasGeometry === true
    },
    blockers,
    boundaries: [
      "This gate does not touch County Studio UI.",
      "This gate does not mutate TerraFusion Sync.",
      "This gate does not change DB seeding.",
      "This gate does not require owner-supnum for Forge dev unless an owner-identity surface consumes it.",
      "This gate does not set productionProofAllowed=true.",
      "This gate does not set operationalProofAllowed=true.",
      "This gate does not hide DATA_TRUTH_FAIL."
    ]
  };
}

export function renderCountyStudioForgeRealDataWiringMarkdown(report) {
  const lines = [
    "# County Studio Forge Real Data Wiring",
    "",
    `Generated: ${report.generatedAtUtc}`,
    `Status: ${report.status}`,
    "",
    "## Decisions",
    "",
    `- realDevServerAllowed=${report.decisions.realDevServerAllowed}`,
    `- realDevActivationAllowed=${report.decisions.realDevActivationAllowed}`,
    `- coreForgeValuationWiringReady=${report.decisions.coreForgeValuationWiringReady}`,
    `- productionProofAllowed=${report.decisions.productionProofAllowed}`,
    `- operationalProofAllowed=${report.decisions.operationalProofAllowed}`,
    "",
    "## Forge Wiring Surfaces",
    "",
    "| Surface | Classification | Owner Lane | API Route | Backend | DB Table/View | Join Key | Status |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |"
  ];

  report.surfaces.forEach((surface) => {
    lines.push(
      `| ${surface.surface} | ${surface.classification} | ${surface.ownerLane} | ${surface.apiRoute} | ${surface.backendServiceOrController} | ${surface.dbTableOrView} | ${surface.joinKey} | ${surface.status} |`
    );
  });

  lines.push(
    "",
    "## TerraAtlas Geometry Evidence",
    "",
    `- status: ${report.geometryEvidencePosture.status}`,
    `- classification: ${report.geometryEvidencePosture.classification}`,
    `- parcelGeometryStatus: ${report.geometryEvidencePosture.parcelGeometryStatus}`,
    `- fullGisLayerTruthStatus: ${report.geometryEvidencePosture.fullGisLayerTruthStatus}`,
    `- mapOverlayStatus: ${report.geometryEvidencePosture.mapOverlayStatus}`,
    `- attributeOverlayStatus: ${report.geometryEvidencePosture.attributeOverlayStatus}`,
    `- riskOverlayAnchoring: ${report.geometryEvidencePosture.riskOverlayAnchoring}`,
    `- realGeometryExists: ${report.geometryEvidencePosture.realGeometryExists}`,
    `- countyStudioUsesRealParcelGeometry: ${report.geometryEvidencePosture.countyStudioUsesRealParcelGeometry}`,
    `- countyStudioUsesRealTerraAtlasGeometry: ${report.geometryEvidencePosture.countyStudioUsesRealTerraAtlasGeometry}`
  );

  lines.push(
    "",
    "## Owner Identity Dependency Scan",
    "",
    `- ownerSupnumBackfillStatus: ${report.ownerIdentityDependency.ownerSupnumBackfillStatus}`,
    `- ownerSupnumBackfillLatestFailedStatus: ${report.ownerIdentityDependency.ownerSupnumBackfillLatestFailedStatus ?? "none"}`,
    `- ownerSupnumRequiredForForgeDev: ${report.ownerIdentityDependency.requiredForForgeDev}`,
    `- ownerSupnumRequiredForPacketProof: ${report.ownerIdentityDependency.requiredForPacketProof}`,
    `- ownerSupnumRequiredForOperationalProof: ${report.ownerIdentityDependency.requiredForOperationalProof}`,
    `- ownerIdentityConsumedByForgeSurfaces: ${report.ownerIdentityDependency.ownerIdentityConsumedByForgeSurfaces}`,
    "",
    "## Mock/Fallback/Generated Path Scan",
    ""
  );

  if (report.mockFallbackGeneratedScan.disallowedVisibleHits.length === 0) {
    lines.push("- None");
  } else {
    report.mockFallbackGeneratedScan.disallowedVisibleHits.forEach((gap) => {
      lines.push(`- ${gap.surface}: ${gap.classification} - ${gap.failureReason}`);
    });
  }

  lines.push("", "## Wiring Gaps", "");
  if (report.wiringGaps.length === 0) {
    lines.push("- None");
  } else {
    report.wiringGaps.forEach((gap) => {
      lines.push(`- ${gap.surface}: ${gap.classification} - ${gap.requiredProofToUpgrade}`);
    });
  }

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) {
    lines.push("- None");
  } else {
    report.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
  }

  lines.push("", "## Boundaries", "");
  report.boundaries.forEach((boundary) => lines.push(`- ${boundary}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    readiness: DEFAULT_READINESS_JSON,
    activation: DEFAULT_ACTIVATION_JSON,
    dataTruth: DEFAULT_DATA_TRUTH_JSON,
    lineage: DEFAULT_LINEAGE_JSON,
    geometryEvidence: DEFAULT_GEOMETRY_EVIDENCE_JSON,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--readiness") args.readiness = path.resolve(argv[++i]);
    else if (arg === "--activation") args.activation = path.resolve(argv[++i]);
    else if (arg === "--data-truth") args.dataTruth = path.resolve(argv[++i]);
    else if (arg === "--lineage") args.lineage = path.resolve(argv[++i]);
    else if (arg === "--geometry-evidence") args.geometryEvidence = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildCountyStudioForgeRealDataWiringReport({
    readinessReport: readJson(args.readiness),
    activationReport: readJson(args.activation),
    dataTruthReport: readJson(args.dataTruth),
    lineageReport: readJson(args.lineage),
    geometryEvidenceReport: readJson(args.geometryEvidence)
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderCountyStudioForgeRealDataWiringMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        status: report.status,
        realDevServerAllowed: report.decisions.realDevServerAllowed,
        realDevActivationAllowed: report.decisions.realDevActivationAllowed,
        productionProofAllowed: report.decisions.productionProofAllowed,
        operationalProofAllowed: report.decisions.operationalProofAllowed,
        wiringGaps: report.wiringGaps.length,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  if (report.status === "FORGE_REAL_DATA_WIRING_BLOCKED") {
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
