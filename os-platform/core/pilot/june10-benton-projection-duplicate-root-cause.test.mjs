#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildBentonProjectionDuplicateRootCause,
  classifyProjectionDuplicateRootCause
} from "./june10-benton-projection-duplicate-root-cause.mjs";

function exactDuplicateInput(overrides = {}) {
  return {
    generatedAtUtc: "2026-05-23T01:00:00.000Z",
    schema: {
      table: "canonical_tf.tf_parcel",
      columns: [
        "TfParcelId",
        "CountyId",
        "ParcelNumber",
        "SitusAddress",
        "LegalDescription",
        "ParcelStatus",
        "PropertyType",
        "CurrentOwnerId",
        "CurrentAssessmentId",
        "CreatedAt",
        "UpdatedAt",
        "ConversionEra"
      ],
      indexes: [
        {
          indexName: "IX_tf_parcel_CountyId_ParcelNumber",
          unique: false,
          definition: "CREATE INDEX \"IX_tf_parcel_CountyId_ParcelNumber\" ON canonical_tf.tf_parcel USING btree (\"CountyId\", \"ParcelNumber\")"
        }
      ]
    },
    syncState: {
      inProgressBatches: 1,
      latestBatch: {
        operator: "claude-strict-serial-improvement-tn500-v144",
        status: "IN_PROGRESS"
      }
    },
    aggregate: {
      duplicateGroups: 1503,
      extraActiveRows: 1503,
      maxRowsPerParcelNumber: 2,
      exactNonVolatileDuplicateGroups: 1503,
      ownerFanoutGroups: 0,
      assessmentFanoutGroups: 0,
      situsFanoutGroups: 0,
      legalFanoutGroups: 0,
      propertyTypeFanoutGroups: 0,
      conversionEraFanoutGroups: 0,
      createdTimestampDistinctGroups: 1503,
      updatedTimestampDistinctGroups: 1503,
      sourceIdentifierFanoutGroups: null,
      loadBatchFanoutGroups: null
    },
    sampleGroups: [
      {
        parcelNumber: "101843020124000",
        rows: 2,
        nonVolatileSignatures: 1,
        ownerIds: 1,
        assessmentIds: 1,
        situsAddresses: 1,
        legalDescriptions: 1,
        propertyTypes: 1,
        conversionEras: 1,
        createdTimestamps: 2,
        updatedTimestamps: 2
      }
    ],
    ...overrides
  };
}

test("classifies exact duplicates without a unique active parcel key as projection upsert root cause", () => {
  const classification = classifyProjectionDuplicateRootCause(exactDuplicateInput());

  assert.equal(classification.primaryRootCause, "projection_upsert_or_uniqueness_defect");
  assert.equal(classification.certificationImpact, "certification_blocker");
  assert.equal(classification.projectionFixRequired, true);
  assert.ok(classification.evidence.some((item) => item.includes("non-volatile")));
  assert.ok(classification.evidence.some((item) => item.includes("no unique active")));
});

test("classifies fanout evidence separately from exact duplicate projection defects", () => {
  const input = exactDuplicateInput({
    aggregate: {
      ...exactDuplicateInput().aggregate,
      exactNonVolatileDuplicateGroups: 100,
      ownerFanoutGroups: 1403,
      assessmentFanoutGroups: 1403
    }
  });

  const classification = classifyProjectionDuplicateRootCause(input);

  assert.equal(classification.primaryRootCause, "projection_fanout_requires_adjudication");
  assert.equal(classification.certificationImpact, "certification_blocker");
  assert.equal(classification.projectionFixRequired, true);
});

test("classifies source duplicate only when source identifiers prove source fanout", () => {
  const input = exactDuplicateInput({
    schema: {
      ...exactDuplicateInput().schema,
      columns: [...exactDuplicateInput().schema.columns, "SourceRecordId", "LoadBatchId"]
    },
    aggregate: {
      ...exactDuplicateInput().aggregate,
      exactNonVolatileDuplicateGroups: 0,
      sourceIdentifierFanoutGroups: 1503,
      loadBatchFanoutGroups: 0
    }
  });

  const classification = classifyProjectionDuplicateRootCause(input);

  assert.equal(classification.primaryRootCause, "source_duplicate_proven");
  assert.equal(classification.certificationImpact, "certification_blocker");
  assert.equal(classification.projectionFixRequired, false);
});

test("builds a blocker report and keeps certification off while Sync is active", () => {
  const report = buildBentonProjectionDuplicateRootCause(exactDuplicateInput());

  assert.equal(report.passed, false);
  assert.equal(report.summary.primaryRootCause, "projection_upsert_or_uniqueness_defect");
  assert.equal(report.summary.syncActive, true);
  assert.equal(report.certificationGranted, false);
  assert.equal(report.databaseMutationTaken, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "sync_active"));
  assert.ok(report.blockers.some((blocker) => blocker.source === "projection_duplicate_root_cause"));
});

test("passes only when no active duplicate groups remain", () => {
  const report = buildBentonProjectionDuplicateRootCause(
    exactDuplicateInput({
      syncState: { inProgressBatches: 0, latestBatch: { status: "COMPLETED" } },
      aggregate: {
        duplicateGroups: 0,
        extraActiveRows: 0,
        maxRowsPerParcelNumber: 1,
        exactNonVolatileDuplicateGroups: 0,
        ownerFanoutGroups: 0,
        assessmentFanoutGroups: 0,
        situsFanoutGroups: 0,
        legalFanoutGroups: 0,
        propertyTypeFanoutGroups: 0,
        conversionEraFanoutGroups: 0,
        createdTimestampDistinctGroups: 0,
        updatedTimestampDistinctGroups: 0,
        sourceIdentifierFanoutGroups: null,
        loadBatchFanoutGroups: null
      },
      sampleGroups: []
    })
  );

  assert.equal(report.passed, true);
  assert.equal(report.summary.primaryRootCause, "none");
  assert.equal(report.blockers.length, 0);
});

test("classifies DB probe errors as unavailable instead of clean", () => {
  const report = buildBentonProjectionDuplicateRootCause(
    exactDuplicateInput({
      error: "canceling statement due to statement timeout",
      aggregate: {
        duplicateGroups: null,
        extraActiveRows: null,
        maxRowsPerParcelNumber: null,
        exactNonVolatileDuplicateGroups: null,
        ownerFanoutGroups: null,
        assessmentFanoutGroups: null,
        situsFanoutGroups: null,
        legalFanoutGroups: null,
        propertyTypeFanoutGroups: null,
        conversionEraFanoutGroups: null,
        createdTimestampDistinctGroups: null,
        updatedTimestampDistinctGroups: null,
        sourceIdentifierFanoutGroups: null,
        loadBatchFanoutGroups: null
      },
      sampleGroups: []
    })
  );

  assert.equal(report.passed, false);
  assert.equal(report.summary.primaryRootCause, "db_probe_unavailable");
  assert.ok(report.blockers.some((blocker) => blocker.source === "db_probe"));
});

test("CLI writes root-cause JSON and Markdown evidence from fixture", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-benton-root-cause-"));
  const inputPath = path.join(tmp, "input.json");
  const outJson = path.join(tmp, "root-cause.json");
  const outMd = path.join(tmp, "root-cause.md");

  fs.writeFileSync(inputPath, `${JSON.stringify(exactDuplicateInput(), null, 2)}\n`);

  const child = spawnSync(
    "node",
    [
      "os-platform/core/pilot/june10-benton-projection-duplicate-root-cause.mjs",
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
  assert.match(child.stdout, /projection_upsert_or_uniqueness_defect/);
  assert.equal(report.summary.primaryRootCause, "projection_upsert_or_uniqueness_defect");
  assert.match(markdown, /Benton Projection Duplicate Root-Cause Gate/);
  assert.match(markdown, /projection_upsert_or_uniqueness_defect/);
});
