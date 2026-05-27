import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildSkagitAuthorizationPacket,
  evaluateAuthorizationState,
  forbiddenClaims
} from "./june10-skagit-repair-authorization-packet.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-skagit-auth-packet-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

test("forbiddenClaims blocks certification, production binding, and workflow-complete claims", () => {
  assert.deepEqual(forbiddenClaims(), [
    "no_skagit_certification",
    "no_production_binding",
    "no_workflow_complete_claims",
    "no_owner_address_value_claims_for_shell_rows",
    "no_runtime_promotion"
  ]);
});

test("evaluateAuthorizationState returns READY_FOR_HUMAN_DECISION for complete dry-run evidence", () => {
  const state = evaluateAuthorizationState({
    dryRun: { status: "DRY_RUN_REPAIR_PARITY_PROJECTED", databaseMutationAttempted: false },
    sourceReceipt: { valid: true, sourceIdArtifact: { sha256: "source" } },
    artifactHashesPresent: true
  });

  assert.equal(state.state, "READY_FOR_HUMAN_DECISION");
  assert.equal(state.executionEnabled, false);
});

test("evaluateAuthorizationState blocks stale or incomplete evidence", () => {
  const state = evaluateAuthorizationState({
    dryRun: { status: "DRY_RUN_REPAIR_BLOCKED", databaseMutationAttempted: false },
    sourceReceipt: { valid: true, sourceIdArtifact: { sha256: "source" } },
    artifactHashesPresent: false
  });

  assert.equal(state.state, "BLOCKED");
  assert.equal(state.executionEnabled, false);
});

test("buildSkagitAuthorizationPacket carries counts and hashes but does not enable execution", () => {
  const packet = buildSkagitAuthorizationPacket({
    dryRun: {
      status: "DRY_RUN_REPAIR_PARITY_PROJECTED",
      counts: { updateTargets: 72947, supersedeTargets: 26, stageInsertTargets: 69 },
      postRepairProjection: { duplicateGroups: 0, sourceOnlyCount: 0, canonicalOnlyCount: 0 },
      artifacts: {
        updateTargets: { sha256: "u", path: "u.jsonl" },
        supersedeTargets: { sha256: "s", path: "s.jsonl" },
        stageInsertTargets: { sha256: "i", path: "i.jsonl" },
        rollbackPlan: { sha256: "r", path: "rollback.md" },
        repairReceipt: { sha256: "rr", path: "receipt.json" }
      },
      databaseMutationAttempted: false,
      productionBindingAllowed: false,
      certificationAllowed: false
    },
    sourceReceipt: {
      valid: true,
      sourceUrl: "https://example.test",
      sourceParcelIdField: "PARCELID",
      sourceIdArtifact: { sha256: "source", path: "source.jsonl" },
      metadataArtifact: { sha256: "metadata", path: "metadata.json" }
    }
  });

  assert.equal(packet.state, "READY_FOR_HUMAN_DECISION");
  assert.equal(packet.executionEnabled, false);
  assert.equal(packet.summary.updateTargets, 72947);
  assert.equal(packet.forbiddenClaims.includes("no_production_binding"), true);
});

test("CLI writes Skagit authorization packet evidence", () => {
  const root = tmpRoot();
  const dryRunPath = path.join(root, "dry-run.json");
  const sourceReceiptPath = path.join(root, "source-receipt.json");
  const outJson = path.join(root, "packet.json");
  const outMd = path.join(root, "packet.md");

  writeJson(dryRunPath, {
    status: "DRY_RUN_REPAIR_PARITY_PROJECTED",
    counts: { updateTargets: 1, supersedeTargets: 1, stageInsertTargets: 1 },
    postRepairProjection: { duplicateGroups: 0, sourceOnlyCount: 0, canonicalOnlyCount: 0 },
    artifacts: {
      updateTargets: { sha256: "u", path: "u.jsonl" },
      supersedeTargets: { sha256: "s", path: "s.jsonl" },
      stageInsertTargets: { sha256: "i", path: "i.jsonl" },
      rollbackPlan: { sha256: "r", path: "rollback.md" },
      repairReceipt: { sha256: "rr", path: "receipt.json" }
    },
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false
  });
  writeJson(sourceReceiptPath, {
    valid: true,
    sourceUrl: "https://example.test",
    sourceParcelIdField: "PARCELID",
    sourceIdArtifact: { sha256: "source", path: "source.jsonl" },
    metadataArtifact: { sha256: "metadata", path: "metadata.json" }
  });

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-skagit-repair-authorization-packet.mjs",
      "--dry-run",
      dryRunPath,
      "--source-receipt",
      sourceReceiptPath,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const packet = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(packet.state, "READY_FOR_HUMAN_DECISION");
  assert.equal(packet.executionEnabled, false);
  assert.match(fs.readFileSync(outMd, "utf8"), /Skagit Repair Authorization Packet/);
});
