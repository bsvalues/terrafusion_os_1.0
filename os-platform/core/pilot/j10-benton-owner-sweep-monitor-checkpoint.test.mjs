import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildOwnerSweepMonitorCheckpoint,
  loadSealedLaneEvidence,
  writePacket
} from "./j10-benton-owner-sweep-monitor-checkpoint.mjs";

test("builds a monitor-only owner sweep checkpoint without enabling mutation", () => {
  const packet = buildOwnerSweepMonitorCheckpoint({
    generatedAt: "2026-06-07T12:00:00.000Z",
    commit: "74a11168f",
    sweepTaskId: "b2xc9tahr",
    observations: {
      cursor: { ok: true, value: { lane: "owner-wsdor", cursor: 322770 } },
      truthOwner: { ok: true, value: { rows: 809396, distinctRows: 809396 } },
      canonicalOwner: { ok: true, value: { rows: 205470 } },
      ownerLink: { ok: true, value: { rows: 1387202 } },
      wsdorTruth: { ok: true, value: { rows: 809363, distinctRows: 809363 } },
      wsdorCanonical: { ok: true, value: { rows: 809363 } },
      latestCompletedChunk: { ok: true, value: { durationSeconds: 71.5, rowsExtracted: 500, rowsPromoted: 500 } },
      activeChunk: { ok: true, value: { inProgress: false, ageSeconds: null } },
      statusCounts: { ok: true, value: { COMPLETED: 56 } },
      quarantine: { ok: true, value: { tableFound: false, rows: null } }
    },
    sealedLaneEvidence: {
      verdict: "BENTON_SEALED_LANE_RUNTIME_PROVEN",
      generatedAt: "2026-06-05T01:47:42.591Z",
      packetHash: "sealed-hash"
    }
  });

  assert.equal(packet.monitorOnly, true);
  assert.equal(packet.databaseMutation, false);
  assert.equal(packet.productionTouched, false);
  assert.equal(packet.activeSyncTouched, false);
  assert.equal(packet.monitorStatus, "OWNER_SWEEP_MONITORING_ACTIVE");
  assert.equal(packet.metrics.cursor, 322770);
  assert.equal(packet.metrics.truthOwnerRows, 809396);
  assert.equal(packet.metrics.truthOwnerDuplication, "1.0000x");
  assert.equal(packet.metrics.wsdorTruthDuplication, "1.0000x");
  assert.equal(packet.failures.failedBatches, 0);
  assert.deepEqual(packet.blockedProbes, []);
  assert.deepEqual(packet.stopConditionsTriggered, []);
  assert.equal(packet.nextAction, "continue_monitoring");
});

test("records partial monitoring instead of pretending blocked probes succeeded", () => {
  const packet = buildOwnerSweepMonitorCheckpoint({
    generatedAt: "2026-06-07T12:00:00.000Z",
    observations: {
      cursor: { ok: true, value: { lane: "owner-wsdor", cursor: 322770 } },
      truthOwner: { ok: false, error: "statement timeout" },
      canonicalOwner: { ok: true, value: { rows: 205470 } },
      statusCounts: { ok: true, value: { COMPLETED: 56 } }
    }
  });

  assert.equal(packet.monitorStatus, "OWNER_SWEEP_MONITORING_PARTIAL");
  assert.deepEqual(packet.blockedProbes, ["truthOwner"]);
  assert.equal(packet.metrics.truthOwnerRows, null);
  assert.equal(packet.nextAction, "continue_monitoring");
});

test("records owner sweep stop condition when lane-stage failures are observed", () => {
  const packet = buildOwnerSweepMonitorCheckpoint({
    generatedAt: "2026-06-07T12:00:00.000Z",
    observations: {
      cursor: { ok: true, value: { lane: "owner-wsdor", cursor: 322770 } },
      truthOwner: { ok: true, value: { rows: 809396, distinctRows: 809396 } },
      statusCounts: { ok: true, value: { COMPLETED: 56, FAILED: 1 } }
    }
  });

  assert.equal(packet.monitorStatus, "OWNER_SWEEP_STOP_CONDITION_OBSERVED");
  assert.equal(packet.failures.failedBatches, 1);
  assert.deepEqual(packet.stopConditionsTriggered, ["owner-related load batch failure observed"]);
  assert.equal(packet.nextAction, "classify_stop_condition_before_any_action");
});

test("distinguishes missing sealed-lane evidence from failed proof", () => {
  const packet = buildOwnerSweepMonitorCheckpoint({
    generatedAt: "2026-06-07T12:00:00.000Z",
    observations: {
      cursor: { ok: true, value: { lane: "owner-wsdor", cursor: 322770 } },
      statusCounts: { ok: true, value: { COMPLETED: 56 } }
    }
  });

  assert.equal(packet.sealedLaneIntegrity.status, "LATEST_EVIDENCE_MISSING_OR_UNREADABLE");
});

test("loads malformed sealed-lane evidence as unavailable instead of throwing", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tf-sealed-lane-"));
  const malformedJson = path.join(dir, "sealed.json");
  fs.writeFileSync(malformedJson, "{not-json");

  assert.equal(loadSealedLaneEvidence(malformedJson), null);
});

test("writePacket emits JSON and Markdown checkpoint evidence", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tf-owner-monitor-"));
  const outJson = path.join(dir, "checkpoint.json");
  const outMd = path.join(dir, "checkpoint.md");
  const packet = buildOwnerSweepMonitorCheckpoint({
    generatedAt: "2026-06-07T12:00:00.000Z",
    observations: {
      cursor: { ok: true, value: { lane: "owner-wsdor", cursor: 322770 } },
      statusCounts: { ok: true, value: { COMPLETED: 56 } }
    }
  });

  writePacket({ packet, outJson, outMd });

  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).packetHash, packet.packetHash);
  assert.match(fs.readFileSync(outMd, "utf8"), /Benton Owner Sweep Monitor Checkpoint/);
  assert.match(fs.readFileSync(outMd, "utf8"), /Mutation: false/);
});
