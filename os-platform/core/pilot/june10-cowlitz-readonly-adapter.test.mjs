#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildCowlitzReadonlyAdapterVerification,
  runCowlitzReadonlyAdapterVerification
} from "./june10-cowlitz-readonly-adapter.mjs";

function cowlitzSourceLockPack() {
  return {
    generatedAtUtc: "2026-05-22T00:00:00.000Z",
    sourceLocks: [
      {
        county: "Cowlitz",
        countyToken: "cowlitz",
        state: "WA",
        sourceDecisionStatus: "source_locked",
        sourceUrls: [
          "https://cowlitzinfo.net/cowlitzpropertyapp/cowlitzpropertyapp/zoner/index",
          "https://gis.cowlitzwa.gov/ccportal/apps/webappviewer/index.html?id=848eadafa8ba4566a6a6370a4294c5e2"
        ],
        receiptTarget: "evidence/june10-38-county-seed/cowlitz/source-snapshot-receipt.json"
      }
    ]
  };
}

function cowlitzRawSourcePack() {
  return {
    appItem: {
      id: "848eadafa8ba4566a6a6370a4294c5e2",
      title: "Assessor Map",
      type: "Web Mapping Application",
      tags: ["Cowlitz County", "Assessor", "Parcels"],
      access: "public",
      licenseInfo:
        "This web application uses public data. Tax Parcel information, including Owner information, cannot be disseminated En masse without a data share agreement with the Assessor's office."
    },
    appData: {
      title: "AssessorMap",
      widgetOnScreen: {
        widgets: [
          {
            name: "Search",
            config: {
              sources: [
                {
                  name: "Parcels",
                  url: "https://gis.cowlitzwa.gov/ccserver/rest/services/Assessor/Parcels/MapServer/0",
                  searchFields: ["PARCNO"],
                  displayField: "DEED_HOLDER_NAME",
                  maxSuggestions: 6,
                  maxResults: 6,
                  type: "query"
                }
              ]
            }
          }
        ]
      }
    },
    parcelLayer: {
      name: "Parcels",
      type: "Feature Layer",
      fields: [
        { name: "OBJECTID", type: "esriFieldTypeOID" },
        { name: "PARCNO", type: "esriFieldTypeString", length: 30 },
        { name: "DEED_HOLDER_NAME", type: "esriFieldTypeString", length: 120 },
        { name: "SITUS_STREET_NUMBER", type: "esriFieldTypeString", length: 20 },
        { name: "SITUS_STREET_NAME", type: "esriFieldTypeString", length: 80 },
        { name: "SITUS_CITY", type: "esriFieldTypeString", length: 40 },
        { name: "LAND_ASSESSED_VALUE", type: "esriFieldTypeDouble" },
        { name: "IMPR_ASSESSED_VALUE", type: "esriFieldTypeDouble" }
      ],
      capabilities: "Map,Query,Data",
      maxRecordCount: 2000
    }
  };
}

test("Cowlitz adapter verifies read-only source metadata and parcel ID semantics", () => {
  const report = buildCowlitzReadonlyAdapterVerification({
    sourceLockPack: cowlitzSourceLockPack(),
    rawSourcePack: cowlitzRawSourcePack(),
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.county, "Cowlitz");
  assert.equal(report.adapterStatus, "verified");
  assert.equal(report.runtimeClaimAllowed, false);
  assert.equal(report.dbMutationAllowed, false);
  assert.equal(report.productionRowsWritten, 0);
  assert.equal(report.fetchPlan.every((step) => step.readOnly === true), true);
  assert.equal(report.parcelIdentity.proven, true);
  assert.equal(report.parcelIdentity.sourceField, "PARCNO");
  assert.equal(report.stagingShape.schema, "terrafusion-staging-parcel-source-v1");
  assert.equal(report.stagingShape.fields.parcelId.sourceField, "PARCNO");
  assert.equal(report.stagingShape.fields.ownerName.sourceField, "DEED_HOLDER_NAME");
  assert.deepEqual(report.stagingShape.fields.situsAddress.sourceFields, [
    "SITUS_STREET_NUMBER",
    "SITUS_STREET_NAME",
    "SITUS_CITY"
  ]);
  assert.deepEqual(report.stagingShape.fields.assessedValue.sourceFields, [
    "LAND_ASSESSED_VALUE",
    "IMPR_ASSESSED_VALUE"
  ]);
  assert.ok(report.lineageReceipt.rawArtifacts.every((artifact) => /^[a-f0-9]{64}$/.test(artifact.sha256)));
  assert.equal(report.lineageReceipt.normalizedArtifact.schema, "terrafusion-staging-parcel-source-v1");
  assert.equal(report.lineageReceipt.normalizedArtifact.rowCount, 0);
  assert.deepEqual(report.blockers, []);
});

test("Cowlitz adapter blocks verification when parcel ID semantics are absent", () => {
  const rawSourcePack = cowlitzRawSourcePack();
  rawSourcePack.appData.widgetOnScreen.widgets[0].config.sources[0].searchFields = ["ACCOUNT"];
  rawSourcePack.parcelLayer.fields = rawSourcePack.parcelLayer.fields.filter((field) => field.name !== "PARCNO");

  const report = buildCowlitzReadonlyAdapterVerification({
    sourceLockPack: cowlitzSourceLockPack(),
    rawSourcePack,
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.adapterStatus, "candidate");
  assert.equal(report.parcelIdentity.proven, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("PARCNO")));
  assert.equal(report.runtimeClaimAllowed, false);
});

test("Cowlitz adapter CLI writes verification evidence without DB mutation", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-cowlitz-adapter-"));
  const sourceLockPath = path.join(root, "source-lock.json");
  const rawSourcePath = path.join(root, "raw-source.json");
  const outJson = path.join(root, "adapter.json");
  const outMd = path.join(root, "adapter.md");
  const artifactRoot = path.join(root, "artifacts");
  const scriptPath = path.resolve("os-platform/core/pilot/june10-cowlitz-readonly-adapter.mjs");

  fs.writeFileSync(sourceLockPath, JSON.stringify(cowlitzSourceLockPack(), null, 2));
  fs.writeFileSync(rawSourcePath, JSON.stringify(cowlitzRawSourcePack(), null, 2));

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

test("Cowlitz adapter run helper writes evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-cowlitz-adapter-helper-"));
  const sourceLockPath = path.join(root, "source-lock.json");
  const rawSourcePath = path.join(root, "raw-source.json");
  const outJson = path.join(root, "adapter.json");
  const outMd = path.join(root, "adapter.md");
  const artifactRoot = path.join(root, "artifacts");

  fs.writeFileSync(sourceLockPath, JSON.stringify(cowlitzSourceLockPack(), null, 2));
  fs.writeFileSync(rawSourcePath, JSON.stringify(cowlitzRawSourcePack(), null, 2));

  const report = runCowlitzReadonlyAdapterVerification({ sourceLockPath, rawSourcePath, outJson, outMd, artifactRoot });

  assert.equal(report.adapterStatus, "verified");
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).adapterStatus, "verified");
  assert.match(fs.readFileSync(outMd, "utf8"), /PARCNO/);
});
