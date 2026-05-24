#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  buildJune10OperatorAuthSmokeReport,
  runJune10OperatorAuthSmoke
} from "./june10-operator-auth-smoke.mjs";

const execFileAsync = promisify(execFile);

function jwt(payload) {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.sig`;
}

test("passes when API login returns provisioned JWT claims and browser proof is skipped", async () => {
  const token = jwt({
    email: "june10-operator@terrafusionmarket.com",
    role: ["GovernmentUser", "Administrator"],
    countyId: "19190019-1919-1919-1919-191919191919",
    countyName: "Benton",
    countyState: "WA",
    countyFipsCode: "53005",
    perm: ["runtime:read", "county:read", "june10:smoke", "workbench:access"]
  });

  const server = http.createServer((req, res) => {
    if (req.url === "/api/auth/login" && req.method === "POST") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          token,
          refreshToken: "refresh-token",
          email: "june10-operator@terrafusionmarket.com",
          roles: ["GovernmentUser", "Administrator"]
        })
      );
      return;
    }

    res.writeHead(404);
    res.end("{}");
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    const report = await runJune10OperatorAuthSmoke({
      baseUrl: `http://127.0.0.1:${port}`,
      email: "june10-operator@terrafusionmarket.com",
      password: "CorrectPassword123!",
      runBrowser: false
    });

    assert.equal(report.passed, true);
    assert.equal(report.apiLogin.status, 200);
    assert.equal(report.apiLogin.tokenIssued, true);
    assert.equal(report.apiLogin.refreshTokenIssued, true);
    assert.deepEqual(report.claims.roles, ["GovernmentUser", "Administrator"]);
    assert.equal(report.claims.countyName, "Benton");
    assert.ok(report.claims.permissions.includes("workbench:access"));
  } finally {
    server.close();
  }
});

test("blocks when required JWT claims are missing", () => {
  const report = buildJune10OperatorAuthSmokeReport({
    baseUrl: "https://terrafusionmarket.com",
    email: "june10-operator@terrafusionmarket.com",
    apiLogin: {
      status: 200,
      tokenIssued: true,
      refreshTokenIssued: true,
      returnedEmail: "june10-operator@terrafusionmarket.com",
      roles: ["GovernmentUser"]
    },
    claims: {
      email: "june10-operator@terrafusionmarket.com",
      roles: ["GovernmentUser"],
      permissions: ["runtime:read"],
      countyId: null,
      countyName: null,
      countyState: null,
      countyFipsCode: null
    },
    browser: { attempted: false, required: false }
  });

  assert.equal(report.passed, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("Administrator")));
  assert.ok(report.blockers.some((blocker) => blocker.includes("county claim")));
  assert.ok(report.blockers.some((blocker) => blocker.includes("workbench:access")));
});

test("CLI writes redacted evidence without exposing the password", async () => {
  const token = jwt({
    email: "june10-operator@terrafusionmarket.com",
    role: ["GovernmentUser", "Administrator"],
    countyId: "19190019-1919-1919-1919-191919191919",
    countyName: "Benton",
    countyState: "WA",
    countyFipsCode: "53005",
    perm: ["runtime:read", "county:read", "june10:smoke", "workbench:access"]
  });

  const server = http.createServer((req, res) => {
    if (req.url === "/api/auth/login" && req.method === "POST") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ token, refreshToken: "refresh-token", email: "june10-operator@terrafusionmarket.com" }));
      return;
    }
    res.writeHead(404);
    res.end("{}");
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-j10-auth-"));
  const outJson = path.join(tmp, "operator-auth.json");
  const outMd = path.join(tmp, "operator-auth.md");

  try {
    const result = await execFileAsync(
      "node",
      [
        "os-platform/core/pilot/june10-operator-auth-smoke.mjs",
        "--base-url",
        `http://127.0.0.1:${port}`,
        "--email",
        "june10-operator@terrafusionmarket.com",
        "--password-env",
        "TF_TEST_OPERATOR_PASSWORD",
        "--skip-browser",
        "--out-json",
        outJson,
        "--out-md",
        outMd
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          TF_TEST_OPERATOR_PASSWORD: "CorrectPassword123!"
        }
      }
    );

    assert.match(result.stdout, /"passed": true/);
    const json = fs.readFileSync(outJson, "utf8");
    const markdown = fs.readFileSync(outMd, "utf8");
    assert.doesNotMatch(json, /CorrectPassword123!/);
    assert.doesNotMatch(markdown, /CorrectPassword123!/);
    assert.match(markdown, /Password supplied: yes \(redacted\)/);
  } finally {
    server.close();
  }
});
