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
  buildJune10EndpointContractSmokeReport,
  probeJune10EndpointContracts
} from "./june10-endpoint-contract-smoke.mjs";

const execFileAsync = promisify(execFile);

function probe({ path: pathname, status = 200, body = {}, contentType = "application/json" }) {
  return {
    id: pathname,
    method: "GET",
    path: pathname,
    url: `http://127.0.0.1:5046${pathname}`,
    status,
    contentType,
    bodyText: JSON.stringify(body),
    bodySnippet: JSON.stringify(body).slice(0, 240),
    ok: status >= 200 && status < 400,
    error: null
  };
}

test("blocks when required runtime endpoint probe fails", () => {
  const report = buildJune10EndpointContractSmokeReport({
    apiBaseUrl: "http://127.0.0.1:5046",
    probes: [
      probe({ path: "/health", body: { status: "ok" } }),
      probe({ path: "/api/counties/benton/parcels?limit=5", status: 404, body: { error: "not found" } })
    ]
  });

  assert.equal(report.passed, false);
  assert.equal(report.summary.failedRuntimeProbes, 1);
  assert.ok(report.blockers.some((blocker) => blocker.source === "runtime_probe"));
});

test("blocks when Benton parcel endpoint does not expose countable rows or county identity", () => {
  const report = buildJune10EndpointContractSmokeReport({
    apiBaseUrl: "http://127.0.0.1:5046",
    probes: [
      probe({ path: "/api/counties/benton/parcels?limit=5", body: { rows: [] } }),
      probe({ path: "/api/runtime/truth/db-identity", body: { passed: true, identity: { database: "terrafusion" } } })
    ]
  });

  assert.equal(report.passed, false);
  assert.ok(report.contractMismatches.some((mismatch) => mismatch.endpointId === "benton_parcels"));
});

test("passes when required runtime endpoints are reachable and response shapes match", () => {
  const report = buildJune10EndpointContractSmokeReport({
    apiBaseUrl: "http://127.0.0.1:5046",
    probes: [
      probe({ path: "/health", body: { status: "ok" } }),
      probe({
        path: "/api/runtime/truth/db-identity",
        body: { passed: true, identity: { database: "terrafusion", provider: "Npgsql.EntityFrameworkCore.PostgreSQL" } }
      }),
      probe({
        path: "/api/counties/benton/parcels?limit=5",
        body: { county: "Benton", total: 10, rows: [{ parcelId: "1001", county: "Benton" }] }
      }),
      probe({
        path: "/api/auth/access-policy",
        body: { signupMode: "provisioned_access_only", publicSignupEnabled: false, accessRequestUrl: "/request-access" }
      })
    ]
  });

  assert.equal(report.passed, true);
  assert.equal(report.summary.contractMismatches, 0);
  assert.equal(report.summary.failedRuntimeProbes, 0);
});

test("uses a development auth token for protected runtime endpoint probes without writing the token to evidence", async () => {
  const token = "fixture-token-that-must-not-be-written";
  const protectedPaths = new Set([
    "/api/runtime/truth/db-identity",
    "/api/counties/benton/parcels?limit=5"
  ]);
  const server = http.createServer((req, res) => {
    res.setHeader("content-type", "application/json");

    if (req.url === "/api/auth/dev-token") {
      res.end(JSON.stringify({ token }));
      return;
    }

    if (protectedPaths.has(req.url) && req.headers.authorization !== `Bearer ${token}`) {
      res.statusCode = 401;
      res.end('{"error":"unauthorized"}');
      return;
    }

    if (req.url === "/health") {
      res.end('{"status":"ok"}');
      return;
    }
    if (req.url === "/api/runtime/truth/db-identity") {
      res.end('{"passed":true,"identity":{"database":"terrafusion","provider":"Npgsql.EntityFrameworkCore.PostgreSQL"}}');
      return;
    }
    if (req.url === "/api/counties/benton/parcels?limit=5") {
      res.end('{"county":"Benton","total":2,"rows":[{"parcelId":"1001","county":"Benton"},{"parcelId":"1002","county":"Benton"}]}');
      return;
    }
    if (req.url === "/api/auth/access-policy") {
      res.end('{"signupMode":"provisioned_access_only","publicSignupEnabled":false,"accessRequestUrl":"/request-access"}');
      return;
    }

    res.statusCode = 404;
    res.end('{"error":"not found"}');
  });
  server.keepAliveTimeout = 1;
  server.headersTimeout = 2000;

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    const report = await probeJune10EndpointContracts({ apiBaseUrl: `http://127.0.0.1:${port}` });

    assert.equal(report.passed, true);
    assert.equal(report.auth.developmentToken.acquired, true);
    assert.equal(report.summary.failedRuntimeProbes, 0);
    assert.equal(JSON.stringify(report).includes(token), false);
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("probes an HTTP fixture and writes endpoint contract evidence", async () => {
  const server = http.createServer((req, res) => {
    res.setHeader("content-type", "application/json");

    if (req.url === "/health") {
      res.end('{"status":"ok"}');
      return;
    }
    if (req.url === "/api/runtime/truth/db-identity") {
      res.end('{"passed":true,"identity":{"database":"terrafusion","provider":"Npgsql.EntityFrameworkCore.PostgreSQL"}}');
      return;
    }
    if (req.url === "/api/counties/benton/parcels?limit=5") {
      res.end('{"county":"Benton","total":2,"rows":[{"parcelId":"1001","county":"Benton"},{"parcelId":"1002","county":"Benton"}]}');
      return;
    }
    if (req.url === "/api/auth/access-policy") {
      res.end('{"signupMode":"provisioned_access_only","publicSignupEnabled":false,"accessRequestUrl":"/request-access"}');
      return;
    }

    res.statusCode = 404;
    res.end('{"error":"not found"}');
  });
  server.keepAliveTimeout = 1;
  server.headersTimeout = 2000;

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-endpoint-contract-smoke-"));
  const outJson = path.join(tmp, "endpoint-contract.json");
  const outMd = path.join(tmp, "endpoint-contract.md");

  try {
    const report = await probeJune10EndpointContracts({ apiBaseUrl: baseUrl });
    assert.equal(report.passed, true);

    const result = await execFileAsync(
      "node",
      [
        "os-platform/core/pilot/june10-endpoint-contract-smoke.mjs",
        "--api-base-url",
        baseUrl,
        "--out-json",
        outJson,
        "--out-md",
        outMd
      ],
      { cwd: process.cwd() }
    );

    assert.match(result.stdout, /"passed": true/);
    assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).passed, true);
    assert.match(fs.readFileSync(outMd, "utf8"), /June 10 Endpoint Contract Smoke/);
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
});
