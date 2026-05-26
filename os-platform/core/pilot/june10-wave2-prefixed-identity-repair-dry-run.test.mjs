import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCountyRepairDryRun,
  classifyRepairDryRun,
  duplicateTargetCount,
  plannedRepairRow
} from "./june10-wave2-prefixed-identity-repair-dry-run.mjs";

test("plannedRepairRow restores source-native ParcelNumber and preserves prefixed key", () => {
  const row = plannedRepairRow({
    county: { fips: "53035", county: "Kitsap" },
    canonicalRow: {
      tfParcelId: "parcel-1",
      parcelNumber: "035-012201-1-001-1007",
      legacyImportedParcelKey: null,
      terraFusionParcelKey: "035-012201-1-001-1007"
    }
  });

  assert.equal(row.proposedParcelNumber, "012201-1-001-1007");
  assert.equal(row.proposedLegacyImportedParcelKey, "035-012201-1-001-1007");
  assert.equal(row.proposedTerraFusionParcelKey, "53035:012201-1-001-1007");
  assert.equal(row.deleteRow, false);
});

test("duplicateTargetCount catches post-repair CountyId + ParcelNumber collisions", () => {
  assert.equal(duplicateTargetCount(["A", "B", "C"]), 0);
  assert.equal(duplicateTargetCount(["A", "B", "A"]), 1);
});

test("classifyRepairDryRun blocks duplicate risk and source mismatch", () => {
  assert.equal(
    classifyRepairDryRun({
      duplicateCountyIdParcelNumberAfter: 1,
      transformedOverlapCount: 10,
      sourceDistinctCount: 10
    }),
    "dry_run_blocked_duplicate_risk"
  );

  assert.equal(
    classifyRepairDryRun({
      duplicateCountyIdParcelNumberAfter: 0,
      transformedOverlapCount: 0,
      sourceDistinctCount: 10
    }),
    "dry_run_blocked_source_mismatch"
  );

  assert.equal(
    classifyRepairDryRun({
      duplicateCountyIdParcelNumberAfter: 0,
      transformedOverlapCount: 8,
      sourceDistinctCount: 10
    }),
    "dry_run_pass_pending_delta_adjudication"
  );
});

test("buildCountyRepairDryRun stays mutation-free and emits rollback posture", () => {
  const dryRun = buildCountyRepairDryRun({
    county: { county: "Kitsap", fips: "53035" },
    sourceIds: new Set(["A", "B"]),
    canonicalRows: [
      {
        tfParcelId: "1",
        countyId: "county",
        parcelNumber: "035-A",
        legacyImportedParcelKey: null,
        terraFusionParcelKey: "035-A"
      },
      {
        tfParcelId: "2",
        countyId: "county",
        parcelNumber: "035-B",
        legacyImportedParcelKey: "035-B",
        terraFusionParcelKey: "035-B"
      }
    ],
    sourceReceiptCandidate: { artifacts: [{ path: "source.jsonl", sha256: "abc" }] }
  });

  assert.equal(dryRun.classification, "dry_run_pass_pending_delta_adjudication");
  assert.equal(dryRun.validation.duplicateCountyIdParcelNumberAfter, 0);
  assert.equal(dryRun.validation.sourceOverlapAfterPrefixRemoval, 2);
  assert.equal(dryRun.doctrine.databaseMutationAttempted, false);
  assert.equal(dryRun.receiptCandidate.certificationAllowed, false);
  assert.match(dryRun.rollbackPlan.requiredPreMutationBackup, /canonical_tf\.tf_parcel/);
});
