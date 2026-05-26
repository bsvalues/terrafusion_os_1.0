import assert from "node:assert/strict";
import test from "node:test";

import { buildProductionDbBindingPlan } from "./june10-production-db-binding-plan.mjs";

test("production DB binding remains blocked while WA seed receipts are missing", () => {
  const report = buildProductionDbBindingPlan({
    receiptReconciliation: {
      productionBindingAllowed: false,
      summary: {
        receiptsVerified: 2,
        receiptsMissing: 36,
        fullIdentityReceipts: 1,
        shellPresentReceipts: 1
      }
    }
  });

  assert.equal(report.decision, "BLOCKED");
  assert.equal(report.productionBindingAllowed, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("36 WA_INITIAL_SEED counties")));
});
