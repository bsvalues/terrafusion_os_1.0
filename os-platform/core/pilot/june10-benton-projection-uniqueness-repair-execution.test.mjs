#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildBentonProjectionUniquenessRepairExecution,
  buildRepairSql
} from "./june10-benton-projection-uniqueness-repair-execution.mjs";

function state(overrides = {}) {
  return {
    generatedAtUtc: "2026-05-23T02:00:00.000Z",
    mode: "observe",
    authorizationToken: null,
    syncState: {
      inProgressBatches: 0,
      latestBatch: { status: "COMPLETED" }
    },
    before: {
      duplicateGroups: 1503,
      extraActiveRows: 1503,
      bentonActiveDistinctParcels: 83296
    },
    after: null,
    execution: null,
    uniqueIndex: {
      exists: false,
      created: false,
      error: null
    },
    error: null,
    ...overrides
  };
}

test("blocks execution while Sync is active even with authorization", () => {
  const report = buildBentonProjectionUniquenessRepairExecution(
    state({
      mode: "execute",
      authorizationToken: "BENTON_PROJECTION_UNIQUENESS_REPAIR_APPROVED",
      syncState: {
        inProgressBatches: 1,
        latestBatch: { status: "IN_PROGRESS" }
      }
    })
  );

  assert.equal(report.executionStatus, "WAITING_SYNC_TERMINAL");
  assert.equal(report.databaseMutationTaken, false);
  assert.equal(report.passed, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "sync_active"));
});

test("blocks execution without explicit authorization", () => {
  const report = buildBentonProjectionUniquenessRepairExecution(
    state({
      mode: "execute",
      authorizationToken: null
    })
  );

  assert.equal(report.executionStatus, "AUTHORIZATION_REQUIRED");
  assert.equal(report.databaseMutationTaken, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "authorization"));
});

test("builds transaction SQL with backup, loser supersede, receipt, and zero-duplicate assertion", () => {
  const sql = buildRepairSql({ runId: "11111111-1111-1111-1111-111111111111" });

  assert.match(sql, /BEGIN;/);
  assert.match(sql, /projection_repair_receipt/);
  assert.match(sql, /projection_repair_row_snapshot/);
  assert.match(sql, /row_number\(\) over/i);
  assert.match(sql, /SUPERSEDED_DUPLICATE/);
  assert.match(sql, /RAISE EXCEPTION 'Benton active duplicate groups remain after repair/);
  assert.match(sql, /COMMIT;/);
});

test("passes after executed repair reports zero active duplicate groups and index exists", () => {
  const report = buildBentonProjectionUniquenessRepairExecution(
    state({
      mode: "execute",
      authorizationToken: "BENTON_PROJECTION_UNIQUENESS_REPAIR_APPROVED",
      after: {
        duplicateGroups: 0,
        extraActiveRows: 0,
        bentonActiveDistinctParcels: 83296
      },
      execution: {
        runId: "11111111-1111-1111-1111-111111111111",
        loserRowsSuperseded: 1503,
        receiptWritten: true
      },
      uniqueIndex: {
        exists: true,
        created: true,
        error: null
      }
    })
  );

  assert.equal(report.executionStatus, "REPAIR_VERIFIED");
  assert.equal(report.databaseMutationTaken, true);
  assert.equal(report.passed, true);
  assert.equal(report.certificationGate.unblockedByThisGate, true);
});

test("observe mode reports ready to execute when Sync is terminal and duplicates remain", () => {
  const report = buildBentonProjectionUniquenessRepairExecution(state());

  assert.equal(report.executionStatus, "READY_FOR_AUTHORIZED_EXECUTION");
  assert.equal(report.databaseMutationTaken, false);
  assert.equal(report.passed, false);
});

test("CLI writes execution gate JSON and Markdown evidence from fixture", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-benton-repair-exec-"));
  const inputPath = path.join(tmp, "input.json");
  const outJson = path.join(tmp, "exec.json");
  const outMd = path.join(tmp, "exec.md");

  fs.writeFileSync(inputPath, `${JSON.stringify(state(), null, 2)}\n`);

  const child = spawnSync(
    "node",
    [
      "os-platform/core/pilot/june10-benton-projection-uniqueness-repair-execution.mjs",
      "--input",
      inputPath,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), encoding: "utf8" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");

  assert.equal(child.status, 1);
  assert.equal(report.executionStatus, "READY_FOR_AUTHORIZED_EXECUTION");
  assert.match(markdown, /Benton Projection Uniqueness Repair Execution Gate/);
  assert.match(markdown, /READY_FOR_AUTHORIZED_EXECUTION/);
});
