#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildJune10SyncEvidenceIntake } from "./june10-sync-evidence-intake.mjs";

function passingProductLoadLedger() {
  return {
    passed: true,
    receiptEvidence: {
      exists: true,
      rowCount: 8,
      blockers: []
    },
    summary: {
      productTablesChecked: 5,
      lineageProven: 5,
      rowsExistLineageUnproven: 0,
      emptyTables: 0,
      missingTables: 0,
      blockers: 0
    },
    rows: [
      {
        tableName: "canonical_tf.tf_parcel",
        productDomain: "parcel",
        rowCount: 3197521,
        lineageStatus: "lineage_proven",
        latestProductLoadReceiptAt: "2026-05-15T01:00:00.000Z",
        blockers: []
      },
      {
        tableName: "canonical_tf.tf_sale",
        productDomain: "sales",
        rowCount: 98,
        lineageStatus: "lineage_proven",
        latestProductLoadReceiptAt: "2026-05-15T01:00:00.000Z",
        blockers: []
      },
      {
        tableName: "CanonicalSaleQualifications",
        productDomain: "qualified_sales",
        rowCount: 251484,
        lineageStatus: "lineage_proven",
        latestProductLoadReceiptAt: "2026-05-15T01:00:00.000Z",
        blockers: []
      }
    ]
  };
}

function sealedCorpus() {
  return {
    verdict: {
      sealed: true,
      clauses: [
        { name: "all_six_lanes_executed", pass: true },
        { name: "no_silent_fallback_paths_triggered", pass: true },
        { name: "reconciliation_artifacts_generated", pass: true },
        { name: "quarantine_deltas_recorded", pass: true },
        { name: "replay_timestamps_captured", pass: true },
        { name: "pacs_snapshot_identifier_preserved", pass: true },
        { name: "api_readback_verifies_promoted_truth", pass: true }
      ]
    },
    summary: {
      runStatus: "Completed",
      lanesCompleted: 6
    }
  };
}

function completedDrainObservation() {
  return {
    interpretation: {
      drainStillActive: false,
      safeToRestartRuntime: true,
      safeToRegenerateRuntimeTruthPackets: true
    }
  };
}

test("accepts Sync/DB evidence only when load receipts and corpus seal are complete", () => {
  const intake = buildJune10SyncEvidenceIntake({
    productLoadLedger: passingProductLoadLedger(),
    bentonCorpus: sealedCorpus(),
    drainObservation: completedDrainObservation()
  });

  assert.equal(intake.intakeStatus, "ACCEPTED_FOR_BENTON_CLOSURE");
  assert.equal(intake.canRunBentonClosure, true);
  assert.deepEqual(intake.nextCommands, [
    "pnpm run truth:benton-runtime-pilot-closure",
    "pnpm run truth:june10-red-team",
    "pnpm run truth:june10-launch-control"
  ]);
});

test("blocks current ATTEMPT evidence when product-load ledger is not lineage-proven", () => {
  const intake = buildJune10SyncEvidenceIntake({
    productLoadLedger: {
      passed: false,
      receiptEvidence: {
        exists: false,
        rowCount: null,
        blockers: ["ProductLoadReceipts table is missing."]
      },
      summary: {
        productTablesChecked: 10,
        lineageProven: 0,
        rowsExistLineageUnproven: 4,
        emptyTables: 5,
        missingTables: 1,
        blockers: 10
      },
      rows: [
        {
          tableName: "canonical_tf.tf_parcel",
          productDomain: "parcel",
          rowCount: null,
          lineageStatus: "missing_table",
          blockers: ["Table missing or unreadable."]
        }
      ]
    },
    bentonCorpus: {
      verdict: {
        sealed: false,
        clauses: [{ name: "all_six_lanes_executed", pass: false }]
      },
      summary: {
        runStatus: "Interrupted",
        lanesCompleted: 0
      }
    },
    drainObservation: {
      interpretation: {
        drainStillActive: true,
        safeToRestartRuntime: false,
        safeToRegenerateRuntimeTruthPackets: false
      }
    }
  });

  assert.equal(intake.intakeStatus, "WAITING_SYNC_DB_EVIDENCE");
  assert.equal(intake.canRunBentonClosure, false);
  assert.ok(intake.blockers.includes("Product-load ledger is not passing."));
  assert.ok(intake.blockers.includes("Benton full-corpus evidence is ATTEMPT or missing seal."));
});

test("CLI writes Sync evidence intake JSON and Markdown reports", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-june10-sync-intake-"));
  const paths = {
    productLoadLedger: path.join(tmp, "product-load.json"),
    bentonCorpus: path.join(tmp, "corpus.json"),
    drainObservation: path.join(tmp, "drain.json"),
    outJson: path.join(tmp, "intake.json"),
    outMd: path.join(tmp, "intake.md")
  };

  fs.writeFileSync(paths.productLoadLedger, `${JSON.stringify(passingProductLoadLedger(), null, 2)}\n`);
  fs.writeFileSync(paths.bentonCorpus, `${JSON.stringify(sealedCorpus(), null, 2)}\n`);
  fs.writeFileSync(paths.drainObservation, `${JSON.stringify(completedDrainObservation(), null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-sync-evidence-intake.mjs",
      "--product-load-ledger",
      paths.productLoadLedger,
      "--benton-corpus",
      paths.bentonCorpus,
      "--drain-observation",
      paths.drainObservation,
      "--out-json",
      paths.outJson,
      "--out-md",
      paths.outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const intake = JSON.parse(fs.readFileSync(paths.outJson, "utf8"));
  const markdown = fs.readFileSync(paths.outMd, "utf8");

  assert.equal(intake.intakeStatus, "ACCEPTED_FOR_BENTON_CLOSURE");
  assert.match(markdown, /June 10 Sync Evidence Intake/);
  assert.match(markdown, /ACCEPTED_FOR_BENTON_CLOSURE/);
});
