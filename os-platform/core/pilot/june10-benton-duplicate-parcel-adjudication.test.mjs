#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildBentonDuplicateParcelAdjudication,
  classifyDuplicateGroup
} from "./june10-benton-duplicate-parcel-adjudication.mjs";

function baseInput(overrides = {}) {
  return {
    generatedAtUtc: "2026-05-23T00:30:00.000Z",
    syncState: {
      inProgressBatches: 1,
      latestBatch: {
        operator: "claude-strict-serial-improvement-tn500-v144",
        status: "IN_PROGRESS"
      }
    },
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
      ]
    },
    aggregate: {
      duplicateGroups: 1503,
      extraActiveRows: 1519,
      maxRowsPerParcelNumber: 3
    },
    sampleRows: [
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
        createdAt: "2026-05-22T00:00:00.000Z",
        updatedAt: "2026-05-22T00:00:00.000Z"
      },
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
        createdAt: "2026-05-22T00:00:00.000Z",
        updatedAt: "2026-05-22T00:00:00.000Z"
      }
    ],
    ...overrides
  };
}

test("classifies exact active duplicate parcel rows as projection fix required", () => {
  const group = classifyDuplicateGroup({
    parcelNumber: "101843020124000",
    rows: baseInput().sampleRows,
    schemaColumns: baseInput().schema.columns
  });

  assert.equal(group.classification, "exact_or_near_duplicate_projection_bug");
  assert.equal(group.certificationImpact, "certification_blocker");
  assert.equal(group.projectionFixRequired, true);
  assert.equal(group.legitimateMultiRowProven, false);
});

test("classifies active duplicates with different owner or assessment as adjudication blocker", () => {
  const input = baseInput();
  input.sampleRows[1] = {
    ...input.sampleRows[1],
    currentOwnerId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    currentAssessmentId: "dddddddd-dddd-dddd-dddd-dddddddddddd"
  };

  const group = classifyDuplicateGroup({
    parcelNumber: "101843020124000",
    rows: input.sampleRows,
    schemaColumns: input.schema.columns
  });

  assert.equal(group.classification, "ownership_or_assessment_split_requires_adjudication");
  assert.equal(group.certificationImpact, "certification_blocker");
  assert.equal(group.projectionFixRequired, true);
});

test("allows warning only when a legitimate version or split key is present", () => {
  const rows = [
    {
      parcelNumber: "101843020124000",
      tfParcelId: "11111111-1111-1111-1111-111111111111",
      parcelStatus: "ACTIVE",
      taxYear: 2025,
      geometryId: "poly-a"
    },
    {
      parcelNumber: "101843020124000",
      tfParcelId: "22222222-2222-2222-2222-222222222222",
      parcelStatus: "ACTIVE",
      taxYear: 2026,
      geometryId: "poly-b"
    }
  ];

  const group = classifyDuplicateGroup({
    parcelNumber: "101843020124000",
    rows,
    schemaColumns: ["TfParcelId", "ParcelNumber", "ParcelStatus", "TaxYear", "GeometryId"]
  });

  assert.equal(group.classification, "legitimate_multi_row_history_or_split_proven");
  assert.equal(group.certificationImpact, "acceptable_warning");
  assert.equal(group.projectionFixRequired, false);
});

test("builds certification blocker report when active duplicates lack explaining keys", () => {
  const report = buildBentonDuplicateParcelAdjudication(baseInput());

  assert.equal(report.passed, false);
  assert.equal(report.summary.duplicateGroups, 1503);
  assert.equal(report.summary.certificationImpact, "certification_blocker");
  assert.equal(report.summary.projectionFixRequired, true);
  assert.equal(report.summary.syncActive, true);
  assert.ok(report.blockers.some((blocker) => blocker.source === "duplicate_active_parcel_numbers"));
  assert.ok(report.blockers.some((blocker) => blocker.source === "sync_active"));
});

test("passes when duplicate groups are absent", () => {
  const report = buildBentonDuplicateParcelAdjudication(
    baseInput({
      syncState: { inProgressBatches: 0, latestBatch: { status: "COMPLETED" } },
      aggregate: {
        duplicateGroups: 0,
        extraActiveRows: 0,
        maxRowsPerParcelNumber: 1
      },
      sampleRows: []
    })
  );

  assert.equal(report.passed, true);
  assert.equal(report.summary.certificationImpact, "none");
  assert.equal(report.summary.projectionFixRequired, false);
  assert.equal(report.blockers.length, 0);
});

test("CLI writes duplicate adjudication JSON and Markdown evidence from fixture", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-benton-dup-adjudication-"));
  const inputPath = path.join(tmp, "input.json");
  const outJson = path.join(tmp, "adjudication.json");
  const outMd = path.join(tmp, "adjudication.md");

  fs.writeFileSync(inputPath, `${JSON.stringify(baseInput(), null, 2)}\n`);

  const child = spawnSync(
    "node",
    [
      "os-platform/core/pilot/june10-benton-duplicate-parcel-adjudication.mjs",
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
  assert.match(child.stdout, /certification_blocker/);
  assert.equal(report.summary.duplicateGroups, 1503);
  assert.match(markdown, /Benton Duplicate Parcel-Number Adjudication/);
  assert.match(markdown, /certification_blocker/);
});
