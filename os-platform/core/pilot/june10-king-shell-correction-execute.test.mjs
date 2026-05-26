import assert from "node:assert/strict";
import test from "node:test";

import { buildExecutionReceipt } from "./june10-king-shell-correction-execute.mjs";

test("buildExecutionReceipt records bounded King mutation without certification", () => {
  const receipt = buildExecutionReceipt({
    gate: { approvalToken: { token: "KING-SHELL-CORRECTION:test" } },
    rows: {
      caseCorrections: [{ tfParcelId: "a" }],
      supersedes: [{ tfParcelId: "b" }],
      inserts: [{ parcelNumber: "1" }],
      placeholders: ["tract"]
    },
    verification: {
      caseCorrected: 1,
      superseded: 1,
      shellInserted: 1,
      activeDuplicateGroups: 0,
      placeholderInserted: 0,
      receiptRowsTotal: 3,
      kingActiveRows: 10,
      trustPosture: "KING_PUBLIC_PARCEL_SHELL",
      trustLabelStorage: "execution_receipt_and_identity_repair_receipt_id"
    },
    backupPath: "evidence/backup.json"
  });

  assert.equal(receipt.databaseMutationAttempted, true);
  assert.equal(receipt.transactionCommitted, true);
  assert.equal(receipt.certificationAllowed, false);
  assert.equal(receipt.productionBindingAllowed, false);
  assert.equal(receipt.expectedCounts.caseCorrections, 1);
  assert.equal(receipt.expectedCounts.supersedes, 1);
  assert.equal(receipt.expectedCounts.shellInserts, 1);
  assert.equal(receipt.expectedCounts.placeholderHeld, 1);
  assert.equal(receipt.verification.activeDuplicateGroups, 0);
});
