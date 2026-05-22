#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  buildWashingtonRuntimeExpansionPhaseAReport,
  runWashingtonRuntimeExpansionPhaseA
} from "./washington-runtime-expansion-phase-a.mjs";

function syncObservation(overrides = {}) {
  return {
    interpretation: {
      drainStillActive: false,
      safeToRegenerateRuntimeTruthPackets: true,
      terminalStatus: "COMPLETED",
      ...overrides.interpretation
    },
    runtimeActionTaken: false,
    databaseMutationTaken: false,
    ...overrides
  };
}

function runtimeDbContent(overrides = {}) {
  return {
    passed: true,
    endpointStatus: 200,
    content: {
      bentonDecision: {
        classification: "benton_runtime_content_proven"
      },
      ...overrides.content
    },
    blockers: [],
    ...overrides
  };
}

function productLoadLedger(overrides = {}) {
  return {
    passed: true,
    rows: [
      {
        tableName: "canonical_tf.tf_parcel",
        rowCount: 84815,
        lineageStatus: "lineage_proven",
        blockers: []
      },
      {
        tableName: "CanonicalSaleQualifications",
        rowCount: 251484,
        lineageStatus: "lineage_proven",
        blockers: []
      }
    ],
    summary: {
      lineageProven: 2,
      blockers: 0
    },
    ...overrides
  };
}

function parcelSanity(overrides = {}) {
  return {
    passed: true,
    distinctActiveParcelNumbers: 83296,
    endpointBehavior: {
      endpointStatus: 200,
      selectedCountyEchoed: true,
      activeCurrentSemanticsProven: true,
      appliesCountyFilter: true,
      appliesActiveFilter: true,
      appliesCurrentYearFilter: true,
      collapsesParcelVersions: true
    },
    blockers: [],
    ...overrides
  };
}

function runtimeRegistration(overrides = {}) {
  return {
    rows: [
      {
        county: "Benton",
        readinessClass: "runtime_proven",
        runtimeRows: 50,
        payloadCounty: "Benton",
        selectedCountyEchoed: true,
        silentBentonFallbackDetected: false,
        activeCurrentSemanticsProven: true,
        blockers: []
      }
    ],
    ...overrides
  };
}

function rowPathProof(overrides = {}) {
  return {
    summary: {
      passed: 1,
      failed: 0,
      silentBentonFallbacks: 0,
      zeroRowRuntimeResponses: 0
    },
    proofs: [
      {
        county: "Benton",
        endpointStatus: 200,
        runtimeRowsReturned: 50,
        selectedCountyEchoed: true,
        silentBentonFallbackDetected: false,
        passed: true,
        blockers: []
      }
    ],
    ...overrides
  };
}

function workflowProof(overrides = {}) {
  return {
    status: "PASS",
    blockers: [],
    benton: {
      parcelEndpointStatus: 200,
      parcelRowsReturned: 50,
      saleQualificationClassification: "canonical_landing_backed",
      canonicalSaleQualifications: 251484,
      ratioStudyEffectiveQualified: 100,
      ratioStudyDecisionQualified: 100
    },
    ...overrides
  };
}

function readyInputs(overrides = {}) {
  return {
    syncObservation: syncObservation(),
    runtimeDbContent: runtimeDbContent(),
    productLoadLedger: productLoadLedger(),
    parcelSanity: parcelSanity(),
    runtimeRegistration: runtimeRegistration(),
    rowPathProof: rowPathProof(),
    workflowProof: workflowProof(),
    ...overrides
  };
}

test("Phase A blocks Benton promotion while Sync is still active", () => {
  const report = buildWashingtonRuntimeExpansionPhaseAReport(
    readyInputs({
      syncObservation: syncObservation({
        interpretation: {
          drainStillActive: true,
          safeToRegenerateRuntimeTruthPackets: false,
          terminalStatus: "RUNNING"
        }
      })
    })
  );

  assert.equal(report.passed, false);
  assert.equal(report.status, "WAITING_SYNC_TERMINAL");
  assert.equal(report.promotion.fullDataReady, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "sync_terminal"));
});

test("Phase A promotes Benton only after terminal Sync and all Benton proofs pass", () => {
  const report = buildWashingtonRuntimeExpansionPhaseAReport(readyInputs());

  assert.equal(report.passed, true);
  assert.equal(report.status, "PASS");
  assert.deepEqual(report.summary, {
    targetCounty: "Benton",
    syncTerminal: true,
    canonicalParcelProven: true,
    activeCurrentParcelSemanticsProven: true,
    productLoadLineageProven: true,
    endpointRuntimeRegistrationProven: true,
    workflowDomainUsabilityProven: true,
    fullDataReadyCountiesAdded: 1
  });
  assert.equal(report.promotion.fullDataReady, true);
  assert.equal(report.promotion.countyRow.county, "Benton");
  assert.equal(report.promotion.countyRow.parcelSemanticsProven, true);
  assert.equal(report.promotion.countyRow.runtimeRows, 83296);
});

test("Phase A blocks promotion when workflow/domain usability remains red", () => {
  const report = buildWashingtonRuntimeExpansionPhaseAReport(
    readyInputs({
      workflowProof: workflowProof({
        status: "FAIL",
        blockers: ["Benton sale-qualification lineage proof did not pass."]
      })
    })
  );

  assert.equal(report.passed, false);
  assert.equal(report.status, "FAIL");
  assert.equal(report.promotion.fullDataReady, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "workflow_domain"));
});

test("Phase A CLI writes evidence and exits nonzero while Sync is active", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-phase-a-"));
  const outJson = path.join(root, "phase-a.json");
  const outMd = path.join(root, "phase-a.md");
  const scriptPath = path.resolve("os-platform/core/pilot/washington-runtime-expansion-phase-a.mjs");

  const paths = {
    syncObservationPath: path.join(root, "sync.json"),
    runtimeDbContentPath: path.join(root, "runtime-db-content.json"),
    productLoadLedgerPath: path.join(root, "product-load.json"),
    parcelSanityPath: path.join(root, "parcel-sanity.json"),
    runtimeRegistrationPath: path.join(root, "runtime-registration.json"),
    rowPathProofPath: path.join(root, "row-path.json"),
    workflowProofPath: path.join(root, "workflow.json")
  };

  fs.writeFileSync(
    paths.syncObservationPath,
    JSON.stringify(
      syncObservation({
        interpretation: {
          drainStillActive: true,
          safeToRegenerateRuntimeTruthPackets: false,
          terminalStatus: "RUNNING"
        }
      }),
      null,
      2
    )
  );
  fs.writeFileSync(paths.runtimeDbContentPath, JSON.stringify(runtimeDbContent(), null, 2));
  fs.writeFileSync(paths.productLoadLedgerPath, JSON.stringify(productLoadLedger(), null, 2));
  fs.writeFileSync(paths.parcelSanityPath, JSON.stringify(parcelSanity(), null, 2));
  fs.writeFileSync(paths.runtimeRegistrationPath, JSON.stringify(runtimeRegistration(), null, 2));
  fs.writeFileSync(paths.rowPathProofPath, JSON.stringify(rowPathProof(), null, 2));
  fs.writeFileSync(paths.workflowProofPath, JSON.stringify(workflowProof(), null, 2));

  const result = spawnSync(
    process.execPath,
    [
      scriptPath,
      "--sync-observation",
      paths.syncObservationPath,
      "--runtime-db-content",
      paths.runtimeDbContentPath,
      "--product-load-ledger",
      paths.productLoadLedgerPath,
      "--parcel-sanity",
      paths.parcelSanityPath,
      "--runtime-registration",
      paths.runtimeRegistrationPath,
      "--row-path-proof",
      paths.rowPathProofPath,
      "--workflow-proof",
      paths.workflowProofPath,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /"status": "WAITING_SYNC_TERMINAL"/);
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).promotion.fullDataReady, false);
  assert.match(fs.readFileSync(outMd, "utf8"), /Washington Runtime Expansion Phase A/);
});

test("Phase A run helper writes passing evidence when inputs are green", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-phase-a-green-"));
  const outJson = path.join(root, "phase-a.json");
  const outMd = path.join(root, "phase-a.md");

  const write = (name, value) => {
    const fullPath = path.join(root, name);
    fs.writeFileSync(fullPath, JSON.stringify(value, null, 2));
    return fullPath;
  };

  const report = runWashingtonRuntimeExpansionPhaseA({
    syncObservationPath: write("sync.json", syncObservation()),
    runtimeDbContentPath: write("runtime-db-content.json", runtimeDbContent()),
    productLoadLedgerPath: write("product-load.json", productLoadLedger()),
    parcelSanityPath: write("parcel-sanity.json", parcelSanity()),
    runtimeRegistrationPath: write("runtime-registration.json", runtimeRegistration()),
    rowPathProofPath: write("row-path.json", rowPathProof()),
    workflowProofPath: write("workflow.json", workflowProof()),
    outJson,
    outMd
  });

  assert.equal(report.passed, true);
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).promotion.fullDataReady, true);
  assert.match(fs.readFileSync(outMd, "utf8"), /Verdict: \*\*PASS\*\*/);
});
