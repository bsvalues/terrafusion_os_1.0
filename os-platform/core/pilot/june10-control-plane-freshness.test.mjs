#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildJune10ControlPlaneFreshness } from "./june10-control-plane-freshness.mjs";

function sampleArtifacts() {
  return {
    syncEvidenceIntake: {
      generatedAtUtc: "2026-05-15T01:00:00.000Z",
      intakeStatus: "WAITING_SYNC_DB_EVIDENCE",
      summary: { blockers: 21 },
      nextCommands: ["pnpm run truth:terrafusion-db-product-load-ledger"]
    },
    shipBlockerLedger: {
      generatedAtUtc: "2026-05-15T01:01:00.000Z",
      launchVerdict: "NO_GO",
      summary: { p0Groups: 6 }
    },
    p0Burndown: {
      generatedAtUtc: "2026-05-15T01:02:00.000Z",
      summary: {
        p0Items: 6,
        syncEvidenceIntakeStatus: "WAITING_SYNC_DB_EVIDENCE",
        syncEvidenceBlockers: 21
      },
      executionQueue: [
        {
          source: "productLoadLedger",
          status: "WAITING_SYNC_DB_EVIDENCE",
          nextUnblockCommand: "pnpm run truth:terrafusion-db-product-load-ledger"
        }
      ]
    },
    launchControl: {
      generatedAtUtc: "2026-05-15T01:03:00.000Z",
      launchVerdict: "NO_GO",
      firstUnblockCommand: "pnpm run truth:terrafusion-db-product-load-ledger",
      summary: {
        p0Items: 6,
        syncEvidenceIntakeStatus: "WAITING_SYNC_DB_EVIDENCE"
      }
    }
  };
}

test("passes when the June 10 control-plane artifacts are in dependency order", () => {
  const report = buildJune10ControlPlaneFreshness(sampleArtifacts());

  assert.equal(report.freshnessStatus, "FRESH");
  assert.equal(report.summary.blockers, 0);
  assert.equal(report.summary.requiredArtifactsPresent, 4);
  assert.equal(report.chain[0].name, "syncEvidenceIntake");
  assert.equal(report.chain.at(-1).name, "launchControl");
});

test("fails when launch control is older than the P0 burndown input", () => {
  const artifacts = sampleArtifacts();
  artifacts.launchControl.generatedAtUtc = "2026-05-15T01:01:30.000Z";

  const report = buildJune10ControlPlaneFreshness(artifacts);

  assert.equal(report.freshnessStatus, "STALE");
  assert.ok(report.blockers.some((blocker) => blocker.includes("launchControl is older than p0Burndown")));
});

test("fails when P0 burndown does not reflect Sync evidence intake status", () => {
  const artifacts = sampleArtifacts();
  artifacts.p0Burndown.summary.syncEvidenceIntakeStatus = "missing";

  const report = buildJune10ControlPlaneFreshness(artifacts);

  assert.equal(report.freshnessStatus, "STALE");
  assert.ok(report.blockers.some((blocker) => blocker.includes("P0 burndown does not reflect Sync evidence intake status")));
});

test("CLI writes control-plane freshness JSON and Markdown reports", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-june10-freshness-"));
  const artifacts = sampleArtifacts();
  const paths = {
    syncEvidenceIntake: path.join(tmp, "sync-intake.json"),
    shipBlockerLedger: path.join(tmp, "ledger.json"),
    p0Burndown: path.join(tmp, "p0.json"),
    launchControl: path.join(tmp, "launch.json"),
    outJson: path.join(tmp, "freshness.json"),
    outMd: path.join(tmp, "freshness.md")
  };

  fs.writeFileSync(paths.syncEvidenceIntake, `${JSON.stringify(artifacts.syncEvidenceIntake, null, 2)}\n`);
  fs.writeFileSync(paths.shipBlockerLedger, `${JSON.stringify(artifacts.shipBlockerLedger, null, 2)}\n`);
  fs.writeFileSync(paths.p0Burndown, `${JSON.stringify(artifacts.p0Burndown, null, 2)}\n`);
  fs.writeFileSync(paths.launchControl, `${JSON.stringify(artifacts.launchControl, null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-control-plane-freshness.mjs",
      "--sync-intake",
      paths.syncEvidenceIntake,
      "--ship-blocker-ledger",
      paths.shipBlockerLedger,
      "--p0-burndown",
      paths.p0Burndown,
      "--launch-control",
      paths.launchControl,
      "--out-json",
      paths.outJson,
      "--out-md",
      paths.outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(paths.outJson, "utf8"));
  const markdown = fs.readFileSync(paths.outMd, "utf8");

  assert.equal(report.freshnessStatus, "FRESH");
  assert.match(markdown, /June 10 Control-Plane Freshness/);
  assert.match(markdown, /FRESH/);
});
