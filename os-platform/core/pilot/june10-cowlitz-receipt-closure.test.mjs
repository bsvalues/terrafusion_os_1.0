import assert from "node:assert/strict";
import test from "node:test";

import { buildCowlitzReceiptClosure } from "./june10-cowlitz-receipt-closure.mjs";

const baseInput = {
  postRepairCounty: {
    sourceDistinct: 57558,
    canonicalDistinct: 57362,
    exactOverlap: 57237,
    sourceOnlyCount: 321,
    canonicalOnlyCount: 125,
    legacyImportedParcelKeyPreserved: true,
    terraFusionParcelKeyPopulated: true
  },
  rowCountAdjudication: {
    summary: {
      sourceRows: 57705,
      sourceDistinctNonNull: 57558,
      sourceNullOrBlank: 0,
      sourceDuplicateGroups: 25,
      canonicalDuplicateGroups: 0
    }
  },
  identifierRootCause: {
    recommendedRootCause: {
      id: "county_prefix_transform_without_documented_crosswalk"
    }
  },
  repairDryRun: {
    dryRunStatus: "dry_run_pass",
    rowsRepairable: 57362,
    rowsScanned: 57362,
    duplicateCountyIdParcelNumberAfter: 0
  },
  repairReceipt: {
    receiptId: "wa_initial_seed_identity_repair_2026_05_26_pilot4",
    committed: true,
    counties: [
      {
        fips: "53015",
        repairedRows: 57362
      }
    ]
  }
};

test("Cowlitz remains blocked with bounded correction plan when post-repair deltas remain", () => {
  const report = buildCowlitzReceiptClosure(baseInput);

  assert.equal(report.status, "bounded_correction_plan_required");
  assert.equal(report.receiptConverted, false);
  assert.equal(report.productionBindingAllowed, false);
  assert.equal(report.postRepairIdentityOverlap.sourceOnlyCount, 321);
  assert.equal(report.postRepairIdentityOverlap.canonicalOnlyCount, 125);
  assert.equal(report.sourceDuplicateNullSemantics.classification, "duplicates_do_not_explain_remaining_identity_delta");
  assert.ok(report.boundedCorrectionPlan.steps.length > 0);
  assert.match(report.blockers.join("\n"), /321 source parcel identifiers/);
  assert.match(report.blockers.join("\n"), /125 canonical parcel identifiers/);
});

test("Cowlitz can only convert to full identity when overlap is complete and blockers are absent", () => {
  const report = buildCowlitzReceiptClosure({
    ...baseInput,
    postRepairCounty: {
      ...baseInput.postRepairCounty,
      sourceDistinct: 57362,
      exactOverlap: 57362,
      sourceOnlyCount: 0,
      canonicalOnlyCount: 0
    }
  });

  assert.equal(report.status, "receipt_backed_full_identity");
  assert.equal(report.receiptConverted, true);
  assert.equal(report.receipt.receiptVersion, "wa_initial_seed_post_repair_v1");
  assert.equal(report.boundedCorrectionPlan, null);
});
