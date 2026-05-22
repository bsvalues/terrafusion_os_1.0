#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  buildConditionalLoadPathDesign,
  runConditionalLoadPathDesign
} from "./june10-conditional-load-path-design.mjs";

function readAdapter(countyToken) {
  return JSON.parse(
    fs.readFileSync(path.join("os-platform", "core", "pilot", "evidence", `june10-${countyToken}-readonly-adapter.latest.json`), "utf8")
  );
}

test("conditional design is limited to Cowlitz and Yakima with no DB or runtime claim", () => {
  const report = buildConditionalLoadPathDesign({
    adapterReports: [readAdapter("cowlitz"), readAdapter("yakima")],
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.summary.countiesDesigned, 2);
  assert.deepEqual(report.summary.counties, ["Cowlitz", "Yakima"]);
  assert.equal(report.summary.productionDbMutationAllowed, false);
  assert.equal(report.summary.runtimeClaimAllowed, false);
  assert.equal(report.summary.dryRunOnly, true);
  assert.equal(report.summary.rollbackMode, "no_op_no_transaction_opened");
  assert.equal(report.passed, true);

  for (const county of report.counties) {
    assert.equal(county.dryRunGuard.enabled, true);
    assert.equal(county.dryRunGuard.wouldWriteProductionDb, false);
    assert.equal(county.dryRunGuard.rollbackMode, "no_op_no_transaction_opened");
    assert.equal(county.lineageReceiptFormat.receiptVersion, "june10-conditional-load-dry-run-v1");
    assert.equal(county.projectionEligibility.currentStatus, "blocked_until_terms_and_row_validation");
  }
});

test("conditional design defines staging table shape and required fields", () => {
  const report = buildConditionalLoadPathDesign({
    adapterReports: [readAdapter("cowlitz"), readAdapter("yakima")],
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });
  const byCounty = new Map(report.counties.map((county) => [county.countyToken, county]));

  const cowlitz = byCounty.get("cowlitz");
  assert.equal(cowlitz.stagingTable.schemaName, "staging_county_seed");
  assert.equal(cowlitz.stagingTable.tableName, "conditional_parcel_source_dry_run");
  assert.deepEqual(cowlitz.stagingTable.requiredFields, ["county_token", "source_parcel_id", "source_lineage_receipt_id"]);
  assert.deepEqual(cowlitz.fieldMapping.parcelId.sourceFields, ["PARCNO"]);
  assert.deepEqual(cowlitz.fieldMapping.ownerName.sourceFields, ["DEED_HOLDER_NAME"]);
  assert.deepEqual(cowlitz.fieldMapping.assessedValue.sourceFields, ["LAND_ASSESSED_VALUE", "IMPR_ASSESSED_VALUE"]);

  const yakima = byCounty.get("yakima");
  assert.deepEqual(yakima.fieldMapping.parcelId.sourceFields, ["parcel_number"]);
  assert.deepEqual(yakima.fieldMapping.ownerName.sourceFields, ["owner_name"]);
  assert.deepEqual(yakima.fieldMapping.situsAddress.sourceFields, ["line_1"]);
  assert.deepEqual(yakima.fieldMapping.assessedValue.sourceFields, ["current_assessed_value"]);
  assert.deepEqual(yakima.fieldMapping.optionalFields.landArea.sourceFields, ["total_acres"]);
});

test("conditional design records missing-field policy and validation checks before DB writes", () => {
  const report = buildConditionalLoadPathDesign({
    adapterReports: [readAdapter("cowlitz"), readAdapter("yakima")],
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  for (const county of report.counties) {
    assert.deepEqual(county.missingFieldPolicy.requiredFields, ["county_token", "source_parcel_id", "source_lineage_receipt_id"]);
    assert.ok(county.missingFieldPolicy.optionalNullableFields.includes("owner_name"));
    assert.ok(county.validationChecks.beforeAnyDbWrite.includes("terms_access_review_approved"));
    assert.ok(county.validationChecks.beforeAnyDbWrite.includes("source_parcel_id_present_and_unique_in_batch"));
    assert.ok(county.validationChecks.beforeAnyDbWrite.includes("dry_run_receipt_hash_matches_normalized_payload"));
    assert.ok(county.validationChecks.beforeProjection.includes("county_token_maps_to_registered_terrafusion_county"));
    assert.ok(county.validationChecks.beforeProjection.includes("projection_receipt_target_is_non_production_or_explicitly_authorized"));
  }
});

test("conditional design fails closed if another county is included", () => {
  const report = buildConditionalLoadPathDesign({
    adapterReports: [readAdapter("cowlitz"), readAdapter("king")],
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.passed, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("Only Cowlitz and Yakima")));
});

test("conditional design CLI writes JSON and Markdown evidence", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-conditional-load-design-"));
  const outJson = path.join(temp, "design.json");
  const outMd = path.join(temp, "design.md");

  execFileSync("node", ["os-platform/core/pilot/june10-conditional-load-path-design.mjs", "--out-json", outJson, "--out-md", outMd], {
    cwd: process.cwd(),
    stdio: "pipe"
  });

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");

  assert.equal(report.summary.countiesDesigned, 2);
  assert.match(markdown, /Conditional Load-Path Design/);
  assert.match(markdown, /No production DB mutation/);
  assert.match(markdown, /blocked_until_terms_and_row_validation/);
});

test("conditional design run helper writes evidence", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-conditional-load-helper-"));
  const outJson = path.join(temp, "design.json");
  const outMd = path.join(temp, "design.md");

  const report = runConditionalLoadPathDesign({ outJson, outMd, generatedAtUtc: "2026-05-22T00:00:00.000Z" });

  assert.equal(report.summary.countiesDesigned, 2);
  assert.equal(fs.existsSync(outJson), true);
  assert.equal(fs.existsSync(outMd), true);
});
