#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  DEV_READINESS_CLASSIFICATIONS,
  OWNER_SUPNUM_DEPENDENCY_CLASSIFICATIONS,
  REQUIRED_READINESS_CHECKS,
  buildBentonRealDevServerReadinessReport
} from "./benton-real-dev-server-readiness.mjs";

const repoRoot = process.cwd();

function partialRealSeedEvidence() {
  return {
    backendHealth: { status: "healthy", source: "runtime probe" },
    activeDrain: { pid: 28503, alive: true, status: "IN_PROGRESS" },
    loadBatch: { stage: "Supp-S1", status: "IN_PROGRESS", insertedRows: 29000 },
    counts: {
      landingTables: {
        property: 80075,
        owner: 805000,
        propSuppAssoc: 780000,
        washPropOwnerVal: 760000
      },
      truthTables: {
        parcel: 80075,
        owner: 735000,
        wsdor: 720000
      },
      canonical: {
        parcel: 80075,
        account: 80075
      }
    },
    countyStudioDependencies: {
      map: "PARTIAL_SEEDED",
      ledger: "SYNC_DERIVED",
      inspector: "SYNC_DERIVED"
    },
    blockers: []
  };
}

test("defines the staged real-dev readiness classifications and checks", () => {
  assert.deepEqual(DEV_READINESS_CLASSIFICATIONS, [
    "AUTHORITATIVE",
    "SYNC_DERIVED",
    "SEEDED",
    "PARTIAL_SEEDED",
    "MOCK",
    "FIXTURE",
    "GENERATED",
    "FALLBACK",
    "UNKNOWN"
  ]);

  assert.deepEqual(OWNER_SUPNUM_DEPENDENCY_CLASSIFICATIONS, [
    "REQUIRED_FOR_FORGE_DEV",
    "NOT_REQUIRED_FOR_FORGE_DEV",
    "REQUIRED_FOR_PACKET_PROOF",
    "REQUIRED_FOR_OPERATIONAL_PROOF",
    "UNKNOWN"
  ]);

  assert.deepEqual(REQUIRED_READINESS_CHECKS, [
    "backend health",
    "active drain process state",
    "load_batch current stage",
    "landing table counts",
    "truth table counts",
    "canonical parcel counts",
    "owner truth count",
    "account count",
    "supp association count",
    "property landing count",
    "WPOV status",
    "WSDOR status",
    "owner-supnum backfill dependency classification",
    "map data dependency status",
    "ledger data dependency status",
    "inspector data dependency status"
  ]);
});

test("allows real dev server only for enough real seeded or sync-derived data", () => {
  const report = buildBentonRealDevServerReadinessReport({
    evidence: partialRealSeedEvidence(),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "REAL_DEV_DATA_AVAILABLE");
  assert.equal(report.decisions.realDevServerAllowed, true);
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
  assert.equal(report.maturity.SYNC_DERIVED_PARTIAL, true);
  assert.equal(report.maturity.SYNC_DERIVED_COMPLETE, false);
  assert.equal(report.maturity.AUTHORITATIVE_RECONCILED, false);
  assert.equal(report.maturity.PRODUCTION_PROOF_ALLOWED, false);
});

test("blocks real dev server when evidence is missing or fake-classified", () => {
  const report = buildBentonRealDevServerReadinessReport({
    evidence: {
      backendHealth: { status: "healthy" },
      activeDrain: { alive: false },
      loadBatch: { status: "UNKNOWN" },
      counts: {
        landingTables: { property: 0 },
        truthTables: { owner: 0 },
        canonical: { parcel: 0, account: 0 }
      },
      countyStudioDependencies: {
        map: "FALLBACK",
        ledger: "GENERATED",
        inspector: "UNKNOWN"
      }
    },
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "REAL_DEV_SERVER_BLOCKED");
  assert.equal(report.decisions.realDevServerAllowed, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("map")));
  assert.ok(report.blockers.some((blocker) => blocker.includes("canonical parcel")));
});

test("does not block real dev readiness solely because the client drain PID is gone when DB load_batch proves state", () => {
  const evidence = partialRealSeedEvidence();
  evidence.activeDrain = { pid: 28503, alive: false, status: "NOT_RUNNING" };
  evidence.loadBatch = {
    stage: "owner-supnum-backfill",
    status: "IN_PROGRESS",
    loadBatchId: "batch-1"
  };

  const report = buildBentonRealDevServerReadinessReport({
    evidence,
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  const drainCheck = report.checks.find((check) => check.name === "active drain process state");
  assert.equal(drainCheck.passed, true);
  assert.equal(report.decisions.realDevServerAllowed, true);
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
});

test("does not block Forge dev when owner-supnum backfill failed but owner identity is not consumed", () => {
  const evidence = partialRealSeedEvidence();
  evidence.activeDrain = { pid: null, alive: null, status: "UNKNOWN" };
  evidence.loadBatch = {
    stage: "owner-supnum-backfill",
    status: "FAILED",
    loadBatchId: "batch-owner-supnum-failed"
  };
  evidence.countyStudioDependencies.ownerSupnumBackfill = {
    status: "FAILED",
    classification: "NOT_REQUIRED_FOR_FORGE_DEV",
    requiredForCountyStudioForgeDev: false,
    requiredForPacketProof: true,
    requiredForOperationalProof: true,
    ownerIdentityConsumedByForgeSurfaces: false
  };

  const report = buildBentonRealDevServerReadinessReport({
    evidence,
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "REAL_DEV_DATA_AVAILABLE");
  assert.equal(report.decisions.realDevServerAllowed, true);
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
  assert.equal(report.forgeDevDependency.ownerSupnumBackfill.status, "FAILED");
  assert.equal(report.forgeDevDependency.ownerSupnumBackfill.requiredForCountyStudioForgeDev, false);
  assert.equal(report.forgeDevDependency.ownerSupnumBackfill.requiredForPacketProof, true);
  assert.equal(report.forgeDevDependency.ownerSupnumBackfill.requiredForOperationalProof, true);
  assert.equal(report.blockers.some((blocker) => /owner-supnum|load_batch|drain process/i.test(blocker)), false);
});

test("does not block Forge dev when owner-supnum resume failed but owner identity is not consumed", () => {
  const evidence = partialRealSeedEvidence();
  evidence.activeDrain = { pid: null, alive: null, status: "UNKNOWN" };
  evidence.loadBatch = {
    stage: "owner-supnum-resume",
    status: "FAILED",
    loadBatchId: "batch-owner-supnum-resume-failed"
  };
  evidence.countyStudioDependencies.ownerSupnumBackfill = {
    status: "FAILED",
    stage: "owner-supnum-resume",
    classification: "NOT_REQUIRED_FOR_FORGE_DEV",
    requiredForCountyStudioForgeDev: false,
    requiredForPacketProof: true,
    requiredForOperationalProof: true,
    ownerIdentityConsumedByForgeSurfaces: false
  };

  const report = buildBentonRealDevServerReadinessReport({
    evidence,
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "REAL_DEV_DATA_AVAILABLE");
  assert.equal(report.decisions.realDevServerAllowed, true);
  assert.equal(report.forgeDevDependency.ownerSupnumBackfill.status, "FAILED");
  assert.equal(report.forgeDevDependency.ownerSupnumBackfill.classification, "NOT_REQUIRED_FOR_FORGE_DEV");
  assert.equal(report.forgeDevDependency.ownerSupnumBackfill.requiredForCountyStudioForgeDev, false);
  assert.equal(report.blockers.some((blocker) => /owner-supnum|load_batch|drain process/i.test(blocker)), false);
});

test("blocks Forge dev when owner-supnum backfill is required by a consumed owner identity surface", () => {
  const evidence = partialRealSeedEvidence();
  evidence.activeDrain = { pid: null, alive: null, status: "UNKNOWN" };
  evidence.loadBatch = {
    stage: "owner-supnum-backfill",
    status: "FAILED",
    loadBatchId: "batch-owner-supnum-failed"
  };
  evidence.countyStudioDependencies.ownerSupnumBackfill = {
    status: "FAILED",
    classification: "REQUIRED_FOR_FORGE_DEV",
    requiredForCountyStudioForgeDev: true,
    requiredForPacketProof: true,
    requiredForOperationalProof: true,
    ownerIdentityConsumedByForgeSurfaces: true,
    consumedSurfaces: ["parcel owner inspector"]
  };

  const report = buildBentonRealDevServerReadinessReport({
    evidence,
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "REAL_DEV_SERVER_BLOCKED");
  assert.equal(report.decisions.realDevServerAllowed, false);
  assert.ok(report.blockers.some((blocker) => /owner-supnum/i.test(blocker)));
});

test("CLI writes readiness evidence and exits zero for conditional real dev state", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-benton-real-dev-"));
  const source = path.join(tmp, "source.json");
  const outJson = path.join(tmp, "readiness.json");
  const outMd = path.join(tmp, "readiness.md");
  fs.writeFileSync(source, `${JSON.stringify(partialRealSeedEvidence(), null, 2)}\n`);

  const result = spawnSync(
    "node",
    [
      "os-platform/core/pilot/benton-real-dev-server-readiness.mjs",
      "--source",
      source,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: repoRoot, encoding: "utf8" }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /REAL_DEV_DATA_AVAILABLE/);
  assert.ok(fs.existsSync(outJson));
  assert.ok(fs.existsSync(outMd));

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");
  assert.equal(report.decisions.realDevServerAllowed, true);
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.match(markdown, /Production Proof: BLOCKED/);
  assert.match(markdown, /Real Dev Server: ALLOWED/);
});
