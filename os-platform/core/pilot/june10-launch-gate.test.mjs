#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

import {
  buildJune10LaunchGateReport,
  inspectActiveRuntimeLegacyLeaks,
  probeJune10LaunchGate
} from "./june10-launch-gate.mjs";

function endpointSmoke(overrides = {}) {
  return {
    passed: true,
    summary: {
      failedRuntimeProbes: 0,
      contractMismatches: 0,
      blockers: 0,
      ...(overrides.summary ?? {})
    },
    blockers: [],
    localRuntimeProbes: [
      {
        id: "health",
        path: "/health",
        status: 200,
        ok: true
      }
    ],
    ...overrides
  };
}

function publicSiteSmoke(overrides = {}) {
  return {
    passed: true,
    summary: {
      blockers: 0,
      warnings: 0,
      ...(overrides.summary ?? {})
    },
    blockers: [],
    ...overrides
  };
}

function productLoadLedger(overrides = {}) {
  return {
    receiptEvidence: {
      exists: true,
      rowCount: 1
    },
    summary: {
      lineageProven: 1,
      blockers: 0,
      ...(overrides.summary ?? {})
    },
    rows: [
      {
        tableName: "canonical_tf.tf_parcel",
        lineageStatus: "lineage_proven"
      }
    ],
    ...overrides
  };
}

function rustRuntimeUsage(overrides = {}) {
  return {
    passed: true,
    summary: {
      launchRelevantRustCrates: 1,
      runtimeIntegrations: 1,
      liveProvenRuntimeIntegrations: 1,
      missingBinaries: 0,
      warnings: 0,
      blockers: 0,
      ...(overrides.summary ?? {})
    },
    warnings: [],
    blockers: [],
    ...overrides
  };
}

function makeTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-june10-launch-gate-"));
}

function writeFile(root, relativePath, content) {
  const fullPath = path.join(root, ...relativePath.split("/"));
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

test("launch gate passes only when live smoke, load ledger, Rust posture, and legacy boundary are clean", () => {
  const report = buildJune10LaunchGateReport({
    apiBaseUrl: "http://127.0.0.1:5046",
    publicBaseUrl: "https://terrafusionmarket.com",
    endpointSmoke: endpointSmoke(),
    publicSiteSmoke: publicSiteSmoke(),
    productLoadLedger: productLoadLedger(),
    rustRuntimeUsage: rustRuntimeUsage(),
    rustClaimsSuppressed: false,
    activeRuntimeLegacyLeaks: []
  });

  assert.equal(report.passed, true);
  assert.equal(report.summary.blockers, 0);
  assert.equal(report.summary.apiHealthLive, true);
  assert.equal(report.summary.endpointSmokePassed, true);
  assert.equal(report.summary.publicAccessPostureExplicit, true);
  assert.equal(report.summary.productLoadLedgerPassed, true);
  assert.equal(report.summary.rustRuntimeProven, true);
});

test("launch gate blocks stale readiness when API health is not live now", () => {
  const report = buildJune10LaunchGateReport({
    apiBaseUrl: "http://127.0.0.1:5046",
    publicBaseUrl: "https://terrafusionmarket.com",
    endpointSmoke: endpointSmoke({
      passed: false,
      summary: { failedRuntimeProbes: 1, contractMismatches: 1, blockers: 1 },
      localRuntimeProbes: [{ id: "health", path: "/health", status: null, ok: false, error: "connect ECONNREFUSED" }]
    }),
    publicSiteSmoke: publicSiteSmoke(),
    productLoadLedger: productLoadLedger(),
    rustRuntimeUsage: rustRuntimeUsage(),
    rustClaimsSuppressed: false,
    activeRuntimeLegacyLeaks: []
  });

  assert.equal(report.passed, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "api_health"));
  assert.ok(report.blockers.some((blocker) => blocker.source === "endpoint_smoke"));
});

test("launch gate blocks product-load claims without a lineage ledger", () => {
  const report = buildJune10LaunchGateReport({
    apiBaseUrl: "http://127.0.0.1:5046",
    publicBaseUrl: "https://terrafusionmarket.com",
    endpointSmoke: endpointSmoke(),
    publicSiteSmoke: publicSiteSmoke(),
    productLoadLedger: null,
    rustRuntimeUsage: rustRuntimeUsage(),
    rustClaimsSuppressed: false,
    activeRuntimeLegacyLeaks: []
  });

  assert.equal(report.passed, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "product_load_ledger"));
});

test("launch gate blocks Rust runtime claims unless they are proven or explicitly suppressed", () => {
  const unprovenRust = rustRuntimeUsage({
    passed: false,
    summary: {
      launchRelevantRustCrates: 1,
      runtimeIntegrations: 1,
      liveProvenRuntimeIntegrations: 0,
      missingBinaries: 2,
      warnings: 2,
      blockers: 0
    }
  });

  const blocked = buildJune10LaunchGateReport({
    apiBaseUrl: "http://127.0.0.1:5046",
    publicBaseUrl: "https://terrafusionmarket.com",
    endpointSmoke: endpointSmoke(),
    publicSiteSmoke: publicSiteSmoke(),
    productLoadLedger: productLoadLedger(),
    rustRuntimeUsage: unprovenRust,
    rustClaimsSuppressed: false,
    activeRuntimeLegacyLeaks: []
  });

  assert.equal(blocked.passed, false);
  assert.ok(blocked.blockers.some((blocker) => blocker.source === "rust_runtime"));

  const suppressed = buildJune10LaunchGateReport({
    apiBaseUrl: "http://127.0.0.1:5046",
    publicBaseUrl: "https://terrafusionmarket.com",
    endpointSmoke: endpointSmoke(),
    publicSiteSmoke: publicSiteSmoke(),
    productLoadLedger: productLoadLedger(),
    rustRuntimeUsage: unprovenRust,
    rustClaimsSuppressed: true,
    activeRuntimeLegacyLeaks: []
  });

  assert.equal(suppressed.passed, true);
  assert.equal(suppressed.summary.rustClaimsSuppressed, true);
});

test("legacy leak scanner blocks product runtime references but allows sync/admin proof lanes", () => {
  const root = makeTempRepo();
  writeFile(
    root,
    "backend/src/TerraFusion.API/Controllers/CostForgeController.cs",
    "public class CostForgeController { const string leak = \"Harris PACS runtime route\"; }"
  );
  writeFile(
    root,
    "backend/src/TerraFusion.API/Controllers/SyncController.cs",
    "public class SyncController { const string allowed = \"Harris PACS upstream provenance\"; }"
  );

  const leaks = inspectActiveRuntimeLegacyLeaks({ repoRoot: root });

  assert.equal(leaks.length, 1);
  assert.equal(leaks[0].filePath, "backend/src/TerraFusion.API/Controllers/CostForgeController.cs");
  assert.equal(leaks[0].allowed, false);
});

test("probeJune10LaunchGate composes live endpoint and public site smoke with ledger evidence", async () => {
  const root = makeTempRepo();
  const ledgerPath = path.join(root, "generated", "truth", "terrafusion-db-product-load-ledger.json");
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.writeFileSync(ledgerPath, JSON.stringify(productLoadLedger(), null, 2));

  const server = http.createServer((req, res) => {
    res.setHeader("content-type", "application/json");

    if (req.url === "/" || req.url === "/login" || req.url === "/signup" || req.url === "/marketplace") {
      res.setHeader("content-type", "text/html");
      res.end("<html><body>Marketplace governed module access request sign in</body></html>");
      return;
    }

    if (req.url === "/api/auth/dev-token") {
      res.end('{"token":"fixture-token"}');
      return;
    }
    if (req.url === "/health" || req.url === "/api/health") {
      res.end('{"status":"ok"}');
      return;
    }
    if (req.url === "/api/runtime/truth/db-identity") {
      res.end('{"passed":true,"identity":{"database":"terrafusion","provider":"Npgsql.EntityFrameworkCore.PostgreSQL"}}');
      return;
    }
    if (req.url === "/api/counties/benton/parcels?limit=5") {
      res.end('{"county":"Benton","total":2,"rows":[{"parcelId":"1001","county":"Benton"}]}');
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

  try {
    const report = await probeJune10LaunchGate({
      apiBaseUrl: baseUrl,
      publicBaseUrl: baseUrl,
      repoRoot: root,
      productLoadLedgerPath: ledgerPath,
      rustClaimsSuppressed: true,
      timeoutMs: 5000
    });

    assert.equal(report.passed, true);
    assert.equal(report.summary.endpointSmokePassed, true);
    assert.equal(report.summary.publicAccessPostureExplicit, true);
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
});
