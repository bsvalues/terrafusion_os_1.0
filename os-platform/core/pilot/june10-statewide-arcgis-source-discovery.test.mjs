import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildCountySearchQueries,
  buildDiscoveryReport,
  classifyArcgisItem,
  summarizeDiscoveryItem
} from "./june10-statewide-arcgis-source-discovery.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-statewide-arcgis-discovery-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

test("buildCountySearchQueries targets authoritative parcel inventory sources", () => {
  const queries = buildCountySearchQueries({ county: "Skagit", fips: "53057" });

  assert.ok(queries.some((query) => query.includes("Skagit County parcels")));
  assert.ok(queries.every((query) => !/sales|comparable/i.test(query)));
});

test("classifyArcgisItem identifies parcel FeatureServer candidates", () => {
  assert.equal(
    classifyArcgisItem({
      title: "Skagit County Tax Parcels",
      type: "Feature Service",
      url: "https://example.test/FeatureServer"
    }, { county: "Skagit" }),
    "county_parcel_feature_service_candidate"
  );
  assert.equal(
    classifyArcgisItem({
      title: "Current Parcels",
      type: "Feature Service",
      owner: "WAGeoservices",
      url: "https://example.test/FeatureServer"
    }, { county: "Adams" }),
    "washington_statewide_parcel_feature_service_candidate"
  );
  assert.equal(
    classifyArcgisItem({
      title: "Florida Statewide Parcels",
      type: "Feature Service",
      url: "https://example.test/FeatureServer"
    }, { county: "Columbia" }),
    "secondary_or_irrelevant"
  );
});

test("summarizeDiscoveryItem keeps source URL and parcel signal", () => {
  const summary = summarizeDiscoveryItem({
    title: "County Parcels",
    type: "Feature Service",
    url: "https://example.test/FeatureServer",
    owner: "county",
    id: "abc"
  });

  assert.equal(summary.title, "County Parcels");
  assert.equal(summary.url, "https://example.test/FeatureServer");
  assert.equal(summary.classification, "parcel_feature_service_candidate");
});

test("buildDiscoveryReport marks non-certifiable counties only", () => {
  const report = buildDiscoveryReport({
    matrix: {
      rows: [
        { county: "Cowlitz", fips: "53015", certifiable: true },
        { county: "Skagit", fips: "53057", certifiable: false }
      ]
    },
    discoveries: new Map([
      [
        "Skagit",
        [
          {
            title: "Skagit Tax Parcels",
            type: "Feature Service",
            url: "https://example.test/FeatureServer"
          }
        ]
      ]
    ])
  });

  assert.equal(report.summary.countiesChecked, 1);
  assert.equal(report.rows[0].county, "Skagit");
  assert.equal(report.rows[0].status, "arcgis_candidate_found");
  assert.equal(report.productionBindingAllowed, false);
});

test("CLI writes statewide discovery report in fixture mode", () => {
  const root = tmpRoot();
  const matrixPath = path.join(root, "matrix.json");
  const outJson = path.join(root, "out.json");
  const outMd = path.join(root, "out.md");

  writeJson(matrixPath, {
    rows: [
      { county: "Skagit", fips: "53057", certifiable: false },
      { county: "Cowlitz", fips: "53015", certifiable: true }
    ]
  });

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-statewide-arcgis-source-discovery.mjs",
      "--matrix",
      matrixPath,
      "--out-json",
      outJson,
      "--out-md",
      outMd,
      "--fixture"
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(report.summary.countiesChecked, 1);
  assert.match(fs.readFileSync(outMd, "utf8"), /Statewide ArcGIS Source Discovery/);
});
