import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildSkagitPrefixRepairPlan,
  duplicateGroupCount,
  parseCanonicalRows,
  parseSourceIds
} from "./june10-skagit-prefix-repair-dry-run.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-skagit-prefix-dry-run-"));
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

test("parseSourceIds reads source-native Skagit PARCELID JSONL", () => {
  const root = tmpRoot();
  const sourcePath = path.join(root, "source.jsonl");
  writeText(sourcePath, `${JSON.stringify({ sourceNativeParcelId: "P1" })}\n${JSON.stringify({ sourceNativeParcelId: "P2" })}\n`);

  assert.deepEqual([...parseSourceIds(sourcePath)].sort(), ["P1", "P2"]);
});

test("parseCanonicalRows reads canonical parcel rows", () => {
  const root = tmpRoot();
  const canonicalPath = path.join(root, "canonical.jsonl");
  writeText(
    canonicalPath,
    `${JSON.stringify({ tfParcelId: "a", parcelNumber: "057-P1" })}\n${JSON.stringify({ tfParcelId: "b", parcelNumber: "057-P2" })}\n`
  );

  const rows = parseCanonicalRows(canonicalPath);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].parcelNumber, "057-P1");
});

test("buildSkagitPrefixRepairPlan updates matched rows, supersedes stale rows, and stages source-only rows", () => {
  const plan = buildSkagitPrefixRepairPlan({
    sourceIds: new Set(["P1", "P2", "P3"]),
    canonicalRows: [
      { tfParcelId: "a", parcelNumber: "057-P1", terraFusionParcelKey: "53057:057-P1" },
      { tfParcelId: "b", parcelNumber: "057-P2", terraFusionParcelKey: "53057:057-P2" },
      { tfParcelId: "c", parcelNumber: "057-P4", terraFusionParcelKey: "53057:057-P4" }
    ]
  });

  assert.equal(plan.updateTargets.length, 2);
  assert.equal(plan.supersedeTargets.length, 1);
  assert.equal(plan.stageInsertTargets.length, 1);
  assert.equal(plan.postRepairProjection.duplicateGroups, 0);
  assert.equal(plan.postRepairProjection.sourceOnlyCount, 0);
  assert.equal(plan.postRepairProjection.canonicalOnlyCount, 0);
  assert.equal(plan.updateTargets[0].legacyImportedParcelKey, "057-P1");
  assert.equal(plan.updateTargets[0].proposedTerraFusionParcelKey, "53057:P1");
});

test("duplicateGroupCount detects duplicate projected parcel numbers", () => {
  assert.equal(duplicateGroupCount(["P1", "P1", "P2"]), 1);
  assert.equal(duplicateGroupCount(["P1", "P2"]), 0);
});

test("CLI writes dry-run artifacts and keeps mutation disabled", () => {
  const root = tmpRoot();
  const sourcePath = path.join(root, "source.jsonl");
  const canonicalPath = path.join(root, "canonical.jsonl");
  const outRoot = path.join(root, "out");
  const outJson = path.join(root, "latest.json");
  const outMd = path.join(root, "latest.md");

  writeText(sourcePath, `${JSON.stringify({ sourceNativeParcelId: "P1" })}\n${JSON.stringify({ sourceNativeParcelId: "P2" })}\n`);
  writeText(
    canonicalPath,
    `${JSON.stringify({ tfParcelId: "a", parcelNumber: "057-P1" })}\n${JSON.stringify({ tfParcelId: "b", parcelNumber: "057-P3" })}\n`
  );

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-skagit-prefix-repair-dry-run.mjs",
      "--source-ids",
      sourcePath,
      "--canonical-rows",
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
  assert.equal(report.county, "Skagit");
  assert.equal(report.databaseMutationAttempted, false);
  assert.equal(report.productionBindingAllowed, false);
  assert.equal(report.artifacts.updateTargets.path.endsWith("update-targets.jsonl"), true);
  assert.match(fs.readFileSync(outMd, "utf8"), /Skagit Prefix Repair Dry-Run/);
});
