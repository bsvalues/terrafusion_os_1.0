#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  DB_COUNT_QUERIES,
  buildBentonSyncDrainStateEvidence,
  evidenceToReadinessSource
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
