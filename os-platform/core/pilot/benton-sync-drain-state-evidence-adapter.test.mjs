#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  DB_COUNT_QUERIES,
  LATEST_LOAD_BATCH_QUERY,
  LATEST_OWNER_SUPNUM_FAILURE_QUERY,
  buildBentonSyncDrainStateEvidence,
  evidenceToReadinessSource,
  makeRuntimeDbQueryRunner
} from "./benton-sync-drain-state-evidence-adapter.mjs";

const repoRoot = process.cwd();

test("defines read-only DB count queries required by the readiness gate", () => {
  assert.deepEqual(Object.keys(DB_COUNT_QUERIES), [
    "legacyProperty",
    "legacyOwner",
    "legacyPropSuppAssoc",
    "legacyWashPropOwnerVal",
    "legacyAccount",
    "truthParcel",
    "truthOwner",
    "truthWsdor",
    "canonicalParcel",
    "canonicalOwner",
    "canonicalWsdor",
    "gisParcelGeometry"
  ]);
});

test("classifies populated Sync/DB evidence as partial real seed without production proof", async () => {
  const queryValues = {
    latestLoadBatch: {
      load_batch_id: "batch-1",
      stage: "Supp-S1",
      status: "IN_PROGRESS"
    },
    latestOwnerSupnumFailure: {
      loadBatchId: "batch-owner-failed",
      stage: "owner-supnum-backfill",
      status: "FAILED"
    },
    legacyProperty: 80075,
    legacyOwner: 805000,
    legacyPropSuppAssoc: 780000,
    legacyWashPropOwnerVal: 760000,
    legacyAccount: 80075,
    truthParcel: 80075,
    truthOwner: 735000,
    truthWsdor: 720000,
    canonicalParcel: 80075,
    canonicalOwner: 735000,
    canonicalWsdor: 710000,
    gisParcelGeometry: 80075
  };

  const evidence = await buildBentonSyncDrainStateEvidence({
    drainPid: 28503,
    probeBackendHealth: async () => ({ status: "healthy", ok: true }),
    processAlive: () => true,
    query: async (name) => queryValues[name]
  });

  assert.equal(evidence.backendHealth.status, "healthy");
  assert.equal(evidence.activeDrain.alive, true);
  assert.equal(evidence.loadBatch.stage, "Supp-S1");
  assert.equal(evidence.counts.landingTables.property, 80075);
  assert.equal(evidence.counts.truthTables.owner, 735000);
  assert.equal(evidence.counts.canonical.parcel, 80075);
  assert.equal(evidence.counts.gis.parcelGeometry, 80075);
  assert.equal(evidence.countyStudioDependencies.map, "PARTIAL_SEEDED");
  assert.equal(evidence.countyStudioDependencies.ledger, "SYNC_DERIVED");
  assert.equal(evidence.countyStudioDependencies.inspector, "SYNC_DERIVED");
  assert.equal(evidence.countyStudioDependencies.ownerSupnumBackfill.classification, "NOT_REQUIRED_FOR_FORGE_DEV");
  assert.equal(evidence.countyStudioDependencies.ownerSupnumBackfill.latestFailed.status, "FAILED");
  assert.equal(evidence.countyStudioDependencies.ownerSupnumBackfill.requiredForPacketProof, true);
  assert.equal(evidence.countyStudioDependencies.exemptionFactSeal.classification, "UNKNOWN");
  assert.equal(evidence.countyStudioDependencies.exemptionFactSeal.requiredForCountyStudioForgeDev, false);
  assert.equal(evidence.decisions.productionProofAllowed, false);
  assert.equal(evidence.decisions.operationalProofAllowed, false);
});

test("classifies exemption fact seal failure as not required for Forge dev", async () => {
  const queryValues = {
    latestLoadBatch: {
      loadBatchId: "batch-exemption-failed",
      stage: "exemption-fact-seal",
      status: "FAILED"
    },
    latestOwnerSupnumFailure: {
      loadBatchId: "batch-owner-failed",
      stage: "owner-supnum-resume",
      status: "FAILED"
    },
    legacyProperty: 1190834,
    legacyOwner: 8213706,
    legacyPropSuppAssoc: 4382985,
    legacyWashPropOwnerVal: 1707143,
    legacyAccount: 535140,
    truthParcel: 83326,
    truthOwner: 816849,
    truthWsdor: 774696,
    canonicalParcel: 3198979,
    canonicalOwner: 312532,
    canonicalWsdor: 686820,
    gisParcelGeometry: 80075
  };

  const evidence = await buildBentonSyncDrainStateEvidence({
    probeBackendHealth: async () => ({ status: "healthy", ok: true }),
    processAlive: () => null,
    query: async (name) => queryValues[name]
  });

  assert.equal(evidence.loadBatch.stage, "exemption-fact-seal");
  assert.equal(evidence.loadBatch.status, "FAILED");
  assert.equal(evidence.countyStudioDependencies.ownerSupnumBackfill.stage, "owner-supnum-resume");
  assert.equal(evidence.countyStudioDependencies.ownerSupnumBackfill.status, "FAILED");
  assert.equal(evidence.countyStudioDependencies.exemptionFactSeal.status, "FAILED");
  assert.equal(evidence.countyStudioDependencies.exemptionFactSeal.classification, "NOT_REQUIRED_FOR_FORGE_DEV");
  assert.equal(evidence.countyStudioDependencies.exemptionFactSeal.requiredForCountyStudioForgeDev, false);
  assert.equal(evidence.countyStudioDependencies.exemptionFactSeal.requiredForProductionProof, true);
  assert.equal(evidence.countyStudioDependencies.exemptionFactSeal.requiredForPacketProof, true);
  assert.equal(evidence.countyStudioDependencies.exemptionFactSeal.requiredForOperationalProof, true);
  assert.equal(evidence.decisions.productionProofAllowed, false);
  assert.equal(evidence.decisions.operationalProofAllowed, false);
});

test("keeps Sync/DB evidence readable for Forge dev when canonical parcel is unavailable but real parcel identity exists", async () => {
  const queryValues = {
    latestLoadBatch: {
      load_batch_id: "batch-1",
      stage: "owner-supnum-v2-activesupp-copy",
      status: "IN_PROGRESS"
    },
    latestOwnerSupnumFailure: {
      loadBatchId: "batch-owner-failed",
      stage: "owner-supnum-resume",
      status: "FAILED"
    },
    legacyProperty: 1190834,
    legacyOwner: 8213706,
    legacyPropSuppAssoc: 4382985,
    legacyWashPropOwnerVal: 1707143,
    legacyAccount: 535140,
    truthParcel: 83326,
    truthOwner: 816849,
    truthWsdor: 774696,
    canonicalParcel: { unavailable: true, reason: "docker psql timeout" },
    canonicalOwner: 312532,
    canonicalWsdor: 686820,
    gisParcelGeometry: 80075
  };

  const evidence = await buildBentonSyncDrainStateEvidence({
    probeBackendHealth: async () => ({ status: "healthy", ok: true }),
    processAlive: () => null,
    query: async (name) => queryValues[name]
  });

  assert.equal(evidence.counts.canonical.parcel, 0);
  assert.equal(evidence.counts.landingTables.property, 1190834);
  assert.equal(evidence.counts.truthTables.parcel, 83326);
  assert.equal(evidence.counts.gis.parcelGeometry, 80075);
  assert.equal(evidence.countyStudioDependencies.map, "SYNC_DERIVED");
  assert.equal(evidence.countyStudioDependencies.ledger, "SYNC_DERIVED");
  assert.equal(evidence.countyStudioDependencies.inspector, "SYNC_DERIVED");
  assert.equal(evidence.decisions.realDevEvidenceReadable, true);
  assert.equal(evidence.decisions.productionProofAllowed, false);
  assert.equal(evidence.decisions.operationalProofAllowed, false);
});

test("reports UNKNOWN instead of passing when DB query tooling is unavailable", async () => {
  const evidence = await buildBentonSyncDrainStateEvidence({
    drainPid: 28503,
    probeBackendHealth: async () => ({ status: "healthy", ok: true }),
    processAlive: () => false,
    query: async () => ({ unavailable: true, reason: "psql not found" })
  });

  assert.equal(evidence.activeDrain.alive, false);
  assert.equal(evidence.loadBatch.status, "UNKNOWN");
  assert.equal(evidence.counts.landingTables.property, 0);
  assert.equal(evidence.countClassifications.legacyProperty, "UNKNOWN");
  assert.equal(evidence.countyStudioDependencies.map, "UNKNOWN");
  assert.equal(evidence.decisions.realDevEvidenceReadable, false);
});

test("converts adapter evidence into readiness-gate source payload", async () => {
  const evidence = await buildBentonSyncDrainStateEvidence({
    probeBackendHealth: async () => ({ status: "healthy", ok: true }),
    processAlive: () => true,
    query: async (name) => {
      if (name === "latestLoadBatch") return { stage: "Owner", status: "COMPLETED" };
      return 10;
    }
  });

  const source = evidenceToReadinessSource(evidence);
  assert.equal(source.counts.landingTables.property, 10);
  assert.equal(source.counts.truthTables.owner, 10);
  assert.equal(source.countyStudioDependencies.ledger, "SYNC_DERIVED");
  assert.equal(source.countyStudioDependencies.ownerSupnumBackfill.requiredForCountyStudioForgeDev, false);
});

test("CLI writes UNKNOWN evidence without psql instead of inventing counts", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-sync-evidence-adapter-"));
  const outJson = path.join(tmp, "adapter.json");
  const outMd = path.join(tmp, "adapter.md");
  const result = spawnSync(
    process.execPath,
    [
      "os-platform/core/pilot/benton-sync-drain-state-evidence-adapter.mjs",
      "--drain-pid",
      "28503",
      "--out-json",
      outJson,
      "--out-md",
      outMd,
      "--no-backend-probe"
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, PATH: "" }
    }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /UNKNOWN/);
  assert.ok(fs.existsSync(outJson));

  const evidence = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(evidence.countClassifications.legacyProperty, "UNKNOWN");
  assert.equal(evidence.decisions.realDevEvidenceReadable, false);
});

test("uses canonical Docker psql runtime when workstation psql is unavailable", async () => {
  const calls = [];
  const runner = makeRuntimeDbQueryRunner({
    dbRuntime: "auto",
    connectionString: "postgresql://postgres:postgres@localhost:5432/terrafusion",
    dockerPath: "docker",
    pgContainer: "terrafusion-postgres-dev",
    pgDatabase: "terrafusion",
    pgUser: "postgres",
    spawn: (command, args) => {
      calls.push([command, args]);
      if (command === "psql") {
        return { error: new Error("spawnSync psql ENOENT") };
      }
      return { status: 0, stdout: "42\n", stderr: "" };
    }
  });

  const value = await runner("legacyProperty", DB_COUNT_QUERIES.legacyProperty);

  assert.equal(value, 42);
  assert.deepEqual(calls[1], [
    "docker",
    [
      "exec",
      "terrafusion-postgres-dev",
      "psql",
      "-U",
      "postgres",
      "-d",
      "terrafusion",
      "-X",
      "-A",
      "-t",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      DB_COUNT_QUERIES.legacyProperty
    ]
  ]);
});

test("keeps DB evidence UNKNOWN when no direct or Docker runtime path is available", async () => {
  const runner = makeRuntimeDbQueryRunner({
    dbRuntime: "auto",
    connectionString: null,
    dockerPath: "docker",
    spawn: () => ({ error: new Error("command unavailable") })
  });

  const value = await runner("legacyProperty", DB_COUNT_QUERIES.legacyProperty);

  assert.equal(value.unavailable, true);
  assert.match(value.reason, /No readable DB runtime path/i);
});

test("direct DB runtime without a connection string does not pass", async () => {
  const runner = makeRuntimeDbQueryRunner({
    dbRuntime: "direct",
    connectionString: null,
    spawn: () => ({ status: 0, stdout: "42\n", stderr: "" })
  });

  const value = await runner("legacyProperty", DB_COUNT_QUERIES.legacyProperty);

  assert.equal(value.unavailable, true);
  assert.match(value.reason, /No database connection string configured/i);
});

test("load batch query uses the canonical quoted Sync column contract", () => {
  assert.match(LATEST_LOAD_BATCH_QUERY, /"LoadBatchId"/);
  assert.match(LATEST_LOAD_BATCH_QUERY, /"Operator"/);
  assert.match(LATEST_LOAD_BATCH_QUERY, /"Status"/);
  assert.doesNotMatch(LATEST_LOAD_BATCH_QUERY, /COALESCE\([^)]*\bload_batch_id\b/);
  assert.doesNotMatch(LATEST_LOAD_BATCH_QUERY, /\bfamily\b/);
  assert.match(LATEST_OWNER_SUPNUM_FAILURE_QUERY, /"Operator"\s+ILIKE\s+'owner-supnum%'/);
  assert.match(LATEST_OWNER_SUPNUM_FAILURE_QUERY, /"Status"\s*=\s*'FAILED'/);
});

test("Docker psql runtime uses the configured DB evidence timeout", async () => {
  let observedOptions = null;
  const runner = makeRuntimeDbQueryRunner({
    dbRuntime: "docker",
    queryTimeoutMs: 60000,
    spawn: (_command, _args, options) => {
      observedOptions = options;
      return { status: 0, stdout: "42\n", stderr: "" };
    }
  });

  const value = await runner("legacyProperty", DB_COUNT_QUERIES.legacyProperty);

  assert.equal(value, 42);
  assert.equal(observedOptions.timeout, 60000);
});
