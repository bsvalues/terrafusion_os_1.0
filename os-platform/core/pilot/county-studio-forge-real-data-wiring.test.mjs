#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  REQUIRED_FORGE_WIRING_SURFACES,
  buildCountyStudioForgeRealDataWiringReport
} from "./county-studio-forge-real-data-wiring.mjs";

const repoRoot = process.cwd();

function readinessReport(overrides = {}) {
  return {
    status: "REAL_DEV_DATA_AVAILABLE",
    decisions: {
      realDevServerAllowed: true,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    forgeDevDependency: {
      ownerSupnumBackfill: {
        stage: "owner-supnum-resume",
        status: "IN_PROGRESS",
        latestFailed: {
          loadBatchId: "failed-owner-supnum",
          stage: "owner-supnum-resume",
          status: "FAILED"
        },
        classification: "NOT_REQUIRED_FOR_FORGE_DEV",
        requiredForCountyStudioForgeDev: false,
        requiredForPacketProof: true,
        requiredForOperationalProof: true,
        ownerIdentityConsumedByForgeSurfaces: false,
        consumedSurfaces: []
      }
    },
    ...overrides
  };
}

function activationReport(overrides = {}) {
  return {
    status: "REAL_DEV_ACTIVATION_READY",
    decisions: {
      realDevActivationAllowed: true,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    ...overrides
  };
}

function dataTruthReport(overrides = {}) {
  return {
    status: "DATA_TRUTH_FAIL",
    claims: {
      realDevServerAllowed: true,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    proofAreas: [
      {
        area: "parcel/property source",
        classification: "SYNC_DERIVED",
        reason: "parcel/property path is sync-derived but canonical count reconciliation remains incomplete"
      },
      {
        area: "ratio study population",
        classification: "SYNC_DERIVED",
        reason: "ratio rows are sync-derived but not production reconciled"
      },
      {
        area: "risk objects",
        classification: "GENERATED",
        reason: "risk objects are derived without authoritative same-study proof"
      },
      {
        area: "Atlas layers",
        classification: "FALLBACK",
        reason: "Atlas compatibility layers are not production GIS proof"
      }
    ],
    ...overrides
  };
}

function lineageReport(overrides = {}) {
  return {
    status: "DATA_LINEAGE_RECONCILED_WITH_PRODUCTION_BLOCKERS",
    decisions: {
      realDevActivationAllowed: true,
      realDevServerAllowed: true,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    inventory: [
      {
        surface: "parcel/property identity",
        frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts",
        apiRoute: "GET /county-study/studies/{studyId}/segments + segment detail routes",
        backendServiceOrController: "CountyStudySegmentDerivationService / CountyStudyInspectorService",
        dbTableOrView: "truth_pacs.parcel_spine + canonical_tf.tf_parcel",
        ownerLane: "Forge",
        classification: "SYNC_DERIVED",
        observedCount: 83682,
        joinKey: "countyId + taxYear + parcelId/APN",
        countyId: "19190019-1919-1919-1919-191919191919",
        taxYear: 2026,
        studyId: "runtime-selected-study",
        failureReason: "Canonical Benton count reconciliation remains incomplete.",
        requiredProofToUpgrade: "Compare sync-derived parcel identity counts to canonical Benton expected counts."
      },
      {
        surface: "valuation metrics",
        frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyCommandStrip.tsx",
        apiRoute: "GET /county-study/studies/{studyId}/statistics-compat + health-summary",
        backendServiceOrController: "CountyStudyHealthService / statistics compatibility API",
        dbTableOrView: "PACS valuation + comparable sales ratio-study population",
        ownerLane: "Forge",
        classification: "SYNC_DERIVED",
        observedCount: 83682,
        joinKey: "countyId + taxYear + studyId + parcelId + saleId",
        countyId: "19190019-1919-1919-1919-191919191919",
        taxYear: 2026,
        studyId: "runtime-selected-study",
        failureReason: "Production reconciliation remains incomplete.",
        requiredProofToUpgrade: "Directly recompute ratio metrics from source rows."
      },
      {
        surface: "risk objects",
        frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/components/RiskSurfaceCommandCenter.tsx",
        apiRoute: "GET /county-study/studies/{studyId}/health-summary",
        backendServiceOrController: "CountyStudyHealthService + risk surface derivation",
        dbTableOrView: "CountySegments / derived risk metrics",
        ownerLane: "Forge",
        classification: "GENERATED",
        observedCount: 688,
        joinKey: "studyId + segmentId + riskObjectId",
        countyId: "19190019-1919-1919-1919-191919191919",
        taxYear: 2026,
        studyId: "runtime-selected-study",
        failureReason: "Risk object same-study lineage is not production-proven.",
        requiredProofToUpgrade: "Prove risk objects from authoritative ratio/valuation rows."
      },
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
        failureReason: "Atlas layer provenance is compatibility/provisional.",
        requiredProofToUpgrade: "Replace compatibility proof with TerraAtlas-owned Benton layer contracts."
      }
    ],
    ...overrides
  };
}

function geometryEvidenceReport(overrides = {}) {
  return {
    status: "TERRAATLAS_GEOMETRY_EVIDENCE_AVAILABLE_NOT_WIRED",
    classification: "ATLAS_LAYER_AVAILABLE_NOT_WIRED",
    decisions: {
      realGeometryExists: true,
      countyStudioUsesRealTerraAtlasGeometry: false,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    geometryCounts: {
      parcelGeometry: 80075
    },
    finding: "TerraAtlas parcel geometry is available but County Studio is still wired through the compatibility map feed.",
    requiredProofToUpgrade:
      "Wire County Studio embedded map context to TerraAtlas-owned geometry/layer service or prove compatibility feed lineage.",
    ...overrides
  };
}

test("defines Forge real-data wiring surfaces without owner identity as Forge-dev required", () => {
  assert.deepEqual(REQUIRED_FORGE_WIRING_SURFACES, [
    "parcel/property identity source",
    "property characteristics source",
    "valuation metrics source",
    "ratio-study context source",
    "risk object source",
    "geometry/map context source",
    "countyId/taxYear/studyId propagation",
    "fallback/mock/generated path scan",
    "owner identity dependency scan"
  ]);
});

test("verifies core Forge valuation wiring while identifying generated and fallback gaps", () => {
  const report = buildCountyStudioForgeRealDataWiringReport({
    readinessReport: readinessReport(),
    activationReport: activationReport(),
    dataTruthReport: dataTruthReport(),
    lineageReport: lineageReport(),
    geometryEvidenceReport: geometryEvidenceReport(),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "FORGE_REAL_DATA_WIRING_VERIFIED_WITH_GAPS");
  assert.equal(report.decisions.realDevServerAllowed, true);
  assert.equal(report.decisions.realDevActivationAllowed, true);
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
  assert.equal(report.decisions.coreForgeValuationWiringReady, true);
  assert.equal(report.ownerIdentityDependency.requiredForCountyStudioForgeDev, false);
  assert.equal(report.ownerIdentityDependency.classification, "NOT_REQUIRED_FOR_FORGE_DEV");

  const parcel = report.surfaces.find((surface) => surface.surface === "parcel/property identity source");
  assert.equal(parcel.classification, "SYNC_DERIVED");
  assert.equal(parcel.status, "REAL_DEV_WIRED_PRODUCTION_BLOCKED");
  assert.equal(parcel.countyId, "19190019-1919-1919-1919-191919191919");
  assert.equal(parcel.taxYear, 2026);

  const characteristics = report.surfaces.find((surface) => surface.surface === "property characteristics source");
  assert.equal(characteristics.classification, "SYNC_DERIVED");
  assert.match(characteristics.dbTableOrView, /parcel_spine/i);

  const risk = report.surfaces.find((surface) => surface.surface === "risk object source");
  assert.equal(risk.classification, "GENERATED");
  assert.equal(risk.status, "WIRING_GAP_IDENTIFIED");

  const geometry = report.surfaces.find((surface) => surface.surface === "geometry/map context source");
  assert.equal(geometry.classification, "ATLAS_LAYER_AVAILABLE_NOT_WIRED");
  assert.equal(geometry.status, "WIRING_GAP_IDENTIFIED");
  assert.equal(geometry.observedCount, 80075);
  assert.match(geometry.failureReason, /available but County Studio is still wired/i);

  assert.ok(report.wiringGaps.some((gap) => gap.surface === "risk object source"));
  assert.ok(report.wiringGaps.some((gap) => gap.surface === "geometry/map context source"));
  assert.equal(report.mockFallbackGeneratedScan.disallowedVisibleHits.length, 1);
});

test("does not count sync-derived TerraAtlas geometry as a Forge-dev wiring gap", () => {
  const report = buildCountyStudioForgeRealDataWiringReport({
    readinessReport: readinessReport(),
    activationReport: activationReport(),
    dataTruthReport: dataTruthReport(),
    lineageReport: lineageReport(),
    geometryEvidenceReport: geometryEvidenceReport({
      status: "TERRAATLAS_GEOMETRY_EVIDENCE_REAL_DEV_WIRED",
      classification: "SYNC_DERIVED_GEOMETRY",
      decisions: {
        realGeometryExists: true,
        countyStudioUsesRealTerraAtlasGeometry: true,
        productionProofAllowed: false,
        operationalProofAllowed: false
      },
      sourcePath: {
        apiRoute: "fetchTerraAtlasParcelGeometryMapData -> GET /api/atlas-live/geometry/parcels",
        backendServiceOrController: "AtlasLiveGeometryController reads gis_tf.tf_parcel_geom",
        dbTableOrView: "gis_tf.tf_parcel_geom",
        joinKey: "countyId + parcelId/APN + layerId"
      },
      finding: "County Studio geometry/map context is wired to a real TerraAtlas sync-derived geometry path for real dev."
    }),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  const geometry = report.surfaces.find((surface) => surface.surface === "geometry/map context source");
  assert.equal(geometry.classification, "SYNC_DERIVED_GEOMETRY");
  assert.equal(geometry.status, "REAL_DEV_WIRED_PRODUCTION_BLOCKED");
  assert.match(geometry.apiRoute, /atlas-live\/geometry\/parcels/);
  assert.match(geometry.backendServiceOrController, /AtlasLiveGeometryController/);
  assert.ok(report.wiringGaps.some((gap) => gap.surface === "risk object source"));
  assert.ok(!report.wiringGaps.some((gap) => gap.surface === "geometry/map context source"));
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
});

test("blocks wiring verification when real dev activation is not ready", () => {
  const report = buildCountyStudioForgeRealDataWiringReport({
    readinessReport: readinessReport({
      status: "REAL_DEV_SERVER_BLOCKED",
      decisions: {
        realDevServerAllowed: false,
        productionProofAllowed: false,
        operationalProofAllowed: false
      }
    }),
    activationReport: activationReport({
      status: "REAL_DEV_ACTIVATION_BLOCKED",
      decisions: {
        realDevActivationAllowed: false,
        productionProofAllowed: false,
        operationalProofAllowed: false
      }
    }),
    dataTruthReport: dataTruthReport(),
    lineageReport: lineageReport(),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "FORGE_REAL_DATA_WIRING_BLOCKED");
  assert.equal(report.decisions.realDevServerAllowed, false);
  assert.equal(report.decisions.realDevActivationAllowed, false);
  assert.ok(report.blockers.some((blocker) => /real dev activation/i.test(blocker)));
});

test("CLI writes Forge real-data wiring JSON and markdown evidence", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-county-studio-forge-wiring-"));
  const readiness = path.join(tmp, "readiness.json");
  const activation = path.join(tmp, "activation.json");
  const dataTruth = path.join(tmp, "data-truth.json");
  const lineage = path.join(tmp, "lineage.json");
  const outJson = path.join(tmp, "wiring.json");
  const outMd = path.join(tmp, "wiring.md");

  fs.writeFileSync(readiness, `${JSON.stringify(readinessReport(), null, 2)}\n`);
  fs.writeFileSync(activation, `${JSON.stringify(activationReport(), null, 2)}\n`);
  fs.writeFileSync(dataTruth, `${JSON.stringify(dataTruthReport(), null, 2)}\n`);
  fs.writeFileSync(lineage, `${JSON.stringify(lineageReport(), null, 2)}\n`);
  const geometryEvidence = path.join(tmp, "geometry-evidence.json");
  fs.writeFileSync(geometryEvidence, `${JSON.stringify(geometryEvidenceReport(), null, 2)}\n`);

  const result = spawnSync(
    "node",
    [
      "os-platform/core/pilot/county-studio-forge-real-data-wiring.mjs",
      "--readiness",
      readiness,
      "--activation",
      activation,
      "--data-truth",
      dataTruth,
      "--lineage",
      lineage,
      "--geometry-evidence",
      geometryEvidence,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: repoRoot, encoding: "utf8" }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /FORGE_REAL_DATA_WIRING_VERIFIED_WITH_GAPS/);
  assert.ok(fs.existsSync(outJson));
  assert.ok(fs.existsSync(outMd));

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
  assert.match(markdown, /Owner Identity Dependency Scan/);
  assert.match(markdown, /productionProofAllowed=false/);
  assert.match(markdown, /operationalProofAllowed=false/);
});
