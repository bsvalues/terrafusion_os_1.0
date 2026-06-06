#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  REQUIRED_PROOF_AREAS,
  buildCountyStudioR1DataTruthReport
} from "./county-studio-r1-data-truth-gate.mjs";

const repoRoot = process.cwd();

test("defines the full County Studio R1 data-truth proof surface", () => {
  assert.deepEqual(REQUIRED_PROOF_AREAS, [
    "study list",
    "selected study",
    "countyId",
    "taxYear",
    "parcel/property source",
    "parcel geometry source",
    "neighborhoods",
    "market areas",
    "model groups",
    "value tiers",
    "county segments",
    "taxing districts",
    "comparable sales",
    "CAMA characteristics",
    "PACS valuation",
    "ratio study population",
    "risk objects",
    "ledger rows",
    "inspector details",
    "map overlays",
    "Atlas layers",
    "TerraForge statistics API",
    "SignalR payloads"
  ]);
});

test("fails current County Studio proof when Atlas geometry is compatibility/provisional", () => {
  const report = buildCountyStudioR1DataTruthReport({
    repoRoot,
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "DATA_TRUTH_FAIL");
  assert.equal(report.claims.productionProofAllowed, false);
  assert.equal(report.claims.surfaceRuntimeProofOnly, true);
  assert.ok(
    report.failures.some((failure) =>
      failure.includes("Atlas layers") && failure.includes("compatibility")
    )
  );
  assert.ok(
    report.failures.some((failure) =>
      failure.includes("parcel geometry source") && failure.includes("GeoForge compatibility")
    )
  );

  const atlasLayers = report.proofAreas.find((area) => area.area === "Atlas layers");
  assert.equal(atlasLayers.classification, "FALLBACK");
  assert.equal(atlasLayers.productionProofAllowed, false);

  const countyId = report.proofAreas.find((area) => area.area === "countyId");
  assert.equal(countyId.classification, "UNKNOWN");
  assert.match(countyId.reason, /label is present/i);
});

test("records real-dev posture without promoting production or operational proof", () => {
  const report = buildCountyStudioR1DataTruthReport({
    repoRoot,
    generatedAtUtc: "2026-06-06T00:00:00.000Z",
    realDevReadinessReport: {
      status: "REAL_DEV_DATA_AVAILABLE",
      decisions: {
        realDevServerAllowed: true,
        productionProofAllowed: false,
        operationalProofAllowed: false
      }
    }
  });

  assert.equal(report.claims.realDevServerAllowed, true);
  assert.equal(report.claims.productionProofAllowed, false);
  assert.equal(report.claims.operationalProofAllowed, false);
  assert.match(report.claims.realDevBoundary, /real Benton-backed dev surface/i);
});

test("CLI writes evidence and exits non-zero while data truth is not proven", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-county-studio-data-truth-"));
  const outJson = path.join(tmp, "data-truth.json");
  const outMd = path.join(tmp, "data-truth.md");

  const result = spawnSync(
    "node",
    [
      "os-platform/core/pilot/county-studio-r1-data-truth-gate.mjs",
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: repoRoot, encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /DATA_TRUTH_FAIL/);
  assert.ok(fs.existsSync(outJson));
  assert.ok(fs.existsSync(outMd));

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");

  assert.equal(report.status, "DATA_TRUTH_FAIL");
  assert.equal(report.claims.productionProofAllowed, false);
  assert.match(markdown, /No data lineage, no production proof/);
  assert.match(markdown, /compatibility/);
});
