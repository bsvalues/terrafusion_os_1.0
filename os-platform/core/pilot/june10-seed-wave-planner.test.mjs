import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFileSync } from "node:child_process";

import { buildSeedWavePlan } from "./june10-seed-wave-planner.mjs";

const scriptPath = path.resolve("os-platform/core/pilot/june10-seed-wave-planner.mjs");

function coverageFixture() {
  return {
    generatedAtUtc: "2026-05-14T00:00:00.000Z",
    counties: [
      {
        county: "Benton",
        acquisitionFamily: "Direct sales search",
        priority: "P1",
        status: "adapter-ready",
        officialAssessorBaseUrl: "https://co.benton.wa.us",
        primarySalesSource: "Benton sales",
        fallbackSource: "Auditor",
        gisMapSurface: "Benton GIS"
      },
      {
        county: "Yakima",
        acquisitionFamily: "Direct sales search",
        priority: "P2",
        status: "adapter-ready",
        officialAssessorBaseUrl: "https://www.yakimacounty.us",
        primarySalesSource: "Sales Searches",
        fallbackSource: "Other Searches",
        gisMapSurface: "Parcel Search"
      },
      {
        county: "Cowlitz",
        acquisitionFamily: "Parcel transfer history",
        priority: "P1",
        status: "adapter-ready",
        officialAssessorBaseUrl: "https://www.co.cowlitz.wa.us",
        primarySalesSource: "Parcel conveyances",
        fallbackSource: "Auditor",
        gisMapSurface: "GIS"
      },
      {
        county: "Klickitat",
        acquisitionFamily: "Monthly sales report",
        priority: "P1",
        status: "adapter-ready",
        officialAssessorBaseUrl: "https://www.klickitatcounty.org",
        primarySalesSource: "Monthly report",
        fallbackSource: "Parcel history",
        gisMapSurface: "GIS"
      },
      {
        county: "Douglas",
        acquisitionFamily: "Monthly report / parcel history",
        priority: "P1",
        status: "adapter-ready",
        officialAssessorBaseUrl: "https://www.douglascountywa.gov",
        primarySalesSource: "Monthly Sales",
        fallbackSource: "TaxSifter",
        gisMapSurface: "Map"
      },
      {
        county: "Kitsap",
        acquisitionFamily: "Parcel transfer history / open data export",
        priority: "P1",
        status: "adapter-ready",
        officialAssessorBaseUrl: "https://www.kitsap.gov",
        primarySalesSource: "Open data",
        fallbackSource: "Parcel history",
        gisMapSurface: "Open data"
      }
    ]
  };
}

test("builds first-wave work orders by acquisition family and excludes Benton", () => {
  const report = buildSeedWavePlan({
    coverage: coverageFixture(),
    receipts: { rows: [] }
  });

  assert.equal(report.summary.countiesInScope, 5);
  assert.equal(report.summary.firstWaveWorkOrders, 5);
  assert.equal(report.summary.bentonExcluded, true);
  assert.equal(report.summary.runtimeClaimAllowed, false);
  assert.equal(report.workOrders.some((order) => order.county === "Benton"), false);
  assert.ok(report.workOrders.some((order) => order.county === "Yakima"));
  assert.ok(report.workOrders.every((order) => order.nextAction === "capture_source_snapshot"));
});

test("uses existing receipt status to advance next action", () => {
  const report = buildSeedWavePlan({
    coverage: coverageFixture(),
    receipts: {
      rows: [
        {
          county: "Yakima",
          countyToken: "yakima",
          derivedStatus: "NORMALIZED_READY"
        }
      ]
    }
  });

  const yakima = report.workOrders.find((order) => order.county === "Yakima");

  assert.ok(yakima);
  assert.equal(yakima.receiptStatus, "NORMALIZED_READY");
  assert.equal(yakima.nextAction, "load_staging_terrafusion_db");
});

test("CLI writes seed wave JSON and Markdown reports", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-seed-wave-"));
  const coveragePath = path.join(root, "coverage.json");
  const receiptsPath = path.join(root, "receipts.json");
  const outJson = path.join(root, "wave.json");
  const outMd = path.join(root, "wave.md");

  fs.writeFileSync(coveragePath, `${JSON.stringify(coverageFixture(), null, 2)}\n`);
  fs.writeFileSync(receiptsPath, `${JSON.stringify({ rows: [] }, null, 2)}\n`);

  execFileSync("node", [
    scriptPath,
    "--coverage",
    coveragePath,
    "--receipts",
    receiptsPath,
    "--out-json",
    outJson,
    "--out-md",
    outMd
  ], {
    cwd: process.cwd(),
    stdio: "pipe"
  });

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const md = fs.readFileSync(outMd, "utf8");

  assert.equal(report.summary.firstWaveWorkOrders, 5);
  assert.match(md, /J10-SEED-DIRECT-SALES-SEARCH-YAKIMA/);
  assert.match(md, /Runtime claim allowed: false/);
});
