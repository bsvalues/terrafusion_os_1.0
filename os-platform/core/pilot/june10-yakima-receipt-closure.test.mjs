import assert from "node:assert/strict";
import test from "node:test";

import { buildYakimaReceiptClosure } from "./june10-yakima-receipt-closure.mjs";

const baseInput = {
  postRepairCounty: {
    sourceDistinct: 98978,
    canonicalDistinct: 102238,
    exactOverlap: 98878,
    sourceOnlyCount: 100,
    canonicalOnlyCount: 3360,
    rowCountMatches: false,
    sourceCountSemanticsAccepted: false,
    repairedRowsMatch: true,
    legacyImportedParcelKeyPreserved: true,
    terraFusionParcelKeyPopulated: true,
    sourceOnlySample: ["17140922403"],
    canonicalOnlySample: ["10070199992"]
  },
  repairReceipt: {
    committed: true,
    counties: [
      {
        fips: "53077",
        repairedRows: 102238,
        sourceParcelIdField: "AssessorNumber"
      }
    ]
  },
  dbSnapshot: {
    activeRows: 102238,
    activeDistinct: 102238,
    activeDuplicateGroups: 0,
    identityRepairReceiptRows: 102238,
    supersededRows: 0
  },
  sourceReceiptExists: false,
  sourceArtifactExists: false,
  supportingArtifacts: []
};

test("Yakima closure remains blocked when source artifact is missing and deltas remain", () => {
  const report = buildYakimaReceiptClosure(baseInput);

  assert.equal(report.status, "blocked_source_canonical_delta");
  assert.equal(report.receiptConverted, false);
  assert.equal(report.productionBindingAllowed, false);
  assert.equal(report.certificationAllowed, false);
  assert.equal(report.liveDbSnapshot.activeDuplicateGroups, 0);
  assert.equal(report.postRepairIdentityOverlap.sourceOnlyCount, 100);
  assert.equal(report.postRepairIdentityOverlap.canonicalOnlyCount, 3360);
  assert.equal(report.deltaClassification.duplicateNullSemantics.status, "not_rerunnable_without_raw_source_artifact");
  assert.match(report.blockers.join("\n"), /source snapshot receipt is missing/);
});

test("Yakima can only convert when source and canonical identity parity is complete", () => {
  const report = buildYakimaReceiptClosure({
    ...baseInput,
    postRepairCounty: {
      ...baseInput.postRepairCounty,
      sourceDistinct: 102238,
      exactOverlap: 102238,
      sourceOnlyCount: 0,
      canonicalOnlyCount: 0,
      rowCountMatches: true,
      sourceCountSemanticsAccepted: true
    },
    sourceReceiptExists: true,
    sourceArtifactExists: true
  });

  assert.equal(report.status, "receipt_backed_full_identity");
  assert.equal(report.receiptConverted, true);
  assert.equal(report.receipt.receiptVersion, "wa_initial_seed_post_repair_v1");
  assert.equal(report.boundedCorrectionPlan, null);
});
