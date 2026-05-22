#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildSpokaneReadonlyAdapterVerification,
  extractSpokaneRawSourcePack,
  runSpokaneReadonlyAdapterVerification
} from "./june10-spokane-readonly-adapter.mjs";

function spokaneSourceLockPack() {
  return {
    generatedAtUtc: "2026-05-22T00:00:00.000Z",
    sourceLocks: [
      {
        county: "Spokane",
        countyToken: "spokane",
        state: "WA",
        sourceDecisionStatus: "source_candidate_locked",
        sourceUrls: ["https://www.spokanecounty.org"],
        sourceLabels: {
          officialAssessorBaseUrl: "https://www.spokanecounty.org",
          primarySalesSource: "SCOUT Sales Search",
          fallbackSource: "Map parcel detail history",
          gisMapSurface: "SCOUT map"
        },
        receiptTarget: "evidence/june10-38-county-seed/spokane/source-snapshot-receipt.json"
      }
    ]
  };
}

function serviceHtml() {
  return `
    <html>
      <head><title>SCOUT/Queries (MapServer)</title></head>
      <body>
        <h2>SCOUT/Queries (MapServer)</h2>
        <b>Service Description: </b>SCOUT public query layers<br/>
        <b>Map Name: </b>SCOUT Queries<br/>
        <b>Capabilities: </b>Map,Query,Data<br/>
      </body>
    </html>
  `;
}

function layersHtml() {
  return `
    <html>
      <head><title>All Layers and Tables (SCOUT/Queries)</title></head>
      <body>
        <h2>All Layers and Tables (SCOUT/Queries)</h2>
        <div class="rbody">
          <ul>
            <h3>Layer: <a href="/arcgis/rest/services/SCOUT/Queries/MapServer/2">Parcels</a> (2)</h3>
            <b>Name:</b> Parcels<br/><br/>
            <b>Display Field:</b> nbhd_name<br/><br/>
            <b>Type: </b> Feature Layer<br/><br/>
            <b>Geometry Type:</b> esriGeometryPolygon<br/><br/>
            <b>MaxRecordCount: </b> 2000<br/><br/>
            <b>Supported Query Formats: </b> JSON, geoJSON, PBF<br/><br/>
            <b>Fields: </b>
            <ul>
              <li>OBJECTID<i>(type: esriFieldTypeOID, alias: OBJECTID)</i></li>
              <li>PID_NUM<i>(type: esriFieldTypeString, alias: Parcel Number, length: 255)</i></li>
              <li>ACO_NUM<i>(type: esriFieldTypeString, alias: Segregation Number, length: 255)</i></li>
              <li>owner_name<i>(type: esriFieldTypeString, alias: owner_name, length: 100)</i></li>
              <li>tax_year<i>(type: esriFieldTypeInteger, alias: tax_year)</i></li>
              <li>asmt_year<i>(type: esriFieldTypeInteger, alias: asmt_year)</i></li>
              <li>site_address<i>(type: esriFieldTypeString, alias: site_address, length: 50)</i></li>
              <li>site_state<i>(type: esriFieldTypeString, alias: site_state, length: 2)</i></li>
              <li>site_zip<i>(type: esriFieldTypeString, alias: site_zip, length: 10)</i></li>
              <li>seg_status<i>(type: esriFieldTypeString, alias: seg_status, length: 20)</i></li>
              <li>Shape<i>(type: esriFieldTypeGeometry, alias: SHAPE)</i></li>
            </ul>
          </ul>
        </div>
      </body>
    </html>
  `;
}

function spokaneRawSourcePack() {
  return extractSpokaneRawSourcePack({
    serviceHtml: serviceHtml(),
    layersHtml: layersHtml()
  });
}

test("Spokane adapter extracts SCOUT Parcels layer metadata without feature rows", () => {
  const raw = spokaneRawSourcePack();

  assert.equal(raw.pageMetadata.title, "SCOUT/Queries (MapServer)");
  assert.equal(raw.serviceMetadata.serviceName, "SCOUT/Queries");
  assert.equal(raw.parcelLayer.id, 2);
  assert.equal(raw.parcelLayer.name, "Parcels");
  assert.equal(raw.parcelLayer.fields.some((field) => field.name === "PID_NUM" && field.alias === "Parcel Number"), true);
  assert.equal(JSON.stringify(raw).includes("features"), false);
});

test("Spokane adapter verifies read-only source metadata and parcel ID semantics", () => {
  const report = buildSpokaneReadonlyAdapterVerification({
    sourceLockPack: spokaneSourceLockPack(),
    rawSourcePack: spokaneRawSourcePack(),
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.county, "Spokane");
  assert.equal(report.adapterStatus, "verified");
  assert.equal(report.runtimeClaimAllowed, false);
  assert.equal(report.dbMutationAllowed, false);
  assert.equal(report.productionRowsWritten, 0);
  assert.equal(report.fetchPlan.every((step) => step.readOnly === true), true);
  assert.equal(report.parcelIdentity.proven, true);
  assert.equal(report.parcelIdentity.sourceField, "PID_NUM");
  assert.equal(report.stagingShape.schema, "terrafusion-staging-parcel-source-v1");
  assert.equal(report.stagingShape.fields.parcelId.sourceField, "PID_NUM");
  assert.equal(report.stagingShape.fields.ownerName.sourceField, "owner_name");
  assert.deepEqual(report.stagingShape.fields.situsAddress.sourceFields, ["site_address", "site_state", "site_zip"]);
  assert.deepEqual(report.stagingShape.fields.assessedValue.sourceFields, []);
  assert.equal(report.stagingShape.fields.taxYear.sourceField, "tax_year");
  assert.equal(report.stagingShape.fields.status.sourceField, "seg_status");
  assert.ok(report.lineageReceipt.rawArtifacts.every((artifact) => /^[a-f0-9]{64}$/.test(artifact.sha256)));
  assert.equal(report.lineageReceipt.normalizedArtifact.schema, "terrafusion-staging-parcel-source-v1");
  assert.equal(report.lineageReceipt.normalizedArtifact.rowCount, 0);
  assert.deepEqual(report.blockers, []);
});

test("Spokane adapter blocks verification when parcel ID semantics are absent", () => {
  const rawSourcePack = spokaneRawSourcePack();
  rawSourcePack.parcelLayer.fields = rawSourcePack.parcelLayer.fields.filter((field) => field.name !== "PID_NUM");

  const report = buildSpokaneReadonlyAdapterVerification({
    sourceLockPack: spokaneSourceLockPack(),
    rawSourcePack,
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.adapterStatus, "candidate");
  assert.equal(report.parcelIdentity.proven, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("PID_NUM")));
  assert.equal(report.runtimeClaimAllowed, false);
});

test("Spokane adapter CLI writes verification evidence without DB mutation", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-spokane-adapter-"));
  const sourceLockPath = path.join(root, "source-lock.json");
  const rawSourcePath = path.join(root, "raw-source.json");
  const outJson = path.join(root, "adapter.json");
  const outMd = path.join(root, "adapter.md");
  const artifactRoot = path.join(root, "artifacts");
  const scriptPath = path.resolve("os-platform/core/pilot/june10-spokane-readonly-adapter.mjs");

  fs.writeFileSync(sourceLockPath, JSON.stringify(spokaneSourceLockPack(), null, 2));
  fs.writeFileSync(rawSourcePath, JSON.stringify(spokaneRawSourcePack(), null, 2));

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
});

test("Spokane adapter run helper writes evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-spokane-adapter-helper-"));
  const sourceLockPath = path.join(root, "source-lock.json");
  const rawSourcePath = path.join(root, "raw-source.json");
  const outJson = path.join(root, "adapter.json");
  const outMd = path.join(root, "adapter.md");
  const artifactRoot = path.join(root, "artifacts");

  fs.writeFileSync(sourceLockPath, JSON.stringify(spokaneSourceLockPack(), null, 2));
  fs.writeFileSync(rawSourcePath, JSON.stringify(spokaneRawSourcePack(), null, 2));

  const report = runSpokaneReadonlyAdapterVerification({ sourceLockPath, rawSourcePath, outJson, outMd, artifactRoot });

  assert.equal(report.adapterStatus, "verified");
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).adapterStatus, "verified");
  assert.match(fs.readFileSync(outMd, "utf8"), /PID_NUM/);
});
