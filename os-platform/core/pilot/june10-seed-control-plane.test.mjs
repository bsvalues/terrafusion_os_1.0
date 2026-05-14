#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildSeedControlPlane } from "./june10-seed-control-plane.mjs";

function fixtures() {
  const wavePlan = {
    summary: {
      firstWaveWorkOrders: 2,
      runtimeClaimAllowed: false
    },
    workOrders: [
      {
        workOrderId: "J10-SEED-DIRECT-SALES-SEARCH-YAKIMA",
        county: "Yakima",
        countyToken: "yakima",
        receiptStatus: "NO_RECEIPT"
      },
      {
        workOrderId: "J10-SEED-PARCEL-TRANSFER-HISTORY-COWLITZ",
        county: "Cowlitz",
        countyToken: "cowlitz",
        receiptStatus: "NO_RECEIPT"
      }
    ]
  };

  const workOrderPack = {
    summary: {
      workOrders: 2,
      runtimeClaimAllowed: false
    },
    workOrders: [
      {
        workOrderId: "J10-SEED-DIRECT-SALES-SEARCH-YAKIMA",
        county: "Yakima",
        countyToken: "yakima",
        receiptTarget: "evidence/june10-38-county-seed/yakima/source-snapshot-receipt.json",
        runtimeClaimAllowed: false
      },
      {
        workOrderId: "J10-SEED-PARCEL-TRANSFER-HISTORY-COWLITZ",
        county: "Cowlitz",
        countyToken: "cowlitz",
        receiptTarget: "evidence/june10-38-county-seed/cowlitz/source-snapshot-receipt.json",
        runtimeClaimAllowed: false
      }
    ]
  };

  const receiptTemplates = {
    summary: {
      templates: 2,
      templateOnly: true,
      runtimeClaimAllowed: false
    },
    templates: [
      {
        workOrderId: "J10-SEED-DIRECT-SALES-SEARCH-YAKIMA",
        county: "Yakima",
        countyToken: "yakima",
        receiptTarget: "evidence/june10-38-county-seed/yakima/source-snapshot-receipt.json",
        templateOnly: true,
        runtimeClaimAllowed: false
      },
      {
        workOrderId: "J10-SEED-PARCEL-TRANSFER-HISTORY-COWLITZ",
        county: "Cowlitz",
        countyToken: "cowlitz",
        receiptTarget: "evidence/june10-38-county-seed/cowlitz/source-snapshot-receipt.json",
        templateOnly: true,
        runtimeClaimAllowed: false
      }
    ]
  };

  const receiptReport = {
    summary: {
      receiptsFound: 0,
      passed: false,
      failed: 0
    },
    rows: []
  };

  const executionStatus = {
    summary: {
      workOrders: 2,
      awaitingSourceCapture: 2,
      blockedByReceiptFailure: 0,
      runtimeClaimAllowed: false
    },
    rows: [
      {
        workOrderId: "J10-SEED-DIRECT-SALES-SEARCH-YAKIMA",
        county: "Yakima",
        countyToken: "yakima",
        receiptTarget: "evidence/june10-38-county-seed/yakima/source-snapshot-receipt.json",
        executionStatus: "AWAITING_SOURCE_CAPTURE",
        runtimeClaimAllowed: false
      },
      {
        workOrderId: "J10-SEED-PARCEL-TRANSFER-HISTORY-COWLITZ",
        county: "Cowlitz",
        countyToken: "cowlitz",
        receiptTarget: "evidence/june10-38-county-seed/cowlitz/source-snapshot-receipt.json",
        executionStatus: "AWAITING_SOURCE_CAPTURE",
        runtimeClaimAllowed: false
      }
    ]
  };

  return { wavePlan, workOrderPack, receiptTemplates, receiptReport, executionStatus };
}

test("passes when seed control-plane artifacts agree and runtime claims stay blocked", () => {
  const report = buildSeedControlPlane(fixtures());

  assert.equal(report.passed, true);
  assert.equal(report.summary.workOrders, 2);
  assert.equal(report.summary.templates, 2);
  assert.equal(report.summary.receiptsFound, 0);
  assert.equal(report.summary.runtimeClaimAllowed, false);
  assert.deepEqual(report.blockers, []);
});

test("blocks drift when a template receipt target differs from the work order target", () => {
  const input = fixtures();
  input.receiptTemplates.templates[0].receiptTarget = "evidence/wrong/source-snapshot-receipt.json";

  const report = buildSeedControlPlane(input);

  assert.equal(report.passed, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("receipt target mismatch")));
});

test("blocks any artifact that enables runtime claims", () => {
  const input = fixtures();
  input.executionStatus.summary.runtimeClaimAllowed = true;

  const report = buildSeedControlPlane(input);

  assert.equal(report.passed, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("runtimeClaimAllowed must remain false")));
});

test("CLI writes control-plane JSON and Markdown reports", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-seed-control-plane-"));
  const input = fixtures();
  const paths = {
    wavePlan: path.join(tmp, "wave-plan.json"),
    workOrderPack: path.join(tmp, "work-pack.json"),
    receiptTemplates: path.join(tmp, "templates.json"),
    receipts: path.join(tmp, "receipts.json"),
    executionStatus: path.join(tmp, "status.json"),
    outJson: path.join(tmp, "control.json"),
    outMd: path.join(tmp, "control.md")
  };

  fs.writeFileSync(paths.wavePlan, `${JSON.stringify(input.wavePlan, null, 2)}\n`);
  fs.writeFileSync(paths.workOrderPack, `${JSON.stringify(input.workOrderPack, null, 2)}\n`);
  fs.writeFileSync(paths.receiptTemplates, `${JSON.stringify(input.receiptTemplates, null, 2)}\n`);
  fs.writeFileSync(paths.receipts, `${JSON.stringify(input.receiptReport, null, 2)}\n`);
  fs.writeFileSync(paths.executionStatus, `${JSON.stringify(input.executionStatus, null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-seed-control-plane.mjs",
      "--wave-plan",
      paths.wavePlan,
      "--work-order-pack",
      paths.workOrderPack,
      "--receipt-template-pack",
      paths.receiptTemplates,
      "--receipts",
      paths.receipts,
      "--execution-status",
      paths.executionStatus,
      "--out-json",
      paths.outJson,
      "--out-md",
      paths.outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(paths.outJson, "utf8"));
  const markdown = fs.readFileSync(paths.outMd, "utf8");

  assert.equal(report.passed, true);
  assert.match(markdown, /Runtime claim allowed: false/);
  assert.match(markdown, /J10-SEED-DIRECT-SALES-SEARCH-YAKIMA/);
});
