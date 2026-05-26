import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExecutionReceipt,
  buildPostureReceipt
} from "./june10-cowlitz-bounded-correction-execute.mjs";

test("buildExecutionReceipt records bounded Cowlitz shell correction without certification", () => {
  const receipt = buildExecutionReceipt({
    dryRun: { currentDeltas: { sourceDistinct: 2 } },
    rows: {
      supersedes: [{ parcelNumber: "old" }],
      inserts: [{ parcelNumber: "new" }]
    },
    verification: {
      sourceDistinct: 2,
      activeDistinct: 2,
      activeRows: 2,
      superseded: 1,
      shellInserted: 1,
      activeDuplicateGroups: 0,
      sourceOnlyRemaining: 0,
      canonicalOnlyRemaining: 0
    },
    backupPath: "evidence/backup.json",
    rollbackPath: "evidence/rollback.sql"
  });

  assert.equal(receipt.databaseMutationAttempted, true);
  assert.equal(receipt.transactionCommitted, true);
  assert.equal(receipt.noDeletes, true);
  assert.equal(receipt.certificationAllowed, false);
  assert.equal(receipt.productionBindingAllowed, false);
  assert.equal(receipt.parityAchieved, true);
  assert.equal(receipt.receiptPosture, "receipt_backed_shell_present");
});

test("buildPostureReceipt keeps Cowlitz workflow certification blocked", () => {
  const posture = buildPostureReceipt({
    executionReceipt: {
      receiptId: "receipt",
      backupPath: "backup.json",
      rollbackPath: "rollback.sql",
      receiptPosture: "receipt_backed_shell_present",
      verification: {
        sourceDistinct: 2,
        activeDistinct: 2,
        activeRows: 2,
        superseded: 1,
        shellInserted: 1,
        sourceOnlyRemaining: 0,
        canonicalOnlyRemaining: 0,
        activeDuplicateGroups: 0
      }
    }
  });

  assert.equal(posture.receiptVersion, "wa_initial_seed_shell_present_v1");
  assert.equal(posture.trustPosture, "COWLITZ_PUBLIC_PARCEL_IDENTITY");
  assert.equal(posture.productionBindingAllowed, false);
  assert.equal(posture.certificationAllowed, false);
  assert.equal(posture.workflowLabels.officialValuation, "blocked");
});
