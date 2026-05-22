#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildKingReadonlyAdapterVerification,
  runKingReadonlyAdapterVerification
} from "./june10-king-readonly-adapter.mjs";

function kingSourceLockPack() {
  return {
    generatedAtUtc: "2026-05-22T00:00:00.000Z",
    sourceLocks: [
      {
        county: "King",
        countyToken: "king",
        state: "WA",
        sourceDecisionStatus: "source_candidate_locked",
        sourceUrls: ["https://kingcounty.gov"],
        sourceLabels: {
          officialAssessorBaseUrl: "https://kingcounty.gov",
          primarySalesSource: "eSales Search",
          fallbackSource: "Parcel detail + recorded documents",
          gisMapSurface: "Parcel Viewer / GIS Center"
        },
        receiptTarget: "evidence/june10-38-county-seed/king/source-snapshot-receipt.json"
      }
    ]
  };
}

function kingRawSourcePack() {
  return {
    serviceMetadata: {
      currentVersion: 10.91,
      mapName: "Layers",
      serviceDescription:
        "This layer represents the tax parcels in King County. King County parcel numbers may include leading zeros in PIN, Major or Minor.",
      copyrightText: "King County",
      capabilities: "Map,Query,Data",
      supportedQueryFormats: "JSON, geoJSON, PBF",
      documentInfo: {
        Title: "Property (property)",
        Author: "KCGIS Center",
        Keywords: "King County,property_OpenData,tax,parcel,major,minor,pin,kingcounty_opendata"
      },
      layers: [
        {
          id: 439,
          name: "parcel_area",
          type: "Feature Layer",
          geometryType: "esriGeometryPolygon"
        }
      ]
    },
    parcelLayer: {
      id: 439,
      name: "parcel_area",
      type: "Feature Layer",
      description:
        "This layer represents the tax parcels in King County. The layer includes stacked polygon geometry for undivided interest and vertical parcels. King County parcel numbers may include leading zeros in PIN, Major or Minor. Do not use for survey purposes.",
      geometryType: "esriGeometryPolygon",
      displayField: "MAJOR",
      capabilities: "Map,Query,Data",
      supportedQueryFormats: "JSON, geoJSON, PBF",
      maxRecordCount: 4000,
      fields: [
        { name: "OBJECTID", type: "esriFieldTypeOID", alias: "OBJECTID" },
        { name: "Shape", type: "esriFieldTypeGeometry", alias: "Shape" },
        { name: "MAJOR", type: "esriFieldTypeString", alias: "MAJOR", length: 6 },
        { name: "MINOR", type: "esriFieldTypeString", alias: "MINOR", length: 4 },
        { name: "PIN", type: "esriFieldTypeString", alias: "PIN", length: 10 },
        { name: "Shape_Length", type: "esriFieldTypeDouble", alias: "Shape_Length" },
        { name: "Shape_Area", type: "esriFieldTypeDouble", alias: "Shape_Area" }
      ],
      indexes: [{ name: "I390PIN", fields: "PIN", isAscending: true, isUnique: false }]
    }
  };
}

test("King adapter verifies read-only source metadata and parcel ID semantics", () => {
  const report = buildKingReadonlyAdapterVerification({
    sourceLockPack: kingSourceLockPack(),
    rawSourcePack: kingRawSourcePack(),
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.county, "King");
  assert.equal(report.adapterStatus, "verified");
  assert.equal(report.runtimeClaimAllowed, false);
  assert.equal(report.dbMutationAllowed, false);
  assert.equal(report.productionRowsWritten, 0);
  assert.equal(report.fetchPlan.every((step) => step.readOnly === true), true);
  assert.equal(report.parcelIdentity.proven, true);
  assert.equal(report.parcelIdentity.sourceField, "PIN");
  assert.deepEqual(report.parcelIdentity.componentFields, ["MAJOR", "MINOR"]);
  assert.equal(report.stagingShape.schema, "terrafusion-staging-parcel-source-v1");
  assert.equal(report.stagingShape.fields.parcelId.sourceField, "PIN");
  assert.deepEqual(report.stagingShape.fields.parcelId.componentFields, ["MAJOR", "MINOR"]);
  assert.equal(report.stagingShape.fields.ownerName.sourceField, null);
  assert.equal(report.stagingShape.fields.situsAddress.sourceField, null);
  assert.deepEqual(report.stagingShape.fields.assessedValue.sourceFields, []);
  assert.ok(report.warnings.some((warning) => warning.includes("owner")));
  assert.ok(report.warnings.some((warning) => warning.includes("assessed value")));
  assert.ok(report.warnings.some((warning) => warning.includes("stacked polygon")));
  assert.ok(report.lineageReceipt.rawArtifacts.every((artifact) => /^[a-f0-9]{64}$/.test(artifact.sha256)));
  assert.equal(report.lineageReceipt.normalizedArtifact.schema, "terrafusion-staging-parcel-source-v1");
  assert.equal(report.lineageReceipt.normalizedArtifact.rowCount, 0);
  assert.deepEqual(report.blockers, []);
});

test("King adapter blocks verification when PIN semantics are absent", () => {
  const rawSourcePack = kingRawSourcePack();
  rawSourcePack.parcelLayer.fields = rawSourcePack.parcelLayer.fields.filter((field) => field.name !== "PIN");

  const report = buildKingReadonlyAdapterVerification({
    sourceLockPack: kingSourceLockPack(),
    rawSourcePack,
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.adapterStatus, "candidate");
  assert.equal(report.parcelIdentity.proven, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("PIN")));
  assert.equal(report.runtimeClaimAllowed, false);
});

test("King adapter CLI writes verification evidence without DB mutation", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-king-adapter-"));
  const sourceLockPath = path.join(root, "source-lock.json");
  const rawSourcePath = path.join(root, "raw-source.json");
  const outJson = path.join(root, "adapter.json");
  const outMd = path.join(root, "adapter.md");
  const artifactRoot = path.join(root, "artifacts");
  const scriptPath = path.resolve("os-platform/core/pilot/june10-king-readonly-adapter.mjs");

  fs.writeFileSync(sourceLockPath, JSON.stringify(kingSourceLockPack(), null, 2));
  fs.writeFileSync(rawSourcePath, JSON.stringify(kingRawSourcePack(), null, 2));

  const result = spawnSync(
    process.execPath,
    [
      scriptPath,
      "--source-lock",
      sourceLockPath,
      "--raw-source",
      rawSourcePath,
      "--out-json",
      outJson,
      "--out-md",
      outMd,
      "--artifact-root",
      artifactRoot
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /"adapterStatus": "verified"/);
  const output = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(output.adapterStatus, "verified");
  assert.equal(output.dbMutationAllowed, false);
  assert.match(fs.readFileSync(outMd, "utf8"), /Runtime claim allowed: false/);
  assert.match(fs.readFileSync(outMd, "utf8"), /Value fields: not available/);
});

test("King adapter run helper writes evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-king-adapter-helper-"));
  const sourceLockPath = path.join(root, "source-lock.json");
  const rawSourcePath = path.join(root, "raw-source.json");
  const outJson = path.join(root, "adapter.json");
  const outMd = path.join(root, "adapter.md");
  const artifactRoot = path.join(root, "artifacts");

  fs.writeFileSync(sourceLockPath, JSON.stringify(kingSourceLockPack(), null, 2));
  fs.writeFileSync(rawSourcePath, JSON.stringify(kingRawSourcePack(), null, 2));

  const report = runKingReadonlyAdapterVerification({ sourceLockPath, rawSourcePath, outJson, outMd, artifactRoot });

  assert.equal(report.adapterStatus, "verified");
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).adapterStatus, "verified");
  assert.match(fs.readFileSync(outMd, "utf8"), /PIN/);
});
