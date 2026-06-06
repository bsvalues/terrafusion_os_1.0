#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildCountyStudioRealDevServerActivationReport
} from "./county-studio-real-dev-server-activation.mjs";

const repoRoot = process.cwd();

function readinessReport(overrides = {}) {
  return {
    status: "REAL_DEV_DATA_AVAILABLE",
    decisions: {
      realDevServerAllowed: true,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    forgeDevDependency: {
      ownerSupnumBackfill: {
        status: "FAILED",
        classification: "NOT_REQUIRED_FOR_FORGE_DEV",
        requiredForCountyStudioForgeDev: false,
        requiredForPacketProof: true,
        requiredForOperationalProof: true
      }
    },
    checks: [
      { name: "backend health", classification: "SYNC_DERIVED", passed: true },
      { name: "map data dependency status", classification: "PARTIAL_SEEDED", passed: true },
      { name: "ledger data dependency status", classification: "SYNC_DERIVED", passed: true },
      { name: "inspector data dependency status", classification: "SYNC_DERIVED", passed: true }
    ],
    blockers: [],
    ...overrides
  };
}

function dataTruthReport(overrides = {}) {
  return {
    status: "DATA_TRUTH_FAIL",
    claims: {
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    proofAreas: [
      {
        area: "parcel/property source",
        classification: "SYNC_DERIVED",
        productionProofAllowed: false,
        reason: "real dev data, not authoritative production proof"
      },
      {
        area: "risk objects",
        classification: "GENERATED",
        productionProofAllowed: false,
        reason: "derived risk source lineage still unproven"
      },
      {
        area: "Atlas layers",
        classification: "FALLBACK",
        productionProofAllowed: false,
        reason: "compatibility geometry remains production blocker"
      }
    ],
    failures: ["risk objects: derived risk source lineage still unproven"],
    ...overrides
  };
}

test("allows real Benton dev activation only when readiness allows it", () => {
  const report = buildCountyStudioRealDevServerActivationReport({
    readinessReport: readinessReport(),
    dataTruthReport: dataTruthReport(),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "REAL_DEV_ACTIVATION_READY");
  assert.equal(report.decisions.realDevActivationAllowed, true);
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.equal(report.decisions.operationalProofAllowed, false);
  assert.equal(report.forgeDevDependency.ownerSupnumBackfill.status, "FAILED");
  assert.equal(report.forgeDevDependency.ownerSupnumBackfill.requiredForCountyStudioForgeDev, false);
  assert.match(report.runPath.prerequisiteCommand, /benton-real-dev-server-readiness:db/);
  assert.match(report.runPath.launchCommand, /TF_COUNTY_STUDIO_DEV_DATA_MODE=real-benton/);
});

test("blocks real dev activation when DB readiness evidence is missing", () => {
  const report = buildCountyStudioRealDevServerActivationReport({
    readinessReport: readinessReport({
      status: "REAL_DEV_SERVER_BLOCKED",
      decisions: {
        realDevServerAllowed: false,
        productionProofAllowed: false,
        operationalProofAllowed: false
      },
      blockers: ["DB evidence unreadable"]
    }),
    dataTruthReport: dataTruthReport(),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "REAL_DEV_ACTIVATION_BLOCKED");
  assert.equal(report.decisions.realDevActivationAllowed, false);
  assert.ok(report.blockers.some((blocker) => /DB evidence unreadable/.test(blocker)));
});

test("mock or fallback readiness dependencies cannot satisfy activation", () => {
  const report = buildCountyStudioRealDevServerActivationReport({
    readinessReport: readinessReport({
      checks: [
        { name: "backend health", classification: "SYNC_DERIVED", passed: true },
        { name: "map data dependency status", classification: "FALLBACK", passed: true },
        { name: "ledger data dependency status", classification: "GENERATED", passed: true },
        { name: "inspector data dependency status", classification: "MOCK", passed: true }
      ]
    }),
    dataTruthReport: dataTruthReport(),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.status, "REAL_DEV_ACTIVATION_BLOCKED");
  assert.equal(report.decisions.realDevActivationAllowed, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("map data dependency status")));
  assert.ok(report.blockers.some((blocker) => blocker.includes("ledger data dependency status")));
  assert.ok(report.blockers.some((blocker) => blocker.includes("inspector data dependency status")));
});

test("surfaces remaining data-truth blockers without promoting production proof", () => {
  const report = buildCountyStudioRealDevServerActivationReport({
    readinessReport: readinessReport(),
    dataTruthReport: dataTruthReport(),
    generatedAtUtc: "2026-06-06T00:00:00.000Z"
  });

  assert.equal(report.decisions.realDevActivationAllowed, true);
  assert.equal(report.dataTruthPosture.status, "DATA_TRUTH_FAIL");
  assert.equal(report.productionBlockedDependencies.length, 2);
  assert.ok(report.productionBlockedDependencies.some((item) => item.classification === "GENERATED"));
  assert.ok(report.productionBlockedDependencies.some((item) => item.classification === "FALLBACK"));
});

test("CLI writes activation evidence and exits zero only for real dev activation", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-county-studio-real-dev-"));
  const readiness = path.join(tmp, "readiness.json");
  const dataTruth = path.join(tmp, "data-truth.json");
  const outJson = path.join(tmp, "activation.json");
  const outMd = path.join(tmp, "activation.md");

  fs.writeFileSync(readiness, `${JSON.stringify(readinessReport(), null, 2)}\n`);
  fs.writeFileSync(dataTruth, `${JSON.stringify(dataTruthReport(), null, 2)}\n`);

  const result = spawnSync(
    "node",
    [
      "os-platform/core/pilot/county-studio-real-dev-server-activation.mjs",
      "--readiness",
      readiness,
      "--data-truth",
      dataTruth,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: repoRoot, encoding: "utf8" }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /REAL_DEV_ACTIVATION_READY/);
  assert.ok(fs.existsSync(outJson));
  assert.ok(fs.existsSync(outMd));

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");
  assert.equal(report.decisions.productionProofAllowed, false);
  assert.match(markdown, /Production Proof: BLOCKED/);
  assert.match(markdown, /Operational Proof: BLOCKED/);
});
