#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildJune10ShipBlockerLedger } from "./june10-ship-blocker-ledger.mjs";

function sampleReadiness() {
  return {
    status: "FAIL",
    shipBlockers: [
      { source: "productLoadLedger", message: "ProductLoadReceipts table is missing." },
      { source: "productLoadLedger", message: "canonical_tf.tf_sale: Rows exist but no product load receipt proves lineage." },
      { source: "bentonPilotClosure", message: "Benton runtime pilot closure is not passing." },
      { source: "crosswalk", message: "Crosswalk runtime-proven count does not match runtime candidate set." },
      { source: "runtimeCandidateSet", message: "Runtime candidate set does not prove Benton-only June 10 scope." }
    ],
    executionQueue: [
      {
        source: "productLoadLedger",
        ownerLane: "Claude Code / Sync DB, audited by Codex",
        nextCommand: "pnpm run truth:terrafusion-db-product-load-ledger",
        requiredResolution: "Emit/read product-load receipts."
      },
      {
        source: "bentonPilotClosure",
        ownerLane: "Codex after all Benton data gates are green",
        nextCommand: "pnpm run truth:benton-runtime-pilot-closure",
        requiredResolution: "Prove Benton closure."
      }
    ]
  };
}

function sampleLaunchControl() {
  return {
    launchVerdict: "NO_GO",
    stopConditions: [
      "June 10 readiness packet is not passing.",
      "Credibility red-team verdict is RED.",
      "Launch claim guard is LOCKED."
    ],
    nextCommands: [
      "pnpm run truth:terrafusion-db-product-load-ledger",
      "pnpm run truth:benton-runtime-pilot-closure"
    ]
  };
}

function sampleRedTeam() {
  return {
    verdict: "RED",
    credibilityAttacks: [
      { surface: "runtime_lineage", severity: "CRITICAL", attack: "Product-load lineage is unproven." },
      { surface: "benton_realism", severity: "CRITICAL", attack: "Benton corpus is ATTEMPT only." },
      { surface: "county_trust", severity: "HIGH", attack: "38-county receipts are missing." }
    ]
  };
}

test("groups readiness blockers into prioritized owner-lane work items", () => {
  const ledger = buildJune10ShipBlockerLedger({
    readiness: sampleReadiness(),
    launchControl: sampleLaunchControl(),
    redTeam: sampleRedTeam()
  });

  assert.equal(ledger.launchVerdict, "NO_GO");
  assert.equal(ledger.summary.readinessBlockers, 5);
  assert.equal(ledger.blockerGroups[0].source, "productLoadLedger");
  assert.equal(ledger.blockerGroups[0].priority, "P0");
  assert.equal(ledger.blockerGroups[0].ownerLane, "Claude Code / Sync DB, audited by Codex");
  assert.equal(ledger.blockerGroups[0].nextCommand, "pnpm run truth:terrafusion-db-product-load-ledger");
});

test("adds launch stop conditions and red-team attacks as separate guardrail groups", () => {
  const ledger = buildJune10ShipBlockerLedger({
    readiness: sampleReadiness(),
    launchControl: sampleLaunchControl(),
    redTeam: sampleRedTeam()
  });

  assert.ok(ledger.blockerGroups.some((group) => group.source === "launchControl"));
  assert.ok(ledger.blockerGroups.some((group) => group.source === "redTeam:runtime_lineage"));
  assert.ok(ledger.summary.criticalRedTeamAttacks >= 2);
});

test("CLI writes ship-blocker ledger JSON and Markdown reports", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-june10-blockers-"));
  const paths = {
    readiness: path.join(tmp, "readiness.json"),
    launchControl: path.join(tmp, "launch.json"),
    redTeam: path.join(tmp, "red-team.json"),
    outJson: path.join(tmp, "ledger.json"),
    outMd: path.join(tmp, "ledger.md")
  };

  fs.writeFileSync(paths.readiness, `${JSON.stringify(sampleReadiness(), null, 2)}\n`);
  fs.writeFileSync(paths.launchControl, `${JSON.stringify(sampleLaunchControl(), null, 2)}\n`);
  fs.writeFileSync(paths.redTeam, `${JSON.stringify(sampleRedTeam(), null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-ship-blocker-ledger.mjs",
      "--readiness",
      paths.readiness,
      "--launch-control",
      paths.launchControl,
      "--red-team",
      paths.redTeam,
      "--out-json",
      paths.outJson,
      "--out-md",
      paths.outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const ledger = JSON.parse(fs.readFileSync(paths.outJson, "utf8"));
  const markdown = fs.readFileSync(paths.outMd, "utf8");

  assert.equal(ledger.launchVerdict, "NO_GO");
  assert.match(markdown, /June 10 Ship Blocker Ledger/);
  assert.match(markdown, /productLoadLedger/);
});
