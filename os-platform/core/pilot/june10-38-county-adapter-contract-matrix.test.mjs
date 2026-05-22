#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildAdapterContractMatrix,
  runAdapterContractMatrix
} from "./june10-38-county-adapter-contract-matrix.mjs";

function sourceLockPack() {
  return {
    generatedAtUtc: "2026-05-22T00:00:00.000Z",
    sourceLocks: [
      {
        county: "Cowlitz",
        countyToken: "cowlitz",
        acquisitionFamily: "Parcel transfer history",
        sourceDecisionStatus: "source_locked",
        sourceUrls: [
          "https://cowlitzinfo.net/cowlitzpropertyapp/cowlitzpropertyapp/zoner/index",
          "https://gis.cowlitzwa.gov/ccportal/apps/webappviewer/index.html?id=848eadafa8ba4566a6a6370a4294c5e2"
        ],
        sourceLabels: {
          primarySalesSource: "Parcel detail conveyances + Request Sales Report",
          fallbackSource: "Auditor Public Record Search / recorded documents / assessor map",
          gisMapSurface: "County GIS Maps + Assessor GIS Map"
        }
      },
      {
        county: "Kitsap",
        countyToken: "kitsap",
        acquisitionFamily: "Parcel transfer history / open data export",
        sourceDecisionStatus: "source_candidate_locked",
        sourceUrls: ["https://www.kitsapgov.com"],
        sourceLabels: {
          primarySalesSource: "Parcel Details sales history + Sales Data / prior-year residential sales",
          fallbackSource: "Auditor deed search + weekly downloadable assessor TXT data",
          gisMapSurface: "Parcel Search Map"
        }
      },
      {
        county: "Yakima",
        countyToken: "yakima",
        acquisitionFamily: "Direct sales search",
        sourceDecisionStatus: "source_locked",
        sourceUrls: ["https://property.spatialest.com/wa/yakima#/"],
        sourceLabels: {
          primarySalesSource: "Sales Searches",
          fallbackSource: "Other Searches",
          gisMapSurface: "Parcel Search / mapping"
        }
      },
      {
        county: "Spokane",
        countyToken: "spokane",
        acquisitionFamily: "Direct sales search",
        sourceDecisionStatus: "source_candidate_locked",
        sourceUrls: ["https://www.spokanecounty.org"],
        sourceLabels: {
          primarySalesSource: "SCOUT Sales Search",
          fallbackSource: "Map parcel detail history",
          gisMapSurface: "SCOUT map"
        }
      },
      {
        county: "Clark",
        countyToken: "clark",
        acquisitionFamily: "Direct sales search",
        sourceDecisionStatus: "source_candidate_locked",
        sourceUrls: ["https://clark.wa.gov"],
        sourceLabels: {
          primarySalesSource: "Property Information Center sales history + Residential Property Sales Information",
          fallbackSource: "MapsOnline / parcel fact sheet / recorded documents",
          gisMapSurface: "Property Information Center + MapsOnline"
        }
      }
    ]
  };
}

test("adapter matrix emits required contract fields for every locked county", () => {
  const report = buildAdapterContractMatrix({ sourceLockPack: sourceLockPack() });

  assert.equal(report.summary.counties, 5);
  assert.equal(report.summary.runtimeClaimAllowed, false);

  for (const row of report.rows) {
    assert.ok(row.sourceType);
    assert.ok(row.accessMethod);
    assert.ok(row.expectedExportFormat);
    assert.ok(row.parcelIdentifierField);
    assert.ok(row.ownerAddressValueFields);
    assert.ok(row.updateCadence);
    assert.ok(row.licenseTermsRisk);
    assert.match(row.adapterStatus, /^(none|candidate|implemented|verified)$/);
  }
});

test("adapter matrix classifies Cowlitz, Yakima, Spokane, and Clark as interactive portal candidates", () => {
  const report = buildAdapterContractMatrix({ sourceLockPack: sourceLockPack() });
  const cowlitz = report.rows.find((row) => row.county === "Cowlitz");
  const yakima = report.rows.find((row) => row.county === "Yakima");
  const spokane = report.rows.find((row) => row.county === "Spokane");
  const clark = report.rows.find((row) => row.county === "Clark");

  assert.equal(cowlitz.sourceType, "county_property_portal_plus_gis");
  assert.equal(cowlitz.accessMethod, "manual_snapshot_or_playwright_capture");
  assert.equal(cowlitz.expectedExportFormat, "html_or_json_network_capture_plus_optional_gis_layer");
  assert.equal(cowlitz.adapterStatus, "candidate");

  assert.equal(yakima.sourceType, "spatialest_property_portal");
  assert.equal(yakima.accessMethod, "manual_snapshot_or_playwright_capture");
  assert.equal(yakima.expectedExportFormat, "html_or_json_network_capture");
  assert.equal(yakima.adapterStatus, "candidate");

  assert.equal(spokane.sourceType, "county_property_portal_plus_gis");
  assert.equal(spokane.accessMethod, "manual_snapshot_or_playwright_capture");
  assert.equal(spokane.expectedExportFormat, "html_or_json_network_capture_plus_optional_gis_layer");
  assert.equal(spokane.adapterStatus, "candidate");

  assert.equal(clark.sourceType, "county_property_portal_plus_gis");
  assert.equal(clark.accessMethod, "manual_snapshot_or_playwright_capture");
  assert.equal(clark.expectedExportFormat, "html_or_json_network_capture_plus_optional_gis_layer");
  assert.equal(clark.adapterStatus, "candidate");
});

test("adapter matrix classifies open data/export counties separately", () => {
  const report = buildAdapterContractMatrix({ sourceLockPack: sourceLockPack() });
  const kitsap = report.rows.find((row) => row.county === "Kitsap");

  assert.equal(kitsap.sourceType, "downloadable_assessor_export_plus_parcel_history");
  assert.equal(kitsap.accessMethod, "download_snapshot");
  assert.equal(kitsap.expectedExportFormat, "txt_csv_or_fixed_width_download");
  assert.equal(kitsap.licenseTermsRisk, "medium_terms_review_required");
});

test("adapter matrix keeps all runtime and DB claims disabled", () => {
  const report = buildAdapterContractMatrix({ sourceLockPack: sourceLockPack() });

  assert.equal(report.claimRules.runtimeClaimAllowed, false);
  assert.equal(report.claimRules.dbMutationAllowed, false);
  assert.ok(report.claimRules.forbiddenClaims.includes("runtime-ready"));
  assert.ok(report.rules.some((rule) => rule.includes("No scraping beyond allowed source behavior.")));
});

test("adapter matrix marks Cowlitz verified from read-only adapter receipt without runtime claims", () => {
  const report = buildAdapterContractMatrix({
    sourceLockPack: sourceLockPack(),
    adapterVerificationReports: [
      {
        county: "Cowlitz",
        countyToken: "cowlitz",
        adapterId: "cowlitz-readonly-arcgis-metadata-v1",
        adapterStatus: "verified",
        runtimeClaimAllowed: false,
        dbMutationAllowed: false,
        productionRowsWritten: 0,
        parcelIdentity: { proven: true, sourceField: "PARCNO" },
        blockers: []
      }
    ]
  });

  const cowlitz = report.rows.find((row) => row.county === "Cowlitz");

  assert.equal(cowlitz.adapterStatus, "verified");
  assert.equal(cowlitz.runtimeClaimAllowed, false);
  assert.equal(cowlitz.dbMutationAllowed, false);
  assert.equal(cowlitz.parcelIdentifierField, "PARCNO");
  assert.equal(cowlitz.verification.adapterId, "cowlitz-readonly-arcgis-metadata-v1");
  assert.equal(report.summary.verifiedAdapters, 1);
});

test("adapter matrix marks Yakima verified from read-only adapter receipt without runtime claims", () => {
  const report = buildAdapterContractMatrix({
    sourceLockPack: sourceLockPack(),
    adapterVerificationReports: [
      {
        county: "Yakima",
        countyToken: "yakima",
        adapterId: "yakima-readonly-spatialest-config-v1",
        adapterStatus: "verified",
        runtimeClaimAllowed: false,
        dbMutationAllowed: false,
        productionRowsWritten: 0,
        parcelIdentity: { proven: true, sourceField: "parcel_number" },
        blockers: []
      }
    ]
  });

  const yakima = report.rows.find((row) => row.county === "Yakima");

  assert.equal(yakima.adapterStatus, "verified");
  assert.equal(yakima.runtimeClaimAllowed, false);
  assert.equal(yakima.dbMutationAllowed, false);
  assert.equal(yakima.parcelIdentifierField, "parcel_number");
  assert.equal(yakima.verification.adapterId, "yakima-readonly-spatialest-config-v1");
  assert.equal(report.summary.verifiedAdapters, 1);
});

test("adapter matrix marks Spokane verified from read-only adapter receipt without runtime claims", () => {
  const report = buildAdapterContractMatrix({
    sourceLockPack: sourceLockPack(),
    adapterVerificationReports: [
      {
        county: "Spokane",
        countyToken: "spokane",
        adapterId: "spokane-readonly-scout-arcgis-schema-v1",
        adapterStatus: "verified",
        runtimeClaimAllowed: false,
        dbMutationAllowed: false,
        productionRowsWritten: 0,
        parcelIdentity: { proven: true, sourceField: "PID_NUM" },
        blockers: []
      }
    ]
  });

  const spokane = report.rows.find((row) => row.county === "Spokane");

  assert.equal(spokane.adapterStatus, "verified");
  assert.equal(spokane.runtimeClaimAllowed, false);
  assert.equal(spokane.dbMutationAllowed, false);
  assert.equal(spokane.parcelIdentifierField, "PID_NUM");
  assert.equal(spokane.verification.adapterId, "spokane-readonly-scout-arcgis-schema-v1");
  assert.equal(report.summary.verifiedAdapters, 1);
});

test("adapter matrix marks Clark verified from read-only adapter receipt without runtime claims", () => {
  const report = buildAdapterContractMatrix({
    sourceLockPack: sourceLockPack(),
    adapterVerificationReports: [
      {
        county: "Clark",
        countyToken: "clark",
        adapterId: "clark-readonly-propertyfinder-arcgis-schema-v1",
        adapterStatus: "verified",
        runtimeClaimAllowed: false,
        dbMutationAllowed: false,
        productionRowsWritten: 0,
        parcelIdentity: { proven: true, sourceField: "Prop_id" },
        blockers: []
      }
    ]
  });

  const clark = report.rows.find((row) => row.county === "Clark");

  assert.equal(clark.adapterStatus, "verified");
  assert.equal(clark.runtimeClaimAllowed, false);
  assert.equal(clark.dbMutationAllowed, false);
  assert.equal(clark.parcelIdentifierField, "Prop_id");
  assert.equal(clark.verification.adapterId, "clark-readonly-propertyfinder-arcgis-schema-v1");
  assert.equal(report.summary.verifiedAdapters, 1);
});

test("adapter matrix CLI writes JSON and Markdown evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-adapter-matrix-"));
  const sourceLockPath = path.join(root, "source-lock.json");
  const outJson = path.join(root, "matrix.json");
  const outMd = path.join(root, "matrix.md");
  const scriptPath = path.resolve("os-platform/core/pilot/june10-38-county-adapter-contract-matrix.mjs");

  fs.writeFileSync(sourceLockPath, JSON.stringify(sourceLockPack(), null, 2));
  const result = spawnSync(
    process.execPath,
    [scriptPath, "--source-lock", sourceLockPath, "--out-json", outJson, "--out-md", outMd],
    {
      cwd: process.cwd(),
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /"counties": 5/);
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).summary.counties, 5);
  assert.match(fs.readFileSync(outMd, "utf8"), /Adapter Contract Matrix/);
});

test("adapter matrix run helper writes evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-adapter-matrix-helper-"));
  const sourceLockPath = path.join(root, "source-lock.json");
  const outJson = path.join(root, "matrix.json");
  const outMd = path.join(root, "matrix.md");

  fs.writeFileSync(sourceLockPath, JSON.stringify(sourceLockPack(), null, 2));
  const report = runAdapterContractMatrix({ sourceLockPath, outJson, outMd });

  assert.equal(report.summary.counties, 5);
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).summary.counties, 5);
  assert.match(fs.readFileSync(outMd, "utf8"), /Yakima/);
});
