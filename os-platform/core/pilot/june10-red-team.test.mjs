#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildJune10RedTeamReport } from "./june10-red-team.mjs";

function sampleInputs() {
  return {
    readiness: {
      status: "FAIL",
      summary: {
        countyScope: {
          prohibit39CountyRuntimeClaim: true,
          runtimeCandidateScope: "runtime_scope_requires_review",
          runtimeCandidateProven: 39,
          evidenceBackedLoadCandidates: 0
        },
        terraFusionDb: {
          productLoadLedgerPassed: false,
          lineageProven: 0,
          rowsExistLineageUnproven: 4,
          emptyTables: 5
        },
        bentonPilot: {
          pilotClosureStatus: "FAIL",
          pilotClosureProofDetailPassed: false
        }
      },
      shipBlockers: [
        {
          source: "productLoadLedger",
          message: "ProductLoadReceipts table is missing."
        },
        {
          source: "bentonPilotClosure",
          message: "Benton runtime pilot closure is not passing."
        }
      ],
      executionQueue: [
        {
          source: "productLoadLedger",
          nextCommand: "pnpm run truth:terrafusion-db-product-load-ledger",
          requiredResolution: "Emit/read product-load receipts."
        }
      ]
    },
    seedLane: {
      passed: true,
      summary: {
        workOrders: 5,
        receiptsFound: 0,
        runtimeClaimAllowed: false,
        blockers: 0
      }
    },
    bentonCorpusAttempt: {
      verdict: {
        sealed: false,
        clauses: [
          { name: "all_six_lanes_executed", pass: false },
          { name: "api_readback_verifies_promoted_truth", pass: false }
        ]
      },
      summary: {
        runStatus: "Interrupted",
        lanesCompleted: 0,
        batchesObserved: 18
      }
    },
    coverage: {
      status: "PASS_WITH_LIMITATIONS",
      limitations: [
        "This proves registry coverage and acquisition-path inventory only; it does not prove statewide ingestion."
      ]
    }
  };
}

test("returns RED when readiness, Benton corpus, and seed receipt proof are incomplete", () => {
  const report = buildJune10RedTeamReport(sampleInputs());

  assert.equal(report.verdict, "RED");
  assert.equal(report.summary.shipBlockers, 2);
  assert.equal(report.summary.seedReceiptsFound, 0);
  assert.equal(report.summary.bentonCorpusSealed, false);
  assert.ok(report.credibilityAttacks.some((attack) => attack.surface === "runtime_lineage"));
  assert.ok(report.credibilityAttacks.some((attack) => attack.surface === "benton_realism"));
  assert.ok(report.credibilityAttacks.some((attack) => attack.surface === "county_trust"));
});

test("contains containment posture and banned narratives", () => {
  const report = buildJune10RedTeamReport(sampleInputs());

  assert.ok(report.requiredContainmentPosture.some((item) => item.includes("readiness packet failure")));
  assert.ok(report.bannedNarratives.includes("39 counties are runtime-ready"));
  assert.ok(report.safestPublicFraming.includes("controlled readiness execution"));
  assert.ok(report.requiredProofArtifacts.includes("Passing June 10 readiness packet."));
});

test("CLI writes red-team JSON and Markdown reports", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-june10-red-team-"));
  const inputs = sampleInputs();
  const paths = {
    readiness: path.join(tmp, "readiness.json"),
    seedLane: path.join(tmp, "seed-lane.json"),
    bentonAttempt: path.join(tmp, "benton-attempt.json"),
    coverage: path.join(tmp, "coverage.json"),
    outJson: path.join(tmp, "red-team.json"),
    outMd: path.join(tmp, "red-team.md")
  };

  fs.writeFileSync(paths.readiness, `${JSON.stringify(inputs.readiness, null, 2)}\n`);
  fs.writeFileSync(paths.seedLane, `${JSON.stringify(inputs.seedLane, null, 2)}\n`);
  fs.writeFileSync(paths.bentonAttempt, `${JSON.stringify(inputs.bentonCorpusAttempt, null, 2)}\n`);
  fs.writeFileSync(paths.coverage, `${JSON.stringify(inputs.coverage, null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-red-team.mjs",
      "--readiness",
      paths.readiness,
      "--seed-lane",
      paths.seedLane,
      "--benton-attempt",
      paths.bentonAttempt,
      "--coverage",
      paths.coverage,
      "--out-json",
      paths.outJson,
      "--out-md",
      paths.outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(paths.outJson, "utf8"));
  const markdown = fs.readFileSync(paths.outMd, "utf8");

  assert.equal(report.verdict, "RED");
  assert.match(markdown, /Credibility Attack Report/);
  assert.match(markdown, /39 counties are runtime-ready/);
});
