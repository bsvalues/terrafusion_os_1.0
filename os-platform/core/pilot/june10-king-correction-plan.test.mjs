#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildKingCorrectionPlan } from "./june10-king-correction-plan.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-king-correction-plan-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeLines(filePath, values) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${values.join("\n")}\n`);
}

const adjudication = {
  summary: {
    sourceOnlyCount: 4,
    canonicalOnlyCount: 3,
    exactOverlap: 10,
    sourceDuplicateExtraRows: 2,
    sourceCaptureComplete: true
  },
  caseNormalizationEdges: {
    count: 1,
    sample: [{ sourceValue: "abc-tr", canonicalValue: "ABC-TR" }]
  }
};

const dbInspection = {
  available: true,
  rows: [
    {
      parcelNumber: "ABC-TR",
      parcelStatus: "ACTIVE",
      propertyType: "placeholder",
      conversionEra: "WA_INITIAL_SEED",
      identityRepairReceiptId: "repair"
    },
    {
      parcelNumber: "103",
      parcelStatus: "ACTIVE",
      propertyType: "residential",
      conversionEra: "WA_INITIAL_SEED",
      identityRepairReceiptId: "repair"
    },
    {
      parcelNumber: "104",
      parcelStatus: "INACTIVE",
      propertyType: "commercial",
      conversionEra: "WA_INITIAL_SEED",
      identityRepairReceiptId: "repair"
    }
  ],
  error: null
};

test("buildKingCorrectionPlan separates case-only edges from true source/canonical deltas", () => {
  const plan = buildKingCorrectionPlan({
    adjudication,
    canonicalOnlyRows: ["ABC-TR", "103", "104"],
    sourceOnlyRows: ["abc-tr", "102", "105", "106"],
    dbInspection
  });

  assert.equal(plan.countyName, "King County");
  assert.equal(plan.databaseMutationAllowed, false);
  assert.equal(plan.productionBindingAllowed, false);
  assert.equal(plan.casePolicy.selectedPolicy, "preserve_source_pin_case_exactly");
  assert.equal(plan.sourceOnlyPlan.trueSourceOnlyRows, 3);
  assert.equal(plan.canonicalOnlyPlan.trueCanonicalOnlyRows, 2);
  assert.equal(plan.canonicalOnlyPlan.dbInspection.inspectedRows, 3);
  assert.ok(plan.blockers.some((blocker) => blocker.includes("3 true source-only")));
  assert.ok(plan.blockers.some((blocker) => blocker.includes("2 true canonical-only")));
});

test("buildKingCorrectionPlan blocks when DB detail is unavailable", () => {
  const plan = buildKingCorrectionPlan({
    adjudication,
    canonicalOnlyRows: ["ABC-TR", "103", "104"],
    sourceOnlyRows: ["abc-tr", "102", "105", "106"],
    dbInspection: { available: false, rows: [], error: "database offline" }
  });

  assert.equal(plan.canonicalOnlyPlan.dbInspection.available, false);
  assert.ok(plan.blockers.some((blocker) => blocker.includes("DB row detail")));
});

test("CLI writes King correction plan evidence", () => {
  const root = tmpRoot();
  const adjudicationPath = path.join(root, "adjudication.json");
  const canonicalOnlyPath = path.join(root, "canonical-only.txt");
  const sourceOnlyPath = path.join(root, "source-only.txt");
  const outJson = path.join(root, "plan.json");
  const outMd = path.join(root, "plan.md");
  const outRoot = path.join(root, "out");

  writeJson(adjudicationPath, adjudication);
  writeLines(canonicalOnlyPath, ["ABC-TR", "103", "104"]);
  writeLines(sourceOnlyPath, ["abc-tr", "102", "105", "106"]);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-king-correction-plan.mjs",
      "--adjudication",
      adjudicationPath,
      "--canonical-only",
      canonicalOnlyPath,
      "--source-only",
      sourceOnlyPath,
      "--out-json",
      outJson,
      "--out-md",
      outMd,
      "--out-root",
      outRoot
    ],
    {
      cwd: process.cwd(),
      stdio: "pipe",
      env: {
        ...process.env,
        TF_PG_CONTAINER: "definitely-missing-container"
      }
    }
  );

  const plan = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(plan.certificationAllowed, false);
  assert.match(fs.readFileSync(outMd, "utf8"), /King Correction Plan/);
  assert.ok(fs.existsSync(path.join(outRoot, "king-canonical-only-db-detail.json")));
});
