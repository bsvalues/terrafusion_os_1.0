import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  buildKingSourceCompletenessCapture,
  normalizeKingSourceRows,
  summarizeKingSourceCompleteness
} from "./june10-king-source-completeness-capture.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-king-source-completeness-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeLines(filePath, values) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${values.join("\n")}\n`);
}

const dryRun = {
  proposedStageRows: [
    { parcelNumber: "0009100000" },
    { parcelNumber: "0126049178" },
    { parcelNumber: "TRACT-A" }
  ]
};

const serviceMetadata = {
  description: "This layer includes place-holder polygons and stacked polygon geometry for undivided interest and vertical parcels.",
  fields: [
    { name: "OBJECTID" },
    { name: "MAJOR" },
    { name: "MINOR" },
    { name: "PIN" },
    { name: "Shape_Length" },
    { name: "Shape_Area" }
  ],
  indexes: [{ fields: "PIN", isUnique: false }]
};

test("normalizeKingSourceRows preserves one loadable identity row per PIN and records duplicate geometry rows", () => {
  const rows = normalizeKingSourceRows({
    requestedPins: ["0009100000", "0126049178", "TRACT-A"],
    features: [
      { attributes: { OBJECTID: 1, PIN: "0009100000", MAJOR: "000910", MINOR: "0000", Shape_Length: 10, Shape_Area: 20 } },
      { attributes: { OBJECTID: 2, PIN: "0009100000", MAJOR: "000910", MINOR: "0000", Shape_Length: 11, Shape_Area: 21 } },
      { attributes: { OBJECTID: 3, PIN: "0126049178", MAJOR: "012604", MINOR: "9178", Shape_Length: 10, Shape_Area: 20 } },
      { attributes: { OBJECTID: 4, PIN: "TRACT-A", MAJOR: "TRACT", MINOR: "A", Shape_Length: 0, Shape_Area: 0 } }
    ]
  });

  assert.equal(rows.normalizedRows.length, 3);
  assert.equal(rows.duplicateGeometryRows, 1);
  assert.equal(rows.normalizedRows[0].loadableAsRuntimeParcelShell, true);
  assert.equal(rows.normalizedRows[2].placeholderReviewRequired, true);
  assert.equal(rows.missingPins.length, 0);
});

test("summarizeKingSourceCompleteness reports runtime shell loadability but keeps workflow completeness blocked", () => {
  const normalized = normalizeKingSourceRows({
    requestedPins: ["0009100000", "0126049178"],
    features: [
      { attributes: { OBJECTID: 1, PIN: "0009100000", MAJOR: "000910", MINOR: "0000", Shape_Length: 10, Shape_Area: 20 } },
      { attributes: { OBJECTID: 2, PIN: "0126049178", MAJOR: "012604", MINOR: "9178", Shape_Length: 10, Shape_Area: 20 } }
    ]
  });

  const report = summarizeKingSourceCompleteness({
    generatedAt: "2026-05-26T00:00:00.000Z",
    requestedPins: ["0009100000", "0126049178"],
    normalized,
    serviceMetadata,
    rawArtifactPath: "raw.jsonl",
    rawArtifactSha256: "abc",
    captureReceiptPath: "receipt.json"
  });

  assert.equal(report.summary.requestedSourceOnlyPins, 2);
  assert.equal(report.summary.presentInRicherSourceArtifact, 2);
  assert.equal(report.summary.loadableAsRuntimeParcelShell, 2);
  assert.equal(report.validation.allSourceOnlyPinsAccountedFor, true);
  assert.equal(report.validation.ownerAddressValueWorkflowComplete, false);
  assert.equal(report.productionBindingAllowed, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("owner/address/value")));
});

test("CLI writes King source completeness capture evidence from existing raw artifact", () => {
  const root = tmpRoot();
  const dryRunPath = path.join(root, "dry-run.json");
  const serviceMetadataPath = path.join(root, "service.json");
  const rawPath = path.join(root, "raw.jsonl");
  const outRoot = path.join(root, "out");
  const outJson = path.join(root, "latest.json");
  const outMd = path.join(root, "latest.md");

  writeJson(dryRunPath, dryRun);
  writeJson(serviceMetadataPath, serviceMetadata);
  fs.writeFileSync(rawPath, `${JSON.stringify({ features: [
    { attributes: { OBJECTID: 1, PIN: "0009100000", MAJOR: "000910", MINOR: "0000", Shape_Length: 10, Shape_Area: 20 } },
    { attributes: { OBJECTID: 2, PIN: "0126049178", MAJOR: "012604", MINOR: "9178", Shape_Length: 10, Shape_Area: 20 } },
    { attributes: { OBJECTID: 3, PIN: "TRACT-A", MAJOR: "TRACT", MINOR: "A", Shape_Length: 0, Shape_Area: 0 } }
  ] })}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-king-source-completeness-capture.mjs",
      "--dry-run",
      dryRunPath,
      "--service-metadata",
      serviceMetadataPath,
      "--raw-artifact",
      rawPath,
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
  assert.equal(report.summary.presentInRicherSourceArtifact, 3);
  assert.ok(fs.existsSync(path.join(outRoot, "king-source-completeness-capture-receipt.json")));
  assert.ok(fs.existsSync(path.join(outRoot, "king-source-only-runtime-shell-stage-list.json")));
  assert.ok(fs.existsSync(path.join(outRoot, "king-source-completeness-rejected-rows.json")));
  assert.match(fs.readFileSync(outMd, "utf8"), /King Source Completeness Capture/);
});
