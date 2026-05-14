import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFileSync } from "node:child_process";

import { validateReceipt, validateReceiptRoot } from "./june10-seed-receipt-validator.mjs";

const scriptPath = path.resolve("os-platform/core/pilot/june10-seed-receipt-validator.mjs");
const sha = "a".repeat(64);

function baseReceipt(overrides = {}) {
  return {
    receiptVersion: "june10-seed-v1",
    status: "LIMITED_WORKFLOW_READY",
    county: "Yakima",
    countyToken: "yakima",
    state: "WA",
    fips: "53077",
    capturedAtUtc: "2026-05-14T00:00:00.000Z",
    capturedBy: "test",
    sourceFamily: "Direct sales search",
    sourceSystem: {
      name: "Yakima Spatialest",
      url: "https://property.spatialest.com/wa/yakima#/",
      accessType: "public",
      requiresCredential: false
    },
    rawArtifacts: [
      {
        path: "raw/yakima-parcels.json",
        sha256: sha,
        bytes: 100,
        recordCount: 1,
        capturedAtUtc: "2026-05-14T00:00:00.000Z"
      }
    ],
    normalizedArtifacts: [
      {
        path: "normalized/yakima-parcels.normalized.jsonl",
        sha256: sha,
        schema: "terrafusion-public-parcel-v1",
        recordCount: 1
      }
    ],
    target: {
      terrafusionDbIdentity: "sha256:redacted",
      databaseRole: "38-county-seed-staging",
      schema: "public_seed",
      tables: ["tf_seed_parcel"]
    },
    counts: {
      parcelRowsRaw: 1,
      parcelRowsNormalized: 1,
      parcelRowsLoaded: 1,
      distinctParcelIdsLoaded: 1,
      activeCurrentParcelIdsLoaded: null,
      salesRowsRaw: 0,
      salesRowsNormalized: 0,
      salesRowsLoaded: 0,
      geometryRowsLoaded: 0
    },
    coverage: {
      parcelStatusSemantics: "unknown",
      taxYearSemantics: "unknown",
      salesDateRange: { min: null, max: null },
      expectedActiveParcelRange: { min: null, max: null, source: null }
    },
    apiProof: {
      endpoint: "http://localhost:5046/api/counties/yakima/parcels",
      status: 200,
      payloadCounty: "Yakima",
      countyEcho: true,
      fallbackDetected: false,
      rowCount: 1
    },
    uiSmoke: {
      performed: true,
      frontendUrl: "http://localhost:5173/forge/county-studio",
      screenshotFolder: "evidence/june10-uat/test",
      trustLabelVisible: true,
      unsupportedWorkflowLabelsVisible: true
    },
    workflowLabels: {
      parcelInspection: "limited",
      salesReview: "blocked",
      mapInspection: "blocked",
      costForgeEstimate: "blocked",
      officialValuation: "blocked"
    },
    claimLabel: "limited workflow",
    warnings: [],
    blockers: [],
    noSecretValuesRecorded: true,
    ...overrides
  };
}

test("validates a complete limited-workflow receipt", () => {
  const result = validateReceipt(baseReceipt());

  assert.equal(result.passed, true);
  assert.equal(result.derivedStatus, "LIMITED_WORKFLOW_READY");
  assert.equal(result.gates.A.passed, true);
  assert.equal(result.gates.E.passed, true);
});

test("rejects overclaimed status when only source snapshot is present", () => {
  const receipt = baseReceipt({
    status: "LIMITED_WORKFLOW_READY",
    normalizedArtifacts: [],
    target: {},
    counts: {
      parcelRowsRaw: 1,
      parcelRowsNormalized: 0,
      parcelRowsLoaded: 0,
      distinctParcelIdsLoaded: 0
    },
    apiProof: {},
    uiSmoke: {},
    claimLabel: "limited workflow"
  });

  const result = validateReceipt(receipt);

  assert.equal(result.passed, false);
  assert.equal(result.derivedStatus, "SNAPSHOT_CAPTURED");
  assert.ok(result.blockers.some((item) => item.includes("does not match derived status")));
});

test("rejects receipts that record secret-like values", () => {
  const receipt = baseReceipt({
    sourceSystem: {
      name: "Bad source",
      url: "https://example.test",
      accessType: "public",
      apiKey: "do-not-record"
    }
  });

  const result = validateReceipt(receipt);

  assert.equal(result.passed, false);
  assert.ok(result.blockers.some((item) => item.includes("Secret-like value")));
});

test("root validation accepts an empty pre-seed folder as no-receipts state", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-seed-empty-"));
  const report = validateReceiptRoot(root);

  assert.equal(report.summary.receiptsFound, 0);
  assert.equal(report.summary.noReceiptsFound, true);
  assert.equal(report.summary.failed, 0);
});

test("CLI writes JSON and Markdown validation reports", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-seed-cli-"));
  const countyDir = path.join(root, "yakima");
  fs.mkdirSync(countyDir, { recursive: true });
  fs.writeFileSync(
    path.join(countyDir, "source-snapshot-receipt.json"),
    `${JSON.stringify(baseReceipt(), null, 2)}\n`
  );

  const outJson = path.join(root, "out.json");
  const outMd = path.join(root, "out.md");

  execFileSync("node", [scriptPath, "--root", root, "--out-json", outJson, "--out-md", outMd], {
    cwd: process.cwd(),
    stdio: "pipe"
  });

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");

  assert.equal(report.summary.receiptsFound, 1);
  assert.equal(report.summary.passed, true);
  assert.match(markdown, /Yakima/);
});
