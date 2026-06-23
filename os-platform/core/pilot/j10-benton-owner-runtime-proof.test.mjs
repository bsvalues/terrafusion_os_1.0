import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildOwnerRuntimeProofPacket,
  writePacket
} from "./j10-benton-owner-runtime-proof.mjs";

test("proves owner-current runtime when truth, canonical owner, and links are coherent", () => {
  const packet = buildOwnerRuntimeProofPacket({
    generatedAt: "2026-06-07T17:00:00.000Z",
    observations: {
      truthOwner: { ok: true, value: { rows: 816849, distinctRows: 816849 } },
      canonicalOwner: { ok: true, value: { rows: 312532, distinctIds: 312532, nullAcctId: 0, blankDisplayName: 0 } },
      ownerLink: { ok: true, value: { rows: 2111805 } },
      wsdorTruth: { ok: true, value: { rows: 774696, distinctRows: 774696 } },
      wsdorCanonical: { ok: true, value: { rows: 686820 } },
      statusCounts: { ok: true, value: { COMPLETED: 148, IN_PROGRESS: 2 } }
    }
  });

  assert.equal(packet.verdict, "BENTON_OWNER_RUNTIME_TRUTH_PROVEN");
  assert.equal(packet.runtimeProven, true);
  assert.equal(packet.productionTouched, false);
  assert.equal(packet.databaseMutation, false);
  assert.equal(packet.activeSyncTouched, false);
  assert.equal(packet.metrics.truthOwnerRows, 816849);
  assert.equal(packet.metrics.truthOwnerDuplication, "1.0000x");
  assert.equal(packet.metrics.canonicalOwnerRows, 312532);
  assert.equal(packet.metrics.ownerLinkRows, 2111805);
  assert.equal(packet.ownerReadiness.status, "OWNER_CURRENT_RUNTIME_PROVEN");
  assert.equal(packet.wsdorStatus, "WSDOR_CANONICAL_CONTINUING");
  assert.deepEqual(packet.blockers, []);
});

test("blocks runtime proof when owner truth duplicates or required counts are missing", () => {
  const packet = buildOwnerRuntimeProofPacket({
    generatedAt: "2026-06-07T17:00:00.000Z",
    observations: {
      truthOwner: { ok: true, value: { rows: 10, distinctRows: 9 } },
      canonicalOwner: { ok: true, value: { rows: 0, distinctIds: 0, nullAcctId: 0, blankDisplayName: 0 } },
      ownerLink: { ok: true, value: { rows: 0 } },
      statusCounts: { ok: true, value: { COMPLETED: 148 } }
    }
  });

  assert.equal(packet.verdict, "BENTON_OWNER_RUNTIME_BLOCKED");
  assert.equal(packet.runtimeProven, false);
  assert.equal(packet.blockers.includes("Owner truth duplication is not 1.0000x."), true);
  assert.equal(packet.blockers.includes("Canonical owner rows are missing."), true);
  assert.equal(packet.blockers.includes("Parcel-owner link rows are missing."), true);
});

test("reports owner truth duplication as unavailable when truth probe is blocked", () => {
  const packet = buildOwnerRuntimeProofPacket({
    generatedAt: "2026-06-07T17:00:00.000Z",
    observations: {
      truthOwner: { ok: false, error: "statement timeout" },
      canonicalOwner: { ok: true, value: { rows: 312532, distinctIds: 312532, nullAcctId: 0, blankDisplayName: 0 } },
      ownerLink: { ok: true, value: { rows: 2111805 } },
      statusCounts: { ok: true, value: { COMPLETED: 148 } }
    }
  });

  assert.equal(packet.metrics.truthOwnerDuplication, null);
  assert.equal(packet.blockers.includes("Owner truth duplication is unavailable."), true);
  assert.equal(packet.blockers.includes("Owner truth duplication is not 1.0000x."), false);
});

test("writePacket emits JSON and Markdown owner runtime proof evidence", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tf-owner-proof-"));
  const outJson = path.join(dir, "proof.json");
  const outMd = path.join(dir, "proof.md");
  const packet = buildOwnerRuntimeProofPacket({
    generatedAt: "2026-06-07T17:00:00.000Z",
    observations: {
      truthOwner: { ok: true, value: { rows: 816849, distinctRows: 816849 } },
      canonicalOwner: { ok: true, value: { rows: 312532, distinctIds: 312532, nullAcctId: 0, blankDisplayName: 0 } },
      ownerLink: { ok: true, value: { rows: 2111805 } },
      statusCounts: { ok: true, value: { COMPLETED: 148 } }
    }
  });

  writePacket({ packet, outJson, outMd });

  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).packetHash, packet.packetHash);
  assert.match(fs.readFileSync(outMd, "utf8"), /Benton Owner Runtime Proof/);
  assert.match(fs.readFileSync(outMd, "utf8"), /Runtime proven: true/);
});
