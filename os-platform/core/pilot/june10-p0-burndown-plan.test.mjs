#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildJune10P0BurndownPlan } from "./june10-p0-burndown-plan.mjs";

function sampleLedger() {
  return {
    launchVerdict: "NO_GO",
    blockerGroups: [
      {
        priority: "P0",
        source: "productLoadLedger",
        ownerLane: "Claude Code / Sync DB, audited by Codex",
        nextCommand: "pnpm run truth:terrafusion-db-product-load-ledger",
        requiredResolution: "Prove product-load receipts.",
        blockerCount: 14,
        blockers: ["ProductLoadReceipts table is missing."]
      },
      {
        priority: "P0",
        source: "bentonPilotClosure",
        ownerLane: "Codex after all Benton data gates are green",
        nextCommand: "pnpm run truth:benton-runtime-pilot-closure",
        requiredResolution: "Prove Benton closure.",
        blockerCount: 7,
        blockers: ["Benton runtime pilot closure is not passing."]
      },
      {
        priority: "P0",
        source: "launchControl",
        ownerLane: "Codex",
        nextCommand: "pnpm run truth:june10-launch-control",
        requiredResolution: "Clear launch-control stop conditions.",
        blockerCount: 3,
        blockers: ["June 10 readiness packet is not passing."]
      },
      {
        priority: "P0",
        source: "redTeam:runtime_lineage",
        ownerLane: "Codex / launch-control review",
        nextCommand: "pnpm run truth:june10-red-team",
        requiredResolution: "Clear runtime-lineage attack.",
        blockerCount: 1,
        blockers: ["Rows exist but product-load lineage is not proven."]
      },
      {
        priority: "P1",
        source: "crosswalk",
        ownerLane: "Codex",
        nextCommand: "pnpm run truth:washington-39-county-data-crosswalk",
        requiredResolution: "Align county scope.",
        blockerCount: 1,
        blockers: ["Crosswalk mismatch."]
      }
    ]
  };
}

test("builds a P0-only burndown with explicit wait states and dependencies", () => {
  const plan = buildJune10P0BurndownPlan({ ledger: sampleLedger() });

  assert.equal(plan.launchVerdict, "NO_GO");
  assert.equal(plan.summary.p0Items, 4);
  assert.equal(plan.summary.deferredNonP0Items, 1);
  assert.equal(plan.executionQueue[0].source, "productLoadLedger");
  assert.equal(plan.executionQueue[0].status, "WAITING_EXTERNAL_SYNC_DB");
  assert.equal(plan.executionQueue[1].source, "bentonPilotClosure");
  assert.deepEqual(plan.executionQueue[1].blockedBy, ["productLoadLedger"]);
  assert.ok(plan.executionQueue.some((item) => item.source === "launchControl" && item.status === "BLOCKED_BY_P0"));
});

test("marks missing ledger as a no-go planning blocker", () => {
  const plan = buildJune10P0BurndownPlan({ ledger: null });

  assert.equal(plan.launchVerdict, "NO_GO");
  assert.equal(plan.summary.p0Items, 0);
  assert.equal(plan.planBlockers[0], "June 10 ship-blocker ledger is missing.");
});

test("CLI writes P0 burndown JSON and Markdown reports", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-june10-p0-"));
  const ledgerPath = path.join(tmp, "ledger.json");
  const outJson = path.join(tmp, "p0.json");
  const outMd = path.join(tmp, "p0.md");

  fs.writeFileSync(ledgerPath, `${JSON.stringify(sampleLedger(), null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-p0-burndown-plan.mjs",
      "--ledger",
      ledgerPath,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const plan = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");

  assert.equal(plan.summary.p0Items, 4);
  assert.match(markdown, /June 10 P0 Burndown Plan/);
  assert.match(markdown, /WAITING_EXTERNAL_SYNC_DB/);
});
