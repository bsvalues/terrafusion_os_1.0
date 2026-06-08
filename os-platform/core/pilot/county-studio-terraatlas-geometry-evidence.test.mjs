#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  TERRAFUSION_GEOMETRY_CLASSIFICATIONS,
  buildCountyStudioTerraAtlasGeometryEvidenceReport
} from "./county-studio-terraatlas-geometry-evidence.mjs";

const repoRoot = process.cwd();

function syncEvidence(overrides = {}) {
  return {
    status: "SYNC_DB_EVIDENCE_READABLE",
    counts: {
      gis: {
        parcelGeometry: 80075
      },
      canonical: {
        parcel: 3199335
      }
    },
    queryResults: {
      gisParcelGeometry: 80075,
      canonicalParcel: 3199335
    },
    ...overrides
  };
}

function dataTruth(overrides = {}) {
  return {
    status: "DATA_TRUTH_FAIL",
    proofAreas: [
      {
        area: "Atlas layers",
        classification: "FALLBACK",
        reason: "Atlas layers is served through Atlas compatibility geometry.",
        evidence: {
          tokens: [
            "fetchAtlasCompatibilityMapData",
            "fetchGeoForgeCompatibilityOutlines",
            "fetchGeoForgeCompatibilityParcels"
          ]
        }
      }
    ],
    ...overrides
  };
}

function lineage(overrides = {}) {
  return {
    status: "DATA_LINEAGE_RECONCILED_WITH_PRODUCTION_BLOCKERS",
    inventory: [
      {
        surface: "geometry/layers",
        frontendFile: "frontend/apps/os-shell/src/pages/forge/atlas-live/atlasLiveApi.ts",
        apiRoute: "GET /launch-data/washington/counties/status.json + Atlas compatibility map routes",
        backendServiceOrController: "Atlas Live compatibility API",
        dbTableOrView: "gis_tf.tf_parcel_geom",
        ownerLane: "Atlas",
        classification: "FALLBACK",
        observedCount: 80075,
        joinKey: "countyId + parcelId/APN + layerId",
        countyId: "19190019-1919-1919-1919-191919191919",
        taxYear: 2026,
        studyId: "runtime-selected-study",
        failureReason: "Atlas layers is served through Atlas compatibility geometry.",
        requiredProofToUpgrade: "Wire County Studio to TerraAtlas-owned geometry contracts."
      }
    ],
    ...overrides
  };
}

test("defines TerraAtlas geometry evidence classifications", () => {
  assert.deepEqual(TERRAFUSION_GEOMETRY_CLASSIFICATIONS, [
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
  ]);
});

test("classifies real TerraAtlas geometry as available but not wired when County Studio uses compatibility endpoints", () => {
  const report = buildCountyStudioTerraAtlasGeometryEvidenceReport({
    syncEvidenceReport: syncEvidence(),
    dataTruthReport: dataTruth(),
    lineageReport: lineage(),
    sourceScan: {
      frontendConsumer: "EmbeddedAtlasGisWorkspace uses useAtlasMapData",
      apiRoute: "fetchAtlasCompatibilityMapData -> /geoforge/v2/parcels/tiles",
      backendServiceOrController: "GeoForge compatibility API",
      usesCompatibilityMapData: true,
      usesTerraAtlasParcelGeometryEndpoint: false,
      usesTerraAtlasDbTable: false,
      candidateTables: [
        { table: "gis_tf.tf_parcel_geom", count: 80075, exists: true },
        { table: "canonical_tf.tf_parcel", count: 3199335, exists: true }
      ]
    },
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "TERRAATLAS_GEOMETRY_EVIDENCE_AVAILABLE_NOT_WIRED");
  assert.equal(report.classification, "ATLAS_LAYER_AVAILABLE_NOT_WIRED");
  assert.equal(report.decisions.realGeometryExists, true);
  assert.equal(report.decisions.countyStudioUsesRealTerraAtlasGeometry, false);
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
  assert.equal(report.geometryCounts.parcelGeometry, 80075);
  assert.match(report.finding, /available but County Studio is still wired/i);
});

test("classifies real parcel geometry separately from unproven full GIS layer truth", () => {
  const report = buildCountyStudioTerraAtlasGeometryEvidenceReport({
    syncEvidenceReport: syncEvidence(),
    dataTruthReport: dataTruth(),
    lineageReport: lineage({
      inventory: [
        {
          surface: "geometry/layers",
          frontendFile: "frontend/apps/os-shell/src/pages/forge/atlas-live/atlasLiveApi.ts",
          apiRoute: "GET /api/parcels/{tfParcelId}/geometry",
          backendServiceOrController: "ParcelGeometryController + ParcelGeometryReader",
          dbTableOrView: "gis_tf.tf_parcel_geom",
          ownerLane: "Atlas",
          classification: "SYNC_DERIVED",
          observedCount: 80075,
          joinKey: "tfParcelId + countyId"
        }
      ]
    }),
    sourceScan: {
      usesCompatibilityMapData: false,
      usesTerraAtlasParcelGeometryEndpoint: true,
      usesTerraAtlasDbTable: true,
      returnsParcelPolygonsOnly: true,
      outlinesReturnedFromEndpoint: false,
      hardcodedOrNullAttributeFields: [
        "assessedValue",
        "propertyClass",
        "salePrice",
        "ratio",
        "ratioDeviation",
        "nbhdMedianRatio"
      ],
      neighborhoodCodeFromQueryScope: true,
      riskOverlayUsesFeatureNeighborhoodCode: true,
      riskLabelsScreenPositioned: true
    },
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "TERRAATLAS_GIS_TRUTH_PARTIAL");
  assert.equal(report.classification, "PARTIAL_GIS_TRUTH");
  assert.equal(report.parcelGeometryStatus, "SYNC_DERIVED_PARCEL_GEOMETRY");
  assert.equal(report.fullGisLayerTruthStatus, "GIS_LAYER_TRUTH_NOT_PROVEN");
  assert.equal(report.mapOverlayStatus, "FALLBACK_MAP_OVERLAY");
  assert.equal(report.attributeOverlayStatus, "UNPROVEN_ATTRIBUTE_OVERLAY");
  assert.equal(report.riskOverlayAnchoring, "NOT_GIS_ANCHORED");
  assert.equal(report.riskOverlayAnchoringClassification, "UI_ABSOLUTE_RISK_LABELS");
  assert.equal(report.decisions.countyStudioUsesRealParcelGeometry, true);
  assert.equal(report.decisions.countyStudioUsesFullTerraAtlasGisLayerTruth, false);
  assert.equal(report.decisions.riskOverlayGisAnchored, false);
  assert.equal(report.decisions.productionProofAllowed, false);
});

test("does not let the parcel endpoint override stale compatibility lineage into full GIS proof", () => {
  const report = buildCountyStudioTerraAtlasGeometryEvidenceReport({
    syncEvidenceReport: syncEvidence(),
    dataTruthReport: dataTruth(),
    lineageReport: lineage(),
    sourceScan: {
      apiRoute: "fetchTerraAtlasParcelGeometryMapData -> GET /api/atlas-live/geometry/parcels",
      backendServiceOrController: "AtlasLiveGeometryController reads gis_tf.tf_parcel_geom",
      usesCompatibilityMapData: true,
      usesTerraAtlasParcelGeometryEndpoint: true,
      usesTerraAtlasDbTable: true,
      returnsParcelPolygonsOnly: true,
      outlinesReturnedFromEndpoint: false,
      hardcodedOrNullAttributeFields: ["assessedValue", "ratio", "nbhdMedianRatio"],
      neighborhoodCodeFromQueryScope: true,
      riskOverlayUsesFeatureNeighborhoodCode: true,
      riskLabelsScreenPositioned: true,
      candidateTables: [
        { table: "gis_tf.tf_parcel_geom", count: 80075, exists: true }
      ]
    },
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.classification, "PARTIAL_GIS_TRUTH");
  assert.equal(report.parcelGeometryStatus, "SYNC_DERIVED_PARCEL_GEOMETRY");
  assert.equal(report.fullGisLayerTruthStatus, "GIS_LAYER_TRUTH_NOT_PROVEN");
  assert.match(report.sourcePath.apiRoute, /atlas-live\/geometry\/parcels/);
  assert.match(report.sourcePath.backendServiceOrController, /AtlasLiveGeometryController/);
});

test("default source scan detects parcel-only payloads and non-GIS-anchored risk labels", () => {
  const report = buildCountyStudioTerraAtlasGeometryEvidenceReport({
    syncEvidenceReport: syncEvidence(),
    dataTruthReport: dataTruth(),
    lineageReport: lineage(),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.sourceScan.returnsParcelPolygonsOnly, true);
  assert.equal(report.sourceScan.outlinesReturnedFromEndpoint, false);
  assert.deepEqual(report.sourceScan.hardcodedOrNullAttributeFields, [
    "assessedValue",
    "propertyClass",
    "salePrice",
    "ratio",
    "ratioDeviation",
    "nbhdMedianRatio"
  ]);
  assert.equal(report.sourceScan.neighborhoodCodeFromQueryScope, true);
  assert.equal(report.sourceScan.riskOverlayUsesFeatureNeighborhoodCode, true);
  assert.equal(report.sourceScan.riskLabelsScreenPositioned, true);
  assert.equal(report.fullGisLayerTruthStatus, "GIS_LAYER_TRUTH_NOT_PROVEN");
  assert.equal(report.riskOverlayAnchoring, "NOT_GIS_ANCHORED");
});

test("keeps fallback geometry when no real GIS geometry is readable", () => {
  const report = buildCountyStudioTerraAtlasGeometryEvidenceReport({
    syncEvidenceReport: syncEvidence({
      counts: { gis: { parcelGeometry: 0 }, canonical: { parcel: 0 } },
      queryResults: { gisParcelGeometry: 0, canonicalParcel: 0 }
    }),
    dataTruthReport: dataTruth(),
    lineageReport: lineage({
      inventory: [
        {
          surface: "geometry/layers",
          classification: "FALLBACK",
          observedCount: 0
        }
      ]
    }),
    sourceScan: {
      usesCompatibilityMapData: true,
      usesTerraAtlasParcelGeometryEndpoint: false,
      usesTerraAtlasDbTable: false
    },
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "TERRAATLAS_GEOMETRY_EVIDENCE_FALLBACK");
  assert.equal(report.classification, "FALLBACK_GEOMETRY");
  assert.equal(report.decisions.realGeometryExists, false);
});

test("CLI writes TerraAtlas geometry evidence JSON and markdown", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-terraatlas-geometry-"));
  const sync = path.join(tmp, "sync.json");
  const truth = path.join(tmp, "truth.json");
  const line = path.join(tmp, "lineage.json");
  const sourceScan = path.join(tmp, "source-scan.json");
  const outJson = path.join(tmp, "geometry.json");
  const outMd = path.join(tmp, "geometry.md");

  fs.writeFileSync(sync, `${JSON.stringify(syncEvidence(), null, 2)}\n`);
  fs.writeFileSync(truth, `${JSON.stringify(dataTruth(), null, 2)}\n`);
  fs.writeFileSync(line, `${JSON.stringify(lineage(), null, 2)}\n`);
  fs.writeFileSync(
    sourceScan,
    `${JSON.stringify(
      {
        usesCompatibilityMapData: true,
        usesTerraAtlasParcelGeometryEndpoint: false,
        usesTerraAtlasDbTable: false
      },
      null,
      2
    )}\n`
  );

  const result = spawnSync(
    "node",
    [
      "os-platform/core/pilot/county-studio-terraatlas-geometry-evidence.mjs",
      "--sync-evidence",
      sync,
      "--data-truth",
      truth,
      "--lineage",
      line,
      "--source-scan",
      sourceScan,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: repoRoot, encoding: "utf8" }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /ATLAS_LAYER_AVAILABLE_NOT_WIRED/);
  assert.ok(fs.existsSync(outJson));
  assert.ok(fs.existsSync(outMd));

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");
  assert.equal(report.classification, "ATLAS_LAYER_AVAILABLE_NOT_WIRED");
  assert.equal(report.fullGisLayerTruthStatus, "GIS_LAYER_TRUTH_NOT_PROVEN");
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
  assert.match(markdown, /TerraAtlas Geometry Evidence/);
  assert.match(markdown, /ATLAS_LAYER_AVAILABLE_NOT_WIRED/);
});
