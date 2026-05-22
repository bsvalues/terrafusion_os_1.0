#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildClarkReadonlyAdapterVerification,
  runClarkReadonlyAdapterVerification
} from "./june10-clark-readonly-adapter.mjs";

function clarkSourceLockPack() {
  return {
    generatedAtUtc: "2026-05-22T00:00:00.000Z",
    sourceLocks: [
      {
        county: "Clark",
        countyToken: "clark",
        state: "WA",
        sourceDecisionStatus: "source_candidate_locked",
        sourceUrls: ["https://clark.wa.gov"],
        sourceLabels: {
          officialAssessorBaseUrl: "https://clark.wa.gov",
          primarySalesSource: "Property Information Center sales history + Residential Property Sales Information",
          fallbackSource: "MapsOnline / parcel fact sheet / recorded documents",
          gisMapSurface: "Property Information Center + MapsOnline"
        },
        receiptTarget: "evidence/june10-38-county-seed/clark/source-snapshot-receipt.json"
      }
    ]
  };
}

function clarkRawSourcePack() {
  return {
    serviceMetadata: {
      currentVersion: 11.5,
      mapName: "PropertyFinder",
      serviceItemId: "dfb647307169445ca9b9b443f1bb5cf1",
      capabilities: "Query,Map,Data",
      supportedQueryFormats: "JSON, geoJSON, PBF",
      layers: [
        {
          id: 1,
          name: "Taxlots",
          type: "Feature Layer",
          geometryType: "esriGeometryPolygon"
        }
      ]
    },
    parcelLayer: {
      id: 1,
      name: "Taxlots",
      type: "Feature Layer",
      description: "Taxlots2 is an updated version of Taxlots.",
      geometryType: "esriGeometryPolygon",
      displayField: "Prop_id",
      capabilities: "Query,Map,Data",
      supportedQueryFormats: "JSON, geoJSON, PBF",
      maxRecordCount: 2000,
      fields: [
        { name: "OBJECTID", type: "esriFieldTypeOID", alias: "OBJECTID" },
        { name: "Prop_id", type: "esriFieldTypeInteger", alias: "Property ID" },
        { name: "Owner", type: "esriFieldTypeString", alias: "Owner Name", length: 70 },
        { name: "SitusAddrsFull", type: "esriFieldTypeString", alias: "Situs Address", length: 150 },
        { name: "Shape", type: "esriFieldTypeGeometry", alias: "Shape" },
        { name: "MailAddrs1", type: "esriFieldTypeString", alias: "MailAddrs1", length: 60 },
        { name: "CityUGA", type: "esriFieldTypeString", alias: "CityUGA", length: 255 }
      ],
      ownershipBasedAccessControlForFeatures: { allowOthersToQuery: true }
    }
  };
}

test("Clark adapter verifies read-only source metadata and parcel ID semantics", () => {
  const report = buildClarkReadonlyAdapterVerification({
    sourceLockPack: clarkSourceLockPack(),
    rawSourcePack: clarkRawSourcePack(),
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.county, "Clark");
  assert.equal(report.adapterStatus, "verified");
  assert.equal(report.runtimeClaimAllowed, false);
  assert.equal(report.dbMutationAllowed, false);
  assert.equal(report.productionRowsWritten, 0);
  assert.equal(report.fetchPlan.every((step) => step.readOnly === true), true);
  assert.equal(report.parcelIdentity.proven, true);
  assert.equal(report.parcelIdentity.sourceField, "Prop_id");
  assert.equal(report.stagingShape.schema, "terrafusion-staging-parcel-source-v1");
  assert.equal(report.stagingShape.fields.parcelId.sourceField, "Prop_id");
  assert.equal(report.stagingShape.fields.ownerName.sourceField, "Owner");
  assert.equal(report.stagingShape.fields.situsAddress.sourceField, "SitusAddrsFull");
  assert.deepEqual(report.stagingShape.fields.assessedValue.sourceFields, []);
  assert.ok(report.warnings.some((warning) => warning.includes("assessed value")));
  assert.ok(report.lineageReceipt.rawArtifacts.every((artifact) => /^[a-f0-9]{64}$/.test(artifact.sha256)));
  assert.equal(report.lineageReceipt.normalizedArtifact.schema, "terrafusion-staging-parcel-source-v1");
  assert.equal(report.lineageReceipt.normalizedArtifact.rowCount, 0);
  assert.deepEqual(report.blockers, []);
});

test("Clark adapter blocks verification when parcel ID semantics are absent", () => {
  const rawSourcePack = clarkRawSourcePack();
  rawSourcePack.parcelLayer.fields = rawSourcePack.parcelLayer.fields.filter((field) => field.name !== "Prop_id");

  const report = buildClarkReadonlyAdapterVerification({
    sourceLockPack: clarkSourceLockPack(),
    rawSourcePack,
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.adapterStatus, "candidate");
  assert.equal(report.parcelIdentity.proven, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("Prop_id")));
  assert.equal(report.runtimeClaimAllowed, false);
});

test("Clark adapter CLI writes verification evidence without DB mutation", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-clark-adapter-"));
  const sourceLockPath = path.join(root, "source-lock.json");
  const rawSourcePath = path.join(root, "raw-source.json");
  const outJson = path.join(root, "adapter.json");
  const outMd = path.join(root, "adapter.md");
  const artifactRoot = path.join(root, "artifacts");
  const scriptPath = path.resolve("os-platform/core/pilot/june10-clark-readonly-adapter.mjs");

  fs.writeFileSync(sourceLockPath, JSON.stringify(clarkSourceLockPack(), null, 2));
  fs.writeFileSync(rawSourcePath, JSON.stringify(clarkRawSourcePack(), null, 2));

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

test("Clark adapter run helper writes evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-clark-adapter-helper-"));
  const sourceLockPath = path.join(root, "source-lock.json");
  const rawSourcePath = path.join(root, "raw-source.json");
  const outJson = path.join(root, "adapter.json");
  const outMd = path.join(root, "adapter.md");
  const artifactRoot = path.join(root, "artifacts");

  fs.writeFileSync(sourceLockPath, JSON.stringify(clarkSourceLockPack(), null, 2));
  fs.writeFileSync(rawSourcePath, JSON.stringify(clarkRawSourcePack(), null, 2));

  const report = runClarkReadonlyAdapterVerification({ sourceLockPath, rawSourcePath, outJson, outMd, artifactRoot });

  assert.equal(report.adapterStatus, "verified");
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).adapterStatus, "verified");
  assert.match(fs.readFileSync(outMd, "utf8"), /Prop_id/);
});
