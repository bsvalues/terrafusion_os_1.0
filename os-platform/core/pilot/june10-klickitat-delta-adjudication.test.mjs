import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { adjudicateKlickitatDelta, classifyKlickitatDecision, summarizeSourceParsers } from "./june10-klickitat-delta-adjudication.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-klickitat-delta-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

test("classifyKlickitatDecision recognizes full identity closure only on complete overlap", () => {
  assert.equal(
    classifyKlickitatDecision({
      sourceOnlyCount: 0,
      canonicalOnlyCount: 0,
      sourceCoverageRatio: 1,
      sourceArtifactKind: "parcel_inventory"
    }),
    "receipt_backed_full_identity"
  );
});

test("classifyKlickitatDecision blocks partial sales-report semantics", () => {
  assert.equal(
    classifyKlickitatDecision({
      sourceOnlyCount: 12,
      canonicalOnlyCount: 20652,
      sourceCoverageRatio: 0.0306,
      sourceArtifactKind: "sales_report"
    }),
    "blocked_source_semantics"
  );
});

test("classifyKlickitatDecision can identify shell-present candidates when coverage is substantial but incomplete", () => {
  assert.equal(
    classifyKlickitatDecision({
      sourceOnlyCount: 8,
      canonicalOnlyCount: 25,
      sourceCoverageRatio: 0.96,
      sourceArtifactKind: "parcel_inventory"
    }),
    "shell_present_candidate"
  );
});

test("summarizeSourceParsers totals duplicate and null source IDs", () => {
  const summary = summarizeSourceParsers([
    { rowCount: 10, idsExtracted: 8, duplicates: 2, nullOrBlank: 0 },
    { rowCount: 5, idsExtracted: 3, duplicates: 1, nullOrBlank: 1 }
  ]);

  assert.equal(summary.rowCount, 15);
  assert.equal(summary.idsExtracted, 11);
  assert.equal(summary.duplicateRows, 3);
  assert.equal(summary.nullOrBlankRows, 1);
});

test("adjudicateKlickitatDelta compares post-prefix repair identity sets without mutation", () => {
  const report = adjudicateKlickitatDelta({
    sourceIds: ["A", "B", "C", "C"],
    canonicalIds: ["A", "B", "D"],
    acquisitionCounty: {
      parserSummaries: [{ rowCount: 4, idsExtracted: 3, duplicates: 1, nullOrBlank: 0 }],
      receiptCandidate: { artifacts: [{ path: "source.xlsx", sha256: "abc" }] }
    },
    repairCounty: {
      validation: { duplicateCountyIdParcelNumberAfter: 0, sourceOverlapAfterPrefixRemoval: 2 },
      receiptCandidate: { receiptId: "repair" }
    }
  });

  assert.equal(report.summary.sourceDistinctParcelIds, 3);
  assert.equal(report.summary.canonicalDistinctParcelIdsAfterPrefixRepair, 3);
  assert.equal(report.summary.sourceOnlyCount, 1);
  assert.equal(report.summary.canonicalOnlyCount, 1);
  assert.equal(report.summary.duplicateSourceRows, 1);
  assert.equal(report.decision, "blocked_source_semantics");
  assert.equal(report.databaseMutationAttempted, false);
  assert.equal(report.productionBindingAllowed, false);
});

test("CLI writes Klickitat delta evidence and delta lists", () => {
  const root = tmpRoot();
  const acquisitionPath = path.join(root, "acquisition.json");
  const repairPath = path.join(root, "repair.json");
  const sourcePath = path.join(root, "source.jsonl");
  const canonicalPath = path.join(root, "canonical.txt");
  const outRoot = path.join(root, "out");
  const outJson = path.join(root, "klickitat.json");
  const outMd = path.join(root, "klickitat.md");

  writeJson(acquisitionPath, {
    counties: [
      {
        county: "Klickitat",
        parserSummaries: [{ rowCount: 3, idsExtracted: 2, duplicates: 1, nullOrBlank: 0 }],
        receiptCandidate: { artifacts: [{ path: "source.xlsx", sha256: "abc" }] }
      }
    ]
  });
  writeJson(repairPath, {
    counties: [{ county: "Klickitat", validation: { duplicateCountyIdParcelNumberAfter: 0 }, receiptCandidate: { receiptId: "repair" } }]
  });
  writeText(
    sourcePath,
    `${JSON.stringify({ sourceNativeParcelId: "A" })}\n${JSON.stringify({ sourceNativeParcelId: "B" })}\n`
  );
  writeText(canonicalPath, "A\nC\n");

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-klickitat-delta-adjudication.mjs",
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
  assert.equal(fs.readFileSync(path.join(outRoot, "klickitat-source-only-parcels.txt"), "utf8").trim(), "B");
  assert.equal(fs.readFileSync(path.join(outRoot, "klickitat-canonical-only-parcels.txt"), "utf8").trim(), "C");
  assert.match(fs.readFileSync(outMd, "utf8"), /Klickitat Delta Adjudication/);
});
