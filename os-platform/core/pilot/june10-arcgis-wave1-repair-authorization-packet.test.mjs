import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildAuthorizationPacket,
  evaluateAuthorizationState,
  forbiddenClaims,
  requiredCountyArtifacts
} from "./june10-arcgis-wave1-repair-authorization-packet.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-arcgis-wave1-auth-packet-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function cleanDryRunCounty(overrides = {}) {
  return {
    county: "Columbia",
    fips: "53013",
    classification: "repair_dry_run_ready_for_authorization",
    validation: {
      proposedRows: 2,
      duplicateCountyIdParcelNumberAfter: 0,
      missingSourceMappings: 0,
      blankProposedParcelNumbers: 0,
      proposedRowsSha256: "dry-run-sha"
    },
    receiptCandidate: {
      sourceArtifact: { path: "source.jsonl", sha256: "source-sha" }
    },
    artifacts: {
      proposedRowsPath: "proposed.jsonl",
      proposedRowsSha256: "proposed-sha",
      repairReceiptCandidatePath: "receipt.json",
      repairReceiptCandidateSha256: "receipt-sha",
      rollbackPlanPath: "rollback.md",
      rollbackPlanSha256: "rollback-sha"
    },
    blockers: [],
    doctrine: {
      databaseMutationAttempted: false,
      productionBindingAllowed: false,
      runtimeClaimAllowed: false,
      certificationAllowed: false
    },
    ...overrides
  };
}

test("requiredCountyArtifacts captures source, dry-run, receipt, and rollback hashes", () => {
  const artifacts = requiredCountyArtifacts(cleanDryRunCounty());

  assert.equal(artifacts.sourceArtifact.sha256, "source-sha");
  assert.equal(artifacts.proposedRows.sha256, "proposed-sha");
  assert.equal(artifacts.repairReceiptCandidate.sha256, "receipt-sha");
  assert.equal(artifacts.rollbackPlan.sha256, "rollback-sha");
});

test("evaluateAuthorizationState is ready only when all counties are clean and Garfield is excluded", () => {
  assert.deepEqual(
    evaluateAuthorizationState({
      repairDryRuns: [cleanDryRunCounty()],
      garfieldAdjudication: { repairAllowed: false, classification: "garfield_blank_source_native_delta_hold" }
    }),
    { state: "READY_FOR_HUMAN_DECISION", executionEnabled: false, blockers: [] }
  );

  const blocked = evaluateAuthorizationState({
    repairDryRuns: [cleanDryRunCounty({ validation: { proposedRows: 1, duplicateCountyIdParcelNumberAfter: 1 } })],
    garfieldAdjudication: { repairAllowed: false }
  });
  assert.equal(blocked.state, "BLOCKED");
  assert.match(blocked.blockers.join("\n"), /duplicate/i);
});

test("evaluateAuthorizationState does not require Garfield exclusion outside Garfield scope", () => {
  assert.deepEqual(
    evaluateAuthorizationState({
      repairDryRuns: [cleanDryRunCounty({ county: "Adams", fips: "53001" })],
      garfieldAdjudication: null
    }),
    { state: "READY_FOR_HUMAN_DECISION", executionEnabled: false, blockers: [] }
  );
});

test("buildAuthorizationPacket keeps execution, production binding, and certification disabled", () => {
  const packet = buildAuthorizationPacket({
    dryRun: {
      generatedAt: "2026-05-27T00:00:00.000Z",
      repairDryRuns: [cleanDryRunCounty()],
      garfieldAdjudication: { repairAllowed: false, classification: "garfield_blank_source_native_delta_hold" },
      summary: {
        cleanRepairReadyCount: 1,
        proposedRows: 2,
        duplicateCountyIdParcelNumberAfter: 0
      }
    }
  });

  assert.equal(packet.state, "READY_FOR_HUMAN_DECISION");
  assert.equal(packet.executionEnabled, false);
  assert.equal(packet.productionBindingAllowed, false);
  assert.equal(packet.certificationAllowed, false);
  assert.equal(packet.scope.countiesIncluded.length, 1);
  assert.equal(packet.scope.countiesExcluded[0].county, "Garfield");
  assert.ok(packet.stopConditions.some((condition) => /hash/i.test(condition)));
  assert.ok(forbiddenClaims().includes("no_production_binding"));
});

test("CLI writes authorization packet", () => {
  const root = tmpRoot();
  const dryRunPath = path.join(root, "dry-run.json");
  const outJson = path.join(root, "packet.json");
  const outMd = path.join(root, "packet.md");

  writeJson(dryRunPath, {
    generatedAt: "2026-05-27T00:00:00.000Z",
    repairDryRuns: [cleanDryRunCounty()],
    garfieldAdjudication: { repairAllowed: false, classification: "garfield_blank_source_native_delta_hold" },
    summary: {
      cleanRepairReadyCount: 1,
      proposedRows: 2,
      duplicateCountyIdParcelNumberAfter: 0
    }
  });

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-arcgis-wave1-repair-authorization-packet.mjs",
      "--dry-run",
      dryRunPath,
      "--out-json",
      outJson,
      "--out-md",
      outMd,
      "--wave-label",
      "Wave 2"
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const packet = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(packet.state, "READY_FOR_HUMAN_DECISION");
  assert.equal(packet.waveLabel, "Wave 2");
  assert.match(fs.readFileSync(outMd, "utf8"), /ArcGIS Wave 2 Repair Authorization Packet/);
});
