import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildCountyCaptureResult,
  compareIdentitySets,
  extractSourceIdentity,
  fetchJsonWithRetry,
  selectWaveCounties,
  shortFips,
  stripSeedPrefix
} from "./june10-arcgis-source-capture-wave1.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-arcgis-source-capture-wave1-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

test("shortFips returns the county three-digit suffix", () => {
  assert.equal(shortFips("53023"), "023");
  assert.equal(shortFips("023"), "023");
});

test("selectWaveCounties picks bounded small receipt-ready counties", () => {
  const rows = [
    { county: "Garfield", fips: "53023", validationStatus: "candidate_layer_receipt_ready" },
    { county: "King", fips: "53033", validationStatus: "candidate_layer_receipt_ready" },
    { county: "Jefferson", fips: "53031", validationStatus: "candidate_layer_not_arcgis_service" }
  ];

  assert.deepEqual(
    selectWaveCounties(rows, ["Garfield", "Jefferson", "King"]).map((row) => row.county),
    ["Garfield", "King"]
  );
});

test("extractSourceIdentity separates statewide prefixed and source-native IDs", () => {
  const identity = extractSourceIdentity([
    { attributes: { PARCEL_ID_NR: "023-100", ORIG_PARCEL_ID: "100" } },
    { attributes: { PARCEL_ID_NR: "023-100", ORIG_PARCEL_ID: "100" } },
    { attributes: { PARCEL_ID_NR: "023-200", ORIG_PARCEL_ID: "200" } },
    { attributes: { PARCEL_ID_NR: "", ORIG_PARCEL_ID: "" } }
  ]);

  assert.equal(identity.rowCount, 4);
  assert.equal(identity.prefixedIds.size, 2);
  assert.equal(identity.sourceNativeIds.size, 2);
  assert.equal(identity.nullOrBlankSourceNative, 1);
  assert.equal(identity.duplicateSourceNativeIds, 1);
});

test("compareIdentitySets detects prefixed repair candidates", () => {
  const comparison = compareIdentitySets({
    sourceNativeIds: new Set(["100", "200"]),
    sourcePrefixedIds: new Set(["023-100", "023-200"]),
    canonicalIds: new Set(["023-100", "023-200"])
  });

  assert.equal(comparison.exactSourceNativeOverlapCount, 0);
  assert.equal(comparison.prefixedSourceOverlapCount, 2);
  assert.equal(comparison.prefixStrippedCanonicalOverlapCount, 2);
});

test("buildCountyCaptureResult classifies bounded deltas and blocks certification", () => {
  const result = buildCountyCaptureResult({
    county: { county: "Garfield", fips: "53023" },
    source: {
      rowCount: 2,
      sourceNativeIds: new Set(["100", "300"]),
      prefixedIds: new Set(["023-100", "023-300"]),
      nullOrBlankSourceNative: 0,
      duplicateSourceNativeIds: 0
    },
    canonicalIds: new Set(["023-100", "023-200"]),
    sourceArtifact: { path: "artifact.jsonl", sha256: "abc" }
  });

  assert.equal(stripSeedPrefix("023-100"), "100");
  assert.equal(result.classification, "bounded_delta_candidate");
  assert.equal(result.productionBindingAllowed, false);
  assert.equal(result.certificationAllowed, false);
});

test("fetchJsonWithRetry retries transient ArcGIS socket failures", async () => {
  let attempts = 0;
  const payload = await fetchJsonWithRetry("https://example.test/query", {
    retries: 1,
    retryDelayMs: 0,
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) throw new TypeError("fetch failed");
      return {
        ok: true,
        text: async () => JSON.stringify({ features: [{ attributes: { ORIG_PARCEL_ID: "100" } }] })
      };
    }
  });

  assert.equal(attempts, 2);
  assert.equal(payload.features[0].attributes.ORIG_PARCEL_ID, "100");
});

test("CLI writes Wave 1 source capture report in fixture mode", () => {
  const root = tmpRoot();
  const validationPath = path.join(root, "validation.json");
  const outRoot = path.join(root, "wave1");
  const outJson = path.join(root, "out.json");
  const outMd = path.join(root, "out.md");

  writeJson(validationPath, {
    rows: [
      {
        county: "Garfield",
        fips: "53023",
        validationStatus: "candidate_layer_receipt_ready",
        normalizedServiceUrl: "https://example.test/FeatureServer",
        parcelIdFields: ["PARCEL_ID_NR", "ORIG_PARCEL_ID"],
        countyScopeFields: ["FIPS_NR"]
      }
    ]
  });

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-arcgis-source-capture-wave1.mjs",
      "--validation",
      validationPath,
      "--out-root",
      outRoot,
      "--out-json",
      outJson,
      "--out-md",
      outMd,
      "--wave-label",
      "Wave 2",
      "--fixture"
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(report.summary.countiesChecked, 1);
  assert.equal(report.waveLabel, "Wave 2");
  assert.match(fs.readFileSync(outMd, "utf8"), /ArcGIS Source Capture Wave 2/);
});
