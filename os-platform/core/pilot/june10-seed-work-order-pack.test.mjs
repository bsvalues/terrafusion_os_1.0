#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildSeedWorkOrderPack } from "./june10-seed-work-order-pack.mjs";

function sampleWavePlan() {
  return {
    generatedAtUtc: "2026-05-14T17:39:16.972Z",
    summary: {
      firstWaveWorkOrders: 2,
      runtimeClaimAllowed: false
    },
    workOrders: [
      {
        workOrderId: "J10-SEED-DIRECT-SALES-SEARCH-YAKIMA",
        county: "Yakima",
        countyToken: "yakima",
        acquisitionFamily: "Direct sales search",
        priority: "P2",
        registryStatus: "adapter-ready",
        officialAssessorBaseUrl: "https://property.spatialest.com/wa/yakima#/",
        primarySalesSource: "Sales Searches",
        fallbackSource: "Other Searches",
        gisMapSurface: "Parcel Search / mapping",
        receiptStatus: "NO_RECEIPT",
        nextAction: "capture_source_snapshot",
        claimAllowed: "source/seed work order only",
        forbiddenClaims: ["runtime-ready", "official county-certified valuation"]
      },
      {
        workOrderId: "J10-SEED-PARCEL-TRANSFER-HISTORY-COWLITZ",
        county: "Cowlitz",
        countyToken: "cowlitz",
        acquisitionFamily: "Parcel transfer history",
        priority: "P1",
        registryStatus: "adapter-ready",
        officialAssessorBaseUrl: "https://www.co.cowlitz.wa.us",
        primarySalesSource: "Parcel detail conveyances + Request Sales Report",
        fallbackSource: "Auditor Public Record Search",
        gisMapSurface: "County GIS Maps + Assessor GIS Map",
        receiptStatus: "NO_RECEIPT",
        nextAction: "capture_source_snapshot",
        claimAllowed: "source/seed work order only",
        forbiddenClaims: ["runtime-ready", "official county-certified valuation"]
      }
    ]
  };
}

test("builds executable seed work orders with receipt targets and source capture checklist", () => {
  const pack = buildSeedWorkOrderPack({ wavePlan: sampleWavePlan() });

  assert.equal(pack.summary.workOrders, 2);
  assert.equal(pack.summary.runtimeClaimAllowed, false);

  const yakima = pack.workOrders.find((order) => order.county === "Yakima");

  assert.ok(yakima);
  assert.equal(yakima.receiptTarget, "evidence/june10-38-county-seed/yakima/source-snapshot-receipt.json");
  assert.equal(yakima.currentStage, "source_snapshot");
  assert.ok(yakima.sourceCaptureChecklist.some((item) => item.includes("official assessor")));
  assert.ok(yakima.requiredReceiptFields.includes("sourceSystem.url"));
  assert.ok(yakima.requiredReceiptFields.includes("target.terrafusionDbIdentity"));
});

test("keeps runtime claims blocked until validated receipt progression exists", () => {
  const pack = buildSeedWorkOrderPack({ wavePlan: sampleWavePlan() });
  const cowlitz = pack.workOrders.find((order) => order.county === "Cowlitz");

  assert.ok(cowlitz);
  assert.equal(cowlitz.runtimeClaimAllowed, false);
  assert.ok(cowlitz.stopConditions.some((item) => item.includes("sample, demo, or synthetic")));
  assert.ok(cowlitz.doctrine.some((item) => item.includes("TerraFusion DB is product runtime truth")));
  assert.ok(cowlitz.forbiddenClaims.includes("full county data loaded"));
});

test("CLI writes work-order JSON and Markdown reports", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-seed-work-pack-"));
  const wavePlanPath = path.join(tmp, "wave-plan.json");
  const outJson = path.join(tmp, "work-pack.json");
  const outMd = path.join(tmp, "work-pack.md");

  fs.writeFileSync(wavePlanPath, `${JSON.stringify(sampleWavePlan(), null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-seed-work-order-pack.mjs",
      "--wave-plan",
      wavePlanPath,
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
