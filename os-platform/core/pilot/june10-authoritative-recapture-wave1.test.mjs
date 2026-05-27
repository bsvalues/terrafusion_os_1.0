import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildCountyRecaptureResult,
  compareIdentitySets,
  selectWave1Candidates,
  summarizeArcgisLayer
} from "./june10-authoritative-recapture-wave1.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-auth-recapture-wave1-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

test("selectWave1Candidates chooses only authoritative recapture candidates", () => {
  const candidates = selectWave1Candidates({
    rows: [
      { county: "Benton", fips: "53005", inventoryAccess: "authoritative_inventory_recapture_candidate" },
      { county: "Kitsap", fips: "53035", inventoryAccess: "authoritative_inventory_recapture_candidate" },
      { county: "Cowlitz", fips: "53015", inventoryAccess: "authoritative_inventory_receipt_found" },
      { county: "Pierce", fips: "53053", inventoryAccess: "secondary_evidence_only" }
    ]
  });

  assert.deepEqual(
    candidates.map((candidate) => candidate.county),
    ["Benton", "Kitsap"]
  );
});

test("summarizeArcgisLayer detects source-native parcel fields", () => {
  const summary = summarizeArcgisLayer({
    name: "Tax Parcels",
    fields: [
      { name: "OBJECTID", type: "esriFieldTypeOID" },
      { name: "PARCELID", type: "esriFieldTypeString" },
      { name: "OwnerName", type: "esriFieldTypeString" }
    ],
    maxRecordCount: 2000
  });

  assert.equal(summary.layerName, "Tax Parcels");
  assert.equal(summary.sourceParcelIdField, "PARCELID");
  assert.equal(summary.hasUsableParcelIdField, true);
});

test("compareIdentitySets reports exact and prefix-stripped overlap", () => {
  const comparison = compareIdentitySets({
    sourceIds: new Set(["100", "200", "300"]),
    canonicalIds: new Set(["035-100", "035-200", "999"])
  });

  assert.equal(comparison.exactOverlapCount, 0);
  assert.equal(comparison.prefixStrippedOverlapCount, 2);
  assert.equal(comparison.sourceOnlyCount, 3);
  assert.equal(comparison.canonicalOnlyCount, 3);
});

test("buildCountyRecaptureResult emits a receipt candidate but keeps certification blocked", () => {
  const result = buildCountyRecaptureResult({
    county: { county: "Kitsap", fips: "53035" },
    source: {
      sourceUrl: "https://example.test/FeatureServer/0",
      accessMethod: "arcgis_rest_query",
      termsPosture: "public_endpoint_terms_review_required"
    },
    capture: {
      status: "captured",
      sourceParcelIdField: "APN",
      rowCount: 2,
      distinctSourceIds: 2,
      nullOrBlankIds: 0,
      duplicateIds: 0,
      metadataArtifact: { path: "meta.json", sha256: "a" },
      sourceIdArtifact: { path: "ids.jsonl", sha256: "b" }
    },
    identityComparison: compareIdentitySets({
      sourceIds: new Set(["1", "2"]),
      canonicalIds: new Set(["1", "2"])
    })
  });

  assert.equal(result.receiptCandidate.valid, true);
  assert.equal(result.certificationAllowed, false);
  assert.equal(result.productionBindingAllowed, false);
});

test("CLI writes recapture wave evidence from fixture mode", () => {
  const root = tmpRoot();
  const matrixPath = path.join(root, "matrix.json");
  const outJson = path.join(root, "out.json");
  const outMd = path.join(root, "out.md");

  writeJson(matrixPath, {
    rows: [
      { county: "Benton", fips: "53005", inventoryAccess: "authoritative_inventory_recapture_candidate" },
      { county: "Kitsap", fips: "53035", inventoryAccess: "authoritative_inventory_recapture_candidate" },
      { county: "Skagit", fips: "53057", inventoryAccess: "authoritative_inventory_recapture_candidate" }
    ]
  });

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-authoritative-recapture-wave1.mjs",
      "--matrix",
      matrixPath,
      "--out-root",
      path.join(root, "wave"),
      "--out-json",
      outJson,
      "--out-md",
      outMd,
      "--fixture"
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(report.summary.countiesChecked, 3);
  assert.equal(report.databaseMutationAttempted, false);
  assert.equal(report.productionBindingAllowed, false);
  assert.match(fs.readFileSync(outMd, "utf8"), /Authoritative Recapture Wave 1/);
});
