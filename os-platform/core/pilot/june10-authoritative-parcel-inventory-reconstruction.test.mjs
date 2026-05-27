import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildAuthoritativeParcelInventoryReconstruction,
  classifyInventoryAccess,
  detectInventorySignals,
  officialWashingtonCountyRows
} from "./june10-authoritative-parcel-inventory-reconstruction.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-statewide-parcel-recon-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

test("officialWashingtonCountyRows defines all 39 Washington counties with FIPS", () => {
  const rows = officialWashingtonCountyRows();

  assert.equal(rows.length, 39);
  assert.deepEqual(
    rows.find((row) => row.county === "Benton"),
    { county: "Benton", fips: "53005" }
  );
  assert.deepEqual(
    rows.find((row) => row.county === "Yakima"),
    { county: "Yakima", fips: "53077" }
  );
});

test("detectInventorySignals separates GIS and export clues from sales-only evidence", () => {
  const signals = detectInventorySignals({
    acquisitionFamily: "Parcel inventory / open data export",
    primarySalesSource: "Comparable sales workbook",
    gisMapSurface: "ArcGIS REST FeatureServer parcel layer",
    evidenceFiles: ["payloads/county-sales.xlsx"]
  });

  assert.equal(signals.gisLayer, true);
  assert.equal(signals.arcgisRest, true);
  assert.equal(signals.downloadableExport, true);
  assert.equal(signals.secondarySalesEvidence, true);
  assert.equal(signals.searchOnly, false);
});

test("classifyInventoryAccess requires authoritative parcel receipts for certification", () => {
  assert.equal(
    classifyInventoryAccess({
      authoritativeParcelReceiptFound: true,
      gisLayer: false,
      arcgisRest: false,
      downloadableExport: false,
      searchOnly: false,
      secondarySalesEvidence: false
    }),
    "authoritative_inventory_receipt_found"
  );
  assert.equal(
    classifyInventoryAccess({
      authoritativeParcelReceiptFound: false,
      gisLayer: true,
      arcgisRest: true,
      downloadableExport: false,
      searchOnly: false,
      secondarySalesEvidence: true
    }),
    "authoritative_inventory_recapture_candidate"
  );
  assert.equal(
    classifyInventoryAccess({
      authoritativeParcelReceiptFound: false,
      gisLayer: false,
      arcgisRest: false,
      downloadableExport: false,
      searchOnly: true,
      secondarySalesEvidence: false
    }),
    "search_only_requires_export_policy"
  );
  assert.equal(
    classifyInventoryAccess({
      authoritativeParcelReceiptFound: false,
      gisLayer: false,
      arcgisRest: false,
      downloadableExport: false,
      searchOnly: false,
      secondarySalesEvidence: true
    }),
    "secondary_evidence_only"
  );
});

test("statewide reconstruction always returns a 39-county certification-blocking matrix", () => {
  const root = tmpRoot();
  const crosswalkPath = path.join(root, "crosswalk.json");
  const evidenceRoot = path.join(root, "evidence");
  writeJson(crosswalkPath, {
    rows: [
      {
        county: "Kitsap",
        acquisitionFamily: "Parcel inventory / open data export",
        gisMapSurface: "ArcGIS REST FeatureServer parcel layer",
        evidenceFiles: ["kitsap-sales.xlsx"]
      },
      {
        county: "Pierce",
        primarySalesSource: "ATIP comparable sales information",
        evidenceFiles: ["pierce-sales.zip"]
      }
    ]
  });

  const report = buildAuthoritativeParcelInventoryReconstruction({
    crosswalk: JSON.parse(fs.readFileSync(crosswalkPath, "utf8")),
    evidenceRoot
  });

  assert.equal(report.summary.countiesChecked, 39);
  assert.equal(report.productionBindingAllowed, false);
  assert.equal(report.runtimeClaimAllowed, false);
  assert.equal(report.certificationAllowed, false);
  assert.equal(
    report.rows.find((row) => row.county === "Kitsap").inventoryAccess,
    "authoritative_inventory_recapture_candidate"
  );
  assert.equal(
    report.rows.find((row) => row.county === "Pierce").inventoryAccess,
    "secondary_evidence_only"
  );
});

test("CLI writes statewide authoritative parcel inventory reconstruction evidence", () => {
  const root = tmpRoot();
  const crosswalkPath = path.join(root, "crosswalk.json");
  const outJson = path.join(root, "out.json");
  const outMd = path.join(root, "out.md");

  writeJson(crosswalkPath, {
    rows: [
      {
        county: "Okanogan",
        acquisitionFamily: "GIS parcel inventory / downloadable export",
        evidenceFiles: []
      }
    ]
  });

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-authoritative-parcel-inventory-reconstruction.mjs",
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
  assert.equal(report.rows.length, 39);
  assert.match(fs.readFileSync(outMd, "utf8"), /Washington Authoritative Parcel Inventory Reconstruction/);
  assert.equal(report.rows.find((row) => row.county === "Okanogan").gisLayer, true);
});
