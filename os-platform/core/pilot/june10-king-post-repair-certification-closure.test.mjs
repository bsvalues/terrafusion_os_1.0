import assert from "node:assert/strict";
import test from "node:test";

import { buildKingPostRepairCertificationClosure } from "./june10-king-post-repair-certification-closure.mjs";

test("King closure converts clean shell execution into receipt-backed shell-present posture", () => {
  const report = buildKingPostRepairCertificationClosure({
    executionReceipt: {
      transactionCommitted: true,
      expectedCounts: { placeholderHeld: 24 },
      verification: {
        shellInserted: 1137,
        superseded: 451,
        caseCorrected: 12,
        activeDuplicateGroups: 0,
        placeholderInserted: 0,
        kingActiveRows: 635872
      }
    },
    postExecutionAudit: {
      sourceCanonicalIdentityVerification: {
        canonicalActiveDistinct: 635872,
        sourceOnlyNonPlaceholder: 0,
        canonicalOnly: 0
      },
      postExecutionVerdict: {
        identityParityAchievedUnderPolicyApprovedScope: true
      }
    },
    sourceArtifactPath: "missing.jsonl",
    sourceMetadataPath: "missing.json"
  });

  assert.equal(report.status, "receipt_backed_shell_present");
  assert.equal(report.receiptConverted, true);
  assert.equal(report.certificationAllowed, false);
  assert.equal(report.productionBindingAllowed, false);
  assert.equal(report.receipt.trustPosture, "KING_PUBLIC_PARCEL_SHELL");
});
