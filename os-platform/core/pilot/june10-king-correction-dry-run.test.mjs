#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildKingCorrectionDryRun } from "./june10-king-correction-dry-run.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-king-correction-dry-run-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeLines(filePath, values) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${values.join("\n")}\n`);
}

const plan = {
  sourceOnlyPlan: {
    trueSourceOnlyRows: 2,
    sourceCaptureComplete: true
  },
  canonicalOnlyPlan: {
    trueCanonicalOnlyRows: 1,
    dbInspection: {
      available: true,
      rows: [
        {
          tfParcelId: "row-case",
          parcelNumber: "ABC-TR",
          parcelStatus: "ACTIVE",
          propertyType: "33-0",
          conversionEra: "WA_INITIAL_SEED",
          legacyImportedParcelKey: "033-ABC-TR",
          terraFusionParcelKey: "53033:ABC-TR",
          identityRepairReceiptId: "repair"
        },
        {
          tfParcelId: "row-stale",
          parcelNumber: "103",
          parcelStatus: "ACTIVE",
          propertyType: "11",
          conversionEra: "WA_INITIAL_SEED",
          legacyImportedParcelKey: "033-103",
          terraFusionParcelKey: "53033:103",
          identityRepairReceiptId: "repair"
        }
      ]
    }
  },
  casePolicy: {
    selectedPolicy: "preserve_source_pin_case_exactly"
  }
};

const adjudication = {
  summary: {
    sourceOnlyCount: 3,
    canonicalOnlyCount: 2,
    exactOverlap: 10
  },
  caseNormalizationEdges: {
    count: 1,
    sample: [{ sourceValue: "abc-tr", canonicalValue: "ABC-TR" }]
  },
  serviceFacts: {
    geometryCaptured: false,
    ownerFieldsCaptured: false,
    documentsPlaceholderPolygons: true
  }
};

test("buildKingCorrectionDryRun separates case updates, supersedes, and non-loadable source staging", () => {
  const dryRun = buildKingCorrectionDryRun({
    correctionPlan: plan,
    adjudication,
    sourceOnlyRows: ["abc-tr", "102", "105"],
    canonicalOnlyRows: ["ABC-TR", "103"],
    sourceProbe: {
      available: true,
      probes: {
        "103": { presentInSource: false }
      }
    }
  });

  assert.equal(dryRun.databaseMutationAttempted, false);
  assert.equal(dryRun.productionBindingAllowed, false);
  assert.equal(dryRun.summary.proposedCaseCorrections, 1);
  assert.equal(dryRun.summary.proposedSupersedes, 1);
  assert.equal(dryRun.summary.proposedStageRows, 2);
  assert.equal(dryRun.validation.countyIdParcelNumberDuplicatesAfter, 0);
  assert.equal(dryRun.validation.postCorrectionIdentityParityWouldBeAchieved, true);
  assert.equal(dryRun.validation.sourceOnlyRowsLoadableWithRequiredFields, false);
  assert.equal(dryRun.validation.canonicalOnlyRowsSafeToSupersede, true);
  assert.equal(dryRun.result, "DRY_RUN_BLOCKED_REQUIRED_FIELDS");
});

test("buildKingCorrectionDryRun blocks supersede when source probe finds canonical-only row", () => {
  const dryRun = buildKingCorrectionDryRun({
    correctionPlan: plan,
    adjudication,
    sourceOnlyRows: ["abc-tr", "102", "105"],
    canonicalOnlyRows: ["ABC-TR", "103"],
    sourceProbe: {
      available: true,
      probes: {
        "103": { presentInSource: true }
      }
    }
  });

  assert.equal(dryRun.validation.canonicalOnlyRowsSafeToSupersede, false);
  assert.equal(dryRun.result, "DRY_RUN_BLOCKED_CANONICAL_SOURCE_CONFLICT");
  assert.ok(dryRun.blockers.some((blocker) => blocker.includes("present in current source")));
});

test("CLI writes King dry-run evidence", () => {
  const root = tmpRoot();
  const planPath = path.join(root, "plan.json");
  const adjudicationPath = path.join(root, "adjudication.json");
  const sourceOnlyPath = path.join(root, "source-only.txt");
  const canonicalOnlyPath = path.join(root, "canonical-only.txt");
  const sourceProbePath = path.join(root, "source-probe.json");
  const dbDetailPath = path.join(root, "db-detail.json");
  const outRoot = path.join(root, "out");
  const outJson = path.join(root, "dry-run.json");
  const outMd = path.join(root, "dry-run.md");

  writeJson(planPath, plan);
  writeJson(adjudicationPath, adjudication);
  writeLines(sourceOnlyPath, ["abc-tr", "102", "105"]);
  writeLines(canonicalOnlyPath, ["ABC-TR", "103"]);
  writeJson(sourceProbePath, {
    available: true,
    probes: {
      "103": { presentInSource: false }
    }
  });
  writeJson(dbDetailPath, {
    available: true,
    rows: plan.canonicalOnlyPlan.dbInspection.rows
  });

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-king-correction-dry-run.mjs",
      "--plan",
      planPath,
      "--adjudication",
      adjudicationPath,
      "--source-only",
      sourceOnlyPath,
      "--canonical-only",
      canonicalOnlyPath,
      "--source-probe",
      sourceProbePath,
      "--db-detail",
      dbDetailPath,
      "--out-root",
      outRoot,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const dryRun = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(dryRun.summary.proposedStageRows, 2);
  assert.ok(fs.existsSync(path.join(outRoot, "proposed-supersede-list.json")));
  assert.ok(fs.existsSync(path.join(outRoot, "proposed-stage-list.json")));
  assert.ok(fs.existsSync(path.join(outRoot, "rollback-plan.sql")));
  assert.match(fs.readFileSync(outMd, "utf8"), /King Correction Dry-Run/);
});
