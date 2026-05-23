#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildBentonProjectionUniquenessRepairPlan,
  chooseCanonicalWinner
} from "./june10-benton-projection-uniqueness-repair-plan.mjs";

function duplicateRows() {
  return [
    {
      parcelNumber: "101843020124000",
      tfParcelId: "22222222-2222-2222-2222-222222222222",
      currentOwnerId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      currentAssessmentId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      situsAddress: "100 MAIN ST",
      legalDescription: "LOT 1",
      propertyType: "RES",
      parcelStatus: "ACTIVE",
      conversionEra: "sync",
      createdAt: "2026-05-22T00:02:00.000Z",
      updatedAt: "2026-05-22T00:05:00.000Z"
    },
    {
      parcelNumber: "101843020124000",
      tfParcelId: "11111111-1111-1111-1111-111111111111",
      currentOwnerId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      currentAssessmentId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      situsAddress: "100 MAIN ST",
      legalDescription: "LOT 1",
      propertyType: "RES",
      parcelStatus: "ACTIVE",
      conversionEra: "sync",
      createdAt: "2026-05-22T00:01:00.000Z",
      updatedAt: "2026-05-22T00:03:00.000Z"
    }
  ];
}

function fixtureInput(overrides = {}) {
  return {
    generatedAtUtc: "2026-05-23T01:30:00.000Z",
    syncState: {
      inProgressBatches: 1,
      latestBatch: {
        status: "IN_PROGRESS",
        operator: "claude-strict-serial-improvement-tn500-v145"
      }
    },
    rootCause: {
      primaryRootCause: "projection_upsert_or_uniqueness_defect",
      projectionFixRequired: true,
      certificationImpact: "certification_blocker"
    },
    aggregate: {
      duplicateGroups: 1503,
      extraActiveRows: 1503,
      maxRowsPerParcelNumber: 2
    },
    duplicateRows: duplicateRows(),
    ...overrides
  };
}

test("chooses deterministic canonical winner by updatedAt, createdAt, then TfParcelId", () => {
  const result = chooseCanonicalWinner(duplicateRows());

  assert.equal(result.winner.tfParcelId, "22222222-2222-2222-2222-222222222222");
  assert.deepEqual(
    result.losers.map((row) => row.tfParcelId),
    ["11111111-1111-1111-1111-111111111111"]
  );
});

test("builds active uniqueness repair plan without allowing DB mutation while Sync is active", () => {
  const report = buildBentonProjectionUniquenessRepairPlan(fixtureInput());

  assert.equal(report.passed, false);
  assert.equal(report.databaseMutationTaken, false);
  assert.equal(report.repairAuthorization.mutationAllowedNow, false);
  assert.equal(report.summary.certificationBlockedUntilDryRunZero, true);
  assert.equal(report.summary.duplicateGroups, 1503);
  assert.match(report.repairPlan.activeUniquenessRule.sql, /CREATE UNIQUE INDEX/);
  assert.match(report.repairPlan.deterministicUpsertBehavior.conflictTargetSql, /CountyId/);
  assert.equal(report.dryRun.sampleResolutionGroups[0].winnerTfParcelId, "22222222-2222-2222-2222-222222222222");
  assert.ok(report.blockers.some((blocker) => blocker.source === "sync_active"));
  assert.ok(report.blockers.some((blocker) => blocker.source === "active_duplicates_remaining"));
});

test("blocks repair when root cause is not the projection upsert defect", () => {
  const report = buildBentonProjectionUniquenessRepairPlan(
    fixtureInput({
      rootCause: {
        primaryRootCause: "source_duplicate_proven",
        projectionFixRequired: false,
        certificationImpact: "certification_blocker"
      }
    })
  );

  assert.equal(report.passed, false);
  assert.equal(report.repairAuthorization.mutationAllowedNow, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "root_cause_not_projection_upsert"));
});

test("passes only when no active duplicate groups remain and Sync is terminal", () => {
  const report = buildBentonProjectionUniquenessRepairPlan(
    fixtureInput({
      syncState: {
        inProgressBatches: 0,
        latestBatch: { status: "COMPLETED" }
      },
      aggregate: {
        duplicateGroups: 0,
        extraActiveRows: 0,
        maxRowsPerParcelNumber: 1
      },
      duplicateRows: []
    })
  );

  assert.equal(report.passed, true);
  assert.equal(report.summary.certificationBlockedUntilDryRunZero, false);
  assert.equal(report.repairAuthorization.mutationAllowedNow, false);
  assert.equal(report.blockers.length, 0);
});

test("CLI writes repair plan JSON and Markdown evidence from fixture", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-benton-uniqueness-repair-"));
  const inputPath = path.join(tmp, "input.json");
  const outJson = path.join(tmp, "repair.json");
  const outMd = path.join(tmp, "repair.md");

  fs.writeFileSync(inputPath, `${JSON.stringify(fixtureInput(), null, 2)}\n`);

  const child = spawnSync(
    "node",
    [
      "os-platform/core/pilot/june10-benton-projection-uniqueness-repair-plan.mjs",
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
  assert.match(child.stdout, /active_duplicates_remaining/);
  assert.equal(report.summary.duplicateGroups, 1503);
  assert.match(markdown, /Benton Projection Uniqueness Repair Plan/);
  assert.match(markdown, /CREATE UNIQUE INDEX/);
});
