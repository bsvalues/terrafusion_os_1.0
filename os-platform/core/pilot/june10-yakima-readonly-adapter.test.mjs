#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildYakimaReadonlyAdapterVerification,
  extractYakimaRawSourcePack,
  runYakimaReadonlyAdapterVerification
} from "./june10-yakima-readonly-adapter.mjs";

function yakimaSourceLockPack() {
  return {
    generatedAtUtc: "2026-05-22T00:00:00.000Z",
    sourceLocks: [
      {
        county: "Yakima",
        countyToken: "yakima",
        state: "WA",
        sourceDecisionStatus: "source_locked",
        sourceUrls: ["https://property.spatialest.com/wa/yakima#/", "https://www.yakimacounty.us"],
        receiptTarget: "evidence/june10-38-county-seed/yakima/source-snapshot-receipt.json"
      }
    ]
  };
}

function yakimaRawSourcePack() {
  return {
    pageMetadata: {
      title: "Yakima County WA, Property Record Card",
      canonicalUrl: "https://property.spatialest.com/wa/yakima",
      vendor: "Spatialest",
      dataTimestamp: "05/22/2026",
      termsUrl: "https://www.schneidergis.com/legal-information/software-terms"
    },
    appConfig: {
      sitename: "Yakima County WA, Property Record Card",
      tenant: "WA Yakima",
      state: "wa",
      client: "yakima",
      settings: {
        dataTimestamp: "05/22/2026",
        isAuthenticated: false
      },
      permissions: {
        canSearchFull: true,
        canExportExcel: true
      },
      config: {
        map: {
          plotlayertitle: "Parcels",
          loadedlayeridentifier: "ParcelIdentifier",
          layers: [
            {
              title: "Layers",
              layers: [
                {
                  title: "Parcel Layer",
                  sourceparams: '{ "LAYERS" : "yakima-wa:Parcels", "SRS": "EPSG:900913", "format" : "image/png8" }'
                }
              ]
            }
          ],
          results: [
            { id: "line_1", title: "", schema: "public" },
            { id: "current_assessed_value", title: "Assessed Value", schema: "public" },
            { id: "parcel_number", title: "", schema: "public" },
            { id: "owner_name", title: "", schema: "public" }
          ]
        },
        prc: {
          recordcard: {
            header: {
              leftTop: { template: "{{parcel_number}}" },
              leftBottom: { template: "{{address}}" },
              middle: { template: "{{owners}}" },
              right: { template: "{{value}}" }
            },
            sections: [
              {
                id: "propertydetails",
                components: [
                  {
                    datasource: {
                      fields: [
                        { id: "parcel_number", title: "Parcel Number", schema: "public" },
                        { id: "line_1", title: "Situs Address", schema: "public" },
                        { id: "owners", title: "Owners", schema: "public" },
                        { id: "total_acres", title: "Property Size", schema: "public" }
                      ]
                    }
                  }
                ]
              }
            ]
          }
        }
      },
      searchresults: {
        export: [
          { id: "parcel_number", title: "Parcel Number", schema: "public" },
          { id: "line_1", title: "Address", schema: "public" },
          { id: "owner_name", title: "Owner", schema: "public" },
          { id: "current_assessed_value", title: "Assessed Value", schema: "public" }
        ]
      },
      searchby: [
        { id: "parcel", title: "Parcel #", useAsFilter: true, useAsSuggestion: true },
        { id: "Address", title: "Address", useAsFilter: true, useAsSuggestion: true },
        { id: "no_dash_parcel", title: "", useAsFilter: false, useAsSuggestion: false }
      ],
      lang: {
        DISCLAIMER:
          '<p>Please read: <a href="https://www.schneidergis.com/legal-information/software-terms">Global Terms of Service</a></p>'
      }
    }
  };
}

test("Yakima adapter extracts public Spatialest data-props without retaining CSRF token", () => {
  const html = `
    <html><head>
      <meta name="csrf-token" content="do-not-keep">
      <title>Yakima County WA, Property Record Card</title>
    </head>
    <body>
      <div id="rct-main-app" data-props='${JSON.stringify(yakimaRawSourcePack().appConfig)}'></div>
    </body></html>
  `;

  const raw = extractYakimaRawSourcePack(html, "https://property.spatialest.com/wa/yakima");

  assert.equal(raw.pageMetadata.title, "Yakima County WA, Property Record Card");
  assert.equal(raw.appConfig.client, "yakima");
  assert.equal(JSON.stringify(raw).includes("do-not-keep"), false);
});

test("Yakima adapter verifies read-only source metadata and parcel ID semantics", () => {
  const report = buildYakimaReadonlyAdapterVerification({
    sourceLockPack: yakimaSourceLockPack(),
    rawSourcePack: yakimaRawSourcePack(),
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.county, "Yakima");
  assert.equal(report.adapterStatus, "verified");
  assert.equal(report.runtimeClaimAllowed, false);
  assert.equal(report.dbMutationAllowed, false);
  assert.equal(report.productionRowsWritten, 0);
  assert.equal(report.fetchPlan.every((step) => step.readOnly === true), true);
  assert.equal(report.parcelIdentity.proven, true);
  assert.equal(report.parcelIdentity.sourceField, "parcel_number");
  assert.equal(report.stagingShape.schema, "terrafusion-staging-parcel-source-v1");
  assert.equal(report.stagingShape.fields.parcelId.sourceField, "parcel_number");
  assert.equal(report.stagingShape.fields.ownerName.sourceField, "owner_name");
  assert.equal(report.stagingShape.fields.situsAddress.sourceField, "line_1");
  assert.equal(report.stagingShape.fields.assessedValue.sourceField, "current_assessed_value");
  assert.ok(report.lineageReceipt.rawArtifacts.every((artifact) => /^[a-f0-9]{64}$/.test(artifact.sha256)));
  assert.equal(report.lineageReceipt.normalizedArtifact.schema, "terrafusion-staging-parcel-source-v1");
  assert.equal(report.lineageReceipt.normalizedArtifact.rowCount, 0);
  assert.deepEqual(report.blockers, []);
});

test("Yakima adapter blocks verification when parcel ID semantics are absent", () => {
  const rawSourcePack = yakimaRawSourcePack();
  rawSourcePack.appConfig.searchby = [{ id: "Address", title: "Address" }];
  rawSourcePack.appConfig.searchresults.export = rawSourcePack.appConfig.searchresults.export.filter(
    (field) => field.id !== "parcel_number"
  );

  const report = buildYakimaReadonlyAdapterVerification({
    sourceLockPack: yakimaSourceLockPack(),
    rawSourcePack,
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(report.adapterStatus, "candidate");
  assert.equal(report.parcelIdentity.proven, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("parcel_number")));
  assert.equal(report.runtimeClaimAllowed, false);
});

test("Yakima adapter CLI writes verification evidence without DB mutation", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-yakima-adapter-"));
  const sourceLockPath = path.join(root, "source-lock.json");
  const rawSourcePath = path.join(root, "raw-source.json");
  const outJson = path.join(root, "adapter.json");
  const outMd = path.join(root, "adapter.md");
  const artifactRoot = path.join(root, "artifacts");
  const scriptPath = path.resolve("os-platform/core/pilot/june10-yakima-readonly-adapter.mjs");

  fs.writeFileSync(sourceLockPath, JSON.stringify(yakimaSourceLockPack(), null, 2));
  fs.writeFileSync(rawSourcePath, JSON.stringify(yakimaRawSourcePack(), null, 2));

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

test("Yakima adapter run helper writes evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-yakima-adapter-helper-"));
  const sourceLockPath = path.join(root, "source-lock.json");
  const rawSourcePath = path.join(root, "raw-source.json");
  const outJson = path.join(root, "adapter.json");
  const outMd = path.join(root, "adapter.md");
  const artifactRoot = path.join(root, "artifacts");

  fs.writeFileSync(sourceLockPath, JSON.stringify(yakimaSourceLockPack(), null, 2));
  fs.writeFileSync(rawSourcePath, JSON.stringify(yakimaRawSourcePack(), null, 2));

  const report = runYakimaReadonlyAdapterVerification({ sourceLockPath, rawSourcePath, outJson, outMd, artifactRoot });

  assert.equal(report.adapterStatus, "verified");
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).adapterStatus, "verified");
  assert.match(fs.readFileSync(outMd, "utf8"), /parcel_number/);
});
