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
const DEFAULT_ACTIVATION_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-real-dev-server-activation.json"
);
const DEFAULT_SYNC_EVIDENCE_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "benton-sync-drain-state-evidence.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-r1-data-lineage-reconciliation.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-r1-data-lineage-reconciliation.md"
);

export const REQUIRED_RECONCILIATION_SURFACES = [
  "map",
  "ledger",
  "inspector",
  "packet/payloads",
  "risk objects",
  "parcel/property identity",
  "valuation metrics",
  "geometry/layers",
  "owner/account/supplement joins",
  "WPOV/WSDOR dependencies"
];

const DEV_REAL_CLASSIFICATIONS = new Set(["AUTHORITATIVE", "SYNC_DERIVED", "SEEDED", "PARTIAL_SEEDED"]);

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

function readinessCheck(readinessReport, name) {
  return (readinessReport?.checks ?? []).find((check) => check.name === name) ?? null;
}

function proofArea(dataTruthReport, area) {
  return (dataTruthReport?.proofAreas ?? []).find((item) => item.area === area) ?? null;
}

function evidenceCounts(readinessReport, syncEvidenceReport = null) {
  const landing = readinessCheck(readinessReport, "landing table counts")?.evidence ?? {};
  const canonical = readinessCheck(readinessReport, "canonical parcel counts")?.evidence ?? {};
  return {
    propertyLanding: landing.propertyLanding ?? null,
    ownerLanding: landing.ownerLanding ?? null,
    suppAssociation: landing.suppAssociation ?? null,
    wpov: landing.wpov ?? null,
    truthParcel: landing.truthParcel ?? null,
    truthOwner: landing.truthOwner ?? null,
    truthWsdor: landing.truthWsdor ?? null,
    canonicalParcel: canonical.canonicalParcel ?? landing.canonicalParcel ?? null,
    account: landing.account ?? null,
    canonicalOwner: syncEvidenceReport?.counts?.canonical?.owner ?? syncEvidenceReport?.queryResults?.canonicalOwner ?? null,
    canonicalWsdor: syncEvidenceReport?.counts?.canonical?.wsdor ?? syncEvidenceReport?.queryResults?.canonicalWsdor ?? null,
    gisParcelGeometry: syncEvidenceReport?.counts?.gis?.parcelGeometry ?? syncEvidenceReport?.queryResults?.gisParcelGeometry ?? null
  };
}

function observedCountFor(surface, counts) {
  switch (surface) {
    case "map":
    case "geometry/layers":
      return counts.gisParcelGeometry ?? counts.truthParcel ?? counts.canonicalParcel;
    case "ledger":
    case "inspector":
    case "risk objects":
    case "valuation metrics":
      return counts.truthParcel ?? counts.canonicalParcel;
    case "parcel/property identity":
      return counts.canonicalParcel ?? counts.truthParcel ?? counts.propertyLanding;
    case "owner/account/supplement joins":
      return {
        ownerLanding: counts.ownerLanding,
        truthOwner: counts.truthOwner,
        canonicalOwner: counts.canonicalOwner,
        account: counts.account,
        suppAssociation: counts.suppAssociation
      };
    case "WPOV/WSDOR dependencies":
      return {
        wpov: counts.wpov,
        truthWsdor: counts.truthWsdor,
        canonicalWsdor: counts.canonicalWsdor
      };
    default:
      return null;
  }
}

function checkClassification(readinessReport, name) {
  return normalizeClassification(readinessCheck(readinessReport, name)?.classification);
}

function areaClassification(dataTruthReport, area) {
  return normalizeClassification(proofArea(dataTruthReport, area)?.classification);
}

function areaReason(dataTruthReport, area, fallback) {
  return proofArea(dataTruthReport, area)?.reason ?? fallback;
}

function statusFor(classification, productionProofAllowed, dependencyClassification = null) {
  if (productionProofAllowed) return "PRODUCTION_READY";
  if (dependencyClassification === "NOT_REQUIRED_FOR_FORGE_DEV") return "PACKET_OPS_BLOCKER_NOT_FORGE_DEV";
  if (DEV_REAL_CLASSIFICATIONS.has(classification)) return "REAL_DEV_AVAILABLE_PRODUCTION_BLOCKED";
  return "PRODUCTION_BLOCKER";
}

function inventoryEntry({
  surface,
  sourceName,
  frontendFile,
  apiRoute,
  backendServiceOrController,
  dbTableOrView,
  ownerLane,
  classification,
  observedCount,
  expectedCanonicalCount = null,
  joinKey,
  countyId = "19190019-1919-1919-1919-191919191919",
  taxYear = 2026,
  studyId = "runtime-selected-study",
  failureReason,
  requiredProofToUpgrade,
  productionProofAllowed = false,
  dependencyClassification = null,
  requiredForCountyStudioForgeDev = null,
  requiredForPacketProof = null,
  requiredForOperationalProof = null,
  ownerSupnumBackfillStatus = null,
  ownerSupnumBackfillLatestFailedStatus = null
}) {
  return {
    surface,
    sourceName,
    frontendFile,
    apiRoute,
    backendServiceOrController,
    dbTableOrView,
    ownerLane,
    classification: normalizeClassification(classification),
    observedCount,
    expectedCanonicalCount,
    joinKey,
    countyId,
    taxYear,
    studyId,
    failureReason,
    requiredProofToUpgrade,
    productionProofAllowed,
    ...(dependencyClassification ? { dependencyClassification } : {}),
    ...(requiredForCountyStudioForgeDev !== null ? { requiredForCountyStudioForgeDev } : {}),
    ...(requiredForPacketProof !== null ? { requiredForPacketProof } : {}),
    ...(requiredForOperationalProof !== null ? { requiredForOperationalProof } : {}),
    ...(ownerSupnumBackfillStatus !== null ? { ownerSupnumBackfillStatus } : {}),
    ...(ownerSupnumBackfillLatestFailedStatus !== null ? { ownerSupnumBackfillLatestFailedStatus } : {}),
    status: statusFor(normalizeClassification(classification), productionProofAllowed, dependencyClassification)
  };
}

function buildInventory({ readinessReport, dataTruthReport, syncEvidenceReport }) {
  const counts = evidenceCounts(readinessReport, syncEvidenceReport);
  const ownerSupnumDependency = readinessReport?.forgeDevDependency?.ownerSupnumBackfill
    ?? syncEvidenceReport?.countyStudioDependencies?.ownerSupnumBackfill
    ?? {
      status: "UNKNOWN",
      classification: "UNKNOWN",
      requiredForCountyStudioForgeDev: false,
      requiredForPacketProof: true,
      requiredForOperationalProof: true
    };
  const mapDependencyClassification = checkClassification(readinessReport, "map data dependency status");
  const ledgerDependencyClassification = checkClassification(readinessReport, "ledger data dependency status");
  const inspectorDependencyClassification = checkClassification(readinessReport, "inspector data dependency status");

  return [
    inventoryEntry({
      surface: "map",
      sourceName: "County Studio embedded TerraAtlas valuation-risk map",
      frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/components/EmbeddedAtlasGisWorkspace.tsx",
      apiRoute: "GET /county-study/studies/{studyId}/health-summary + TerraAtlas compatibility map feed",
      backendServiceOrController: "CountyStudyHealthService + Atlas Live compatibility API",
      dbTableOrView: "truth_pacs.parcel_spine + gis_tf.tf_parcel_geom (dev evidence only)",
      ownerLane: "Forge",
      classification: mapDependencyClassification,
      observedCount: observedCountFor("map", counts),
      joinKey: "countyId + taxYear + studyId + segmentId/geographyRef",
      failureReason: areaReason(
        dataTruthReport,
        "map overlays",
        "Map can render for real dev, but overlay and geometry lineage are not production-reconciled."
      ),
      requiredProofToUpgrade:
        "Prove TerraAtlas-owned Benton geometry/layers and Forge risk overlays share countyId, taxYear, studyId, and selected object keys."
    }),
    inventoryEntry({
      surface: "ledger",
      sourceName: "Unified Risk Ledger",
      frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/utils/riskSurfaces.ts",
      apiRoute: "GET /county-study/studies/{studyId}/health-summary",
      backendServiceOrController: "CountyStudyHealthService",
      dbTableOrView: "CountySegments / derived segment metrics",
      ownerLane: "Forge",
      classification: areaClassification(dataTruthReport, "ledger rows") === "UNKNOWN"
        ? ledgerDependencyClassification
        : areaClassification(dataTruthReport, "ledger rows"),
      observedCount: observedCountFor("ledger", counts),
      joinKey: "studyId + segmentSetId + segmentId",
      failureReason: areaReason(dataTruthReport, "ledger rows", "Ledger rows need same-study lineage proof."),
      requiredProofToUpgrade:
        "Recompute ledger rows from authoritative segment metrics and prove same-study alignment with map and inspector."
    }),
    inventoryEntry({
      surface: "inspector",
      sourceName: "County Studio decision inspector",
      frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/components/ObjectInspector.tsx",
      apiRoute: "GET /county-study/segments/{segmentId}/detail",
      backendServiceOrController: "CountyStudyInspectorService",
      dbTableOrView: "CountySegments + segment parcel ratio detail",
      ownerLane: "Forge",
      classification: areaClassification(dataTruthReport, "inspector details") === "UNKNOWN"
        ? inspectorDependencyClassification
        : areaClassification(dataTruthReport, "inspector details"),
      observedCount: observedCountFor("inspector", counts),
      joinKey: "segmentId + studyId",
      failureReason: areaReason(dataTruthReport, "inspector details", "Inspector detail lineage is not production-proven."),
      requiredProofToUpgrade:
        "Prove inspector details are sourced from the same authoritative segment/risk population as the selected map object and ledger row."
    }),
    inventoryEntry({
      surface: "packet/payloads",
      sourceName: "County Studio evidence packet payloads",
      frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/components/ExportPacketModal.tsx",
      apiRoute: "GET /county-study/studies/{studyId}/evidence-packet",
      backendServiceOrController: "CountyStudyEvidencePacketService",
      dbTableOrView: "Evidence packet DTO derived from health summary and segment detail",
      ownerLane: "Dossier",
      classification: "UNKNOWN",
      observedCount: null,
      joinKey: "studyId + segmentId + parcelId when selected",
      failureReason: "Evidence packet lineage is not separately proven against Dossier-owned packet evidence.",
      requiredProofToUpgrade:
        "Prove packet payloads preserve source row lineage and route to TerraDossier without presenting generated evidence as authoritative."
    }),
    inventoryEntry({
      surface: "risk objects",
      sourceName: "County Studio risk objects",
      frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/components/RiskSurfaceCommandCenter.tsx",
      apiRoute: "GET /county-study/studies/{studyId}/health-summary",
      backendServiceOrController: "CountyStudyHealthService + risk surface derivation",
      dbTableOrView: "CountySegments / derived risk metrics",
      ownerLane: "Forge",
      classification: areaClassification(dataTruthReport, "risk objects"),
      observedCount: observedCountFor("risk objects", counts),
      joinKey: "studyId + segmentId + riskObjectId",
      failureReason: areaReason(dataTruthReport, "risk objects", "Risk object source lineage is not production-proven."),
      requiredProofToUpgrade:
        "Prove risk objects are recomputed from authoritative ratio/valuation rows and align with map, ledger, and inspector in one study context."
    }),
    inventoryEntry({
      surface: "parcel/property identity",
      sourceName: "Benton parcel/property identity",
      frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts",
      apiRoute: "GET /county-study/studies/{studyId}/segments + segment detail routes",
      backendServiceOrController: "CountyStudySegmentDerivationService / CountyStudyInspectorService",
      dbTableOrView: "truth_pacs.parcel_spine + canonical_tf.tf_parcel",
      ownerLane: "Forge",
      classification: areaClassification(dataTruthReport, "parcel/property source"),
      observedCount: observedCountFor("parcel/property identity", counts),
      joinKey: "countyId + taxYear + parcelId/APN",
      failureReason: areaReason(dataTruthReport, "parcel/property source", "Parcel identity source/count reconciliation remains incomplete."),
      requiredProofToUpgrade:
        "Compare seeded/sync-derived parcel identity counts to canonical Benton expected counts and prove APN/parcelId reconciliation."
    }),
    inventoryEntry({
      surface: "valuation metrics",
      sourceName: "County Studio valuation and ratio metrics",
      frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyCommandStrip.tsx",
      apiRoute: "GET /county-study/studies/{studyId}/statistics-compat + health-summary",
      backendServiceOrController: "CountyStudyHealthService / statistics compatibility API",
      dbTableOrView: "PACS valuation + comparable sales ratio-study population",
      ownerLane: "Forge",
      classification: areaClassification(dataTruthReport, "ratio study population"),
      observedCount: observedCountFor("valuation metrics", counts),
      joinKey: "countyId + taxYear + studyId + parcelId + saleId",
      failureReason: areaReason(dataTruthReport, "ratio study population", "Ratio study population is sync-derived but not authoritative-reconciled."),
      requiredProofToUpgrade:
        "Prove sale qualification, valuation rows, and ratio metrics against authoritative Benton source counts and direct recomputation."
    }),
    inventoryEntry({
      surface: "geometry/layers",
      sourceName: "TerraAtlas geometry and layer feed consumed by County Studio",
      frontendFile: "frontend/apps/os-shell/src/pages/forge/atlas-live/atlasLiveApi.ts",
      apiRoute: "GET /launch-data/washington/counties/status.json + Atlas compatibility map routes",
      backendServiceOrController: "Atlas Live compatibility API",
      dbTableOrView: "gis_tf.tf_parcel_geom",
      ownerLane: "Atlas",
      classification: areaClassification(dataTruthReport, "Atlas layers"),
      observedCount: observedCountFor("geometry/layers", counts),
      joinKey: "countyId + parcelId/APN + layerId",
      failureReason: areaReason(dataTruthReport, "Atlas layers", "Geometry/layer lineage is compatibility or provisional."),
      requiredProofToUpgrade:
        "Replace compatibility proof with TerraAtlas-owned Benton parcel geometry, neighborhoods, segments, reval areas, and taxing district layer contracts."
    }),
    inventoryEntry({
      surface: "owner/account/supplement joins",
      sourceName: "Owner, account, and supplement association joins",
      frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts",
      apiRoute: "County Studio evidence and parcel handoff routes",
      backendServiceOrController: "TerraFusion Sync-derived owner/account read models",
      dbTableOrView: "legacy owner/account/prop_supp_assoc + truth_owner + canonical account",
      ownerLane: "Forge",
      classification: "PARTIAL_SEEDED",
      observedCount: observedCountFor("owner/account/supplement joins", counts),
      joinKey: "parcelId/APN + suppNum + ownerId/accountId",
      failureReason: "Owner/account/supplement rows are readable for real dev, but owner lane reconciliation is not production-complete.",
      requiredProofToUpgrade:
        "Complete owner/supplement association reconciliation and prove expected Benton owner/account counts before production proof.",
      dependencyClassification: ownerSupnumDependency.classification,
      requiredForCountyStudioForgeDev: ownerSupnumDependency.requiredForCountyStudioForgeDev,
      requiredForPacketProof: ownerSupnumDependency.requiredForPacketProof,
      requiredForOperationalProof: ownerSupnumDependency.requiredForOperationalProof,
      ownerSupnumBackfillStatus: ownerSupnumDependency.status,
      ownerSupnumBackfillLatestFailedStatus: ownerSupnumDependency.latestFailed?.status ?? null
    }),
    inventoryEntry({
      surface: "WPOV/WSDOR dependencies",
      sourceName: "WPOV and WSDOR dependency rows",
      frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts",
      apiRoute: "County Studio valuation/evidence read paths",
      backendServiceOrController: "TerraFusion Sync WPOV/WSDOR read models",
      dbTableOrView: "legacy wash_prop_owner_val + truth_wsdor",
      ownerLane: "Forge",
      classification: "PARTIAL_SEEDED",
      observedCount: observedCountFor("WPOV/WSDOR dependencies", counts),
      joinKey: "parcelId/APN + taxYear + owner/account references",
      failureReason: "WPOV/WSDOR rows are present for real dev, but canonical source/count reconciliation remains incomplete.",
      requiredProofToUpgrade:
        "Reconcile WPOV/WSDOR counts and joins against canonical Benton expectations and direct source recomputation."
    })
  ];
}

function summarize(reportInventory, readinessReport, dataTruthReport) {
  const realEnoughForDev = reportInventory
    .filter((item) => DEV_REAL_CLASSIFICATIONS.has(item.classification))
    .map((item) => `${item.surface}: ${item.classification} (${item.sourceName})`);
  const blockedForProduction = reportInventory
    .filter((item) => item.productionProofAllowed !== true)
    .map((item) => `${item.surface}: ${item.classification} - ${item.failureReason}`);
  const dataTruthFailures = Array.isArray(dataTruthReport?.failures) ? dataTruthReport.failures : [];
  const blockers = [
    "TerraAtlas-owned Benton geometry/layer provenance remains fallback or compatibility-classified.",
    "Risk objects, ledger rows, and inspector details still need authoritative same-study source binding.",
    "Canonical Benton expected counts are missing for parcel/property, valuation, owner/account, WPOV/WSDOR, and GIS layers.",
    "CountyId/taxYear/studyId identity is present in runtime labels but not proven by authoritative source manifest.",
    "Evidence packets and downstream payloads lack Dossier-grade row lineage proof."
  ];

  return {
    realDevReadinessStatus: readinessReport?.status ?? "UNKNOWN",
    dataTruthStatus: dataTruthReport?.status ?? "UNKNOWN",
    forgeDevDependency: readinessReport?.forgeDevDependency ?? null,
    whatIsNowRealEnoughForDev: realEnoughForDev,
    whatRemainsBlockedForProductionProof: blockedForProduction,
    realEnoughForDev,
    blockedForProduction,
    dataTruthFailureCount: dataTruthFailures.length,
    smallestPathToDataTruthPass: [
      "Publish canonical Benton expected counts for every primary County Studio source.",
      "Replace compatibility/provisional GIS proof with TerraAtlas-owned geometry/layer lineage.",
      "Prove map, ledger, inspector, and packet payloads use the same countyId, taxYear, and studyId keys.",
      "Directly recompute ratio/valuation metrics from source rows and reconcile to the UI population.",
      "Attach Dossier/Dais/Trace lineage for evidence packets, workflow routes, and decisions."
    ]
  };
}

export function buildCountyStudioR1DataLineageReconciliationReport({
  readinessReport = null,
  dataTruthReport = null,
  activationReport = null,
  syncEvidenceReport = null,
  generatedAtUtc = new Date().toISOString()
} = {}) {
  const realDevActivationAllowed = activationReport?.decisions?.realDevActivationAllowed === true;
  const dataTruthFailed = dataTruthReport?.status === "DATA_TRUTH_FAIL";
  const inventory = buildInventory({ readinessReport, dataTruthReport, syncEvidenceReport });
  const summary = summarize(inventory, readinessReport, dataTruthReport);
  const blockers = [];

  if (!realDevActivationAllowed) {
    blockers.push("Real dev activation is not ready; run the readiness DB and activation gates first.");
  }
  if (!dataTruthReport) {
    blockers.push("Data truth gate evidence is missing.");
  }
  if (!readinessReport) {
    blockers.push("Benton real-dev readiness evidence is missing.");
  }

  const status = blockers.length > 0
    ? "DATA_LINEAGE_RECONCILIATION_BLOCKED"
    : dataTruthFailed
      ? "DATA_LINEAGE_RECONCILED_WITH_PRODUCTION_BLOCKERS"
      : "DATA_LINEAGE_RECONCILED";

  return {
    generatedAtUtc,
    gate: "county-studio-r1-data-lineage-reconciliation",
    status,
    decisions: {
      realDevActivationAllowed,
      realDevServerAllowed: readinessReport?.decisions?.realDevServerAllowed === true,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    requiredSurfaces: REQUIRED_RECONCILIATION_SURFACES,
    inventory,
    summary,
    topDataTruthBlockers: summary.smallestPathToDataTruthPass.length >= 5
      ? [
          "Geometry/layers are not proven through TerraAtlas-owned Benton GIS contracts.",
          "Risk objects/ledger/inspector remain generated or derived without authoritative same-study lineage.",
          "Canonical expected Benton counts are missing for production reconciliation.",
          "Evidence packet and downstream payload lineage is unknown.",
          "WPOV/WSDOR and owner/account/supplement joins are partial seeded, not reconciled."
        ]
      : [],
    blockers,
    sourceArtifacts: {
      readiness: "os-platform/core/pilot/evidence/benton-real-dev-server-readiness.json",
      dataTruth: "os-platform/core/pilot/evidence/county-studio-r1-data-truth-gate.latest.json",
      activation: "os-platform/core/pilot/evidence/county-studio-real-dev-server-activation.json"
    },
    boundaries: [
      "This reconciliation does not touch County Studio UI.",
      "This reconciliation does not add mock or fallback data.",
      "This reconciliation does not weaken DATA_TRUTH_FAIL.",
      "This reconciliation does not mutate TerraFusion Sync or DB seed behavior.",
      "This reconciliation does not change Docker/Postgres topology."
    ]
  };
}

export function renderCountyStudioR1DataLineageReconciliationMarkdown(report) {
  const lines = [
    "# County Studio R1 Data Lineage Reconciliation",
    "",
    `Generated: ${report.generatedAtUtc}`,
    `Status: ${report.status}`,
    "",
    "## Decisions",
    "",
    `- realDevActivationAllowed=${report.decisions.realDevActivationAllowed}`,
    `- realDevServerAllowed=${report.decisions.realDevServerAllowed}`,
    `- productionProofAllowed=${report.decisions.productionProofAllowed}`,
    `- operationalProofAllowed=${report.decisions.operationalProofAllowed}`,
    "",
    "## Inventory",
    "",
    "| Surface | Classification | Owner Lane | Observed Count | Status | Failure Reason | Required Proof To Upgrade |",
    "| --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const item of report.inventory) {
    lines.push(
      `| ${item.surface} | ${item.classification} | ${item.ownerLane} | ${JSON.stringify(item.observedCount)} | ${item.status} | ${String(item.failureReason).replaceAll("\n", " ")} | ${String(item.requiredProofToUpgrade).replaceAll("\n", " ")} |`
    );
  }

  lines.push("", "## What Is Now Real Enough For Dev", "");
  report.summary.whatIsNowRealEnoughForDev.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Forge Dev Dependency Reclassification", "");
  const ownerSupnum = report.summary.forgeDevDependency?.ownerSupnumBackfill;
  if (ownerSupnum) {
    lines.push(
      `- ownerSupnumBackfillStatus: ${ownerSupnum.status}`,
      `- ownerSupnumBackfillLatestFailedStatus: ${ownerSupnum.latestFailed?.status ?? "none"}`,
      `- ownerSupnumBackfillClassification: ${ownerSupnum.classification}`,
      `- ownerSupnumBackfillRequiredForForgeDev: ${ownerSupnum.requiredForCountyStudioForgeDev}`,
      `- ownerSupnumBackfillRequiredForPacketProof: ${ownerSupnum.requiredForPacketProof}`,
      `- ownerSupnumBackfillRequiredForOperationalProof: ${ownerSupnum.requiredForOperationalProof}`
    );
  } else {
    lines.push("- ownerSupnumBackfillClassification: UNKNOWN");
  }

  lines.push("", "## What Remains Blocked For Production Proof", "");
  report.summary.whatRemainsBlockedForProductionProof.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Top 5 Data Truth Blockers", "");
  report.topDataTruthBlockers.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Smallest Path To DATA_TRUTH_PASS", "");
  report.summary.smallestPathToDataTruthPass.forEach((item) => lines.push(`- ${item}`));

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
    dataTruth: DEFAULT_DATA_TRUTH_JSON,
    activation: DEFAULT_ACTIVATION_JSON,
    syncEvidence: DEFAULT_SYNC_EVIDENCE_JSON,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--readiness") args.readiness = path.resolve(argv[++i]);
    else if (arg === "--data-truth") args.dataTruth = path.resolve(argv[++i]);
    else if (arg === "--activation") args.activation = path.resolve(argv[++i]);
    else if (arg === "--sync-evidence") args.syncEvidence = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildCountyStudioR1DataLineageReconciliationReport({
    readinessReport: readJson(args.readiness),
    dataTruthReport: readJson(args.dataTruth),
    activationReport: readJson(args.activation),
    syncEvidenceReport: readJson(args.syncEvidence)
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderCountyStudioR1DataLineageReconciliationMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        status: report.status,
        realDevActivationAllowed: report.decisions.realDevActivationAllowed,
        productionProofAllowed: report.decisions.productionProofAllowed,
        operationalProofAllowed: report.decisions.operationalProofAllowed,
        inventory: report.inventory.length,
        blockers: report.blockers.length,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  if (report.status === "DATA_LINEAGE_RECONCILIATION_BLOCKED") {
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
