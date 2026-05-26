#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildKingShellCorrectionAuthorizationPacket } from "./june10-king-shell-correction-authorization-packet.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-king-auth-packet-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

const transactionDryRun = {
  generatedAt: "2026-05-26T00:00:00.000Z",
  countyName: "King County",
  fips: "53033",
  trustLabel: "KING_PUBLIC_PARCEL_SHELL",
  databaseMutationAttempted: false,
  productionBindingAllowed: false,
  certificationAllowed: false,
  summary: {
    staleCanonicalRows: 451,
    supersedeCandidates: 451,
    sourceExactCaseCorrections: 12,
    shellInsertCandidates: 1137,
    placeholderReviewHeld: 24,
    unsafeSupersedes: 0
  },
  postTransactionParityProof: {
    policyApprovedIdentityParityWouldBeAchieved: true,
    fullSourceParityBlockedByPlaceholderQueue: true,
    countyIdParcelNumberDuplicatesAfter: 0,
    shellRowsReceiveTrustLabel: true,
    shellRowsBlockedFromWorkflowCompleteClaims: true
  },
  blockers: []
};

const shellPolicy = {
  trustLabel: "KING_PUBLIC_PARCEL_SHELL",
  policy: {
    shellRowsAreWorkflowComplete: false,
    blockedActions: ["owner_address_value_dependent_workflows", "valuation_or_cost_claims"]
  },
  loadabilityMatrix: {
    workflowCompleteRows: 0,
    certificationRows: 0
  }
};

const sourceCompleteness = {
  artifacts: {
    rawArtifactSha256: "source-sha",
    rawArtifactPath: "raw.jsonl"
  }
};

test("buildKingShellCorrectionAuthorizationPacket requires human approval and blocks certification", () => {
  const packet = buildKingShellCorrectionAuthorizationPacket({
    transactionDryRun,
    shellPolicy,
    sourceCompleteness,
    rollbackSqlExists: true
  });

  assert.equal(packet.authorizationStatus, "READY_FOR_HUMAN_DECISION");
  assert.equal(packet.databaseMutationAttempted, false);
  assert.equal(packet.productionBindingAllowed, false);
  assert.equal(packet.certificationAllowed, false);
  assert.equal(packet.executability.executionCommandEnabled, false);
  assert.match(packet.executability.disabledExecutionCommand, /DISABLED/);
  assert.equal(packet.executiveSummary.supersedes, 451);
  assert.equal(packet.executiveSummary.shellInserts, 1137);
  assert.equal(packet.executiveSummary.caseCorrections, 12);
  assert.equal(packet.executiveSummary.placeholderRowsExcluded, 24);
  assert.ok(packet.riskStatement.some((line) => line.includes("not workflow-certified")));
  assert.ok(packet.humanApprovalChecklist.some((item) => item.required === true));
  assert.ok(packet.noBsLine.includes("not approved for King certification"));
});

test("buildKingShellCorrectionAuthorizationPacket blocks authorization when rollback SQL is missing", () => {
  const packet = buildKingShellCorrectionAuthorizationPacket({
    transactionDryRun,
    shellPolicy,
    sourceCompleteness,
    rollbackSqlExists: false
  });

  assert.equal(packet.authorizationStatus, "BLOCKED_PRECONDITION");
  assert.ok(packet.preconditions.some((item) => item.id === "rollback_sql_exists" && item.passed === false));
});

test("CLI writes King authorization packet evidence", () => {
  const root = tmpRoot();
  const transactionPath = path.join(root, "transaction.json");
  const shellPolicyPath = path.join(root, "policy.json");
  const sourcePath = path.join(root, "source.json");
  const rollbackPath = path.join(root, "rollback.sql");
  const rawPath = path.join(root, "raw.jsonl");
  const outRoot = path.join(root, "out");
  const outJson = path.join(root, "packet.json");
  const outMd = path.join(root, "packet.md");

  writeJson(transactionPath, transactionDryRun);
  writeJson(shellPolicyPath, shellPolicy);
  writeText(rawPath, "source artifact\n");
  writeJson(sourcePath, {
    ...sourceCompleteness,
    artifacts: {
      rawArtifactPath: rawPath,
      rawArtifactSha256: "a7814472c4db8f59ef332601c9745fcf7c7fdf1d52804d758abc9202ab267280"
    }
  });
  writeText(rollbackPath, "-- rollback\n");

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-king-shell-correction-authorization-packet.mjs",
      "--transaction-dry-run",
      transactionPath,
      "--shell-policy",
      shellPolicyPath,
      "--source-completeness",
      sourcePath,
      "--rollback-sql",
      rollbackPath,
      "--out-root",
      outRoot,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const packet = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(packet.authorizationStatus, "READY_FOR_HUMAN_DECISION");
  assert.ok(fs.existsSync(path.join(outRoot, "human-approval-checklist.json")));
  assert.ok(fs.existsSync(path.join(outRoot, "execution-command.disabled.txt")));
  assert.ok(fs.existsSync(path.join(outRoot, "post-execution-proof-requirements.json")));
  assert.match(fs.readFileSync(outMd, "utf8"), /King Shell Correction Authorization Packet/);
});
