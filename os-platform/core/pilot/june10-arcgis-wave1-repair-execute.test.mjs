import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildCountyPostureReceipt,
  buildExecutionPlan,
  evaluateAuthorizationPacket,
  parseProposedRows
} from "./june10-arcgis-wave1-repair-execute.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-arcgis-wave1-repair-execute-"));
}

test("evaluateAuthorizationPacket allows only ready packet with execution disabled", () => {
  const packet = {
    state: "READY_FOR_HUMAN_DECISION",
    executionEnabled: false,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false,
    blockers: [],
    scope: {
      countiesIncluded: [
        { county: "Columbia", fips: "53013" },
        { county: "Ferry", fips: "53019" },
        { county: "Pend Oreille", fips: "53051" },
        { county: "Wahkiakum", fips: "53069" }
      ],
      countiesExcluded: [{ county: "Garfield", fips: "53023" }]
    }
  };

  assert.deepEqual(evaluateAuthorizationPacket(packet).blockers, []);
  assert.equal(evaluateAuthorizationPacket({ ...packet, executionEnabled: true }).blockers[0], "Authorization packet unexpectedly enables execution.");
});

test("parseProposedRows reads jsonl and rejects blank proposed parcel numbers", () => {
  const root = tmpRoot();
  const filePath = path.join(root, "rows.jsonl");
  fs.writeFileSync(
    filePath,
    `${JSON.stringify({ tfParcelId: "p1", countyId: "53013", currentParcelNumber: "013-1", proposedParcelNumber: "1", proposedLegacyImportedParcelKey: "013-1", proposedTerraFusionParcelKey: "53013:1" })}\n`
  );
  assert.equal(parseProposedRows(filePath).length, 1);

  fs.writeFileSync(
    filePath,
    `${JSON.stringify({
      tfParcelId: "p1",
      countyId: "53013",
      currentParcelNumber: "013-1",
      proposedParcelNumber: "",
      proposedLegacyImportedParcelKey: "013-1",
      proposedTerraFusionParcelKey: "53013:"
    })}\n`
  );
  assert.throws(() => parseProposedRows(filePath), /blank proposed ParcelNumber/);
});

test("buildExecutionPlan excludes Garfield and totals proposed rows", () => {
  const packet = {
    scope: {
      countiesIncluded: [
        { county: "Columbia", fips: "53013" },
        { county: "Wahkiakum", fips: "53069" }
      ],
      countiesExcluded: [{ county: "Garfield", fips: "53023" }]
    },
    counties: [
      {
        county: "Columbia",
        fips: "53013",
        proposedRows: 2,
        artifacts: { proposedRows: { path: "columbia.jsonl", sha256: "sha1" } }
      },
      {
        county: "Wahkiakum",
        fips: "53069",
        proposedRows: 1,
        artifacts: { proposedRows: { path: "wahkiakum.jsonl", sha256: "sha2" } }
      }
    ]
  };

  const plan = buildExecutionPlan({ packet, backupStamp: "20260527T000000Z" });
  assert.equal(plan.totalProposedRows, 3);
  assert.equal(plan.counties.length, 2);
  assert.equal(plan.counties.some((county) => county.fips === "53023"), false);
  assert.equal(plan.counties[0].backupTable, "backup.arcgis_wave1_53013_identity_20260527T000000Z");
});

test("buildCountyPostureReceipt keeps production binding and certification false", () => {
  const receipt = buildCountyPostureReceipt({
    county: { county: "Columbia", fips: "53013" },
    audit: {
      activeRows: 5280,
      duplicateGroups: 0,
      repairedRows: 5280,
      legacyPreservedRows: 5280,
      terraFusionKeyRows: 5280,
      sourceParcelIdFieldRows: 5280
    },
    sourceArtifact: { path: "source.jsonl", sha256: "source-sha" },
    executionReceiptPath: "execution.json"
  });

  assert.equal(receipt.receiptVersion, "wa_initial_seed_post_repair_v1");
  assert.equal(receipt.receiptStatus, "receipt_backed_full_identity");
  assert.equal(receipt.productionBindingAllowed, false);
  assert.equal(receipt.certificationAllowed, false);
});
