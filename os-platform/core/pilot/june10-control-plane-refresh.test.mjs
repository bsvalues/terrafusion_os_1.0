#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  buildJune10ControlPlaneRefresh,
  defaultRefreshSteps
} from "./june10-control-plane-refresh.mjs";

function completedSteps() {
  return defaultRefreshSteps().map((step, index) => ({
    ...step,
    exitCode: 0,
    startedAtUtc: `2026-05-15T01:0${index}:00.000Z`,
    completedAtUtc: `2026-05-15T01:0${index}:01.000Z`,
    stdout: "{}",
    stderr: ""
  }));
}

test("passes only when every refresh step succeeds and final freshness is fresh", () => {
  const report = buildJune10ControlPlaneRefresh({
    steps: completedSteps(),
    finalFreshness: {
      freshnessStatus: "FRESH",
      summary: { blockers: 0 }
    }
  });

  assert.equal(report.refreshStatus, "PASS");
  assert.equal(report.summary.failedSteps, 0);
  assert.equal(report.summary.finalFreshnessStatus, "FRESH");
  assert.equal(report.steps.at(-1).id, "controlPlaneFreshness");
});

test("renders refresh command lines with OS-neutral path separators", () => {
  const report = buildJune10ControlPlaneRefresh({
    steps: completedSteps(),
    finalFreshness: {
      freshnessStatus: "FRESH",
      summary: { blockers: 0 }
    }
  });

  assert.equal(report.steps[0].commandLine, "node os-platform/core/pilot/june10-sync-evidence-intake.mjs");
  assert.ok(report.steps.every((step) => !step.commandLine.includes("\\")));
});

test("redacts secret-like command output before writing refresh evidence", () => {
  const steps = completedSteps();
  steps[0].stdout = "token=abc123 password=super-secret Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig";
  steps[0].stderr = "ConnectionString=Server=.;Password=top-secret;";

  const report = buildJune10ControlPlaneRefresh({
    steps,
    finalFreshness: {
      freshnessStatus: "FRESH",
      summary: { blockers: 0 }
    }
  });

  assert.doesNotMatch(report.steps[0].stdout, /abc123|super-secret|eyJhbGciOiJIUzI1NiJ9|payload\.sig/);
  assert.doesNotMatch(report.steps[0].stderr, /top-secret/);
  assert.match(report.steps[0].stdout, /token=<redacted>/);
  assert.match(report.steps[0].stderr, /Password=<redacted>/i);
});

test("bounds stored command output while preserving tail context", () => {
  const steps = completedSteps();
  steps[0].stdout = `${"a".repeat(7000)}TAIL-CONTEXT`;
  steps[0].stderr = `${"b".repeat(7000)}ERROR-TAIL`;

  const report = buildJune10ControlPlaneRefresh({
    steps,
    finalFreshness: {
      freshnessStatus: "FRESH",
      summary: { blockers: 0 }
    }
  });

  assert.ok(report.steps[0].stdout.length < 6500);
  assert.ok(report.steps[0].stderr.length < 6500);
  assert.match(report.steps[0].stdout, /\[truncated .* chars\]/);
  assert.match(report.steps[0].stdout, /TAIL-CONTEXT$/);
  assert.match(report.steps[0].stderr, /ERROR-TAIL$/);
});

test("fails when any refresh step exits non-zero", () => {
  const steps = completedSteps();
  steps[2].exitCode = 1;
  steps[2].stderr = "burndown failed";

  const report = buildJune10ControlPlaneRefresh({
    steps,
    finalFreshness: {
      freshnessStatus: "FRESH",
      summary: { blockers: 0 }
    }
  });

  assert.equal(report.refreshStatus, "FAIL");
  assert.ok(report.blockers.some((blocker) => blocker.includes("p0Burndown exited 1")));
});

test("fails when final freshness is stale after ordered refresh", () => {
  const report = buildJune10ControlPlaneRefresh({
    steps: completedSteps(),
    finalFreshness: {
      freshnessStatus: "STALE",
      summary: { blockers: 1 },
      blockers: ["operatorCommandQueue is older than warRoomStatus."]
    }
  });

  assert.equal(report.refreshStatus, "FAIL");
  assert.ok(report.blockers.some((blocker) => blocker.includes("Final control-plane freshness is STALE")));
});

test("CLI dry run writes a planned refresh report without running commands", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-june10-refresh-"));
  const outJson = path.join(tmp, "refresh.json");
  const outMd = path.join(tmp, "refresh.md");

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-control-plane-refresh.mjs",
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

  assert.equal(report.refreshStatus, "PLANNED");
  assert.equal(report.summary.totalSteps, defaultRefreshSteps().length);
  assert.equal(report.summary.executedSteps, 0);
  assert.match(markdown, /June 10 Control-Plane Refresh/);
  assert.match(markdown, /controlPlaneFreshness/);
});
