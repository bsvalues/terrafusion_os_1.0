#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  REQUIRED_FORGE_DEV_PREFLIGHT_CHAIN,
  buildCountyStudioR1ForgeDevStatusReport
} from "./county-studio-r1-forge-dev-status.mjs";

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
        classification: "NOT_REQUIRED_FOR_FORGE_DEV",
        requiredForCountyStudioForgeDev: false,
        requiredForPacketProof: true,
        requiredForOperationalProof: true,
        ownerIdentityConsumedByForgeSurfaces: false,
        latestFailed: {
          stage: "owner-supnum-resume",
          status: "FAILED"
        }
      },
      exemptionFactSeal: {
        stage: "exemption-fact-seal",
        status: "FAILED",
        classification: "NOT_REQUIRED_FOR_FORGE_DEV",
        requiredForCountyStudioForgeDev: false,
        requiredForProductionProof: true,
        requiredForPacketProof: true,
        requiredForOperationalProof: true,
        exemptionFactsConsumedByForgeSurfaces: false,
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
    dataTruthPosture: {
      status: "DATA_TRUTH_FAIL",
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    forgeDevDependency: readinessReport().forgeDevDependency,
    ...overrides
  };
}

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
    geometryEvidencePosture: {
      status: "TERRAATLAS_GIS_TRUTH_PARTIAL",
      classification: "PARTIAL_GIS_TRUTH",
      parcelGeometryStatus: "SYNC_DERIVED_PARCEL_GEOMETRY",
      fullGisLayerTruthStatus: "GIS_LAYER_TRUTH_NOT_PROVEN",
      mapOverlayStatus: "FALLBACK_MAP_OVERLAY",
      riskOverlayAnchoring: "NOT_GIS_ANCHORED",
      realGeometryExists: true,
      countyStudioUsesRealParcelGeometry: true,
      countyStudioUsesRealTerraAtlasGeometry: false
    },
    ownerIdentityDependency: {
      classification: "NOT_REQUIRED_FOR_FORGE_DEV",
      requiredForForgeDev: false,
      requiredForPacketProof: true,
      requiredForOperationalProof: true,
      ownerSupnumBackfillStatus: "IN_PROGRESS",
      ownerSupnumBackfillLatestFailedStatus: "FAILED"
    },
    wiringGaps: [
      {
        surface: "risk object source",
        classification: "GENERATED"
      }
    ],
    ...overrides
  };
}

function geometryReport(overrides = {}) {
  return {
    status: "TERRAATLAS_GIS_TRUTH_PARTIAL",
    classification: "PARTIAL_GIS_TRUTH",
    parcelGeometryStatus: "SYNC_DERIVED_PARCEL_GEOMETRY",
    fullGisLayerTruthStatus: "GIS_LAYER_TRUTH_NOT_PROVEN",
    mapOverlayStatus: "FALLBACK_MAP_OVERLAY",
    riskOverlayAnchoring: "NOT_GIS_ANCHORED",
    decisions: {
      realGeometryExists: true,
      countyStudioUsesRealParcelGeometry: true,
      countyStudioUsesRealTerraAtlasGeometry: false,
      countyStudioUsesFullTerraAtlasGisLayerTruth: false,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    ...overrides
  };
}

function riskAuditReport(overrides = {}) {
  return {
    status: "RISK_OBJECT_SOURCE_AUDITED_DEV_DERIVED",
    classification: "DEV_DERIVED_FROM_REAL_INPUTS",
    decisions: {
      riskObjectsRequiredForForgeDev: true,
      riskObjectsRequiredForProductionProof: true,
      riskObjectsCanBeDevDerived: true,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    ...overrides
  };
}

test("defines the required County Studio Forge-dev preflight chain", () => {
  assert.deepEqual(REQUIRED_FORGE_DEV_PREFLIGHT_CHAIN, [
    "pnpm run proof:county-studio:real-dev-backend-health",
    "pnpm run proof:county-studio:benton-real-dev-server-readiness:db",
    "pnpm run proof:county-studio:real-dev-activation",
    "pnpm run proof:county-studio:forge-real-data-wiring",
    "pnpm run proof:county-studio:risk-object-source-audit"
  ]);
});

test("summarizes County Studio R1 as real Benton Forge dev while blocking production and operational proof", () => {
  const report = buildCountyStudioR1ForgeDevStatusReport({
    readinessReport: readinessReport(),
    activationReport: activationReport(),
    forgeWiringReport: forgeWiringReport(),
    geometryReport: geometryReport(),
    riskAuditReport: riskAuditReport(),
    generatedAtUtc: "2026-06-07T00:00:00.000Z"
  });

  assert.equal(report.status, "COUNTY_STUDIO_R1_FORGE_DEV_READY");
  assert.equal(report.summary.forgeDevAllowed, true);
  assert.equal(report.summary.realDevActivationAllowed, true);
  assert.equal(report.summary.productionProofAllowed, false);
  assert.equal(report.summary.operationalProofAllowed, false);
  assert.equal(report.summary.dataTruthStatus, "DATA_TRUTH_FAIL");
  assert.equal(report.summary.geometryStatus, "PARTIAL_GIS_TRUTH");
  assert.equal(report.summary.parcelGeometryStatus, "SYNC_DERIVED_PARCEL_GEOMETRY");
  assert.equal(report.summary.fullGisLayerTruthStatus, "GIS_LAYER_TRUTH_NOT_PROVEN");
  assert.equal(report.summary.mapOverlayStatus, "FALLBACK_MAP_OVERLAY");
  assert.equal(report.summary.riskOverlayAnchoring, "NOT_GIS_ANCHORED");
  assert.equal(report.summary.riskObjectStatus, "DEV_DERIVED_FROM_REAL_INPUTS");
  assert.equal(report.summary.ownerSupnumStatus, "NOT_REQUIRED_FOR_FORGE_DEV");
  assert.equal(report.summary.exemptionFactStatus, "NOT_REQUIRED_FOR_FORGE_DEV");
  assert.equal(report.summary.exemptionFactRequiredForForgeDev, false);
  assert.equal(report.summary.exemptionFactRequiredForProductionProof, true);
  assert.equal(report.summary.exemptionFactRequiredForOperationalProof, true);
  assert.equal(report.summary.countyStudioMode, "REAL_BENTON_FORGE_DEV");
  assert.equal(report.summary.requiredRunCommand, "pnpm run dev:county-studio:real-benton");
  assert.ok(report.remainingProductionBlockers.some((item) => /canonical Benton/i.test(item)));
  assert.ok(report.remainingOperationalBlockers.some((item) => /Owner-supnum/i.test(item)));
  assert.match(report.runbook.notProductionProof, /not production proof/i);
  assert.match(report.runbook.notOperationalProof, /not operational proof/i);
});

test("blocks consolidated Forge-dev status when real dev activation is not ready", () => {
  const report = buildCountyStudioR1ForgeDevStatusReport({
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
    forgeWiringReport: forgeWiringReport(),
    geometryReport: geometryReport(),
    riskAuditReport: riskAuditReport(),
    generatedAtUtc: "2026-06-07T00:00:00.000Z"
  });

  assert.equal(report.status, "COUNTY_STUDIO_R1_FORGE_DEV_BLOCKED");
  assert.equal(report.summary.forgeDevAllowed, false);
  assert.ok(report.blockers.some((item) => /real dev server/i.test(item)));
  assert.ok(report.blockers.some((item) => /activation/i.test(item)));
  assert.equal(report.summary.productionProofAllowed, false);
  assert.equal(report.summary.operationalProofAllowed, false);
});

test("keeps production and operational proof false even if an upstream artifact tries to promote them", () => {
  const report = buildCountyStudioR1ForgeDevStatusReport({
    readinessReport: readinessReport({
      decisions: {
        realDevServerAllowed: true,
        productionProofAllowed: true,
        operationalProofAllowed: true
      }
    }),
    activationReport: activationReport({
      decisions: {
        realDevActivationAllowed: true,
        productionProofAllowed: true,
        operationalProofAllowed: true
      }
    }),
    forgeWiringReport: forgeWiringReport(),
    geometryReport: geometryReport(),
    riskAuditReport: riskAuditReport(),
    generatedAtUtc: "2026-06-07T00:00:00.000Z"
  });

  assert.equal(report.summary.productionProofAllowed, false);
  assert.equal(report.summary.operationalProofAllowed, false);
  assert.ok(report.boundaries.some((item) => /does not set productionProofAllowed=true/i.test(item)));
});

test("CLI writes consolidated Forge-dev status JSON and markdown runbook", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-r1-forge-dev-status-"));
  const readiness = path.join(tmp, "readiness.json");
  const activation = path.join(tmp, "activation.json");
  const forgeWiring = path.join(tmp, "forge-wiring.json");
  const geometry = path.join(tmp, "geometry.json");
  const riskAudit = path.join(tmp, "risk-audit.json");
  const outJson = path.join(tmp, "status.json");
  const outMd = path.join(tmp, "status.md");

  fs.writeFileSync(readiness, `${JSON.stringify(readinessReport(), null, 2)}\n`);
  fs.writeFileSync(activation, `${JSON.stringify(activationReport(), null, 2)}\n`);
  fs.writeFileSync(forgeWiring, `${JSON.stringify(forgeWiringReport(), null, 2)}\n`);
  fs.writeFileSync(geometry, `${JSON.stringify(geometryReport(), null, 2)}\n`);
  fs.writeFileSync(riskAudit, `${JSON.stringify(riskAuditReport(), null, 2)}\n`);

  const result = spawnSync(
    "node",
    [
      "os-platform/core/pilot/county-studio-r1-forge-dev-status.mjs",
      "--readiness",
      readiness,
      "--activation",
      activation,
      "--forge-wiring",
      forgeWiring,
      "--geometry",
      geometry,
      "--risk-audit",
      riskAudit,
      "--no-refresh-readiness",
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: repoRoot, encoding: "utf8" }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /COUNTY_STUDIO_R1_FORGE_DEV_READY/);
  assert.ok(fs.existsSync(outJson));
  assert.ok(fs.existsSync(outMd));

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");
  assert.equal(report.summary.countyStudioMode, "REAL_BENTON_FORGE_DEV");
  assert.equal(report.summary.productionProofAllowed, false);
  assert.equal(report.summary.operationalProofAllowed, false);
  assert.match(markdown, /pnpm run dev:county-studio:real-benton/);
  assert.match(markdown, /This is not production proof/);
  assert.match(markdown, /This is not operational proof/);
});

test("CLI refreshes live readiness before status so stale ready evidence cannot override blocked runtime evidence", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-r1-forge-dev-live-status-"));
  const readiness = path.join(tmp, "readiness.json");
  const activation = path.join(tmp, "activation.json");
  const forgeWiring = path.join(tmp, "forge-wiring.json");
  const geometry = path.join(tmp, "geometry.json");
  const riskAudit = path.join(tmp, "risk-audit.json");
  const refreshScript = path.join(tmp, "refresh-readiness.mjs");
  const outJson = path.join(tmp, "status.json");
  const outMd = path.join(tmp, "status.md");

  fs.writeFileSync(readiness, `${JSON.stringify(readinessReport(), null, 2)}\n`);
  fs.writeFileSync(activation, `${JSON.stringify(activationReport(), null, 2)}\n`);
  fs.writeFileSync(forgeWiring, `${JSON.stringify(forgeWiringReport(), null, 2)}\n`);
  fs.writeFileSync(geometry, `${JSON.stringify(geometryReport(), null, 2)}\n`);
  fs.writeFileSync(riskAudit, `${JSON.stringify(riskAuditReport(), null, 2)}\n`);
  fs.writeFileSync(
    refreshScript,
    `
      import fs from 'node:fs';
      const readinessPath = process.argv[2];
      const blocked = {
        status: 'REAL_DEV_SERVER_BLOCKED',
        decisions: {
          realDevServerAllowed: false,
          productionProofAllowed: false,
          operationalProofAllowed: false
        },
        forgeDevDependency: ${JSON.stringify(readinessReport().forgeDevDependency)},
        blockers: ['live DB counts are UNKNOWN/zero']
      };
      fs.writeFileSync(readinessPath, JSON.stringify(blocked, null, 2) + '\\n');
      process.exit(1);
    `
  );

  const result = spawnSync(
    "node",
    [
      "os-platform/core/pilot/county-studio-r1-forge-dev-status.mjs",
      "--readiness",
      readiness,
      "--activation",
      activation,
      "--forge-wiring",
      forgeWiring,
      "--geometry",
      geometry,
      "--risk-audit",
      riskAudit,
      "--refresh-readiness-command",
      `${JSON.stringify(process.execPath)} ${JSON.stringify(refreshScript)} ${JSON.stringify(readiness)}`,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: repoRoot, encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /COUNTY_STUDIO_R1_FORGE_DEV_BLOCKED/);

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(report.status, "COUNTY_STUDIO_R1_FORGE_DEV_BLOCKED");
  assert.equal(report.summary.forgeDevAllowed, false);
  assert.equal(report.summary.countyStudioMode, "FORGE_DEV_BLOCKED");
  assert.equal(report.liveReadinessRefresh.attempted, true);
  assert.equal(report.liveReadinessRefresh.exitCode, 1);
  assert.match(report.liveReadinessRefresh.interpretation, /Live readiness refresh failed/i);
  assert.ok(report.blockers.some((item) => /real dev server evidence/i.test(item)));
  assert.equal(report.summary.productionProofAllowed, false);
  assert.equal(report.summary.operationalProofAllowed, false);
});
