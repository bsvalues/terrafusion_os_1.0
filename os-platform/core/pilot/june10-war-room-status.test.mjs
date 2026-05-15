#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildJune10WarRoomStatus } from "./june10-war-room-status.mjs";

function sampleLaunchControl() {
  return {
    launchVerdict: "NO_GO",
    firstUnblockCommand: "pnpm run truth:terrafusion-db-product-load-ledger",
    approvedExternalFraming: "TerraFusion is in controlled readiness execution.",
    summary: {
      readinessStatus: "FAIL",
      shipBlockers: 23,
      redTeamVerdict: "RED",
      claimGuardStatus: "LOCKED",
      p0Items: 6,
      readyForCodexP0Items: 0,
      syncEvidenceIntakeStatus: "WAITING_SYNC_DB_EVIDENCE",
      stopConditions: 4
    },
    stopConditions: [
      "June 10 readiness packet is not passing.",
      "P0 burn-down is not clear."
    ],
    nextCommands: [
      "pnpm run truth:terrafusion-db-product-load-ledger",
      "pnpm run truth:june10-red-team"
    ]
  };
}

function sampleP0Burndown() {
  return {
    summary: {
      p0Items: 6,
      readyForCodexItems: 0,
      syncEvidenceIntakeStatus: "WAITING_SYNC_DB_EVIDENCE"
    },
    executionQueue: [
      {
        sequence: 1,
        source: "productLoadLedger",
        status: "WAITING_SYNC_DB_EVIDENCE",
        ownerLane: "Claude Code / Sync DB, audited by Codex",
        nextUnblockCommand: "pnpm run truth:terrafusion-db-product-load-ledger",
        firstBlocker: "Product-load ledger is not passing."
      }
    ]
  };
}

function sampleFreshness() {
  return {
    freshnessStatus: "FRESH",
    summary: {
      blockers: 0,
      requiredArtifactsPresent: 4
    }
  };
}

function sampleSyncIntake() {
  return {
    intakeStatus: "WAITING_SYNC_DB_EVIDENCE",
    canRunBentonClosure: false,
    summary: {
      blockers: 21
    },
    blockers: [
      "Product-load ledger is not passing.",
      "ProductLoadReceipts evidence is missing."
    ]
  };
}

test("builds a compact war-room status from launch and P0 evidence", () => {
  const status = buildJune10WarRoomStatus({
    launchControl: sampleLaunchControl(),
    p0Burndown: sampleP0Burndown(),
    freshness: sampleFreshness(),
    syncEvidenceIntake: sampleSyncIntake()
  });

  assert.equal(status.warRoomVerdict, "NO_GO");
  assert.equal(status.activeLane, "WAITING_SYNC_DB_EVIDENCE");
  assert.equal(status.firstUnblockCommand, "pnpm run truth:terrafusion-db-product-load-ledger");
  assert.equal(status.activeP0.source, "productLoadLedger");
  assert.equal(status.summary.controlPlaneFreshness, "FRESH");
  assert.ok(status.stopWork.includes("Do not run Benton closure until Sync evidence intake is accepted."));
});

test("marks stale control-plane status as the active lane before other work", () => {
  const status = buildJune10WarRoomStatus({
    launchControl: sampleLaunchControl(),
    p0Burndown: sampleP0Burndown(),
    freshness: {
      freshnessStatus: "STALE",
      blockers: ["Launch control is older than P0 burn-down."],
      summary: { blockers: 1 }
    },
    syncEvidenceIntake: sampleSyncIntake()
  });

  assert.equal(status.activeLane, "CONTROL_PLANE_STALE");
  assert.equal(status.firstUnblockCommand, "pnpm run truth:june10-control-plane-refresh");
  assert.ok(status.stopWork.includes("Do not use launch-control output until freshness is restored."));
});

test("CLI writes war-room status JSON and Markdown reports", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-june10-war-room-"));
  const paths = {
    launchControl: path.join(tmp, "launch.json"),
    p0Burndown: path.join(tmp, "p0.json"),
    freshness: path.join(tmp, "freshness.json"),
    syncIntake: path.join(tmp, "sync-intake.json"),
    outJson: path.join(tmp, "war-room.json"),
    outMd: path.join(tmp, "war-room.md")
  };

  fs.writeFileSync(paths.launchControl, `${JSON.stringify(sampleLaunchControl(), null, 2)}\n`);
  fs.writeFileSync(paths.p0Burndown, `${JSON.stringify(sampleP0Burndown(), null, 2)}\n`);
  fs.writeFileSync(paths.freshness, `${JSON.stringify(sampleFreshness(), null, 2)}\n`);
  fs.writeFileSync(paths.syncIntake, `${JSON.stringify(sampleSyncIntake(), null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-war-room-status.mjs",
      "--launch-control",
      paths.launchControl,
      "--p0-burndown",
      paths.p0Burndown,
      "--freshness",
      paths.freshness,
      "--sync-intake",
      paths.syncIntake,
      "--out-json",
      paths.outJson,
      "--out-md",
      paths.outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const status = JSON.parse(fs.readFileSync(paths.outJson, "utf8"));
  const markdown = fs.readFileSync(paths.outMd, "utf8");

  assert.equal(status.warRoomVerdict, "NO_GO");
  assert.match(markdown, /June 10 War Room Status/);
  assert.match(markdown, /WAITING_SYNC_DB_EVIDENCE/);
});
