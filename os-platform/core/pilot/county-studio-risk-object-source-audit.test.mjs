#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  RISK_OBJECT_CLASSIFICATIONS,
  buildCountyStudioRiskObjectSourceAuditReport
} from "./county-studio-risk-object-source-audit.mjs";

const repoRoot = process.cwd();

function forgeWiringReport(overrides = {}) {
  return {
    status: "FORGE_REAL_DATA_WIRING_VERIFIED_WITH_GAPS",
    decisions: {
      realDevServerAllowed: true,
      realDevActivationAllowed: true,
      coreForgeValuationWiringReady: true,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    surfaces: [
      {
        surface: "parcel/property identity source",
        classification: "SYNC_DERIVED",
        observedCount: 3199335
      },
      {
        surface: "property characteristics source",
        classification: "SYNC_DERIVED",
        observedCount: 3199335
      },
      {
        surface: "valuation metrics source",
        classification: "SYNC_DERIVED",
        observedCount: 83682
      },
      {
        surface: "ratio-study context source",
        classification: "SYNC_DERIVED",
        observedCount: 83682
      },
      {
        surface: "geometry/map context source",
        classification: "SYNC_DERIVED_GEOMETRY",
        observedCount: 80075
      },
      {
        surface: "risk object source",
        sourceName: "County Studio risk objects",
        frontendFile: "frontend/apps/os-shell/src/pages/forge/county-studio/components/RiskSurfaceCommandCenter.tsx",
        apiRoute: "GET /county-study/studies/{studyId}/health-summary",
        backendServiceOrController: "CountyStudyHealthService + risk surface derivation",
        dbTableOrView: "CountySegments / derived risk metrics",
        ownerLane: "Forge",
        classification: "GENERATED",
        observedCount: 83682,
        joinKey: "studyId + segmentId + riskObjectId",
        countyId: "19190019-1919-1919-1919-191919191919",
        taxYear: 2026,
        studyId: "runtime-selected-study",
        failureReason: "risk objects are derived/presented by County Studio, but their authoritative source lineage and same-study binding are not proven.",
        requiredProofToUpgrade: "Prove risk objects are recomputed from authoritative ratio/valuation rows and align with map, ledger, and inspector in one study context."
      }
    ],
    ...overrides
  };
}

function deterministicSourceScan(overrides = {}) {
  return {
    frontendRiskSurfaceUsesSegments: true,
    frontendGroupsRiskRowsFromSegments: true,
    backendHealthUsesCountySegments: true,
    backendHealthComputesCompositeRisk: true,
    segmentDerivationUsesProperties: true,
    segmentDerivationUsesCamaCharacteristics: true,
    segmentDerivationUsesComparableSales: true,
    segmentDerivationUsesPacsValuation: true,
    persistedRiskObjectTableFound: false,
    mockOrFixtureRiskPathFound: false,
    fallbackRiskPathFound: false,
    generatedPlaceholderRiskPathFound: false,
    ...overrides
  };
}

test("defines risk object source classifications for the audit gate", () => {
  assert.deepEqual(RISK_OBJECT_CLASSIFICATIONS, [
    "GENERATED",
    "DEV_DERIVED_FROM_REAL_INPUTS",
    "SEEDED_RISK_OBJECTS",
    "SYNC_DERIVED_RISK_OBJECTS",
    "FALLBACK_RISK_OBJECTS",
    "UNKNOWN_RISK_OBJECTS"
  ]);
});

test("classifies generated risk rows as dev-derived only when deterministic real inputs are proven", () => {
  const report = buildCountyStudioRiskObjectSourceAuditReport({
    forgeWiringReport: forgeWiringReport(),
    sourceScan: deterministicSourceScan(),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "RISK_OBJECT_SOURCE_AUDITED_DEV_DERIVED");
  assert.equal(report.classification, "DEV_DERIVED_FROM_REAL_INPUTS");
  assert.equal(report.decisions.riskObjectsRequiredForForgeDev, true);
  assert.equal(report.decisions.riskObjectsRequiredForProductionProof, true);
  assert.equal(report.decisions.riskObjectsCanBeDevDerived, true);
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
  assert.equal(report.sourcePath.apiRoute, "GET /county-study/studies/{studyId}/health-summary");
  assert.match(report.sourcePath.backendServiceOrController, /CountyStudyHealthService/);
  assert.match(report.sourcePath.dbTableOrView, /CountySegments/);
  assert.ok(report.evidence.realInputSurfaces.every((surface) => surface.realDevReady === true));
  assert.match(report.requiredProofToUpgrade, /canonical Benton/i);
});

test("keeps risk source generated when source scan finds placeholders or unproven derivation", () => {
  const report = buildCountyStudioRiskObjectSourceAuditReport({
    forgeWiringReport: forgeWiringReport(),
    sourceScan: deterministicSourceScan({
      frontendGroupsRiskRowsFromSegments: false,
      backendHealthComputesCompositeRisk: false,
      generatedPlaceholderRiskPathFound: true
    }),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "RISK_OBJECT_SOURCE_AUDITED_GENERATED");
  assert.equal(report.classification, "GENERATED");
  assert.equal(report.decisions.riskObjectsCanBeDevDerived, false);
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
  assert.match(report.failureReason, /placeholder|deterministic/i);
});

test("classifies persisted risk object source when a concrete table or view is proven", () => {
  const report = buildCountyStudioRiskObjectSourceAuditReport({
    forgeWiringReport: forgeWiringReport({
      surfaces: [
        ...forgeWiringReport().surfaces.filter((surface) => surface.surface !== "risk object source"),
        {
          surface: "risk object source",
          apiRoute: "GET /county-study/studies/{studyId}/risk-objects",
          backendServiceOrController: "CountyStudyRiskObjectController",
          dbTableOrView: "forge_tf.county_studio_risk_objects",
          ownerLane: "Forge",
          classification: "SYNC_DERIVED",
          observedCount: 688,
          joinKey: "countyId + taxYear + studyId + riskObjectId"
        }
      ]
    }),
    sourceScan: deterministicSourceScan({
      persistedRiskObjectTableFound: true,
      persistedRiskObjectClassification: "SYNC_DERIVED_RISK_OBJECTS",
      persistedRiskObjectTable: "forge_tf.county_studio_risk_objects"
    }),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.classification, "SYNC_DERIVED_RISK_OBJECTS");
  assert.equal(report.status, "RISK_OBJECT_SOURCE_AUDITED_SYNC_DERIVED");
  assert.equal(report.sourcePath.dbTableOrView, "forge_tf.county_studio_risk_objects");
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
});

test("CLI writes risk object source audit JSON and markdown evidence", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-risk-object-audit-"));
  const forgeWiring = path.join(tmp, "forge-wiring.json");
  const sourceScan = path.join(tmp, "source-scan.json");
  const outJson = path.join(tmp, "risk-object-audit.json");
  const outMd = path.join(tmp, "risk-object-audit.md");

  fs.writeFileSync(forgeWiring, `${JSON.stringify(forgeWiringReport(), null, 2)}\n`);
  fs.writeFileSync(sourceScan, `${JSON.stringify(deterministicSourceScan(), null, 2)}\n`);

  const result = spawnSync(
    "node",
    [
      "os-platform/core/pilot/county-studio-risk-object-source-audit.mjs",
      "--forge-wiring",
      forgeWiring,
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
  assert.match(result.stdout, /RISK_OBJECT_SOURCE_AUDITED_DEV_DERIVED/);
  assert.ok(fs.existsSync(outJson));
  assert.ok(fs.existsSync(outMd));

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");
  assert.equal(report.classification, "DEV_DERIVED_FROM_REAL_INPUTS");
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
  assert.match(markdown, /Risk Object Source Derivation Audit/);
  assert.match(markdown, /productionProofAllowed=false/);
  assert.match(markdown, /operationalProofAllowed=false/);
});
