#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { buildJune10PublicSiteSmokeReport, probeJune10PublicSite } from "./june10-public-site-smoke.mjs";

const execFileAsync = promisify(execFile);

function route(pathname, status, body, contentType = "text/html") {
  return {
    path: pathname,
    url: `https://terrafusionmarket.com${pathname}`,
    status,
    contentType,
    bodyText: body,
    bodySnippet: body.slice(0, 240),
    ok: status >= 200 && status < 400,
    error: null
  };
}

function apiProbe(pathname, status, body = "{}") {
  return {
    path: pathname,
    url: `https://terrafusionmarket.com${pathname}`,
    status,
    contentType: "application/json",
    bodyText: body,
    bodySnippet: body,
    ok: status >= 200 && status < 500,
    error: null
  };
}

test("allows disabled signup without a public access-request channel", () => {
  const report = buildJune10PublicSiteSmokeReport({
    baseUrl: "https://terrafusionmarket.com",
    routes: [
      route("/", 200, "TerraFusion OS Your session has expired. Sign In"),
      route("/login", 200, "Provisioned access only Sign In"),
      route("/signup", 200, "Public self-signup is disabled. Sign In"),
      route("/marketplace", 200, "Marketplace registry Browse governed modules")
    ],
    apiProbes: [apiProbe("/api/health", 401, '{"error":"Unauthorized"}')]
  });

  assert.equal(report.passed, true);
  assert.equal(report.summary.blockers, 0);
  assert.equal(report.summary.apiAuthGated, 1);
});

test("passes when login disables public requests and marketplace is visible", () => {
  const report = buildJune10PublicSiteSmokeReport({
    baseUrl: "https://terrafusionmarket.com",
    routes: [
      route("/", 200, "TerraFusion OS"),
      route("/login", 200, "Provisioned access only Sign In"),
      route("/signup", 200, "Public self-signup and public access requests are disabled"),
      route("/marketplace", 200, "Marketplace registry Browse governed modules")
    ],
    apiProbes: [
      apiProbe("/api/health", 200, '{"status":"ok"}'),
      apiProbe(
        "/api/auth/access-policy",
        200,
        '{"signupMode":"provisioned_access_only","publicSignupEnabled":false,"message":"TerraFusion access is provisioned by an administrator. Public self-signup and public access requests are disabled."}'
      )
    ],
    renderedRoutes: [
      route("/login", 200, "Provisioned access only Sign In"),
      route("/signup", 200, "Provisioned access only Sign In")
    ],
    renderedBrowserRequired: true
  });

  assert.equal(report.passed, true);
  assert.equal(report.summary.blockers, 0);
  assert.equal(report.summary.apiAuthGated, 0);
});

test("blocks when access policy exposes a public access-request channel", () => {
  const report = buildJune10PublicSiteSmokeReport({
    baseUrl: "https://terrafusionmarket.com",
    routes: [
      route("/", 200, "<div id=\"root\"></div>"),
      route("/login", 200, "<div id=\"root\"></div>"),
      route("/signup", 200, "<div id=\"root\"></div>"),
      route("/marketplace", 200, "<div id=\"root\"></div>")
    ],
    apiProbes: [
      apiProbe("/api/health", 401, '{"error":"Unauthorized"}'),
      apiProbe(
        "/api/auth/access-policy",
        200,
        '{"signupMode":"provisioned_access_only","publicSignupEnabled":false,"accessRequestUrl":"mailto:support@terrafusionmarket.com"}'
      )
    ]
  });

  assert.equal(report.passed, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "access_policy"));
});

test("blocks when rendered login exposes public access request", () => {
  const report = buildJune10PublicSiteSmokeReport({
    baseUrl: "https://terrafusionmarket.com",
    routes: [
      route("/", 200, "<div id=\"root\"></div>"),
      route("/login", 200, "<div id=\"root\"></div>"),
      route("/signup", 200, "<div id=\"root\"></div>"),
      route("/marketplace", 200, "Marketplace registry Browse governed modules")
    ],
    apiProbes: [
      apiProbe("/api/health", 200, '{"status":"ok"}'),
      apiProbe(
        "/api/auth/access-policy",
        200,
        '{"signupMode":"provisioned_access_only","publicSignupEnabled":false,"accessRequestUrl":"mailto:support@terrafusionmarket.com"}'
      )
    ],
    renderedRoutes: [
      route("/login", 200, "TerraFusion OS Provisioned access only Request provisioned access Sign In"),
      route("/signup", 200, "TerraFusion OS Public self-signup is disabled Sign In")
    ],
    renderedBrowserRequired: true
  });

  assert.equal(report.passed, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "rendered_access_posture"));
});

test("blocks when any rendered access route exposes access request after browser render", () => {
  const report = buildJune10PublicSiteSmokeReport({
    baseUrl: "https://terrafusionmarket.com",
    routes: [
      route("/", 200, "<div id=\"root\"></div>"),
      route("/login", 200, "<div id=\"root\"></div>"),
      route("/signup", 200, "<div id=\"root\"></div>"),
      route("/marketplace", 200, "Marketplace registry Browse governed modules")
    ],
    apiProbes: [
      apiProbe("/api/health", 200, '{"status":"ok"}'),
      apiProbe(
        "/api/auth/access-policy",
        200,
        '{"signupMode":"provisioned_access_only","publicSignupEnabled":false,"accessRequestUrl":"mailto:support@terrafusionmarket.com"}'
      )
    ],
    renderedRoutes: [
      route("/login", 200, "TerraFusion OS Provisioned access only Sign In"),
      route("/signup", 200, "TerraFusion OS Provisioned access only Sign In")
    ],
    renderedBrowserRequired: true
  });

  assert.equal(report.passed, false);
  assert.ok(
    report.blockers.some(
      (blocker) =>
        blocker.source === "access_policy"
    )
  );
});

test("blocks when direct rendered login presents a first-time visitor as an expired session", () => {
  const report = buildJune10PublicSiteSmokeReport({
    baseUrl: "https://terrafusionmarket.com",
    routes: [
      route("/", 200, "<div id=\"root\"></div>"),
      route("/login", 200, "<div id=\"root\"></div>"),
      route("/signup", 200, "Public self-signup and public access requests are disabled"),
      route("/marketplace", 200, "Marketplace registry Browse governed modules")
    ],
    apiProbes: [
      apiProbe("/api/health", 200, '{"status":"ok"}'),
      apiProbe(
        "/api/auth/access-policy",
        200,
        '{"signupMode":"provisioned_access_only","publicSignupEnabled":false,"message":"TerraFusion access is provisioned by an administrator. Public self-signup and public access requests are disabled."}'
      )
    ],
    renderedRoutes: [
      route(
        "/login",
        200,
        "TerraFusion OS Your session has expired. Provisioned access only Sign In"
      ),
      route("/signup", 200, "TerraFusion OS Provisioned access only Sign In")
    ],
    renderedBrowserRequired: true
  });

  assert.equal(report.passed, false);
  assert.ok(
    report.blockers.some(
      (blocker) =>
        blocker.source === "rendered_access_posture" &&
        blocker.message.includes("expired-session")
    )
  );
});

test("probes an HTTP fixture and writes JSON and Markdown evidence", async () => {
  const server = http.createServer((req, res) => {
    if (req.url === "/api/health") {
      res.writeHead(401, { "content-type": "application/json" });
      res.end('{"error":"Unauthorized"}');
      return;
    }
    if (req.url === "/api/auth/access-policy") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        '{"signupMode":"provisioned_access_only","publicSignupEnabled":false,"message":"TerraFusion access is provisioned by an administrator. Public self-signup is disabled."}'
      );
      return;
    }

    res.writeHead(200, { "content-type": "text/html" });
    if (req.url === "/signup") res.end("Public self-signup is disabled. Sign In");
    else if (req.url === "/marketplace") res.end("Your session has expired. Provisioned access only. Sign In");
    else res.end("TerraFusion OS Sign In");
  });
  server.keepAliveTimeout = 1;
  server.headersTimeout = 2000;

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-public-site-smoke-"));
  const outJson = path.join(tmp, "public-site.json");
  const outMd = path.join(tmp, "public-site.md");

  try {
    const report = await probeJune10PublicSite({ baseUrl, renderBrowser: false });
    assert.equal(report.passed, false);
    assert.ok(report.routes.find((item) => item.path === "/signup"));

    const result = await execFileAsync(
      "node",
      [
        "os-platform/core/pilot/june10-public-site-smoke.mjs",
        "--base-url",
        baseUrl,
        "--out-json",
        outJson,
        "--out-md",
        outMd,
        "--skip-browser-render"
      ],
      { cwd: process.cwd() }
    );

    assert.match(result.stdout, /"passed": false/);
    assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).passed, false);
    assert.match(fs.readFileSync(outMd, "utf8"), /June 10 Public Site Smoke/);
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
});
