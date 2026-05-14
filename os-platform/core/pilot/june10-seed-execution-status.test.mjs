#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildSeedExecutionStatus } from "./june10-seed-execution-status.mjs";

function sampleWorkOrderPack() {
  return {
    generatedAtUtc: "2026-05-14T18:28:31.866Z",
    summary: {
      workOrders: 2,
      runtimeClaimAllowed: false
    },
    workOrders: [
      {
        workOrderId: "J10-SEED-DIRECT-SALES-SEARCH-YAKIMA",
        county: "Yakima",
        countyToken: "yakima",
        currentStage: "source_snapshot",
        nextAction: "capture_source_snapshot",
        receiptTarget: "evidence/june10-38-county-seed/yakima/source-snapshot-receipt.json",
        runtimeClaimAllowed: false
      },
      {
        workOrderId: "J10-SEED-PARCEL-TRANSFER-HISTORY-COWLITZ",
        county: "Cowlitz",
        countyToken: "cowlitz",
        currentStage: "source_snapshot",
        nextAction: "capture_source_snapshot",
        receiptTarget: "evidence/june10-38-county-seed/cowlitz/source-snapshot-receipt.json",
        runtimeClaimAllowed: false
      }
    ]
  };
}

function sampleReceiptReport() {
  return {
    generatedAtUtc: "2026-05-14T17:09:56.359Z",
    summary: {
      receiptsFound: 1,
      passed: false,
      failed: 0
    },
    rows: [
      {
        county: "Yakima",
        countyToken: "yakima",
        derivedStatus: "SNAPSHOT_CAPTURED",
        passed: true,
        blockers: []
      }
    ]
  };
}

test("summarizes first-wave execution status without permitting runtime claims", () => {
  const report = buildSeedExecutionStatus({
    workOrderPack: sampleWorkOrderPack(),
    receiptReport: { rows: [], summary: { receiptsFound: 0, failed: 0 } }
  });

  assert.equal(report.summary.workOrders, 2);
  assert.equal(report.summary.awaitingSourceCapture, 2);
  assert.equal(report.summary.runtimeClaimAllowed, false);
  assert.equal(report.summary.blockedByReceiptFailure, 0);
  assert.ok(report.rows.every((row) => row.executionStatus === "AWAITING_SOURCE_CAPTURE"));
});

test("uses validated receipt state to advance a work order status", () => {
  const report = buildSeedExecutionStatus({
    workOrderPack: sampleWorkOrderPack(),
    receiptReport: sampleReceiptReport()
  });

  const yakima = report.rows.find((row) => row.county === "Yakima");
  const cowlitz = report.rows.find((row) => row.county === "Cowlitz");

  assert.equal(yakima.executionStatus, "RECEIPT_CAPTURED");
  assert.equal(yakima.nextOperatorAction, "normalize_payload");
  assert.equal(cowlitz.executionStatus, "AWAITING_SOURCE_CAPTURE");
  assert.equal(report.summary.receiptCaptured, 1);
});

test("CLI writes execution status JSON and Markdown", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-seed-exec-status-"));
  const packPath = path.join(tmp, "pack.json");
  const receiptPath = path.join(tmp, "receipts.json");
  const outJson = path.join(tmp, "status.json");
  const outMd = path.join(tmp, "status.md");

  fs.writeFileSync(packPath, `${JSON.stringify(sampleWorkOrderPack(), null, 2)}\n`);
  fs.writeFileSync(receiptPath, `${JSON.stringify(sampleReceiptReport(), null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-seed-execution-status.mjs",
      "--work-order-pack",
      packPath,
      "--receipts",
      receiptPath,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");

  assert.equal(report.summary.workOrders, 2);
  assert.match(markdown, /J10-SEED-DIRECT-SALES-SEARCH-YAKIMA/);
  assert.match(markdown, /Runtime claim allowed: false/);
});
