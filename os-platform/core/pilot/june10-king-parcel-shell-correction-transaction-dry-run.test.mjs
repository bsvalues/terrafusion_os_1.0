#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildKingParcelShellCorrectionTransactionDryRun } from "./june10-king-parcel-shell-correction-transaction-dry-run.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-king-shell-transaction-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

const correctionDryRun = {
  summary: {
    trueSourceOnlyRows: 4,
    trueCanonicalOnlyRows: 2,
    proposedCaseCorrections: 1,
    proposedSupersedes: 2
  },
  validation: {
    postCorrectionIdentityParityWouldBeAchieved: true,
    countyIdParcelNumberDuplicatesAfter: 0,
    canonicalOnlyRowsSafeToSupersede: true,
    caseCorrectionsSafe: true
  },
  proposedCaseCorrections: [
    {
      tfParcelId: "case-row",
      currentCanonicalValue: "ABC-TR",
      proposedParcelNumber: "abc-tr",
      proposedTerraFusionParcelKey: "53033:abc-tr",
      safeForDryRun: true
    }
  ],
  proposedSupersedes: [
    {
      tfParcelId: "stale-1",
      parcelNumber: "100",
      sourceProbePresent: false,
      safeToSupersede: true
    },
    {
      tfParcelId: "stale-2",
      parcelNumber: "101",
      sourceProbePresent: false,
      safeToSupersede: true
    }
  ]
};

const shellPolicy = {
  trustLabel: "KING_PUBLIC_PARCEL_SHELL",
  policy: {
    allowParcelShellRowsInCanonicalRuntime: true,
    shellRowsAreWorkflowComplete: false,
    blockedActions: ["owner_address_value_dependent_workflows", "valuation_or_cost_claims"]
  },
  loadabilityMatrix: {
    sourceOnlyPins: 4,
    shellLoadCandidates: 3,
    placeholderReviewQueue: 1,
    workflowCompleteRows: 0,
    certificationRows: 0
  },
  shellLoadCandidates: [
    { parcelNumber: "200", major: "200", minor: "0000", proposedTerraFusionParcelKey: "53033:200" },
    { parcelNumber: "201", major: "201", minor: "0000", proposedTerraFusionParcelKey: "53033:201" },
    { parcelNumber: "202", major: "202", minor: "0000", proposedTerraFusionParcelKey: "53033:202" }
  ],
  placeholderReviewQueue: [
    { parcelNumber: "TRACT-A", proposedTerraFusionParcelKey: "53033:TRACT-A" }
  ],
  blockedActions: ["owner_address_value_dependent_workflows", "valuation_or_cost_claims"]
};

test("buildKingParcelShellCorrectionTransactionDryRun proves policy-approved identity parity without mutation", () => {
  const dryRun = buildKingParcelShellCorrectionTransactionDryRun({
    correctionDryRun,
    shellPolicy
  });

  assert.equal(dryRun.databaseMutationAttempted, false);
  assert.equal(dryRun.productionBindingAllowed, false);
  assert.equal(dryRun.certificationAllowed, false);
  assert.equal(dryRun.summary.supersedeCandidates, 2);
  assert.equal(dryRun.summary.shellInsertCandidates, 3);
  assert.equal(dryRun.summary.placeholderReviewHeld, 1);
  assert.equal(dryRun.postTransactionParityProof.policyApprovedIdentityParityWouldBeAchieved, true);
  assert.equal(dryRun.postTransactionParityProof.fullSourceParityBlockedByPlaceholderQueue, true);
  assert.equal(dryRun.postTransactionParityProof.countyIdParcelNumberDuplicatesAfter, 0);
  assert.equal(dryRun.trustLabel, "KING_PUBLIC_PARCEL_SHELL");
  assert.ok(dryRun.proposedInsertList.every((row) => row.trustLabel === "KING_PUBLIC_PARCEL_SHELL"));
  assert.ok(dryRun.proposedInsertList.every((row) => row.workflowComplete === false));
  assert.match(dryRun.proposedTransactionReceipt.receiptLanguage.join(" "), /not workflow-complete/);
  assert.match(dryRun.proposedSupersedeSql, /ROLLBACK/);
  assert.match(dryRun.proposedInsertSql, /KING_PUBLIC_PARCEL_SHELL/);
});

test("buildKingParcelShellCorrectionTransactionDryRun blocks when any stale row is unsafe to supersede", () => {
  const dryRun = buildKingParcelShellCorrectionTransactionDryRun({
    correctionDryRun: {
      ...correctionDryRun,
      proposedSupersedes: [
        ...correctionDryRun.proposedSupersedes,
        { tfParcelId: "unsafe", parcelNumber: "999", sourceProbePresent: true, safeToSupersede: false }
      ]
    },
    shellPolicy
  });

  assert.equal(dryRun.postTransactionParityProof.policyApprovedIdentityParityWouldBeAchieved, false);
  assert.ok(dryRun.blockers.some((blocker) => blocker.includes("unsafe supersede")));
});

test("CLI writes King transaction dry-run evidence", () => {
  const root = tmpRoot();
  const correctionPath = path.join(root, "correction.json");
  const policyPath = path.join(root, "policy.json");
  const outRoot = path.join(root, "out");
  const outJson = path.join(root, "latest.json");
  const outMd = path.join(root, "latest.md");

  writeJson(correctionPath, correctionDryRun);
  writeJson(policyPath, shellPolicy);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-king-parcel-shell-correction-transaction-dry-run.mjs",
      "--correction-dry-run",
      correctionPath,
      "--shell-policy",
      policyPath,
      "--out-root",
      outRoot,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const dryRun = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(dryRun.summary.shellInsertCandidates, 3);
  assert.ok(fs.existsSync(path.join(outRoot, "proposed-transaction-receipt.json")));
  assert.ok(fs.existsSync(path.join(outRoot, "proposed-supersede.sql")));
  assert.ok(fs.existsSync(path.join(outRoot, "proposed-insert.sql")));
  assert.ok(fs.existsSync(path.join(outRoot, "excluded-placeholder-queue.json")));
  assert.ok(fs.existsSync(path.join(outRoot, "post-transaction-parity-proof.json")));
  assert.ok(fs.existsSync(path.join(outRoot, "rollback.sql")));
  assert.match(fs.readFileSync(outMd, "utf8"), /King Parcel Shell Correction Transaction Dry-Run/);
});
