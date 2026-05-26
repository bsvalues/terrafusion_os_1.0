#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildKingParcelShellLoadPolicy } from "./june10-king-parcel-shell-load-policy.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-king-parcel-shell-policy-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

const sourceCompleteness = {
  countyName: "King County",
  fips: "53033",
  summary: {
    requestedSourceOnlyPins: 4,
    presentInRicherSourceArtifact: 4,
    loadableAsRuntimeParcelShell: 4,
    missingFromRicherSourceArtifact: 0,
    rejectedRows: 0,
    duplicateGeometryRows: 0,
    placeholderReviewRows: 1
  },
  validation: {
    allSourceOnlyPinsAccountedFor: true,
    runtimeShellFieldsComplete: true,
    ownerAddressValueWorkflowComplete: false,
    noDatabaseWrites: true
  },
  artifacts: {
    rawArtifactSha256: "abc123",
    rawArtifactPath: "raw.jsonl"
  },
  terms: {
    documentsPlaceholderPolygons: true,
    documentsStackedGeometry: true,
    pinIndexUnique: false
  }
};

const stageRows = [
  { parcelNumber: "0009100000", loadableAsRuntimeParcelShell: true, placeholderReviewRequired: false },
  { parcelNumber: "0126049178", loadableAsRuntimeParcelShell: true, placeholderReviewRequired: false },
  { parcelNumber: "0126049179", loadableAsRuntimeParcelShell: true, placeholderReviewRequired: false },
  { parcelNumber: "781250TR-A", loadableAsRuntimeParcelShell: true, placeholderReviewRequired: true }
];

test("buildKingParcelShellLoadPolicy allows normal shell candidates and holds placeholder rows", () => {
  const policy = buildKingParcelShellLoadPolicy({ sourceCompleteness, stageRows });

  assert.equal(policy.trustLabel, "KING_PUBLIC_PARCEL_SHELL");
  assert.equal(policy.databaseMutationAttempted, false);
  assert.equal(policy.productionBindingAllowed, false);
  assert.equal(policy.certificationAllowed, false);
  assert.equal(policy.policy.allowParcelShellRowsInCanonicalRuntime, true);
  assert.equal(policy.loadabilityMatrix.shellLoadCandidates, 3);
  assert.equal(policy.loadabilityMatrix.placeholderReviewQueue, 1);
  assert.equal(policy.loadabilityMatrix.workflowCompleteRows, 0);
  assert.ok(policy.blockedActions.includes("owner_address_value_dependent_workflows"));
  assert.ok(policy.receiptLanguage.some((line) => line.includes("not certified workflow-complete")));
});

test("buildKingParcelShellLoadPolicy blocks shell loading when runtime shell evidence is incomplete", () => {
  const policy = buildKingParcelShellLoadPolicy({
    sourceCompleteness: {
      ...sourceCompleteness,
      validation: {
        ...sourceCompleteness.validation,
        runtimeShellFieldsComplete: false
      }
    },
    stageRows
  });

  assert.equal(policy.policy.allowParcelShellRowsInCanonicalRuntime, false);
  assert.equal(policy.loadabilityMatrix.shellLoadCandidates, 0);
  assert.ok(policy.blockers.some((blocker) => blocker.includes("runtime shell fields")));
});

test("CLI writes King parcel shell load policy evidence", () => {
  const root = tmpRoot();
  const sourceCompletenessPath = path.join(root, "source-completeness.json");
  const stageRowsPath = path.join(root, "stage-rows.json");
  const outRoot = path.join(root, "out");
  const outJson = path.join(root, "policy.json");
  const outMd = path.join(root, "policy.md");

  writeJson(sourceCompletenessPath, sourceCompleteness);
  writeJson(stageRowsPath, stageRows);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-king-parcel-shell-load-policy.mjs",
      "--source-completeness",
      sourceCompletenessPath,
      "--stage-rows",
      stageRowsPath,
      "--out-root",
      outRoot,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const policy = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(policy.loadabilityMatrix.shellLoadCandidates, 3);
  assert.ok(fs.existsSync(path.join(outRoot, "king-parcel-shell-load-policy.json")));
  assert.ok(fs.existsSync(path.join(outRoot, "king-parcel-shell-loadability-matrix.json")));
  assert.match(fs.readFileSync(outMd, "utf8"), /King Parcel Shell Load Policy/);
});
