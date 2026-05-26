import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { adjudicatePierceDelta, classifyPierceDecision, summarizeSourceParsers } from "./june10-pierce-delta-adjudication.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-pierce-delta-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

test("classifyPierceDecision recognizes full identity only on full parcel inventory overlap", () => {
  assert.equal(
    classifyPierceDecision({
      sourceOnlyCount: 0,
      canonicalOnlyCount: 0,
      sourceCoverageRatio: 1,
      sourceArtifactKind: "parcel_inventory"
    }),
    "receipt_backed_full_identity"
  );
});

test("classifyPierceDecision blocks high-coverage sales history semantics", () => {
  assert.equal(
    classifyPierceDecision({
      sourceOnlyCount: 9066,
      canonicalOnlyCount: 75840,
      sourceCoverageRatio: 0.7696,
      sourceArtifactKind: "sales_history_datamart"
    }),
    "blocked_source_semantics"
  );
});

test("classifyPierceDecision can allow shell-present candidate for substantial parcel inventory coverage", () => {
  assert.equal(
    classifyPierceDecision({
      sourceOnlyCount: 10,
      canonicalOnlyCount: 20,
      sourceCoverageRatio: 0.96,
      sourceArtifactKind: "parcel_inventory"
    }),
    "shell_present_candidate"
  );
});

test("summarizeSourceParsers totals nested duplicate and row counts", () => {
  const summary = summarizeSourceParsers([
    { rowCount: 100, idsExtracted: 80, duplicates: 20, nullOrBlank: 0 },
    { rowCount: 50, idsExtracted: 30, duplicates: 20, nullOrBlank: 2 }
  ]);
  assert.equal(summary.rowCount, 150);
  assert.equal(summary.idsExtracted, 110);
  assert.equal(summary.duplicateRows, 40);
  assert.equal(summary.nullOrBlankRows, 2);
});

test("adjudicatePierceDelta compares source and prefix-stripped canonical identity without mutation", () => {
  const report = adjudicatePierceDelta({
    sourceIds: ["A", "B", "B", "C"],
    canonicalIds: ["A", "D"],
    acquisitionCounty: {
      sourceParcelIdField: "sale.txt field 3 parcel/account number",
      parserSummaries: [{ rowCount: 4, idsExtracted: 3, duplicates: 1, nullOrBlank: 0 }],
      receiptCandidate: { artifacts: [{ path: "pierce-sale.zip", sha256: "abc" }] }
    },
    repairCounty: {
      validation: { duplicateCountyIdParcelNumberAfter: 0 },
      receiptCandidate: { receiptId: "repair" }
    }
  });

  assert.equal(report.summary.sourceDistinctParcelIds, 3);
  assert.equal(report.summary.canonicalDistinctParcelIdsAfterPrefixRepair, 2);
  assert.equal(report.summary.sourceOnlyCount, 2);
  assert.equal(report.summary.canonicalOnlyCount, 1);
  assert.equal(report.summary.duplicateSourceRows, 1);
  assert.equal(report.currentSourceProbe.sourceArtifactKind, "sales_history_datamart");
  assert.equal(report.decision, "blocked_source_semantics");
  assert.equal(report.databaseMutationAttempted, false);
  assert.equal(report.productionBindingAllowed, false);
});

test("CLI writes Pierce delta evidence and delta lists", () => {
  const root = tmpRoot();
  const acquisitionPath = path.join(root, "acquisition.json");
  const repairPath = path.join(root, "repair.json");
  const sourcePath = path.join(root, "source.jsonl");
  const canonicalPath = path.join(root, "canonical.txt");
  const outRoot = path.join(root, "out");
  const outJson = path.join(root, "pierce.json");
  const outMd = path.join(root, "pierce.md");

  writeJson(acquisitionPath, {
    counties: [
      {
        county: "Pierce",
        sourceParcelIdField: "sale.txt field 3 parcel/account number",
        parserSummaries: [{ rowCount: 3, idsExtracted: 2, duplicates: 1, nullOrBlank: 0 }],
        receiptCandidate: { artifacts: [{ path: "source.zip", sha256: "abc" }] }
      }
    ]
  });
  writeJson(repairPath, {
    counties: [{ county: "Pierce", validation: { duplicateCountyIdParcelNumberAfter: 0 }, receiptCandidate: { receiptId: "repair" } }]
  });
  writeText(
    sourcePath,
    `${JSON.stringify({ sourceNativeParcelId: "A" })}\n${JSON.stringify({ sourceNativeParcelId: "B" })}\n`
  );
  writeText(canonicalPath, "A\nC\n");

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-pierce-delta-adjudication.mjs",
      "--acquisition",
      acquisitionPath,
      "--repair-dry-run",
      repairPath,
      "--source-ids",
      sourcePath,
      "--canonical-ids",
      canonicalPath,
      "--out-root",
      outRoot,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(report.summary.sourceOnlyCount, 1);
  assert.equal(report.summary.canonicalOnlyCount, 1);
  assert.equal(fs.readFileSync(path.join(outRoot, "pierce-source-only-parcels.txt"), "utf8").trim(), "B");
  assert.equal(fs.readFileSync(path.join(outRoot, "pierce-canonical-only-parcels.txt"), "utf8").trim(), "C");
  assert.match(fs.readFileSync(outMd, "utf8"), /Pierce Delta Adjudication/);
});
