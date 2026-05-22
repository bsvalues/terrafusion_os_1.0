import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  buildWaveAAdapterQualityReview,
  runWaveAAdapterQualityReview
} from "./june10-wave-a-adapter-quality-review.mjs";

const verifiedCounties = ["cowlitz", "yakima", "spokane", "clark", "king"];

function readFixture(name) {
  return JSON.parse(fs.readFileSync(path.join("os-platform", "core", "pilot", "evidence", name), "utf8"));
}

test("quality review audits the five verified Wave A adapters without runtime claims", () => {
  const reports = verifiedCounties.map((county) => readFixture(`june10-${county}-readonly-adapter.latest.json`));
  const review = buildWaveAAdapterQualityReview({ adapterReports: reports, generatedAtUtc: "2026-05-22T00:00:00.000Z" });

  assert.equal(review.summary.reviewedAdapters, 5);
  assert.deepEqual(review.summary.countiesReviewed, ["Clark", "Cowlitz", "King", "Spokane", "Yakima"]);
  assert.equal(review.summary.verifiedAdapters, 5);
  assert.equal(review.summary.runtimeClaimAllowed, false);
  assert.equal(review.summary.dbMutationAllowed, false);
  assert.equal(review.summary.stagingContractConsistent, true);
  assert.equal(review.summary.lineageReceiptConsistent, true);
  assert.equal(review.summary.highConfidenceParcelIdentity, 5);
  assert.equal(review.summary.loadPathReady, 0);
  assert.equal(review.summary.conditionalLoadPathCandidates, 2);
  assert.equal(review.summary.identityReadyOnly, 3);
  assert.equal(review.passed, true);

  for (const row of review.rows) {
    assert.equal(row.adapterStatus, "verified");
    assert.equal(row.productionRowsWritten, 0);
    assert.equal(row.runtimeClaimAllowed, false);
    assert.equal(row.dbMutationAllowed, false);
    assert.equal(row.stagingContract.consistent, true);
    assert.equal(row.lineageReceipt.consistent, true);
    assert.equal(row.parcelIdentity.confidenceLevel, "high");
    assert.equal(row.blockers.length, 0);
  }
});

test("quality review captures missing valuation fields and geometry limitations", () => {
  const reports = verifiedCounties.map((county) => readFixture(`june10-${county}-readonly-adapter.latest.json`));
  const review = buildWaveAAdapterQualityReview({ adapterReports: reports, generatedAtUtc: "2026-05-22T00:00:00.000Z" });
  const byCounty = new Map(review.rows.map((row) => [row.countyToken, row]));

  assert.deepEqual(byCounty.get("cowlitz").missingFields, []);
  assert.equal(byCounty.get("cowlitz").loadPathClassification, "conditional_load_path_candidate");
  assert.equal(byCounty.get("yakima").loadPathClassification, "conditional_load_path_candidate");

  assert.deepEqual(byCounty.get("spokane").missingFields, ["assessedValue"]);
  assert.equal(byCounty.get("spokane").loadPathClassification, "identity_ready_only");

  assert.deepEqual(byCounty.get("clark").missingFields, ["assessedValue"]);
  assert.equal(byCounty.get("clark").loadPathClassification, "identity_ready_only");

  assert.deepEqual(byCounty.get("king").missingFields, ["ownerName", "situsAddress", "assessedValue"]);
  assert.equal(byCounty.get("king").geometryLimitations.length, 2);
  assert.equal(byCounty.get("king").loadPathClassification, "identity_ready_only");
});

test("quality review fails closed on inconsistent staging contract or runtime claim", () => {
  const reports = verifiedCounties.map((county) => readFixture(`june10-${county}-readonly-adapter.latest.json`));
  const broken = structuredClone(reports[0]);
  broken.runtimeClaimAllowed = true;
  broken.stagingShape.schema = "wrong-schema";

  const review = buildWaveAAdapterQualityReview({
    adapterReports: [broken, ...reports.slice(1)],
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  const cowlitz = review.rows.find((row) => row.countyToken === "cowlitz");
  assert.equal(review.passed, false);
  assert.equal(review.summary.runtimeClaimAllowed, true);
  assert.equal(review.summary.stagingContractConsistent, false);
  assert.ok(cowlitz.blockers.includes("Adapter verification permits a runtime claim."));
  assert.ok(cowlitz.blockers.includes("Staging schema is not terrafusion-staging-parcel-source-v1."));
});

test("quality review CLI writes JSON and Markdown evidence", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-wave-a-quality-"));
  const outJson = path.join(temp, "review.json");
  const outMd = path.join(temp, "review.md");

  execFileSync("node", ["os-platform/core/pilot/june10-wave-a-adapter-quality-review.mjs", "--out-json", outJson, "--out-md", outMd], {
    cwd: process.cwd(),
    stdio: "pipe"
  });

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");

  assert.equal(report.summary.reviewedAdapters, 5);
  assert.match(markdown, /Wave A 5-Adapter Quality Review/);
  assert.match(markdown, /conditional_load_path_candidate/);
  assert.match(markdown, /identity_ready_only/);
});

test("quality review run helper writes evidence", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-wave-a-quality-helper-"));
  const outJson = path.join(temp, "review.json");
  const outMd = path.join(temp, "review.md");

  const report = runWaveAAdapterQualityReview({ outJson, outMd, generatedAtUtc: "2026-05-22T00:00:00.000Z" });

  assert.equal(report.summary.reviewedAdapters, 5);
  assert.equal(fs.existsSync(outJson), true);
  assert.equal(fs.existsSync(outMd), true);
});
