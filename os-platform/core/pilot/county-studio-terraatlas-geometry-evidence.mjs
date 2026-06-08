#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_SYNC_EVIDENCE_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "benton-sync-drain-state-evidence.json"
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
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-terraatlas-geometry-evidence.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-terraatlas-geometry-evidence.md"
);

const SOURCE_FILES = {
  embeddedAtlasWorkspace: "frontend/apps/os-shell/src/pages/forge/county-studio/components/EmbeddedAtlasGisWorkspace.tsx",
  atlasLiveApi: "frontend/apps/os-shell/src/pages/forge/atlas-live/atlasLiveApi.ts",
  useAtlasMapData: "frontend/apps/os-shell/src/pages/forge/atlas-live/hooks/useAtlasMapData.ts",
  geoforgeV2Api: "frontend/apps/os-shell/src/pages/forge/geo/v2/v2Api.ts",
  atlasLiveGeometryController: "backend/src/TerraFusion.API/Controllers/AtlasLiveGeometryController.cs",
  parcelGeometryController: "backend/src/TerraFusion.API/Controllers/ParcelGeometryController.cs",
  parcelGeometryReader: "backend/src/TerraFusion.Data/Services/GisTf/ParcelGeometryReader.cs",
  tfParcelGeomConfiguration: "backend/src/TerraFusion.Data/Configurations/GisTf/TfParcelGeomConfiguration.cs"
};

export const TERRAFUSION_GEOMETRY_CLASSIFICATIONS = [
  "SYNC_DERIVED_PARCEL_GEOMETRY",
  "PARTIAL_GIS_TRUTH",
  "GIS_LAYER_TRUTH_NOT_PROVEN",
  "FALLBACK_MAP_OVERLAY",
  "UNPROVEN_ATTRIBUTE_OVERLAY",
  "UI_ABSOLUTE_RISK_LABELS",
  "REQUIRED_FOR_PRODUCTION_GIS_PROOF",
  "SYNC_DERIVED_GEOMETRY",
  "SEEDED_GEOMETRY",
  "ATLAS_LAYER_AVAILABLE_NOT_WIRED",
  "FALLBACK_GEOMETRY",
  "GEOMETRY_MISCLASSIFIED",
  "GEOMETRY_UNKNOWN"
];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readText(relPath) {
  try {
    return fs.readFileSync(path.join(repoRoot, relPath), "utf8");
  } catch {
    return "";
  }
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function numberValue(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function findInventory(lineageReport, surface) {
  return (lineageReport?.inventory ?? []).find((item) => item.surface === surface) ?? null;
}

function findProofArea(dataTruthReport, area) {
  return (dataTruthReport?.proofAreas ?? []).find((item) => item.area === area) ?? null;
}

function geometryCounts(syncEvidenceReport, lineageReport) {
  const geometryInventory = findInventory(lineageReport, "geometry/layers");
  const mapInventory = findInventory(lineageReport, "map");
  const syncCount =
    syncEvidenceReport?.counts?.gis?.parcelGeometry
    ?? syncEvidenceReport?.queryResults?.gisParcelGeometry
    ?? null;

  return {
    parcelGeometry: numberValue(syncCount ?? geometryInventory?.observedCount ?? mapInventory?.observedCount),
    canonicalParcel: numberValue(syncEvidenceReport?.counts?.canonical?.parcel ?? syncEvidenceReport?.queryResults?.canonicalParcel),
    geometryInventoryObservedCount: numberValue(geometryInventory?.observedCount),
    mapInventoryObservedCount: numberValue(mapInventory?.observedCount)
  };
}

function buildDefaultSourceScan() {
  const embedded = readText(SOURCE_FILES.embeddedAtlasWorkspace);
  const atlasApi = readText(SOURCE_FILES.atlasLiveApi);
  const hook = readText(SOURCE_FILES.useAtlasMapData);
  const v2Api = readText(SOURCE_FILES.geoforgeV2Api);
  const atlasLiveGeometryController = readText(SOURCE_FILES.atlasLiveGeometryController);
  const controller = readText(SOURCE_FILES.parcelGeometryController);
  const reader = readText(SOURCE_FILES.parcelGeometryReader);
  const config = readText(SOURCE_FILES.tfParcelGeomConfiguration);
  const usesAtlasLiveGeometryRoute =
    atlasApi.includes("fetchTerraAtlasParcelGeometryMapData")
    && atlasApi.includes("/atlas-live/geometry/parcels")
    && hook.includes("fetchTerraAtlasParcelGeometryMapData");

  return {
    frontendConsumer: embedded.includes("useAtlasMapData")
      ? `${SOURCE_FILES.embeddedAtlasWorkspace} -> useAtlasMapData`
      : SOURCE_FILES.embeddedAtlasWorkspace,
    apiRoute: usesAtlasLiveGeometryRoute
      ? "fetchTerraAtlasParcelGeometryMapData -> GET /api/atlas-live/geometry/parcels"
      : atlasApi.includes("fetchAtlasCompatibilityMapData")
      ? "fetchAtlasCompatibilityMapData -> /geoforge/v2/neighborhoods/outline + /geoforge/v2/parcels/tiles"
      : "UNKNOWN",
    backendServiceOrController: atlasLiveGeometryController.includes("AtlasLiveGeometryController")
      ? "AtlasLiveGeometryController reads gis_tf.tf_parcel_geom as the County Studio bulk map feed"
      : controller.includes("ParcelGeometryController")
      ? "ParcelGeometryController + ParcelGeometryReader are available as real TerraAtlas geometry read path"
      : "UNKNOWN",
    usesCompatibilityMapData:
      embedded.includes("useAtlasMapData")
      && hook.includes("fetchAtlasCompatibilityMapData")
      && atlasApi.includes("fetchGeoForgeCompatibilityParcels")
      && v2Api.includes("/geoforge/v2/parcels/tiles"),
    usesTerraAtlasParcelGeometryEndpoint:
      usesAtlasLiveGeometryRoute
      || atlasLiveGeometryController.includes("api/atlas-live/geometry")
      || atlasLiveGeometryController.includes("TfParcelGeoms")
      || embedded.includes("/api/parcels/{tfParcelId}/geometry")
      || hook.includes("/api/parcels/{tfParcelId}/geometry")
      || atlasApi.includes("/api/parcels/{tfParcelId}/geometry"),
    usesTerraAtlasDbTable:
      atlasLiveGeometryController.includes("gis_tf.tf_parcel_geom")
      || atlasLiveGeometryController.includes("TfParcelGeoms")
      || embedded.includes("gis_tf.tf_parcel_geom")
      || hook.includes("gis_tf.tf_parcel_geom")
      || atlasApi.includes("gis_tf.tf_parcel_geom"),
    availableRealGeometryReadPath:
      (atlasLiveGeometryController.includes("api/atlas-live/geometry")
        && atlasLiveGeometryController.includes("TfParcelGeoms"))
      || controller.includes("GET /api/parcels/{tfParcelId}/geometry")
      && reader.includes("TfParcelGeoms")
      && config.includes("tf_parcel_geom"),
    returnsParcelPolygonsOnly:
      atlasLiveGeometryController.includes("TfParcelGeoms")
      && atlasLiveGeometryController.includes("outlines = (object?)null"),
    outlinesReturnedFromEndpoint:
      !atlasLiveGeometryController.includes("outlines = (object?)null"),
    hardcodedOrNullAttributeFields: [
      atlasLiveGeometryController.includes("assessedValue = 0") ? "assessedValue" : null,
      atlasLiveGeometryController.includes("propertyClass = (string?)null") ? "propertyClass" : null,
      atlasLiveGeometryController.includes("salePrice = 0") ? "salePrice" : null,
      atlasLiveGeometryController.includes("ratio = (double?)null") ? "ratio" : null,
      atlasLiveGeometryController.includes("ratioDeviation = (double?)null") ? "ratioDeviation" : null,
      atlasLiveGeometryController.includes("nbhdMedianRatio = (double?)null") ? "nbhdMedianRatio" : null
    ].filter(Boolean),
    neighborhoodCodeFromQueryScope:
      atlasLiveGeometryController.includes("[FromQuery] string? neighborhoodCode")
      && atlasLiveGeometryController.includes("neighborhoodCode,"),
    riskOverlayUsesFeatureNeighborhoodCode:
      embedded.includes("feature.properties.neighborhoodCode"),
    riskLabelsScreenPositioned:
      embedded.includes("data-testid=\"prometheus-risk-map-label\"")
      && embedded.includes("position: 'absolute'")
      && embedded.includes("top:")
      && embedded.includes("left:"),
    candidateTables: [
      { table: "gis_tf.tf_parcel_geom", exists: config.includes("tf_parcel_geom") },
      { table: "canonical_tf.tf_parcel", exists: reader.includes("TfParcels") },
      { table: "truth_arcgis parcel geometry", exists: reader.includes("TfParcelGeoms") },
      { table: "GeoForge compatibility tiles", exists: v2Api.includes("/geoforge/v2/parcels/tiles") }
    ],
    sourceFiles: SOURCE_FILES
  };
}

function hasUnprovenFullGisTruth({ sourceScan, geometryInventory, atlasProof }) {
  const atlasProofFallback = String(atlasProof?.classification ?? "").toUpperCase() === "FALLBACK";
  const geometryInventoryFallback = String(geometryInventory?.classification ?? "").toUpperCase() === "FALLBACK";
  const unprovenAttributes = Array.isArray(sourceScan?.hardcodedOrNullAttributeFields)
    && sourceScan.hardcodedOrNullAttributeFields.length > 0;
  return atlasProofFallback
    || geometryInventoryFallback
    || sourceScan?.returnsParcelPolygonsOnly === true
    || sourceScan?.outlinesReturnedFromEndpoint === false
    || unprovenAttributes
    || sourceScan?.neighborhoodCodeFromQueryScope === true
    || sourceScan?.riskOverlayUsesFeatureNeighborhoodCode === true
    || sourceScan?.riskLabelsScreenPositioned === true;
}

function classifyGeometry({ counts, sourceScan, geometryInventory, atlasProof }) {
  const realGeometryExists = counts.parcelGeometry > 0;
  const usesRealEndpoint = sourceScan?.usesTerraAtlasParcelGeometryEndpoint === true;
  const usesRealTable = sourceScan?.usesTerraAtlasDbTable === true;
  const usesCompatibility = sourceScan?.usesCompatibilityMapData === true
    || /compatibility/i.test(String(geometryInventory?.apiRoute ?? ""))
    || /compatibility/i.test(String(atlasProof?.reason ?? ""));
  const lineageClaimsFallback = String(geometryInventory?.classification ?? atlasProof?.classification ?? "").toUpperCase() === "FALLBACK";

  if (realGeometryExists && (usesRealEndpoint || usesRealTable)) {
    return hasUnprovenFullGisTruth({ sourceScan, geometryInventory, atlasProof })
      ? "PARTIAL_GIS_TRUTH"
      : "SYNC_DERIVED_GEOMETRY";
  }
  if (realGeometryExists && usesCompatibility) {
    return "ATLAS_LAYER_AVAILABLE_NOT_WIRED";
  }
  if (realGeometryExists && lineageClaimsFallback) {
    return "GEOMETRY_MISCLASSIFIED";
  }
  if (!realGeometryExists && usesCompatibility) {
    return "FALLBACK_GEOMETRY";
  }
  return "GEOMETRY_UNKNOWN";
}

function statusFor(classification) {
  switch (classification) {
    case "PARTIAL_GIS_TRUTH":
      return "TERRAATLAS_GIS_TRUTH_PARTIAL";
    case "SYNC_DERIVED_GEOMETRY":
    case "SEEDED_GEOMETRY":
      return "TERRAATLAS_GEOMETRY_EVIDENCE_REAL_DEV_WIRED";
    case "ATLAS_LAYER_AVAILABLE_NOT_WIRED":
      return "TERRAATLAS_GEOMETRY_EVIDENCE_AVAILABLE_NOT_WIRED";
    case "FALLBACK_GEOMETRY":
      return "TERRAATLAS_GEOMETRY_EVIDENCE_FALLBACK";
    case "GEOMETRY_MISCLASSIFIED":
      return "TERRAATLAS_GEOMETRY_EVIDENCE_MISCLASSIFIED";
    default:
      return "TERRAATLAS_GEOMETRY_EVIDENCE_UNKNOWN";
  }
}

function findingFor(classification) {
  switch (classification) {
    case "PARTIAL_GIS_TRUTH":
      return "County Studio uses real TerraAtlas sync-derived parcel geometry for Forge dev, but full GIS layer truth, GIS attributes, outlines, neighborhoods/segments/district layers, and risk overlay anchoring are not proven.";
    case "SYNC_DERIVED_GEOMETRY":
      return "County Studio geometry/map context is wired to a real TerraAtlas sync-derived geometry path for real dev; production GIS proof remains blocked pending canonical reconciliation.";
    case "SEEDED_GEOMETRY":
      return "County Studio geometry/map context is wired to seeded TerraAtlas geometry for real dev; production GIS proof remains blocked pending canonical reconciliation.";
    case "ATLAS_LAYER_AVAILABLE_NOT_WIRED":
      return "TerraAtlas parcel geometry is available but County Studio is still wired through the compatibility map feed.";
    case "FALLBACK_GEOMETRY":
      return "No real TerraAtlas geometry rows are readable in this runtime; County Studio compatibility geometry remains fallback.";
    case "GEOMETRY_MISCLASSIFIED":
      return "Real geometry exists and the evidence logic appears to be classifying it as fallback without proving the active County Studio route.";
    default:
      return "TerraAtlas geometry provenance is unknown.";
  }
}

export function buildCountyStudioTerraAtlasGeometryEvidenceReport({
  syncEvidenceReport = null,
  dataTruthReport = null,
  lineageReport = null,
  sourceScan = null,
  generatedAtUtc = new Date().toISOString()
} = {}) {
  const geometryInventory = findInventory(lineageReport, "geometry/layers");
  const mapInventory = findInventory(lineageReport, "map");
  const atlasProof = findProofArea(dataTruthReport, "Atlas layers");
  const counts = geometryCounts(syncEvidenceReport, lineageReport);
  const resolvedSourceScan = sourceScan ?? buildDefaultSourceScan();
  const classification = classifyGeometry({
    counts,
    sourceScan: resolvedSourceScan,
    geometryInventory,
    atlasProof
  });
  const status = statusFor(classification);
  const realGeometryExists = counts.parcelGeometry > 0;
  const parcelGeometryStatus = realGeometryExists
    && (
      resolvedSourceScan?.usesTerraAtlasParcelGeometryEndpoint === true
      || resolvedSourceScan?.usesTerraAtlasDbTable === true
    )
    ? "SYNC_DERIVED_PARCEL_GEOMETRY"
    : classification === "FALLBACK_GEOMETRY"
    ? "FALLBACK_GEOMETRY"
    : "GEOMETRY_UNKNOWN";
  const fullGisLayerTruthStatus =
    classification === "SYNC_DERIVED_GEOMETRY" || classification === "SEEDED_GEOMETRY"
      ? classification
      : "GIS_LAYER_TRUTH_NOT_PROVEN";
  const mapOverlayStatus = classification === "PARTIAL_GIS_TRUTH" || classification === "ATLAS_LAYER_AVAILABLE_NOT_WIRED"
    ? "FALLBACK_MAP_OVERLAY"
    : classification === "FALLBACK_GEOMETRY"
    ? "FALLBACK_MAP_OVERLAY"
    : "GEOMETRY_UNKNOWN";
  const attributeOverlayStatus =
    Array.isArray(resolvedSourceScan?.hardcodedOrNullAttributeFields)
    && resolvedSourceScan.hardcodedOrNullAttributeFields.length > 0
      ? "UNPROVEN_ATTRIBUTE_OVERLAY"
      : "GEOMETRY_UNKNOWN";
  const riskOverlayAnchoring = resolvedSourceScan?.riskLabelsScreenPositioned === true
    || resolvedSourceScan?.riskOverlayUsesFeatureNeighborhoodCode === true
    ? "NOT_GIS_ANCHORED"
    : "UNKNOWN";
  const riskOverlayAnchoringClassification = riskOverlayAnchoring === "NOT_GIS_ANCHORED"
    ? "UI_ABSOLUTE_RISK_LABELS"
    : "GEOMETRY_UNKNOWN";
  const countyStudioUsesRealTerraAtlasGeometry =
    classification === "SYNC_DERIVED_GEOMETRY" || classification === "SEEDED_GEOMETRY";
  const countyStudioUsesRealParcelGeometry = parcelGeometryStatus === "SYNC_DERIVED_PARCEL_GEOMETRY";
  const preferActiveSourceScan = countyStudioUsesRealTerraAtlasGeometry || countyStudioUsesRealParcelGeometry;

  return {
    generatedAtUtc,
    gate: "county-studio-terraatlas-geometry-evidence",
    status,
    classification,
    parcelGeometryStatus,
    fullGisLayerTruthStatus,
    mapOverlayStatus,
    attributeOverlayStatus,
    riskOverlayAnchoring,
    riskOverlayAnchoringClassification,
    finding: findingFor(classification),
    decisions: {
      realGeometryExists,
      countyStudioUsesRealParcelGeometry,
      countyStudioUsesRealTerraAtlasGeometry,
      countyStudioUsesFullTerraAtlasGisLayerTruth: countyStudioUsesRealTerraAtlasGeometry,
      fullGisLayerTruthProven: countyStudioUsesRealTerraAtlasGeometry,
      riskOverlayGisAnchored: riskOverlayAnchoring !== "NOT_GIS_ANCHORED",
      atlasLayerAvailableNotWired: classification === "ATLAS_LAYER_AVAILABLE_NOT_WIRED",
      geometryMisclassified: classification === "GEOMETRY_MISCLASSIFIED",
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    geometryCounts: counts,
    sourcePath: {
      frontendFile: geometryInventory?.frontendFile ?? SOURCE_FILES.atlasLiveApi,
      countyStudioConsumer: SOURCE_FILES.embeddedAtlasWorkspace,
      hook: SOURCE_FILES.useAtlasMapData,
      apiRoute: preferActiveSourceScan
        ? resolvedSourceScan.apiRoute ?? geometryInventory?.apiRoute ?? "UNKNOWN"
        : geometryInventory?.apiRoute ?? resolvedSourceScan.apiRoute ?? "UNKNOWN",
      backendServiceOrController: preferActiveSourceScan
        ? resolvedSourceScan.backendServiceOrController ?? geometryInventory?.backendServiceOrController ?? "UNKNOWN"
        : geometryInventory?.backendServiceOrController ?? resolvedSourceScan.backendServiceOrController ?? "UNKNOWN",
      dbTableOrView: geometryInventory?.dbTableOrView ?? "gis_tf.tf_parcel_geom",
      joinKey: geometryInventory?.joinKey ?? "countyId + parcelId/APN + layerId",
      countyId: geometryInventory?.countyId ?? mapInventory?.countyId ?? "19190019-1919-1919-1919-191919191919",
      taxYear: geometryInventory?.taxYear ?? mapInventory?.taxYear ?? 2026,
      studyId: geometryInventory?.studyId ?? mapInventory?.studyId ?? "runtime-selected-study"
    },
    candidateTables: (resolvedSourceScan.candidateTables ?? []).map((candidate) => ({
      ...candidate,
      count: candidate.count ?? (candidate.table === "gis_tf.tf_parcel_geom" ? counts.parcelGeometry : null)
    })),
    sourceScan: resolvedSourceScan,
    atlasProof: atlasProof ?? null,
    lineageGeometryInventory: geometryInventory ?? null,
    requiredProofToUpgrade:
      classification === "PARTIAL_GIS_TRUTH"
        ? "Prove TerraAtlas-owned Benton neighborhoods, segments, reval areas, taxing districts, layer registry, outlines, per-parcel GIS attributes, and GIS-anchored overlays before full GIS or production proof."
        : classification === "ATLAS_LAYER_AVAILABLE_NOT_WIRED"
        ? "Wire County Studio embedded map context to TerraAtlas-owned geometry/layer service or prove the compatibility feed is backed by gis_tf.tf_parcel_geom with source-row lineage."
        : "Prove TerraAtlas-owned Benton parcel geometry, neighborhoods, segments, reval areas, taxing districts, layer registry, and map overlays by countyId/taxYear/studyId before production proof.",
    boundaries: [
      "This gate does not touch County Studio UI.",
      "This gate does not mutate TerraFusion Sync.",
      "This gate does not change DB seeding.",
      "This gate does not invent geometry.",
      "This gate does not weaken production or operational proof.",
      "This gate does not hide fallback if fallback is real."
    ]
  };
}

export function renderCountyStudioTerraAtlasGeometryEvidenceMarkdown(report) {
  const lines = [
    "# County Studio TerraAtlas Geometry Evidence",
    "",
    `Generated: ${report.generatedAtUtc}`,
    `Status: ${report.status}`,
    `Classification: ${report.classification}`,
    `Parcel Geometry Status: ${report.parcelGeometryStatus}`,
    `Full GIS Layer Truth Status: ${report.fullGisLayerTruthStatus}`,
    `Map Overlay Status: ${report.mapOverlayStatus}`,
    `Attribute Overlay Status: ${report.attributeOverlayStatus}`,
    `Risk Overlay Anchoring: ${report.riskOverlayAnchoring}`,
    "",
    "## Finding",
    "",
    report.finding,
    "",
    "## Decisions",
    "",
    `- realGeometryExists=${report.decisions.realGeometryExists}`,
    `- countyStudioUsesRealParcelGeometry=${report.decisions.countyStudioUsesRealParcelGeometry}`,
    `- countyStudioUsesRealTerraAtlasGeometry=${report.decisions.countyStudioUsesRealTerraAtlasGeometry}`,
    `- countyStudioUsesFullTerraAtlasGisLayerTruth=${report.decisions.countyStudioUsesFullTerraAtlasGisLayerTruth}`,
    `- fullGisLayerTruthProven=${report.decisions.fullGisLayerTruthProven}`,
    `- riskOverlayGisAnchored=${report.decisions.riskOverlayGisAnchored}`,
    `- atlasLayerAvailableNotWired=${report.decisions.atlasLayerAvailableNotWired}`,
    `- geometryMisclassified=${report.decisions.geometryMisclassified}`,
    `- productionProofAllowed=${report.decisions.productionProofAllowed}`,
    `- operationalProofAllowed=${report.decisions.operationalProofAllowed}`,
    "",
    "## Geometry Counts",
    "",
    `- parcelGeometry=${report.geometryCounts.parcelGeometry}`,
    `- canonicalParcel=${report.geometryCounts.canonicalParcel}`,
    `- geometryInventoryObservedCount=${report.geometryCounts.geometryInventoryObservedCount}`,
    `- mapInventoryObservedCount=${report.geometryCounts.mapInventoryObservedCount}`,
    "",
    "## Active County Studio Geometry Path",
    "",
    `- frontendFile: ${report.sourcePath.frontendFile}`,
    `- countyStudioConsumer: ${report.sourcePath.countyStudioConsumer}`,
    `- hook: ${report.sourcePath.hook}`,
    `- apiRoute: ${report.sourcePath.apiRoute}`,
    `- backendServiceOrController: ${report.sourcePath.backendServiceOrController}`,
    `- dbTableOrView: ${report.sourcePath.dbTableOrView}`,
    `- joinKey: ${report.sourcePath.joinKey}`,
    "",
    "## Candidate Tables / Views",
    "",
    "| Candidate | Exists | Count |",
    "| --- | --- | --- |"
  ];

  report.candidateTables.forEach((candidate) => {
    lines.push(`| ${candidate.table} | ${candidate.exists} | ${candidate.count ?? "unknown"} |`);
  });

  lines.push(
    "",
    "## Required Proof To Upgrade",
    "",
    report.requiredProofToUpgrade,
    "",
    "## Boundaries",
    ""
  );
  report.boundaries.forEach((boundary) => lines.push(`- ${boundary}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    syncEvidence: DEFAULT_SYNC_EVIDENCE_JSON,
    dataTruth: DEFAULT_DATA_TRUTH_JSON,
    lineage: DEFAULT_LINEAGE_JSON,
    sourceScan: null,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--sync-evidence") args.syncEvidence = path.resolve(argv[++i]);
    else if (arg === "--data-truth") args.dataTruth = path.resolve(argv[++i]);
    else if (arg === "--lineage") args.lineage = path.resolve(argv[++i]);
    else if (arg === "--source-scan") args.sourceScan = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildCountyStudioTerraAtlasGeometryEvidenceReport({
    syncEvidenceReport: readJson(args.syncEvidence),
    dataTruthReport: readJson(args.dataTruth),
    lineageReport: readJson(args.lineage),
    sourceScan: args.sourceScan ? readJson(args.sourceScan) : null
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderCountyStudioTerraAtlasGeometryEvidenceMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        status: report.status,
        classification: report.classification,
        parcelGeometryStatus: report.parcelGeometryStatus,
        fullGisLayerTruthStatus: report.fullGisLayerTruthStatus,
        mapOverlayStatus: report.mapOverlayStatus,
        riskOverlayAnchoring: report.riskOverlayAnchoring,
        realGeometryExists: report.decisions.realGeometryExists,
        countyStudioUsesRealParcelGeometry: report.decisions.countyStudioUsesRealParcelGeometry,
        countyStudioUsesRealTerraAtlasGeometry: report.decisions.countyStudioUsesRealTerraAtlasGeometry,
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
