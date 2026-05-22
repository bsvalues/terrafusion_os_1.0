#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  buildYakimaDryRunRowValidation,
  runYakimaDryRunRowValidation,
  validateYakimaRows
} from "./june10-yakima-dry-run-row-validation.mjs";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readYakimaAdapter() {
  return readJson(path.join("os-platform", "core", "pilot", "evidence", "june10-yakima-readonly-adapter.latest.json"));
}

function readAuthorizationPolicy() {
  return readJson(
    path.join("os-platform", "core", "pilot", "evidence", "june10-production-ingestion-authorization-policy.latest.json")
  );
}

test("Yakima dry-run validates schema and keeps extraction blocked by terms", () => {
  const report = buildYakimaDryRunRowValidation({
    adapterReport: readYakimaAdapter(),
    authorizationPolicy: readAuthorizationPolicy(),
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.county, "Yakima");
  assert.equal(report.countyToken, "yakima");
  assert.equal(report.termsLicensing.state, "not_approved");
  assert.equal(report.extraction.mode, "metadata_config_only_no_feature_query");
  assert.equal(report.extraction.featureQueryAttempted, false);
  assert.equal(report.extraction.rowsFetched, 0);
  assert.equal(report.validation.schemaValid, true);
  assert.equal(report.validation.parcelIdField, "parcel_number");
  assert.equal(report.validation.parcelIdPresencePercent, null);
  assert.equal(report.validation.duplicateParcelIds, 0);
  assert.equal(report.validation.productionRowsWritten, 0);
  assert.equal(report.authorization.authorizedForProductionLoad, false);
  assert.equal(report.authorization.authorizedForProjection, false);
  assert.equal(report.authorization.authorizedForRuntimeRegistration, false);
  assert.equal(report.passed, true);
});

test("Yakima dry-run emits rejected-row report and lineage receipt", () => {
  const report = buildYakimaDryRunRowValidation({
    adapterReport: readYakimaAdapter(),
    authorizationPolicy: readAuthorizationPolicy(),
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.rejectedRowReport.reportVersion, "june10-yakima-rejected-row-report-v1");
  assert.equal(report.rejectedRowReport.summary.rowsExamined, 0);
  assert.equal(report.rejectedRowReport.summary.rowsRejected, 0);
  assert.deepEqual(report.rejectedRowReport.batchRejections, [
    {
      reasonCode: "TERMS_LICENSE_NOT_APPROVED",
      message: "Spatialest row extraction is blocked until Yakima terms/licensing approval is explicit."
    }
  ]);

  assert.equal(report.dryRunLineageReceipt.receiptVersion, "june10-yakima-dry-run-lineage-v1");
  assert.equal(report.dryRunLineageReceipt.counts.sourceRowsExamined, 0);
  assert.equal(report.dryRunLineageReceipt.counts.productionRowsWritten, 0);
  assert.equal(report.dryRunLineageReceipt.runtimeClaimAllowed, false);
  assert.equal(report.dryRunLineageReceipt.dbMutationAllowed, false);
});

test("Yakima row validator detects missing parcel IDs and duplicates", () => {
  const validation = validateYakimaRows({
    rows: [
      { parcel_number: "181321-12401", owner_name: "A", current_assessed_value: "10" },
      { parcel_number: "", owner_name: "B" },
      { parcel_number: "181321-12401", owner_name: "C" }
    ],
    parcelIdField: "parcel_number"
  });

  assert.equal(validation.rowsExamined, 3);
  assert.equal(validation.rowsAccepted, 1);
  assert.equal(validation.rowsRejected, 2);
  assert.equal(validation.parcelIdPresencePercent, 66.6667);
  assert.equal(validation.duplicateParcelIds, 1);
  assert.deepEqual(
    validation.rejectedRows.map((row) => row.reasonCode),
    ["MISSING_SOURCE_PARCEL_ID", "DUPLICATE_SOURCE_PARCEL_ID"]
  );
});

test("Yakima dry-run fails closed if adapter is not Yakima", () => {
  const adapter = readYakimaAdapter();
  adapter.countyToken = "cowlitz";

  const report = buildYakimaDryRunRowValidation({
    adapterReport: adapter,
    authorizationPolicy: readAuthorizationPolicy(),
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.passed, false);
  assert.ok(report.blockers.includes("Adapter report is not for Yakima."));
});

test("Yakima dry-run CLI writes validation, rejected-row, and lineage evidence", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-yakima-dry-run-"));
  const outJson = path.join(temp, "validation.json");
  const outMd = path.join(temp, "validation.md");
  const rejectedRowsJson = path.join(temp, "rejected.json");
  const lineageReceiptJson = path.join(temp, "lineage.json");

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-yakima-dry-run-row-validation.mjs",
      "--out-json",
      outJson,
      "--out-md",
      outMd,
      "--rejected-rows-json",
      rejectedRowsJson,
      "--lineage-receipt-json",
      lineageReceiptJson
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = readJson(outJson);
  const markdown = fs.readFileSync(outMd, "utf8");
  const rejectedRows = readJson(rejectedRowsJson);
  const lineageReceipt = readJson(lineageReceiptJson);

  assert.equal(report.countyToken, "yakima");
  assert.match(markdown, /Yakima Dry-Run Row Validation/);
  assert.equal(rejectedRows.reportVersion, "june10-yakima-rejected-row-report-v1");
  assert.equal(lineageReceipt.receiptVersion, "june10-yakima-dry-run-lineage-v1");
});

test("Yakima dry-run run helper writes evidence", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-yakima-helper-"));
  const outJson = path.join(temp, "validation.json");
  const outMd = path.join(temp, "validation.md");
  const rejectedRowsJson = path.join(temp, "rejected.json");
  const lineageReceiptJson = path.join(temp, "lineage.json");

  const report = runYakimaDryRunRowValidation({
    outJson,
    outMd,
    rejectedRowsJson,
    lineageReceiptJson,
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.countyToken, "yakima");
  assert.equal(fs.existsSync(outJson), true);
  assert.equal(fs.existsSync(outMd), true);
  assert.equal(fs.existsSync(rejectedRowsJson), true);
  assert.equal(fs.existsSync(lineageReceiptJson), true);
});
