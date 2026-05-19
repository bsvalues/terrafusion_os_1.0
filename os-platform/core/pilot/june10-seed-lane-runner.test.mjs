#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildSeedLanePlan, buildSeedLaneReport } from "./june10-seed-lane-runner.mjs";

test("plans seed lane truth scripts in dependency order", () => {
  const plan = buildSeedLanePlan();

  assert.deepEqual(
    plan.map((step) => step.id),
    [
      "seed_receipts",
      "seed_wave_plan",
      "seed_work_order_pack",
      "seed_receipt_template_pack",
      "seed_execution_status",
      "seed_control_plane"
    ]
  );
  assert.equal(plan.at(-1).script, "june10-seed-control-plane.mjs");
});

test("reports pass only when all commands and control plane pass", () => {
  const plan = buildSeedLanePlan();
  const commandResults = plan.map((step) => ({
    ...step,
    exitCode: 0,
    stdout: "{}",
    stderr: ""
  }));
  const controlPlane = {
    passed: true,
    summary: {
      workOrders: 5,
      receiptsFound: 0,
      runtimeClaimAllowed: false,
      blockers: 0
    }
  };

  const report = buildSeedLaneReport({ plan, commandResults, controlPlane, dryRun: false });

  assert.equal(report.passed, true);
  assert.equal(report.summary.commandsRun, 6);
  assert.equal(report.summary.runtimeClaimAllowed, false);
  assert.deepEqual(report.blockers, []);
});

test("blocks the lane if any command fails or runtime claims are enabled", () => {
  const plan = buildSeedLanePlan();
  const commandResults = plan.map((step, index) => ({
    ...step,
    exitCode: index === 2 ? 1 : 0,
    stdout: "",
    stderr: index === 2 ? "failure" : ""
  }));
  const controlPlane = {
    passed: false,
    summary: {
      workOrders: 5,
      receiptsFound: 0,
      runtimeClaimAllowed: true,
      blockers: 1
    }
  };

  const report = buildSeedLaneReport({ plan, commandResults, controlPlane, dryRun: false });

  assert.equal(report.passed, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("seed_work_order_pack failed")));
  assert.ok(report.blockers.some((blocker) => blocker.includes("runtimeClaimAllowed must remain false")));
});

test("CLI dry-run writes a non-proof lane packet", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-seed-lane-"));
  const outJson = path.join(tmp, "lane.json");
  const outMd = path.join(tmp, "lane.md");

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-seed-lane-runner.mjs",
      "--dry-run",
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");

  assert.equal(report.mode, "DRY_RUN");
  assert.equal(report.passed, false);
  assert.equal(report.summary.commandsPlanned, 6);
  assert.match(markdown, /Dry run: true/);
  assert.match(markdown, /seed_control_plane/);
});
