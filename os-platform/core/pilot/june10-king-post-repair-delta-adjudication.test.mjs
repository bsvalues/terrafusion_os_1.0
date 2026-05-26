#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { adjudicateKingDelta } from "./june10-king-post-repair-delta-adjudication.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-king-delta-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

const closure = {
  counties: [
    {
      countyName: "King County",
      fips: "53033",
      sourceOnlyCount: 1,
      canonicalOnlyCount: 1,
      certificationStatus: "blocked_crosswalk_delta"
    }
  ]
};

const captureMetadata = {
  sourceUrl: "https://example.test/king",
  parcelIdField: "PIN",
  expectedSourceCount: 4,
  capturedFeatureRows: 4,
  termsPosture: "public_parcel_id_only",
  geometryCaptured: false,
  ownerFieldsCaptured: false
};

const serviceMetadata = {
  description:
    "This layer includes place-holder polygons and stacked polygon geometry for undivided interest and vertical parcels.",
  indexes: [{ fields: "PIN", isUnique: false }]
};

test("classifies complete King source/canonical bidirectional delta as bounded correction plan", () => {
  const report = adjudicateKingDelta({
    closure,
    sourceIds: ["100", "100", "101", "102", "abc-tr"],
    canonicalIds: ["100", "101", "103", "ABC-TR"],
    captureMetadata,
    serviceMetadata
  });

  assert.equal(report.countyName, "King County");
  assert.equal(report.summary.sourceRows, 5);
  assert.equal(report.summary.sourceDistinctParcelIds, 4);
  assert.equal(report.summary.sourceDuplicateExtraRows, 1);
  assert.equal(report.summary.sourceOnlyCount, 2);
  assert.equal(report.summary.canonicalOnlyCount, 2);
  assert.equal(report.caseNormalizationEdges.count, 1);
  assert.equal(report.summary.sourceCaptureComplete, true);
  assert.equal(report.serviceFacts.documentsStackedGeometry, true);
  assert.equal(report.serviceFacts.pinIndexUnique, false);
  assert.equal(report.decision, "require_bounded_reimport_and_supersede_plan");
  assert.ok(report.blockers.some((blocker) => blocker.includes("current source PINs")));
  assert.ok(report.blockers.some((blocker) => blocker.includes("canonical ParcelNumber")));
  assert.equal(report.databaseMutationAttempted, false);
  assert.equal(report.productionBindingAllowed, false);
});

test("accepts King identity delta only when distinct source and canonical IDs fully overlap", () => {
  const report = adjudicateKingDelta({
    closure: {
      counties: [
        {
          countyName: "King County",
          fips: "53033",
          sourceOnlyCount: 0,
          canonicalOnlyCount: 0,
          certificationStatus: "certification_pass"
        }
      ]
    },
    sourceIds: ["100", "100", "101"],
    canonicalIds: ["100", "101"],
    captureMetadata: { ...captureMetadata, expectedSourceCount: 3, capturedFeatureRows: 3 },
    serviceMetadata
  });

  assert.equal(report.decision, "accept_identity_delta_closed");
  assert.deepEqual(report.blockers, []);
});

test("CLI writes King adjudication evidence and delta lists", () => {
  const root = tmpRoot();
  const closurePath = path.join(root, "closure.json");
  const sourcePath = path.join(root, "king-source.jsonl");
  const sourceMetadataPath = path.join(root, "metadata.json");
  const serviceMetadataPath = path.join(root, "service.json");
  const canonicalPath = path.join(root, "canonical.csv");
  const outRoot = path.join(root, "out");
  const outJson = path.join(root, "king.json");
  const outMd = path.join(root, "king.md");

  writeJson(closurePath, closure);
  writeJson(sourceMetadataPath, captureMetadata);
  writeJson(serviceMetadataPath, serviceMetadata);
  writeText(
    sourcePath,
    `${JSON.stringify({ features: [{ attributes: { PIN: "100" } }, { attributes: { PIN: "100" } }, { attributes: { PIN: "102" } }] })}\n`
  );
  writeText(canonicalPath, "ParcelNumber\n100\n103\n");

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-king-post-repair-delta-adjudication.mjs",
      "--closure",
      closurePath,
      "--source-artifact",
      sourcePath,
      "--source-metadata",
      sourceMetadataPath,
      "--service-metadata",
      serviceMetadataPath,
      "--canonical-export",
      canonicalPath,
      "--out-root",
      outRoot,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(report.decision, "require_bounded_reimport_and_supersede_plan");
  assert.equal(fs.readFileSync(path.join(outRoot, "king-source-only-parcels.txt"), "utf8").trim(), "102");
  assert.equal(fs.readFileSync(path.join(outRoot, "king-canonical-only-parcels.txt"), "utf8").trim(), "103");
  assert.match(fs.readFileSync(outMd, "utf8"), /King Post-Repair Delta Adjudication/);
});
