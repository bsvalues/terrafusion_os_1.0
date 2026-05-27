import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildCountyReconstruction,
  classifyAuthoritativeSourcePosture,
  sourceArtifactClass,
  sourceSignalSummary
} from "./june10-wave2-authoritative-source-reconstruction.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-wave2-source-recon-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

test("sourceArtifactClass separates parcel inventory receipts from sales artifacts", () => {
  assert.equal(sourceArtifactClass("captures/kitsap-parcel-inventory-source-snapshot-receipt.json"), "authoritative_parcel_receipt");
  assert.equal(sourceArtifactClass("payloads/053-pierce-sale.zip"), "secondary_sales_or_comparable");
  assert.equal(sourceArtifactClass("payloads/047-okanogan-comparable-sales.xlsx"), "secondary_sales_or_comparable");
  assert.equal(sourceArtifactClass("data/county-intelligence/sanjuan_analysis.json"), "local_intelligence_only");
});

test("sourceSignalSummary detects parcel inventory recapture signals separately from sales signals", () => {
  const summary = sourceSignalSummary({
    acquisitionFamily: "Parcel transfer history / open data export",
    primarySalesSource: "Parcel Details sales history",
    gisMapSurface: "Parcel Search Map",
    officialAssessorBaseUrl: "https://example.test"
  });

  assert.equal(summary.hasParcelInventorySignal, true);
  assert.equal(summary.hasSalesOnlySignal, true);
  assert.match(summary.signals.join(" "), /open data/i);
});

test("classifyAuthoritativeSourcePosture prioritizes receipts, then recapture possibility, then secondary evidence", () => {
  assert.equal(
    classifyAuthoritativeSourcePosture({
      authoritativeReceiptCount: 1,
      hasParcelInventorySignal: false,
      secondaryEvidenceCount: 0,
      localIntelligenceCount: 0
    }),
    "authoritative_source_receipt_found"
  );
  assert.equal(
    classifyAuthoritativeSourcePosture({
      authoritativeReceiptCount: 0,
      hasParcelInventorySignal: true,
      secondaryEvidenceCount: 2,
      localIntelligenceCount: 0
    }),
    "authoritative_source_recapture_possible"
  );
  assert.equal(
    classifyAuthoritativeSourcePosture({
      authoritativeReceiptCount: 0,
      hasParcelInventorySignal: false,
      secondaryEvidenceCount: 2,
      localIntelligenceCount: 0
    }),
    "secondary_evidence_only"
  );
  assert.equal(
    classifyAuthoritativeSourcePosture({
      authoritativeReceiptCount: 0,
      hasParcelInventorySignal: false,
      secondaryEvidenceCount: 0,
      localIntelligenceCount: 2
    }),
    "blocked_source_access"
  );
});

test("buildCountyReconstruction blocks certification from secondary evidence", () => {
  const row = buildCountyReconstruction({
    county: {
      county: "Pierce",
      fips: "53053",
      primarySalesSource: "ATIP comparable sales information",
      payloadFiles: ["docs/pierce-sale.zip"],
      localDataFiles: [],
      evidenceFiles: ["docs/pierce-sale.zip"]
    },
    discoveredFiles: []
  });

  assert.equal(row.posture, "secondary_evidence_only");
  assert.equal(row.certificationAllowed, false);
  assert.equal(row.productionBindingAllowed, false);
  assert.ok(row.blockers.some((blocker) => blocker.includes("No authoritative parcel inventory receipt")));
});

test("CLI writes Wave 2 source reconstruction matrix", () => {
  const root = tmpRoot();
  const crosswalkPath = path.join(root, "crosswalk.json");
  const outJson = path.join(root, "out.json");
  const outMd = path.join(root, "out.md");

  writeJson(crosswalkPath, {
    rows: [
      {
        county: "Kitsap",
        fips: "53035",
        acquisitionFamily: "Parcel transfer history / open data export",
        primarySalesSource: "Parcel Details sales history",
        payloadFiles: ["kitsap-sales.xlsx"],
        localDataFiles: [],
        evidenceFiles: ["kitsap-sales.xlsx"]
      },
      {
        county: "Pierce",
        fips: "53053",
        primarySalesSource: "Comparable sales",
        payloadFiles: ["pierce-sale.zip"],
        localDataFiles: [],
        evidenceFiles: ["pierce-sale.zip"]
      }
    ]
  });

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-wave2-authoritative-source-reconstruction.mjs",
      "--crosswalk",
      crosswalkPath,
      "--evidence-root",
      root,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(report.rows.length, 5);
  assert.equal(report.rows.find((row) => row.county === "Kitsap").posture, "authoritative_source_recapture_possible");
  assert.equal(report.rows.find((row) => row.county === "Pierce").posture, "secondary_evidence_only");
  assert.match(fs.readFileSync(outMd, "utf8"), /Wave 2 Authoritative Parcel Source Reconstruction/);
});
