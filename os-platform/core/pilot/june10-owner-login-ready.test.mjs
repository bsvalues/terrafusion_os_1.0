#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("owner-login-ready CLI writes redacted evidence and proves handoff posture", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-j10-owner-login-"));
  const outJson = path.join(tmp, "owner-login.json");
  const outMd = path.join(tmp, "owner-login.md");

  const result = await execFileAsync(
    "node",
    [
      "os-platform/core/pilot/june10-owner-login-ready.mjs",
      "--fixture",
      "pass",
      "--email",
      "owner.operator@terrafusionmarket.com",
      "--password-env",
      "TF_TEST_OWNER_PASSWORD",
      "--handoff-path",
      path.join(tmp, "owner-handoff.txt"),
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TF_TEST_OWNER_PASSWORD: "OwnerPassword123!"
      }
    }
  );

  assert.match(result.stdout, /"passed": true/);

  const json = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");
  const handoff = fs.readFileSync(json.handoff.path, "utf8");

  assert.equal(json.passed, true);
  assert.equal(json.ownerAccessReady, true);
  assert.equal(json.handoff.exists, true);
  assert.equal(json.handoff.containsEmail, true);
  assert.equal(json.handoff.containsPassword, true);
  assert.equal(json.handoff.gitIgnored, true);
  assert.equal(json.handoff.pathIncludesTmpOrUserProfile, true);
  assert.doesNotMatch(JSON.stringify(json), /OwnerPassword123!/);
  assert.doesNotMatch(markdown, /OwnerPassword123!/);
  assert.match(markdown, /Verdict: PASS/);
  assert.match(markdown, /Owner operator credential handoff/);
  assert.match(handoff, /owner.operator@terrafusionmarket.com/);
  assert.match(handoff, /OwnerPassword123!/);
});

test("owner-login-ready blocks when no credential handoff is available", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-j10-owner-login-missing-"));
  const outJson = path.join(tmp, "owner-login.json");
  const outMd = path.join(tmp, "owner-login.md");

  await assert.rejects(
    execFileAsync(
      "node",
      [
        "os-platform/core/pilot/june10-owner-login-ready.mjs",
        "--fixture",
        "pass",
        "--email",
        "owner.operator@terrafusionmarket.com",
        "--out-json",
        outJson,
        "--out-md",
        outMd
      ],
      { cwd: process.cwd() }
    )
  );

  const json = JSON.parse(fs.readFileSync(outJson, "utf8"));
  assert.equal(json.passed, false);
  assert.equal(json.ownerAccessReady, false);
  assert.ok(json.blockers.some((blocker) => blocker.includes("Owner password is not configured")));
});
