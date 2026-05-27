import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildCandidateValidationReport,
  evaluateArcgisLayerMetadata,
  normalizeArcgisServiceUrl
} from "./june10-arcgis-candidate-field-validation.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-arcgis-candidate-validation-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

test("normalizeArcgisServiceUrl strips layer suffixes and query params", () => {
  assert.equal(
    normalizeArcgisServiceUrl("https://example.test/arcgis/rest/services/Parcels/FeatureServer/0?f=json"),
    "https://example.test/arcgis/rest/services/Parcels/FeatureServer"
  );
  assert.equal(
    normalizeArcgisServiceUrl("https://example.test/arcgis/rest/services/Parcels/MapServer/12"),
    "https://example.test/arcgis/rest/services/Parcels/MapServer"
  );
  assert.equal(normalizeArcgisServiceUrl("https://example.test/apps/webappviewer/index.html?id=abc"), null);
});

test("evaluateArcgisLayerMetadata detects parcel, county, value, address, query, and extract support", () => {
  const evaluated = evaluateArcgisLayerMetadata({
    service: {
      serviceDescription: "Washington statewide tax parcel data.",
      capabilities: "Query,Extract,Sync",
      supportedExportFormats: "csv,filegdb,geojson",
      layers: [{ id: 0, name: "Parcels_2026" }]
    },
    layer: {
      id: 0,
      name: "Parcels_2026",
      capabilities: "Query,Extract",
      geometryType: "esriGeometryPolygon",
      fields: [
        { name: "OBJECTID" },
        { name: "FIPS_NR" },
        { name: "COUNTY_NM" },
        { name: "PARCEL_ID_NR" },
        { name: "ORIG_PARCEL_ID" },
        { name: "SITUS_ADDRESS" },
        { name: "VALUE_LAND" },
        { name: "VALUE_BLDG" }
      ]
    }
  });

  assert.equal(evaluated.validationStatus, "candidate_layer_receipt_ready");
  assert.deepEqual(evaluated.parcelIdFields, ["PARCEL_ID_NR", "ORIG_PARCEL_ID"]);
  assert.deepEqual(evaluated.countyScopeFields, ["FIPS_NR", "COUNTY_NM"]);
  assert.equal(evaluated.querySupported, true);
  assert.equal(evaluated.extractSupported, true);
  assert.equal(evaluated.sourceScope, "statewide");
});

test("buildCandidateValidationReport maps service validations back to county rows without certification", () => {
  const report = buildCandidateValidationReport({
    discovery: {
      accessMode: "anonymous",
      rows: [
        {
          county: "Adams",
          fips: "53001",
          candidates: [
            {
              title: "Current Parcels",
              owner: "WAGeoservices",
              url: "https://example.test/arcgis/rest/services/Current_Parcels/FeatureServer",
              classification: "washington_statewide_parcel_feature_service_candidate"
            }
          ]
        }
      ]
    },
    validations: new Map([
      [
        "https://example.test/arcgis/rest/services/Current_Parcels/FeatureServer",
        {
          serviceUrl: "https://example.test/arcgis/rest/services/Current_Parcels/FeatureServer",
          reachable: true,
          validationStatus: "candidate_layer_receipt_ready",
          parcelIdFields: ["PARCEL_ID_NR"],
          countyScopeFields: ["FIPS_NR"],
          querySupported: true,
          extractSupported: true,
          sourceScope: "statewide"
        }
      ]
    ])
  });

  assert.equal(report.summary.countiesChecked, 1);
  assert.equal(report.summary.countiesReceiptReadyCandidates, 1);
  assert.equal(report.rows[0].nextAction, "capture_county_slice_from_validated_arcgis_layer");
  assert.equal(report.productionBindingAllowed, false);
  assert.equal(report.certificationAllowed, false);
});

test("CLI writes candidate validation report in fixture mode", () => {
  const root = tmpRoot();
  const discoveryPath = path.join(root, "discovery.json");
  const outJson = path.join(root, "out.json");
  const outMd = path.join(root, "out.md");

  writeJson(discoveryPath, {
    accessMode: "anonymous",
    rows: [
      {
        county: "Adams",
        fips: "53001",
        candidates: [
          {
            title: "Current Parcels",
            owner: "WAGeoservices",
            url: "https://example.test/arcgis/rest/services/Current_Parcels/FeatureServer",
            classification: "washington_statewide_parcel_feature_service_candidate"
          }
        ]
      }
    ]
  });

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-arcgis-candidate-field-validation.mjs",
      "--discovery",
      discoveryPath,
      "--out-json",
      outJson,
      "--out-md",
      outMd,
      "--fixture"
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(report.summary.uniqueCandidateServicesChecked, 1);
  assert.match(fs.readFileSync(outMd, "utf8"), /ArcGIS Candidate Field Validation/);
});
