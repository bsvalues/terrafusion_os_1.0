#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  REQUIRED_RECONCILIATION_SURFACES,
  buildCountyStudioR1DataLineageReconciliationReport
} from "./county-studio-r1-data-lineage-reconciliation.mjs";

const repoRoot = process.cwd();

function readinessReport(overrides = {}) {
  return {
    status: "REAL_DEV_DATA_AVAILABLE",
    decisions: {
      realDevServerAllowed: true,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    checks: [
      {
        name: "landing table counts",
        classification: "PARTIAL_SEEDED",
        passed: true,
        evidence: {
          propertyLanding: 999214,
          ownerLanding: 7396857,
          suppAssociation: 2731351,
          wpov: 1273143,
          truthParcel: 83682,
          truthOwner: 774760,
          truthWsdor: 774696,
          canonicalParcel: 3199335,
          account: 425186
        }
      },
      {
        name: "canonical parcel counts",
        classification: "SEEDED",
        passed: true,
        evidence: { canonicalParcel: 3199335 }
      },
      {
        name: "map data dependency status",
        classification: "PARTIAL_SEEDED",
        passed: true,
        evidence: { classification: "PARTIAL_SEEDED" }
      },
      {
        name: "ledger data dependency status",
        classification: "SYNC_DERIVED",
        passed: true,
        evidence: { classification: "SYNC_DERIVED" }
      },
      {
        name: "inspector data dependency status",
        classification: "SYNC_DERIVED",
        passed: true,
        evidence: { classification: "SYNC_DERIVED" }
      }
    ],
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
        productionProofAllowed: false,
        reason: "canonical service/table paths exist, but canonical Benton source/count manifest is missing"
      },
      {
        area: "parcel geometry source",
        classification: "FALLBACK",
        productionProofAllowed: false,
        reason: "compatibility/provisional geometry cannot satisfy TerraAtlas-owned GIS proof"
      },
      {
        area: "risk objects",
        classification: "GENERATED",
        productionProofAllowed: false,
        reason: "risk object authoritative source lineage and same-study binding are not proven"
      },
      {
        area: "ledger rows",
        classification: "GENERATED",
        productionProofAllowed: false,
        reason: "ledger rows are derived without authoritative same-study proof"
      },
      {
        area: "inspector details",
        classification: "GENERATED",
        productionProofAllowed: false,
        reason: "inspector details are derived without authoritative same-study proof"
      },
      {
        area: "Atlas layers",
        classification: "FALLBACK",
        productionProofAllowed: false,
        reason: "Atlas layer provenance is compatibility/provisional"
      }
    ],
    failures: [
      "parcel geometry source: compatibility/provisional geometry cannot satisfy TerraAtlas-owned GIS proof",
      "risk objects: risk object authoritative source lineage and same-study binding are not proven"
    ],
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

function syncEvidenceReport(overrides = {}) {
  return {
    counts: {
      gis: { parcelGeometry: 80075 },
      canonical: { owner: 215009, wsdor: 686820 }
    },
    queryResults: {
      gisParcelGeometry: 80075,
      canonicalOwner: 215009,
      canonicalWsdor: 686820
    },
    ...overrides
  };
}

test("defines the required County Studio data lineage reconciliation surfaces", () => {
  assert.deepEqual(REQUIRED_RECONCILIATION_SURFACES, [
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
  ]);
});

test("reconciles real-dev available data without promoting production or operational proof", () => {
  const report = buildCountyStudioR1DataLineageReconciliationReport({
    readinessReport: readinessReport(),
    dataTruthReport: dataTruthReport(),
    activationReport: activationReport(),
    syncEvidenceReport: syncEvidenceReport(),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "DATA_LINEAGE_RECONCILED_WITH_PRODUCTION_BLOCKERS");
  assert.equal(report.decisions.realDevActivationAllowed, true);
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
  assert.equal(report.inventory.length, REQUIRED_RECONCILIATION_SURFACES.length);
  assert.ok(report.summary.realEnoughForDev.some((item) => /parcel/i.test(item)));
  assert.ok(report.summary.blockedForProduction.some((item) => /geometry/i.test(item)));
  assert.equal(report.topDataTruthBlockers.length, 5);

  const map = report.inventory.find((item) => item.surface === "map");
  assert.equal(map.classification, "PARTIAL_SEEDED");
  assert.equal(map.productionProofAllowed, false);
  assert.equal(map.ownerLane, "Forge");
  assert.match(map.requiredProofToUpgrade, /TerraAtlas-owned Benton geometry/i);

  const geometry = report.inventory.find((item) => item.surface === "geometry/layers");
  assert.equal(geometry.classification, "FALLBACK");
  assert.equal(geometry.ownerLane, "Atlas");
  assert.equal(geometry.observedCount, 80075);
  assert.match(geometry.failureReason, /compatibility/i);
});

test("blocks reconciliation when real-dev activation is not ready", () => {
  const report = buildCountyStudioR1DataLineageReconciliationReport({
    readinessReport: readinessReport({
      status: "REAL_DEV_SERVER_BLOCKED",
      decisions: {
        realDevServerAllowed: false,
        productionProofAllowed: false,
        operationalProofAllowed: false
      }
    }),
    dataTruthReport: dataTruthReport(),
    activationReport: activationReport({
      status: "REAL_DEV_ACTIVATION_BLOCKED",
      decisions: {
        realDevActivationAllowed: false,
        productionProofAllowed: false,
        operationalProofAllowed: false
      }
    }),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "DATA_LINEAGE_RECONCILIATION_BLOCKED");
  assert.equal(report.decisions.realDevActivationAllowed, false);
  assert.ok(report.blockers.some((blocker) => /real dev activation/i.test(blocker)));
});

test("CLI writes reconciliation JSON and markdown evidence", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-county-studio-lineage-"));
  const readiness = path.join(tmp, "readiness.json");
  const dataTruth = path.join(tmp, "data-truth.json");
  const activation = path.join(tmp, "activation.json");
  const outJson = path.join(tmp, "lineage.json");
  const outMd = path.join(tmp, "lineage.md");

  fs.writeFileSync(readiness, `${JSON.stringify(readinessReport(), null, 2)}\n`);
  fs.writeFileSync(dataTruth, `${JSON.stringify(dataTruthReport(), null, 2)}\n`);
  fs.writeFileSync(activation, `${JSON.stringify(activationReport(), null, 2)}\n`);

  const result = spawnSync(
    "node",
    [
      "os-platform/core/pilot/county-studio-r1-data-lineage-reconciliation.mjs",
      "--readiness",
      readiness,
      "--data-truth",
      dataTruth,
      "--activation",
      activation,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: repoRoot, encoding: "utf8" }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /DATA_LINEAGE_RECONCILED_WITH_PRODUCTION_BLOCKERS/);
  assert.ok(fs.existsSync(outJson));
  assert.ok(fs.existsSync(outMd));

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
  assert.match(markdown, /Top 5 Data Truth Blockers/);
  assert.match(markdown, /productionProofAllowed=false/);
  assert.match(markdown, /operationalProofAllowed=false/);
});
