import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  adjudicateSkagitIdentity,
  classifySkagitIdentity,
  compareSkagitIdentitySets,
  parseSourceIds
} from "./june10-skagit-identity-transform-adjudication.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-skagit-adjudication-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

test("parseSourceIds reads source-native PARCELID JSONL and counts duplicates/nulls", () => {
  const root = tmpRoot();
  const sourcePath = path.join(root, "source.jsonl");
  writeText(
    sourcePath,
    [
      JSON.stringify({ sourceNativeParcelId: "P100" }),
      JSON.stringify({ sourceNativeParcelId: "P200" }),
      JSON.stringify({ sourceNativeParcelId: "P100" }),
      JSON.stringify({ sourceNativeParcelId: "" })
    ].join("\n")
  );

  const parsed = parseSourceIds(sourcePath);

  assert.equal(parsed.rowCount, 4);
  assert.equal(parsed.distinctCount, 2);
  assert.equal(parsed.duplicateRows, 1);
  assert.equal(parsed.nullOrBlankRows, 1);
});

test("compareSkagitIdentitySets separates exact, prefix-stripped, source-only, and canonical-only deltas", () => {
  const comparison = compareSkagitIdentitySets({
    sourceIds: new Set(["P1", "P2", "P3"]),
    canonicalIds: new Set(["057-P1", "057-P2", "057-P4"])
  });

  assert.equal(comparison.exactOverlapCount, 0);
  assert.equal(comparison.prefixStrippedOverlapCount, 2);
  assert.deepEqual(comparison.sourceOnlyAfterPrefixStrip, ["P3"]);
  assert.deepEqual(comparison.canonicalOnlyAfterPrefixStrip, ["057-P4"]);
});

test("classifySkagitIdentity marks high prefix-stripped overlap as prefixed repair plus bounded delta", () => {
  assert.equal(
    classifySkagitIdentity({
      exactOverlapCount: 0,
      prefixStrippedOverlapCount: 72947,
      sourceDistinctCount: 73016,
      canonicalDistinctCount: 72973,
      sourceOnlyAfterPrefixStripCount: 69,
      canonicalOnlyAfterPrefixStripCount: 26
    }),
    "prefixed_repair_candidate_with_bounded_delta"
  );
});

test("adjudicateSkagitIdentity keeps DB mutation and production binding blocked", () => {
  const result = adjudicateSkagitIdentity({
    sourceReceipt: { sourceParcelIdField: "PARCELID", sourceUrl: "https://example.test", termsPosture: "review" },
    sourceStats: {
      rowCount: 3,
      distinctCount: 3,
      duplicateRows: 0,
      nullOrBlankRows: 0,
      ids: new Set(["P1", "P2", "P3"])
    },
    canonicalIds: new Set(["057-P1", "057-P2", "057-P4"])
  });

  assert.equal(result.sourceNativeField, "PARCELID");
  assert.equal(result.classification, "prefixed_repair_candidate_with_bounded_delta");
  assert.equal(result.databaseMutationAttempted, false);
  assert.equal(result.productionBindingAllowed, false);
  assert.equal(result.certificationAllowed, false);
});

test("CLI writes Skagit identity adjudication evidence", () => {
  const root = tmpRoot();
  const sourcePath = path.join(root, "source.jsonl");
  const receiptPath = path.join(root, "receipt.json");
  const canonicalPath = path.join(root, "canonical.jsonl");
  const outJson = path.join(root, "out.json");
  const outMd = path.join(root, "out.md");

  writeText(sourcePath, `${JSON.stringify({ sourceNativeParcelId: "P1" })}\n${JSON.stringify({ sourceNativeParcelId: "P2" })}\n`);
  writeText(canonicalPath, `${JSON.stringify({ parcelNumber: "057-P1" })}\n${JSON.stringify({ parcelNumber: "057-P3" })}\n`);
  writeJson(receiptPath, {
    sourceParcelIdField: "PARCELID",
    sourceUrl: "https://example.test",
    termsPosture: "public_endpoint_terms_review_required"
  });

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-skagit-identity-transform-adjudication.mjs",
      "--source-ids",
      sourcePath,
      "--receipt",
      receiptPath,
      "--canonical-ids",
      canonicalPath,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(report.county, "Skagit");
  assert.equal(report.databaseMutationAttempted, false);
  assert.match(fs.readFileSync(outMd, "utf8"), /Skagit Identity Transform Adjudication/);
});
