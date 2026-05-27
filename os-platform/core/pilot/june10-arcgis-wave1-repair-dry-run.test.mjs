import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildCleanRepairDryRun,
  buildGarfieldDeltaAdjudication,
  duplicateTargetCount,
  parseSourceArtifactRows,
  plannedRepairRow,
  stripSeedPrefix
} from "./june10-arcgis-wave1-repair-dry-run.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-arcgis-wave1-repair-dry-run-"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

test("parseSourceArtifactRows reads source-native and prefixed IDs from captured ArcGIS JSONL", () => {
  const root = tmpRoot();
  const artifact = path.join(root, "source.jsonl");
  fs.writeFileSync(
    artifact,
    `${JSON.stringify({ PARCEL_ID_NR: "013-100", ORIG_PARCEL_ID: "100" })}\n${JSON.stringify({ PARCEL_ID_NR: "013-", ORIG_PARCEL_ID: "" })}\n`
  );

  const rows = parseSourceArtifactRows(artifact);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].sourceNativeParcelNumber, "100");
  assert.equal(rows[0].legacyImportedParcelKey, "013-100");
  assert.equal(rows[1].sourceNativeParcelNumber, "");
});

test("plannedRepairRow restores ORIG_PARCEL_ID and preserves PARCEL_ID_NR", () => {
  const row = plannedRepairRow({
    county: { fips: "53013" },
    canonicalRow: {
      tfParcelId: "p1",
      countyId: "c1",
      parcelNumber: "013-100",
      legacyImportedParcelKey: null,
      terraFusionParcelKey: null
    },
    sourceByPrefixedId: new Map([["013-100", { sourceNativeParcelNumber: "100", legacyImportedParcelKey: "013-100" }]])
  });

  assert.equal(stripSeedPrefix("013-100"), "100");
  assert.equal(row.proposedParcelNumber, "100");
  assert.equal(row.proposedLegacyImportedParcelKey, "013-100");
  assert.equal(row.proposedTerraFusionParcelKey, "53013:100");
  assert.equal(row.action, "restore_source_native_parcel_number_from_arcgis_orig_parcel_id");
});

test("duplicateTargetCount catches proposed CountyId + ParcelNumber collisions", () => {
  assert.equal(duplicateTargetCount(["A", "B", "A"]), 1);
  assert.equal(duplicateTargetCount(["A", "B", "C"]), 0);
});

test("buildCleanRepairDryRun emits duplicate-safe repair receipt and blocks certification", () => {
  const dryRun = buildCleanRepairDryRun({
    county: { county: "Columbia", fips: "53013" },
    captureRow: {
      sourceArtifact: { path: "source.jsonl", sha256: "source-sha" },
      identityComparison: { sourceNativeOnlyCount: 0, canonicalOnlyAfterPrefixStripCount: 0 }
    },
    sourceRows: [
      { sourceNativeParcelNumber: "100", legacyImportedParcelKey: "013-100" },
      { sourceNativeParcelNumber: "200", legacyImportedParcelKey: "013-200" }
    ],
    canonicalRows: [
      { tfParcelId: "p1", countyId: "c1", parcelNumber: "013-100", legacyImportedParcelKey: "", terraFusionParcelKey: "" },
      { tfParcelId: "p2", countyId: "c1", parcelNumber: "013-200", legacyImportedParcelKey: "", terraFusionParcelKey: "" }
    ]
  });

  assert.equal(dryRun.classification, "repair_dry_run_ready_for_authorization");
  assert.equal(dryRun.validation.duplicateCountyIdParcelNumberAfter, 0);
  assert.equal(dryRun.validation.proposedRows, 2);
  assert.equal(dryRun.receiptCandidate.certificationAllowed, false);
  assert.equal(dryRun.doctrine.databaseMutationAttempted, false);
});

test("buildGarfieldDeltaAdjudication holds blank source-native canonical row out of repair", () => {
  const adjudication = buildGarfieldDeltaAdjudication({
    captureRow: {
      county: "Garfield",
      fips: "53023",
      identityComparison: {
        canonicalOnlyAfterPrefixStripSamples: [""],
        canonicalOnlyAfterPrefixStripCount: 1,
        sourceNativeOnlyCount: 0
      }
    },
    sourceRows: [{ sourceNativeParcelNumber: "", legacyImportedParcelKey: "023-" }]
  });

  assert.equal(adjudication.classification, "garfield_blank_source_native_delta_hold");
  assert.equal(adjudication.repairAllowed, false);
  assert.equal(adjudication.certificationAllowed, false);
});

test("CLI writes Wave 1 repair dry-run report in fixture mode", () => {
  const root = tmpRoot();
  const outRoot = path.join(root, "repair");
  const outJson = path.join(root, "out.json");
  const outMd = path.join(root, "out.md");
  const captureRoot = path.join(root, "capture");
  const sourcePath = path.join(captureRoot, "53013-columbia", "source-native-parcel-ids.jsonl");
  fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
  fs.writeFileSync(sourcePath, `${JSON.stringify({ PARCEL_ID_NR: "013-100", ORIG_PARCEL_ID: "100" })}\n`);
  const captureJson = path.join(root, "capture.json");
  writeJson(captureJson, {
    rows: [
      {
        county: "Columbia",
        fips: "53013",
        classification: "prefixed_repair_candidate",
        sourceArtifact: { path: path.relative(process.cwd(), sourcePath).replaceAll(path.sep, "/"), sha256: "source-sha" },
        identityComparison: { sourceNativeOnlyCount: 0, canonicalOnlyAfterPrefixStripCount: 0 }
      }
    ]
  });

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-arcgis-wave1-repair-dry-run.mjs",
      "--capture",
      captureJson,
      "--out-root",
      outRoot,
      "--out-json",
      outJson,
      "--out-md",
      outMd,
      "--fixture"
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(report.summary.cleanRepairReadyCount, 1);
  assert.match(fs.readFileSync(outMd, "utf8"), /ArcGIS Wave 1 Repair Dry-Run/);
});
