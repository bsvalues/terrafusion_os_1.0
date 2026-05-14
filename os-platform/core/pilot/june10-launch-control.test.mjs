#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildJune10LaunchControlReport } from "./june10-launch-control.mjs";

function sampleInputs() {
  return {
    readiness: {
      status: "FAIL",
      shipBlockers: [
        { source: "productLoadLedger", message: "ProductLoadReceipts table is missing." },
        { source: "bentonPilotClosure", message: "Benton runtime pilot closure is not passing." }
      ],
      executionQueue: [
        {
          source: "productLoadLedger",
          nextCommand: "pnpm run truth:terrafusion-db-product-load-ledger",
          requiredResolution: "Emit/read product-load receipts."
        }
      ]
    },
    redTeam: {
      verdict: "RED",
      summary: {
        criticalAttacks: 3,
        shipBlockers: 2
      },
      credibilityAttacks: [{ surface: "runtime_lineage", severity: "CRITICAL" }]
    },
    claimGuard: {
      guardStatus: "LOCKED",
      publicClaimsAllowed: false,
      allowedFraming: "TerraFusion is in controlled readiness execution.",
      requiredProofArtifacts: ["Passing June 10 readiness packet."]
    },
    seedLane: {
      passed: true,
      summary: {
        commandsFailed: 0,
        workOrders: 5,
        receiptsFound: 0,
        runtimeClaimAllowed: false
      }
    }
  };
}

test("returns NO_GO when readiness fails, red-team is RED, and claims are locked", () => {
  const report = buildJune10LaunchControlReport(sampleInputs());

  assert.equal(report.launchVerdict, "NO_GO");
  assert.equal(report.summary.shipBlockers, 2);
  assert.equal(report.summary.claimGuardStatus, "LOCKED");
  assert.equal(report.summary.seedLanePassed, true);
  assert.ok(report.stopConditions.some((condition) => condition.includes("readiness packet is not passing")));
});

test("keeps the safest framing and required proof commands visible", () => {
  const report = buildJune10LaunchControlReport(sampleInputs());

  assert.equal(report.approvedExternalFraming, "TerraFusion is in controlled readiness execution.");
  assert.ok(report.nextCommands.includes("pnpm run truth:terrafusion-db-product-load-ledger"));
  assert.ok(report.requiredProofArtifacts.includes("Passing June 10 readiness packet."));
});

test("CLI writes launch-control JSON and Markdown reports", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-june10-launch-control-"));
  const inputs = sampleInputs();
  const paths = {
    readiness: path.join(tmp, "readiness.json"),
    redTeam: path.join(tmp, "red-team.json"),
    claimGuard: path.join(tmp, "claim-guard.json"),
    seedLane: path.join(tmp, "seed-lane.json"),
    outJson: path.join(tmp, "launch-control.json"),
    outMd: path.join(tmp, "launch-control.md")
  };

  fs.writeFileSync(paths.readiness, `${JSON.stringify(inputs.readiness, null, 2)}\n`);
  fs.writeFileSync(paths.redTeam, `${JSON.stringify(inputs.redTeam, null, 2)}\n`);
  fs.writeFileSync(paths.claimGuard, `${JSON.stringify(inputs.claimGuard, null, 2)}\n`);
  fs.writeFileSync(paths.seedLane, `${JSON.stringify(inputs.seedLane, null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-launch-control.mjs",
      "--readiness",
      paths.readiness,
      "--red-team",
      paths.redTeam,
      "--claim-guard",
      paths.claimGuard,
      "--seed-lane",
      paths.seedLane,
      "--out-json",
      paths.outJson,
      "--out-md",
      paths.outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(paths.outJson, "utf8"));
  const markdown = fs.readFileSync(paths.outMd, "utf8");

  assert.equal(report.launchVerdict, "NO_GO");
  assert.match(markdown, /June 10 Launch Control/);
  assert.match(markdown, /NO_GO/);
});
