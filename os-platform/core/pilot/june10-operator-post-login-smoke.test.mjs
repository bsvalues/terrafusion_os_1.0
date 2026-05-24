#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  buildJune10OperatorPostLoginSmokeReport,
  fetchJsonWithBearer,
  LOGIN_SUBMIT_BUTTON_NAME_PATTERN
} from "./june10-operator-post-login-smoke.mjs";

const execFileAsync = promisify(execFile);

test("passes when post-login shell, identity, Benton context, logout, and invalid-token handling are proven", () => {
  const report = buildJune10OperatorPostLoginSmokeReport({
    baseUrl: "https://terrafusionmarket.com",
    email: "june10-operator@terrafusionmarket.com",
    login: {
      finalUrl: "https://terrafusionmarket.com/canon",
      tokenStored: true,
      jwtIdentity: {
        email: "june10-operator@terrafusionmarket.com",
        roles: ["GovernmentUser", "Administrator"],
        permissions: ["runtime:read", "county:read", "workbench:access"],
        countyName: "Benton",
        countyState: "WA",
        countyFipsCode: "53005"
      }
    },
    shell: {
      canonLoaded: true,
      chromeSignals: {
        terraFusionOsTitle: true,
        shellChrome: true,
        bentonCounty: true,
        canonWorkbench: true
      }
    },
    protectedApis: {
      profile: {
        status: 200,
        operatorIdentityRecognized: true,
        userId: "98c48122-078d-4125-b342-a122d86b8ff3",
        email: "june10-operator@terrafusionmarket.com",
        roles: ["GovernmentUser", "Administrator"],
        permissions: ["runtime:read", "county:read", "workbench:access"],
        countyId: "53005000-0000-4000-8000-000000000005",
        county: "Benton",
        countyFipsCode: "53005",
        state: "WA",
        sessionValid: true
      },
      bentonParcels: {
        status: 200,
        county: "Benton",
        rowsReturned: 1,
        bentonContextPresent: true
      }
    },
    consoleAndRuntime: {
      authErrorCount: 0,
      authErrors: [],
      pageErrorCount: 0,
      pageErrors: []
    },
    logout: {
      controlFound: true,
      clicked: true,
      redirectedToLogin: true,
      tokenCleared: true
    },
    invalidToken: {
      redirectedToLogin: true,
      tokenCleared: true,
      protectedApiRejected: true,
      status: 401
    },
    screenshotPath: "os-platform/core/pilot/evidence/screenshots/june10-operator-post-login-shell.latest.png"
  });

  assert.equal(report.passed, true);
  assert.deepEqual(report.blockers, []);
});

test("login smoke accepts the constitutional production submit label", () => {
  assert.match("Enter TerraFusion OS", LOGIN_SUBMIT_BUTTON_NAME_PATTERN);
  assert.match("Sign In", LOGIN_SUBMIT_BUTTON_NAME_PATTERN);
});

test("blocks when profile identity is missing even if JWT identity and protected Benton API are proven", () => {
  const report = buildJune10OperatorPostLoginSmokeReport({
    baseUrl: "https://terrafusionmarket.com",
    email: "june10-operator@terrafusionmarket.com",
    login: {
      finalUrl: "https://terrafusionmarket.com/canon",
      tokenStored: true,
      jwtIdentity: {
        email: "june10-operator@terrafusionmarket.com",
        roles: ["GovernmentUser", "Administrator"],
        permissions: ["runtime:read", "county:read", "workbench:access"],
        countyName: "Benton",
        countyState: "WA",
        countyFipsCode: "53005"
      }
    },
    shell: {
      canonLoaded: true,
      chromeSignals: {
        terraFusionOsTitle: true,
        shellChrome: true,
        bentonCounty: true,
        canonWorkbench: true
      }
    },
    protectedApis: {
      profile: {
        status: 200,
        operatorIdentityRecognized: false,
        email: null,
        roles: []
      },
      bentonParcels: {
        status: 200,
        county: "Benton",
        rowsReturned: 1,
        bentonContextPresent: true
      }
    },
    consoleAndRuntime: {
      authErrorCount: 0,
      authErrors: [],
      pageErrorCount: 0,
      pageErrors: []
    },
    logout: {
      controlFound: true,
      clicked: true,
      redirectedToLogin: true,
      tokenCleared: true
    },
    invalidToken: {
      redirectedToLogin: true,
      tokenCleared: true,
      protectedApiRejected: true,
      status: 401
    },
    screenshotPath: null
  });

  assert.equal(report.operatorIdentityRecognized, false);
  assert.equal(report.protectedApiSucceeded, false);
  assert.equal(report.bentonCountyContextPresent, false);
  assert.equal(report.passed, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("/api/auth/profile")));
});

test("blocks when Benton FIPS 53005 is not present in the post-login identity", () => {
  const report = buildJune10OperatorPostLoginSmokeReport({
    baseUrl: "https://terrafusionmarket.com",
    email: "june10-operator@terrafusionmarket.com",
    login: {
      finalUrl: "https://terrafusionmarket.com/canon",
      tokenStored: true,
      jwtIdentity: {
        email: "june10-operator@terrafusionmarket.com",
        roles: ["GovernmentUser", "Administrator"],
        permissions: ["runtime:read", "county:read", "workbench:access"],
        countyName: "Benton",
        countyState: "WA",
        countyFipsCode: "99999"
      }
    },
    shell: {
      canonLoaded: true,
      chromeSignals: {
        terraFusionOsTitle: true,
        shellChrome: true,
        bentonCounty: true,
        canonWorkbench: true
      }
    },
    protectedApis: {
      profile: {
        status: 200,
        operatorIdentityRecognized: true,
        userId: "98c48122-078d-4125-b342-a122d86b8ff3",
        email: "june10-operator@terrafusionmarket.com",
        roles: ["GovernmentUser", "Administrator"],
        permissions: ["runtime:read", "county:read", "workbench:access"],
        countyId: "53005000-0000-4000-8000-000000000005",
        county: "Benton",
        countyFipsCode: "99999",
        state: "WA",
        sessionValid: true
      },
      bentonParcels: {
        status: 200,
        county: "Benton",
        rowsReturned: 1,
        bentonContextPresent: true
      }
    },
    consoleAndRuntime: {
      authErrorCount: 0,
      authErrors: [],
      pageErrorCount: 0,
      pageErrors: []
    },
    logout: {
      controlFound: true,
      clicked: true,
      redirectedToLogin: true,
      tokenCleared: true
    },
    invalidToken: {
      redirectedToLogin: true,
      tokenCleared: true,
      protectedApiRejected: true,
      status: 401
    },
    screenshotPath: null
  });

  assert.equal(report.passed, false);
  assert.equal(report.bentonCountyContextPresent, false);
  assert.ok(report.blockers.some((blocker) => blocker.includes("FIPS 53005")));
});

test("fetchJsonWithBearer sends Authorization bearer token and parses JSON response", async () => {
  const server = http.createServer((req, res) => {
    if (req.headers.authorization === "Bearer test-token") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ county: "Benton", data: [1] }));
      return;
    }

    res.writeHead(401, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "unauthorized" }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    const response = await fetchJsonWithBearer(`http://127.0.0.1:${port}/api/protected`, "test-token");
    assert.equal(response.status, 200);
    assert.equal(response.payload.county, "Benton");
  } finally {
    server.close();
  }
});

test("CLI writes evidence and redacts password", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-j10-post-login-"));
  const outJson = path.join(tmp, "post-login.json");
  const outMd = path.join(tmp, "post-login.md");

  const result = await execFileAsync(
    "node",
    [
      "os-platform/core/pilot/june10-operator-post-login-smoke.mjs",
      "--fixture",
      "pass",
      "--email",
      "june10-operator@terrafusionmarket.com",
      "--password-env",
      "TF_TEST_OPERATOR_PASSWORD",
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
  assert.match(markdown, /Verdict: PASS/);
});
