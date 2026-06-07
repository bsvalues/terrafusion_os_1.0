#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildCountyStudioRealDevBackendHealthReport,
  CANONICAL_BACKEND_LAUNCH_COMMAND,
  CANONICAL_BACKEND_HEALTH_ENDPOINTS
} from "./county-studio-real-dev-backend-health.mjs";

const repoRoot = process.cwd();

test("reports healthy backend when a canonical health endpoint responds", () => {
  const report = buildCountyStudioRealDevBackendHealthReport({
    healthChecks: [
      {
        url: "http://localhost:5046/health",
        port: 5046,
        ok: true,
        statusCode: 200
      }
    ],
    generatedAtUtc: "2026-06-07T00:00:00.000Z"
  });

  assert.equal(report.status, "REAL_DEV_BACKEND_HEALTH_PASS");
  assert.equal(report.backendHealthy, true);
  assert.equal(report.healthEndpoint, "http://localhost:5046/health");
  assert.equal(report.backendLaunchCommand, CANONICAL_BACKEND_LAUNCH_COMMAND);
  assert.equal(report.backendStartedByDevCommand, false);
  assert.equal(report.productionProofAllowed, false);
  assert.equal(report.operationalProofAllowed, false);
});

test("blocks with exact backend bootstrap remediation when no health endpoint responds", () => {
  const report = buildCountyStudioRealDevBackendHealthReport({
    healthChecks: CANONICAL_BACKEND_HEALTH_ENDPOINTS.map((url) => ({
      url,
      port: Number(new URL(url).port),
      ok: false,
      error: "connection refused"
    })),
    generatedAtUtc: "2026-06-07T00:00:00.000Z"
  });

  assert.equal(report.status, "REAL_DEV_BACKEND_HEALTH_BLOCKED");
  assert.equal(report.backendHealthy, false);
  assert.equal(report.healthEndpoint, null);
  assert.match(report.failureReason, /No TerraFusion API backend health endpoint responded/i);
  assert.match(report.remediation, /pnpm run dev:backend:api/);
  assert.equal(report.productionProofAllowed, false);
  assert.equal(report.operationalProofAllowed, false);
});

test("CLI writes backend bootstrap evidence and exits nonzero when backend is unavailable", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-backend-health-"));
  const outJson = path.join(tmp, "backend-health.json");
  const outMd = path.join(tmp, "backend-health.md");
  const result = spawnSync(
    process.execPath,
    [
      "os-platform/core/pilot/county-studio-real-dev-backend-health.mjs",
      "--health-url",
      "http://127.0.0.1:9/health",
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: repoRoot, encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /REAL_DEV_BACKEND_HEALTH_BLOCKED/);
  assert.ok(fs.existsSync(outJson));
  assert.ok(fs.existsSync(outMd));

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(report.backendHealthy, false);
  assert.match(report.remediation, /pnpm run dev:backend:api/);
});

test("real Benton dev command checks backend health before DB readiness", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  const command = pkg.scripts["dev:county-studio:real-benton"];

  const backendIndex = command.indexOf("proof:county-studio:real-dev-backend-health");
  const readinessIndex = command.indexOf("proof:county-studio:benton-real-dev-server-readiness:db");

  assert.ok(backendIndex >= 0);
  assert.ok(readinessIndex >= 0);
  assert.ok(backendIndex < readinessIndex);
});
