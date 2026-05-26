#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildKingShellCorrectionDecisionGate } from "./june10-king-shell-correction-decision-gate.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-king-decision-gate-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

const packet = {
  authorizationStatus: "READY_FOR_HUMAN_DECISION",
  databaseMutationAttempted: false,
  productionBindingAllowed: false,
  certificationAllowed: false,
  executiveSummary: {
    supersedes: 451,
    shellInserts: 1137,
    caseCorrections: 12,
    placeholderRowsExcluded: 24,
    duplicateTargetGroupsAfter: 0
  },
  humanApprovalChecklist: [
    { id: "approve_scope", required: true },
    { id: "acknowledge_not_certification", required: true },
    { id: "acknowledge_shell_limit", required: true }
  ]
};

function baseInputs(overrides = {}) {
  return {
    authorizationPacket: packet,
    expectedAuthorizationPacketHash: "packet-hash",
    actualAuthorizationPacketHash: "packet-hash",
    expectedDryRunHash: "dry-hash",
    actualDryRunHash: "dry-hash",
    expectedSourceArtifactHash: "source-hash",
    actualSourceArtifactHash: "source-hash",
    rollbackSqlExists: true,
    worktreeClean: true,
    latestTestsPassed: true,
    decision: "none",
    humanApproval: null,
    ...overrides
  };
}

test("decision gate stays READY_FOR_HUMAN_DECISION without approval", () => {
  const gate = buildKingShellCorrectionDecisionGate(baseInputs());

  assert.equal(gate.state, "READY_FOR_HUMAN_DECISION");
  assert.equal(gate.executionEnabled, false);
  assert.equal(gate.certificationAllowed, false);
  assert.ok(gate.forbiddenApprovals.includes("King certification"));
});

test("decision gate approves only bounded shell correction with explicit checklist acceptance", () => {
  const gate = buildKingShellCorrectionDecisionGate(
    baseInputs({
      decision: "approve",
      humanApproval: {
        phrase: "I explicitly authorize the King shell identity correction transaction only.",
        acceptedChecklistIds: ["approve_scope", "acknowledge_not_certification", "acknowledge_shell_limit"]
      }
    })
  );

  assert.equal(gate.state, "APPROVED_FOR_SHELL_CORRECTION");
  assert.equal(gate.executionEnabled, true);
  assert.equal(gate.certificationAllowed, false);
  assert.equal(gate.productionBindingAllowed, false);
  assert.ok(gate.allowedUnlocks.includes("bounded_king_shell_identity_correction"));
  assert.ok(gate.forbiddenApprovals.includes("placeholder/tract insertion"));
});

test("decision gate rejects explicitly", () => {
  const gate = buildKingShellCorrectionDecisionGate(baseInputs({ decision: "reject" }));

  assert.equal(gate.state, "REJECTED");
  assert.equal(gate.executionEnabled, false);
});

test("decision gate expires when evidence hash changes", () => {
  const gate = buildKingShellCorrectionDecisionGate(baseInputs({ actualDryRunHash: "changed" }));

  assert.equal(gate.state, "EXPIRED_STALE_EVIDENCE");
  assert.equal(gate.executionEnabled, false);
  assert.ok(gate.blockers.some((blocker) => blocker.includes("dry-run hash")));
});

test("CLI writes decision gate evidence and keeps approval token disabled by default", () => {
  const root = tmpRoot();
  const packetPath = path.join(root, "packet.json");
  const dryRunPath = path.join(root, "dry-run.json");
  const sourcePath = path.join(root, "source.jsonl");
  const rollbackPath = path.join(root, "rollback.sql");
  const outRoot = path.join(root, "out");
  const outJson = path.join(root, "gate.json");
  const outMd = path.join(root, "gate.md");

  writeJson(packetPath, packet);
  writeJson(dryRunPath, { dryRun: true });
  writeText(sourcePath, "source\n");
  writeText(rollbackPath, "rollback\n");

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-king-shell-correction-decision-gate.mjs",
      "--authorization-packet",
      packetPath,
      "--transaction-dry-run",
      dryRunPath,
      "--source-artifact",
      sourcePath,
      "--rollback-sql",
      rollbackPath,
      "--worktree-clean",
      "true",
      "--latest-tests-passed",
      "true",
      "--out-root",
      outRoot,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const gate = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(gate.state, "READY_FOR_HUMAN_DECISION");
  assert.equal(gate.approvalToken.enabled, false);
  assert.ok(fs.existsSync(path.join(outRoot, "approval-token.disabled.json")));
  assert.ok(fs.existsSync(path.join(outRoot, "decision-gate-state.json")));
  assert.match(fs.readFileSync(outMd, "utf8"), /King Shell Correction Decision Gate/);
});
