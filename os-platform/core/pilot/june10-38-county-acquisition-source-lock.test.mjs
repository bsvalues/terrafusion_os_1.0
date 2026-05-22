#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildAcquisitionSourceLockPack,
  runAcquisitionSourceLockPack
} from "./june10-38-county-acquisition-source-lock.mjs";

function coverage() {
  return {
    generatedAtUtc: "2026-05-22T00:00:00.000Z",
    counties: [
      {
        county: "Benton",
        status: "adapter-ready",
        priority: "P1",
        acquisitionFamily: "Direct sales search",
        officialAssessorBaseUrl: "https://co.benton.wa.us"
      },
      {
        county: "Cowlitz",
        status: "adapter-ready",
        priority: "P1",
        acquisitionFamily: "Parcel transfer history",
        officialAssessorBaseUrl: "https://www.co.cowlitz.wa.us",
        primarySalesSource: "Parcel detail conveyances",
        fallbackSource: "Auditor Public Record Search",
        gisMapSurface: "County GIS Maps"
      },
      {
        county: "Yakima",
        status: "adapter-ready",
        priority: "P2",
        acquisitionFamily: "Direct sales search",
        officialAssessorBaseUrl: "https://www.yakimacounty.us",
        primarySalesSource: "Sales Searches",
        fallbackSource: "Other Searches",
        gisMapSurface: "Parcel Search"
      },
      {
        county: "Kitsap",
        status: "adapter-ready",
        priority: "P1",
        acquisitionFamily: "Parcel transfer history / open data export",
        officialAssessorBaseUrl: "https://www.kitsapgov.com",
        primarySalesSource: "Sales Data",
        fallbackSource: "Auditor deed search",
        gisMapSurface: "Parcel Search Map"
      }
    ]
  };
}

test("source lock excludes Benton and emits source-capture tasks for non-Benton Wave A counties", () => {
  const report = buildAcquisitionSourceLockPack({ coverage: coverage() });
  const counties = report.sourceLocks.map((lock) => lock.county);

  assert.deepEqual(counties, ["Cowlitz", "Kitsap", "Yakima"]);
  assert.equal(report.summary.countiesLocked, 3);
  assert.equal(report.summary.bentonExcluded, true);
  assert.equal(report.summary.runtimeClaimAllowed, false);
  assert.equal(report.sourceLocks.every((lock) => lock.nextAction === "capture_source_snapshot"), true);
});

test("source lock applies curated Cowlitz and Yakima source URLs", () => {
  const report = buildAcquisitionSourceLockPack({ coverage: coverage() });
  const cowlitz = report.sourceLocks.find((lock) => lock.county === "Cowlitz");
  const yakima = report.sourceLocks.find((lock) => lock.county === "Yakima");

  assert.ok(cowlitz.sourceUrls.includes("https://cowlitzinfo.net/cowlitzpropertyapp/cowlitzpropertyapp/zoner/index"));
  assert.ok(cowlitz.sourceUrls.includes("https://gis.cowlitzwa.gov/ccportal/apps/webappviewer/index.html?id=848eadafa8ba4566a6a6370a4294c5e2"));
  assert.ok(cowlitz.sourceUrls.includes("https://gis.cowlitzwa.gov/ccportal/apps/webappviewer/index.html?id=3b7b5f787ccc46e9bd8c144d998991ae"));
  assert.ok(yakima.sourceUrls.includes("https://property.spatialest.com/wa/yakima#/"));
  assert.equal(cowlitz.sourceDecisionStatus, "source_locked");
  assert.equal(yakima.sourceDecisionStatus, "source_locked");
});

test("source lock keeps runtime claims blocked and requires receipts before load claims", () => {
  const report = buildAcquisitionSourceLockPack({ coverage: coverage() });

  assert.equal(report.claimRules.runtimeClaimAllowed, false);
  assert.ok(report.claimRules.forbiddenClaims.includes("runtime-ready"));
  assert.ok(report.claimRules.forbiddenClaims.includes("full county data loaded"));
  assert.ok(report.rules.some((rule) => rule.includes("source lock is not a receipt")));
});

test("source lock CLI writes JSON and Markdown evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-source-lock-"));
  const coveragePath = path.join(root, "coverage.json");
  const outJson = path.join(root, "source-lock.json");
  const outMd = path.join(root, "source-lock.md");
  const scriptPath = path.resolve("os-platform/core/pilot/june10-38-county-acquisition-source-lock.mjs");

  fs.writeFileSync(coveragePath, JSON.stringify(coverage(), null, 2));
  const result = spawnSync(
    process.execPath,
    [scriptPath, "--coverage", coveragePath, "--out-json", outJson, "--out-md", outMd],
    {
      cwd: process.cwd(),
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /"countiesLocked": 3/);
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).summary.countiesLocked, 3);
  assert.match(fs.readFileSync(outMd, "utf8"), /38-County Acquisition Source Lock/);
});

test("source lock run helper writes evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-source-lock-helper-"));
  const coveragePath = path.join(root, "coverage.json");
  const outJson = path.join(root, "source-lock.json");
  const outMd = path.join(root, "source-lock.md");

  fs.writeFileSync(coveragePath, JSON.stringify(coverage(), null, 2));
  const report = runAcquisitionSourceLockPack({ coveragePath, outJson, outMd });

  assert.equal(report.summary.countiesLocked, 3);
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).summary.countiesLocked, 3);
  assert.match(fs.readFileSync(outMd, "utf8"), /Cowlitz/);
});
