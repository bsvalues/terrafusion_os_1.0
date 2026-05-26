import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { adjudicateOkanoganDelta, classifyOkanoganDecision, summarizeSourceParsers } from "./june10-okanogan-delta-adjudication.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-okanogan-delta-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

test("classifyOkanoganDecision recognizes full identity only on full overlap", () => {
  assert.equal(
    classifyOkanoganDecision({
      sourceOnlyCount: 0,
      canonicalOnlyCount: 0,
      sourceCoverageRatio: 1,
      sourceArtifactKind: "parcel_inventory"
    }),
    "receipt_backed_full_identity"
  );
});

test("classifyOkanoganDecision blocks comparable-sales partial source semantics", () => {
  assert.equal(
    classifyOkanoganDecision({
      sourceOnlyCount: 458,
      canonicalOnlyCount: 43532,
      sourceCoverageRatio: 0.1185,
      sourceArtifactKind: "comparable_sales_workbook"
    }),
    "blocked_source_semantics"
  );
});

test("classifyOkanoganDecision can identify shell-present candidates for substantial parcel inventory coverage", () => {
  assert.equal(
    classifyOkanoganDecision({
      sourceOnlyCount: 4,
      canonicalOnlyCount: 10,
      sourceCoverageRatio: 0.97,
      sourceArtifactKind: "parcel_inventory"
    }),
    "shell_present_candidate"
  );
});

test("summarizeSourceParsers totals parser row, duplicate, and blank counts", () => {
  const summary = summarizeSourceParsers([{ rowCount: 12, idsExtracted: 10, duplicates: 2, nullOrBlank: 1 }]);
  assert.equal(summary.rowCount, 12);
  assert.equal(summary.idsExtracted, 10);
  assert.equal(summary.duplicateRows, 2);
  assert.equal(summary.nullOrBlankRows, 1);
});

test("adjudicateOkanoganDelta compares source and prefix-stripped canonical identity without mutation", () => {
  const report = adjudicateOkanoganDelta({
    sourceIds: ["A", "B", "B", "C"],
    canonicalIds: ["A", "D"],
    acquisitionCounty: {
      sourceParcelIdField: "parcel/account number from Okanogan comparable sales workbook",
      parserSummaries: [{ rowCount: 4, idsExtracted: 3, duplicates: 1, nullOrBlank: 0 }],
      receiptCandidate: { artifacts: [{ path: "okanogan.xlsx", sha256: "abc" }] }
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
  assert.equal(report.currentSourceProbe.sourceArtifactKind, "comparable_sales_workbook");
  assert.equal(report.decision, "blocked_source_semantics");
  assert.equal(report.databaseMutationAttempted, false);
  assert.equal(report.productionBindingAllowed, false);
});

test("CLI writes Okanogan delta evidence and delta lists", () => {
  const root = tmpRoot();
  const acquisitionPath = path.join(root, "acquisition.json");
  const repairPath = path.join(root, "repair.json");
  const sourcePath = path.join(root, "source.jsonl");
  const canonicalPath = path.join(root, "canonical.txt");
  const outRoot = path.join(root, "out");
  const outJson = path.join(root, "okanogan.json");
  const outMd = path.join(root, "okanogan.md");

  writeJson(acquisitionPath, {
    counties: [
      {
        county: "Okanogan",
        sourceParcelIdField: "parcel/account number from Okanogan comparable sales workbook",
        parserSummaries: [{ rowCount: 3, idsExtracted: 2, duplicates: 1, nullOrBlank: 0 }],
        receiptCandidate: { artifacts: [{ path: "source.xlsx", sha256: "abc" }] }
      }
    ]
  });
  writeJson(repairPath, {
    counties: [{ county: "Okanogan", validation: { duplicateCountyIdParcelNumberAfter: 0 }, receiptCandidate: { receiptId: "repair" } }]
  });
  writeText(
    sourcePath,
    `${JSON.stringify({ sourceNativeParcelId: "A" })}\n${JSON.stringify({ sourceNativeParcelId: "B" })}\n`
  );
  writeText(canonicalPath, "A\nC\n");

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-okanogan-delta-adjudication.mjs",
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
  assert.equal(fs.readFileSync(path.join(outRoot, "okanogan-source-only-parcels.txt"), "utf8").trim(), "B");
  assert.equal(fs.readFileSync(path.join(outRoot, "okanogan-canonical-only-parcels.txt"), "utf8").trim(), "C");
  assert.match(fs.readFileSync(outMd, "utf8"), /Okanogan Delta Adjudication/);
});
