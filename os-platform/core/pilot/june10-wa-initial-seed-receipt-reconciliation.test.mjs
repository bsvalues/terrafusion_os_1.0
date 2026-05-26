import assert from "node:assert/strict";
import test from "node:test";

import { buildWaInitialSeedReceiptReconciliation } from "./june10-wa-initial-seed-receipt-reconciliation.mjs";

test("receipt reconciliation counts Spokane and King while keeping production binding blocked", () => {
  const report = buildWaInitialSeedReceiptReconciliation({
    receipts: [
      { countyName: "Spokane County", fips: "53063", status: "receipt_backed_full_identity" },
      { countyName: "King County", fips: "53033", status: "receipt_backed_shell_present" }
    ]
  });

  assert.equal(report.summary.expectedSeedCounties, 38);
  assert.equal(report.summary.receiptsVerified, 2);
  assert.equal(report.summary.receiptsMissing, 36);
  assert.equal(report.summary.fullIdentityReceipts, 1);
  assert.equal(report.summary.shellPresentReceipts, 1);
  assert.equal(report.productionBindingAllowed, false);
});
