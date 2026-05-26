import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCountyAcquisition,
  classifyAcquisition,
  detectParcelIdColumn,
  extractIdsFromDelimitedText,
  normalizeParcelId,
  stripSeedPrefix
} from "./june10-wave2-source-acquisition.mjs";

test("detectParcelIdColumn prefers source-native parcel identifier headers", () => {
  assert.equal(detectParcelIdColumn(["sale_date", "PARCEL_NUMBER", "price"]), 1);
  assert.equal(detectParcelIdColumn(["PIN", "Owner", "Address"]), 0);
  assert.equal(detectParcelIdColumn(["Tax Account Number", "Grantor"]), 0);
  assert.equal(detectParcelIdColumn(["sale_id", "amount"]), -1);
});

test("extractIdsFromDelimitedText supports headed and fixed-index payloads", () => {
  const headed = extractIdsFromDelimitedText("Parcel Number,Sale Price\nA-1,100\nA-2,200\n", {
    sourceParcelIdField: null
  });
  assert.deepEqual([...headed.ids], ["A-1", "A-2"]);
  assert.equal(headed.idField, "Parcel Number");

  const fixed = extractIdsFromDelimitedText("%016403|1|5555514269|06/29/2004\n0000001|4|2505000040|03/01/2001\n", {
    fixedColumnIndex: 2,
    sourceParcelIdField: "Pierce sale.txt field 3"
  });
  assert.deepEqual([...fixed.ids], ["5555514269", "2505000040"]);
  assert.equal(fixed.idField, "Pierce sale.txt field 3");
});

test("classification separates full, shell, transform, and blocked source access", () => {
  assert.equal(
    classifyAcquisition({
      sourceDistinctCount: 3,
      canonicalDistinctCount: 3,
      exactOverlapCount: 3,
      transformedOverlapCount: 3,
      receiptGradeSource: true
    }),
    "full_identity_candidate"
  );

  assert.equal(
    classifyAcquisition({
      sourceDistinctCount: 2,
      canonicalDistinctCount: 10,
      exactOverlapCount: 2,
      transformedOverlapCount: 2,
      receiptGradeSource: true
    }),
    "shell_present_candidate"
  );

  assert.equal(
    classifyAcquisition({
      sourceDistinctCount: 2,
      canonicalDistinctCount: 10,
      exactOverlapCount: 0,
      transformedOverlapCount: 2,
      receiptGradeSource: true
    }),
    "blocked_transform"
  );

  assert.equal(
    classifyAcquisition({
      sourceDistinctCount: 0,
      canonicalDistinctCount: 10,
      exactOverlapCount: 0,
      transformedOverlapCount: 0,
      receiptGradeSource: false
    }),
    "blocked_source_access"
  );
});

test("buildCountyAcquisition is read-only and preserves production binding block", () => {
  const county = buildCountyAcquisition({
    county: {
      county: "Test",
      fips: "53099",
      sourceParcelIdField: "PARCEL",
      payloadFiles: ["source.csv"],
      localDataFiles: []
    },
    sourceIds: new Set(["A", "B"]),
    canonicalIds: new Set(["A", "B"]),
    artifacts: [{ path: "source.csv", sha256: "abc", sizeBytes: 10 }],
    parserSummaries: [{ path: "source.csv", idField: "PARCEL", idsExtracted: 2, rowCount: 2 }],
    accessPath: "existing_payload_file",
    sourceReceiptGrade: true
  });

  assert.equal(county.classification, "full_identity_candidate");
  assert.equal(county.doctrine.databaseMutationAttempted, false);
  assert.equal(county.doctrine.productionBindingAllowed, false);
  assert.equal(county.receiptCandidate.sourceClass, "WA_INITIAL_SEED");
});

test("stripSeedPrefix models the known WA_INITIAL_SEED prefix defect without mutating IDs", () => {
  assert.equal(stripSeedPrefix("035-123456"), "123456");
  assert.equal(stripSeedPrefix("123456"), "123456");
  assert.equal(normalizeParcelId(" 00123 "), "00123");
});
