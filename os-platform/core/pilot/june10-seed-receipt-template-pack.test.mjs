#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { validateReceipt } from "./june10-seed-receipt-validator.mjs";
import { buildSeedReceiptTemplatePack } from "./june10-seed-receipt-template-pack.mjs";

function sampleWorkOrderPack() {
  return {
    generatedAtUtc: "2026-05-14T18:28:31.866Z",
    summary: {
      workOrders: 1,
      runtimeClaimAllowed: false
    },
    workOrders: [
      {
        workOrderId: "J10-SEED-DIRECT-SALES-SEARCH-YAKIMA",
        county: "Yakima",
        countyToken: "yakima",
        receiptTarget: "evidence/june10-38-county-seed/yakima/source-snapshot-receipt.json",
        currentStage: "source_snapshot",
        nextAction: "capture_source_snapshot"
      }
    ]
  };
}

test("builds a receipt template for each seed work order without enabling runtime claims", () => {
  const pack = buildSeedReceiptTemplatePack({ workOrderPack: sampleWorkOrderPack() });
  const template = pack.templates[0];

  assert.equal(pack.summary.templates, 1);
  assert.equal(pack.summary.runtimeClaimAllowed, false);
  assert.equal(template.workOrderId, "J10-SEED-DIRECT-SALES-SEARCH-YAKIMA");
  assert.equal(template.receiptTarget, "evidence/june10-38-county-seed/yakima/source-snapshot-receipt.json");
  assert.equal(template.receipt.receiptVersion, "june10-seed-v1");
  assert.equal(template.receipt.status, "ATTEMPT");
  assert.equal(template.receipt.noSecretValuesRecorded, true);
  assert.equal(template.receipt.workflowLabels.officialValuation, "blocked");
});

test("template is intentionally not a passing receipt until operators replace placeholders", () => {
  const pack = buildSeedReceiptTemplatePack({ workOrderPack: sampleWorkOrderPack() });
  const template = pack.templates[0];
  const validation = validateReceipt(template.receipt, template.receiptTarget);

  assert.equal(template.templateOnly, true);
  assert.equal(validation.passed, false);
  assert.ok(validation.blockers.some((blocker) => blocker.includes("capturedAtUtc")));
  assert.ok(validation.gates.A.blockers.some((blocker) => blocker.includes("SHA-256")));
});

test("CLI writes receipt template JSON and Markdown reports", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-seed-template-pack-"));
  const packPath = path.join(tmp, "work-pack.json");
  const outJson = path.join(tmp, "templates.json");
  const outMd = path.join(tmp, "templates.md");

  fs.writeFileSync(packPath, `${JSON.stringify(sampleWorkOrderPack(), null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-seed-receipt-template-pack.mjs",
      "--work-order-pack",
      packPath,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");

  assert.equal(report.summary.templates, 1);
  assert.match(markdown, /J10-SEED-DIRECT-SALES-SEARCH-YAKIMA/);
  assert.match(markdown, /Template only: true/);
});
