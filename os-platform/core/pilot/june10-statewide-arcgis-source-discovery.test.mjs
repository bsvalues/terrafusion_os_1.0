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
  resolveArcgisAuth,
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

test("resolveArcgisAuth defaults anonymous and never exposes token value", () => {
  assert.deepEqual(resolveArcgisAuth({ env: {}, tokenFile: null }), {
    accessMode: "anonymous",
    tokenPresent: false,
    tokenSource: null,
    token: null
  });

  const auth = resolveArcgisAuth({ env: { ARCGIS_TOKEN: "secret-token" }, tokenFile: null });
  assert.equal(auth.accessMode, "authenticated");
  assert.equal(auth.tokenPresent, true);
  assert.equal(auth.tokenSource, "env:ARCGIS_TOKEN");
  assert.equal(auth.token, "secret-token");
  assert.equal(JSON.stringify({ ...auth, token: undefined }).includes("secret-token"), false);
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
    ]),
    accessMode: "authenticated",
    authComparison: new Map([["Skagit", { anonymousCandidateCount: 0, authenticatedCandidateCount: 1, changed: true }]])
  });

  assert.equal(report.summary.countiesChecked, 1);
  assert.equal(report.rows[0].county, "Skagit");
  assert.equal(report.rows[0].status, "county_arcgis_candidate_found");
  assert.equal(report.productionBindingAllowed, false);
  assert.equal(report.rows[0].accessMode, "authenticated");
  assert.equal(report.rows[0].authChangedCandidateVisibility, true);
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

test("CLI accepts ignored token file without writing token to evidence", () => {
  const root = tmpRoot();
  const matrixPath = path.join(root, "matrix.json");
  const outJson = path.join(root, "out.json");
  const outMd = path.join(root, "out.md");
  const tokenFile = path.join(root, ".env.arcgis.local");
  const secret = "do-not-record-this-token";

  writeJson(matrixPath, {
    rows: [{ county: "Skagit", fips: "53057", certifiable: false }]
  });
  fs.writeFileSync(tokenFile, `ARCGIS_TOKEN=${secret}\n`);

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
      "--token-file",
      tokenFile,
      "--fixture"
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const reportText = fs.readFileSync(outJson, "utf8");
  const markdown = fs.readFileSync(outMd, "utf8");
  const report = JSON.parse(reportText);

  assert.equal(report.accessMode, "authenticated");
  assert.equal(report.authSummary.tokenPresent, true);
  assert.equal(report.authSummary.tokenSource.startsWith("file:"), true);
  assert.equal(report.authSummary.token, undefined);
  assert.equal(reportText.includes(secret), false);
  assert.equal(markdown.includes(secret), false);
});
