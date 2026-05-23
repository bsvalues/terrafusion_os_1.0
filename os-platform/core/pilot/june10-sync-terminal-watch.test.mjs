#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildJune10SyncTerminalWatch } from "./june10-sync-terminal-watch.mjs";

function terminalInput() {
  return {
    generatedAtUtc: "2026-05-22T22:40:00.000Z",
    syncState: {
      observedAtUtc: "2026-05-22T22:39:30.000Z",
      source: "fixture",
      inProgressBatches: 0,
      latestBatch: {
        operator: "claude-strict-serial-improvement-tn500-v142",
        status: "COMPLETED",
        startedAt: "2026-05-22T22:20:00.000Z",
        completedAt: "2026-05-22T22:38:00.000Z",
        rowsPromoted: 554
      },
      statusCounts: {
        COMPLETED: 2531,
        FAILED: 74
      },
      tableEstimates: {
        "canonical_tf.tf_parcel": 3197521,
        "canonical_tf.tf_improvement": 1105,
        "canonical_tf.tf_improvement_feature": 827693,
        "canonical_tf.tf_sale": 721,
        "truth_pacs.parcel_spine": 511793
      }
    },
    apiHealth: {
      checkedAtUtc: "2026-05-22T22:39:45.000Z",
      url: "http://localhost:5046/health",
      status: 200,
      ok: true,
      error: null
    },
    thresholds: {
      terminalQuietMinutes: 2,
      staleInProgressMinutes: 45,
      apiHealthTimeoutMs: 10000
    }
  };
}

test("blocks certification while Sync has an in-progress batch", () => {
  const input = terminalInput();
  input.syncState.inProgressBatches = 1;
  input.syncState.latestBatch = {
    operator: "claude-strict-serial-improvement-tn500-v143",
    status: "IN_PROGRESS",
    startedAt: "2026-05-22T22:39:00.000Z",
    completedAt: null,
    rowsPromoted: null
  };

  const report = buildJune10SyncTerminalWatch(input);

  assert.equal(report.watchStatus, "SYNC_ACTIVE");
  assert.equal(report.certificationTrigger.ready, false);
  assert.equal(report.summary.syncTerminal, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "sync_terminal"));
  assert.ok(report.cleanRestartReadiness.items.every((item) => item.action !== "restart_runtime_now"));
});

test("escalates stale in-progress Sync batches without restarting runtime", () => {
  const input = terminalInput();
  input.syncState.inProgressBatches = 1;
  input.syncState.latestBatch = {
    operator: "claude-strict-serial-improvement-tn500-v143",
    status: "IN_PROGRESS",
    startedAt: "2026-05-22T21:40:00.000Z",
    completedAt: null,
    rowsPromoted: null
  };

  const report = buildJune10SyncTerminalWatch(input);

  assert.equal(report.watchStatus, "ESCALATE_SYNC_TIMEOUT");
  assert.equal(report.summary.timeoutEscalationRequired, true);
  assert.ok(report.escalations.some((item) => item.reason.includes("exceeds stale threshold")));
  assert.equal(report.runtimeActionTaken, false);
  assert.equal(report.databaseMutationTaken, false);
});

test("blocks certification when Sync is terminal but API health is down", () => {
  const input = terminalInput();
  input.apiHealth = {
    checkedAtUtc: "2026-05-22T22:39:45.000Z",
    url: "http://localhost:5046/health",
    status: null,
    ok: false,
    error: "fetch failed"
  };

  const report = buildJune10SyncTerminalWatch(input);

  assert.equal(report.watchStatus, "API_RECOVERY_REQUIRED");
  assert.equal(report.summary.syncTerminal, true);
  assert.equal(report.summary.apiHealthy, false);
  assert.equal(report.certificationTrigger.ready, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "api_health"));
  assert.ok(report.cleanRestartReadiness.items.some((item) => item.name === "API health recovery required"));
});

test("classifies DB probe failure separately from active Sync", () => {
  const input = terminalInput();
  input.syncState = {
    observedAtUtc: "2026-05-22T22:39:30.000Z",
    source: "docker:psql",
    inProgressBatches: null,
    latestBatch: null,
    statusCounts: {},
    tableEstimates: {},
    error: "Docker Desktop is unable to start"
  };

  const report = buildJune10SyncTerminalWatch(input);

  assert.equal(report.watchStatus, "DB_PROBE_UNAVAILABLE");
  assert.equal(report.summary.syncProbeAvailable, false);
  assert.equal(report.summary.syncTerminal, false);
  assert.equal(report.certificationTrigger.ready, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "sync_probe"));
  assert.ok(report.cleanRestartReadiness.items.some((item) => item.name === "Sync/DB probe availability"));
});

test("marks Benton certification triggers green only when Sync terminal and API healthy", () => {
  const report = buildJune10SyncTerminalWatch(terminalInput());

  assert.equal(report.watchStatus, "READY_FOR_BENTON_CERTIFICATION");
  assert.equal(report.passed, true);
  assert.equal(report.certificationTrigger.ready, true);
  assert.deepEqual(report.certificationTrigger.commands, [
    "pnpm run truth:runtime-db-identity",
    "pnpm run truth:benton-parcel-count-sanity",
    "pnpm run truth:runtime-db-content",
    "pnpm run truth:june10-benton-duplicate-parcel-adjudication",
    "pnpm run truth:june10-benton-projection-duplicate-root-cause",
    "pnpm run truth:june10-benton-projection-uniqueness-repair-plan",
    "pnpm run truth:terrafusion-db-product-load-ledger",
    "pnpm run truth:runtime-row-path-proof",
    "pnpm run truth:runtime-source-lineage",
    "pnpm run truth:runtime-sale-qualification",
    "pnpm run truth:benton-runtime-pilot-closure",
    "pnpm run truth:washington-runtime-expansion-phase-a",
    "pnpm run truth:june10-full-production-data-gate"
  ]);
});

test("CLI writes watcher JSON and Markdown evidence from fixture state", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-sync-terminal-watch-"));
  const inputPath = path.join(tmp, "input.json");
  const outJson = path.join(tmp, "watch.json");
  const outMd = path.join(tmp, "watch.md");

  fs.writeFileSync(inputPath, `${JSON.stringify(terminalInput(), null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-sync-terminal-watch.mjs",
      "--input",
      inputPath,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");

  assert.equal(report.watchStatus, "READY_FOR_BENTON_CERTIFICATION");
  assert.equal(report.certificationTrigger.ready, true);
  assert.match(markdown, /June 10 Sync Terminal Watch/);
  assert.match(markdown, /READY_FOR_BENTON_CERTIFICATION/);
  assert.match(markdown, /No runtime restart was performed/);
});
