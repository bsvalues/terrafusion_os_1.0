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
  inspectRuntimeLegacyBoundary,
  probeJune10LaunchGate,
  resolveRustClaimsSuppression
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

function runtimeDbContentAudit(overrides = {}) {
  return {
    endpoint: "https://terrafusionmarket.com/api/runtime/truth/db-content",
    endpointStatus: 200,
    passed: true,
    blockers: [],
    content: {
      passed: true,
      blockers: [],
      totalCounties: 1,
      totalProperties: 10,
      bentonDecision: {
        classification: "benton_runtime_content_proven"
      }
    },
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

function writeRustClaimPosture(root, posture) {
  writeFile(root, "os-platform/core/pilot/june10-rust-claim-posture.json", `${JSON.stringify(posture, null, 2)}\n`);
}

test("launch gate passes only when live smoke, load ledger, Rust posture, and legacy boundary are clean", () => {
  const report = buildJune10LaunchGateReport({
    apiBaseUrl: "http://127.0.0.1:5046",
    publicBaseUrl: "https://terrafusionmarket.com",
    endpointSmoke: endpointSmoke(),
    publicSiteSmoke: publicSiteSmoke(),
    productLoadLedger: productLoadLedger(),
    runtimeDbContentAudit: runtimeDbContentAudit(),
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
  assert.equal(report.summary.runtimeDbContentAuditPassed, true);
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
    runtimeDbContentAudit: runtimeDbContentAudit(),
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
    runtimeDbContentAudit: runtimeDbContentAudit(),
    rustRuntimeUsage: rustRuntimeUsage(),
    rustClaimsSuppressed: false,
    activeRuntimeLegacyLeaks: []
  });

  assert.equal(report.passed, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "product_load_ledger"));
});

test("launch gate blocks stale product-load claims when live runtime DB content audit is red", () => {
  const report = buildJune10LaunchGateReport({
    apiBaseUrl: "http://127.0.0.1:5046",
    publicBaseUrl: "https://terrafusionmarket.com",
    endpointSmoke: endpointSmoke(),
    publicSiteSmoke: publicSiteSmoke(),
    productLoadLedger: productLoadLedger(),
    runtimeDbContentAudit: runtimeDbContentAudit({
      passed: false,
      blockers: ["canonical_tf.tf_parcel is missing or unreadable in TerraFusion DB."]
    }),
    rustRuntimeUsage: rustRuntimeUsage(),
    rustClaimsSuppressed: false,
    activeRuntimeLegacyLeaks: []
  });

  assert.equal(report.passed, false);
  assert.equal(report.summary.productLoadLedgerPassed, true);
  assert.equal(report.summary.runtimeDbContentAuditPassed, false);
  assert.ok(report.blockers.some((blocker) => blocker.source === "runtime_db_content"));
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
    runtimeDbContentAudit: runtimeDbContentAudit(),
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
    runtimeDbContentAudit: runtimeDbContentAudit(),
    rustRuntimeUsage: unprovenRust,
    rustClaimsSuppressed: true,
    activeRuntimeLegacyLeaks: []
  });

  assert.equal(suppressed.passed, true);
  assert.equal(suppressed.summary.rustClaimsSuppressed, true);
});

test("Rust claim suppression requires an explicit safe launch posture artifact", () => {
  const root = makeTempRepo();
  const unprovenRust = rustRuntimeUsage({
    passed: false,
    summary: {
      launchRelevantRustCrates: 1,
      runtimeIntegrations: 1,
      liveProvenRuntimeIntegrations: 0,
      missingBinaries: 1,
      warnings: 1,
      blockers: 0
    }
  });

  assert.equal(resolveRustClaimsSuppression({ repoRoot: root, rustRuntimeUsage: unprovenRust }), false);

  writeRustClaimPosture(root, {
    claimsSuppressed: true,
    allowedPublicClaim: "Rust integration seams exist; runtime execution is not proven.",
    forbiddenClaims: [
      "Rust runtime execution is proven.",
      "Rust kernels are live in production.",
      "Rust accelerated valuation is production-ready."
    ]
  });

  assert.equal(resolveRustClaimsSuppression({ repoRoot: root, rustRuntimeUsage: unprovenRust }), true);
});

test("Rust claim suppression rejects posture artifacts that overclaim live execution", () => {
  const root = makeTempRepo();
  const unprovenRust = rustRuntimeUsage({
    passed: false,
    summary: {
      launchRelevantRustCrates: 1,
      runtimeIntegrations: 1,
      liveProvenRuntimeIntegrations: 0,
      missingBinaries: 1,
      warnings: 1,
      blockers: 0
    }
  });

  writeRustClaimPosture(root, {
    claimsSuppressed: true,
    allowedPublicClaim: "Rust runtime execution is proven and production-ready.",
    forbiddenClaims: ["Rust runtime execution is not proven."]
  });

  assert.equal(resolveRustClaimsSuppression({ repoRoot: root, rustRuntimeUsage: unprovenRust }), false);
});

test("legacy leak scanner blocks product runtime references but allows sync/admin proof lanes", () => {
  const root = makeTempRepo();
  writeFile(
    root,
    "backend/src/TerraFusion.API/Controllers/CostForgeController.cs",
    "using TerraFusion.Core.PACS; public class CostForgeController { }"
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

test("legacy boundary classifier separates active dependency from allowed categories", () => {
  const root = makeTempRepo();
  writeFile(
    root,
    "backend/src/TerraFusion.API/Controllers/CostForgeController.cs",
    [
      "using Microsoft.Data.SqlClient;",
      "public class CostForgeController {",
      "  private SqlConnection OpenLegacyConnection() => new SqlConnection();",
      "  // PACS appears here only as implementation commentary.",
      "}"
    ].join("\n")
  );
  writeFile(
    root,
    "backend/src/TerraFusion.API/Controllers/SyncController.cs",
    "public class SyncController { const string allowed = \"Harris PACS upstream provenance\"; }"
  );
  writeFile(
    root,
    "backend/tests/TerraFusion.API.Tests/BoundaryTests.cs",
    "public class BoundaryTests { const string proof = \"PACS test fixture\"; }"
  );
  writeFile(
    root,
    "frontend/apps/os-shell/src/pages/Login.tsx",
    "export function Login() { return <p>Legacy PACS terminology visible to users</p>; }"
  );
  writeFile(
    root,
    "frontend/apps/os-shell/src/ARCHIVE/OldBridge.tsx",
    "export const old = \"Harris PACS archived bridge\";"
  );

  const boundary = inspectRuntimeLegacyBoundary({ repoRoot: root });

  assert.equal(boundary.rawCount, 6);
  assert.equal(boundary.blockingActiveRuntimeDependencyCount, 1);
  assert.equal(boundary.categoryCounts.active_runtime_dependency, 1);
  assert.equal(boundary.categoryCounts.ingestion_sync_allowed, 1);
  assert.equal(boundary.categoryCounts.proof_or_test_only, 1);
  assert.equal(boundary.categoryCounts.docs_comments_labels, 1);
  assert.equal(boundary.categoryCounts.user_facing_terminology, 1);
  assert.equal(boundary.categoryCounts.archived_or_quarantined, 1);
  assert.equal(boundary.blockingFindings.every((finding) => finding.category === "active_runtime_dependency"), true);
});

test("legacy boundary classifier preserves direct dependencies while allowing sync and label-only references", () => {
  const root = makeTempRepo();
  writeFile(
    root,
    "backend/src/TerraFusion.API/Program.cs",
    [
      "using TerraFusion.Core.PACS;",
      "svc.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.Core.PACS.PacsSqlAdapter>();",
      "app.MapPost(\"/api/admin/pacs/seed\", () => Results.Accepted());",
      "return Results.Accepted(\"/api/admin/pacs/seed/status\", new { message = \"PACS seed started\" });"
    ].join("\n")
  );
  writeFile(
    root,
    "backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs",
    "public class PacsToTerraFusionSyncService { private const string Source = \"PACS import lane\"; }"
  );
  writeFile(
    root,
    "backend/src/TerraFusion.API/Controllers/CostForgeController.cs",
    [
      "public class CostForgeController {",
      "  object Describe() => new { description = \"Check PACS source quality issue\" };",
      "}"
    ].join("\n")
  );
  writeFile(
    root,
    "backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs",
    "[HttpGet(\"pacs-counts\")] public object Counts() => \"pacs proof\";"
  );

  const boundary = inspectRuntimeLegacyBoundary({ repoRoot: root });

  assert.equal(boundary.rawCount, 7);
  assert.equal(boundary.blockingActiveRuntimeDependencyCount, 2);
  assert.equal(boundary.categoryCounts.active_runtime_dependency, 2);
  assert.equal(boundary.categoryCounts.ingestion_sync_allowed, 3);
  assert.equal(boundary.categoryCounts.user_facing_terminology, 1);
  assert.equal(boundary.categoryCounts.proof_or_test_only, 1);
  assert.deepEqual(
    boundary.blockingFindings.map((finding) => finding.lineNumber),
    [1, 2]
  );
});

test("legacy boundary classifier treats production-excluded legacy controllers as quarantined", () => {
  const root = makeTempRepo();
  writeFile(
    root,
    "backend/src/TerraFusion.API/Program.cs",
    [
      "var june10ProductionExcludedControllers = builder.Environment.IsDevelopment()",
      "  ? Array.Empty<string>()",
      "  : new[] { \"PacsController\", \"ProductionPACSIntegrationController\" };"
    ].join("\n")
  );
  writeFile(
    root,
    "backend/src/TerraFusion.API/Controllers/PacsController.cs",
    [
      "using TerraFusion.Core.PACS;",
      "[Route(\"api/pacs\")]",
      "public class PacsController { }"
    ].join("\n")
  );
  writeFile(
    root,
    "backend/src/TerraFusion.API/Controllers/CostForgeController.cs",
    "using TerraFusion.Core.PACS; public class CostForgeController { }"
  );

  const boundary = inspectRuntimeLegacyBoundary({ repoRoot: root });

  assert.equal(boundary.rawCount, 3);
  assert.equal(boundary.categoryCounts.archived_or_quarantined, 2);
  assert.equal(boundary.categoryCounts.active_runtime_dependency, 1);
  assert.equal(boundary.blockingActiveRuntimeDependencyCount, 1);
  assert.equal(boundary.blockingFindings[0].filePath, "backend/src/TerraFusion.API/Controllers/CostForgeController.cs");
});

test("legacy boundary classifier blocks registered legacy services but quarantines unregistered service files", () => {
  const root = makeTempRepo();
  writeFile(
    root,
    "backend/src/TerraFusion.API/Program.cs",
    "builder.Services.AddScoped<RegisteredLegacyService>();"
  );
  writeFile(
    root,
    "backend/src/TerraFusion.API/Services/RegisteredLegacyService.cs",
    "public class RegisteredLegacyService { void Open() { using var connection = new SqlConnection(\"legacy\"); } }"
  );
  writeFile(
    root,
    "backend/src/TerraFusion.API/Services/UnregisteredLegacyService.cs",
    "public class UnregisteredLegacyService { void Open() { using var connection = new SqlConnection(\"legacy\"); } }"
  );

  const boundary = inspectRuntimeLegacyBoundary({ repoRoot: root });

  assert.equal(boundary.rawCount, 2);
  assert.equal(boundary.categoryCounts.active_runtime_dependency, 1);
  assert.equal(boundary.categoryCounts.archived_or_quarantined, 1);
  assert.equal(boundary.blockingFindings[0].filePath, "backend/src/TerraFusion.API/Services/RegisteredLegacyService.cs");
});

test("legacy boundary classifier allows standalone sync and dev-gated source adapters", () => {
  const root = makeTempRepo();
  writeFile(
    root,
    "backend/src/TerraFusion.API/Program.cs",
    [
      "if (args.Contains(\"--sync-cost-matrices-only\"))",
      "{",
      "  svc.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.Core.PACS.PacsSqlAdapter>();",
      "}",
      "var enableLegacySourceRuntimeAdapters = builder.Environment.IsDevelopment();",
      "if (enableLegacySourceRuntimeAdapters)",
      "{",
      "  builder.Services.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.API.Services.PacsEfAdapter>();",
      "}",
      "builder.Services.AddScoped<RegisteredRuntimeAdapter>();"
    ].join("\n")
  );
  writeFile(
    root,
    "backend/src/TerraFusion.API/Services/PacsEfAdapter.cs",
    "using TerraFusion.Core.PACS; public sealed class PacsEfAdapter { }"
  );
  writeFile(
    root,
    "backend/src/TerraFusion.API/Services/RegisteredRuntimeAdapter.cs",
    "using TerraFusion.Core.PACS; public sealed class RegisteredRuntimeAdapter { }"
  );

  const boundary = inspectRuntimeLegacyBoundary({ repoRoot: root });

  assert.equal(boundary.rawCount, 4);
  assert.equal(boundary.categoryCounts.ingestion_sync_allowed, 1);
  assert.equal(boundary.categoryCounts.archived_or_quarantined, 2);
  assert.equal(boundary.categoryCounts.active_runtime_dependency, 1);
  assert.equal(boundary.blockingFindings[0].filePath, "backend/src/TerraFusion.API/Services/RegisteredRuntimeAdapter.cs");
});

test("launch gate blocks only active runtime dependency legacy findings", () => {
  const report = buildJune10LaunchGateReport({
    apiBaseUrl: "http://127.0.0.1:5046",
    publicBaseUrl: "https://terrafusionmarket.com",
    endpointSmoke: endpointSmoke(),
    publicSiteSmoke: publicSiteSmoke(),
    productLoadLedger: productLoadLedger(),
    runtimeDbContentAudit: runtimeDbContentAudit(),
    rustRuntimeUsage: rustRuntimeUsage(),
    rustClaimsSuppressed: false,
    runtimeLegacyBoundary: {
      rawCount: 3,
      blockingActiveRuntimeDependencyCount: 0,
      categoryCounts: {
        active_runtime_dependency: 0,
        ingestion_sync_allowed: 1,
        proof_or_test_only: 1,
        docs_comments_labels: 1,
        archived_or_quarantined: 0,
        user_facing_terminology: 0
      },
      findings: [],
      blockingFindings: []
    }
  });

  assert.equal(report.passed, true);
  assert.equal(report.summary.activeRuntimeLegacyLeaks, 0);
  assert.equal(report.summary.rawRuntimeLegacyReferences, 3);
  assert.equal(report.checks.legacyRuntimeBoundary.categoryCounts.ingestion_sync_allowed, 1);
  assert.ok(Array.isArray(report.checks.legacyRuntimeBoundary.examplesByCategory.ingestion_sync_allowed));
  assert.ok(!report.blockers.some((blocker) => blocker.source === "legacy_runtime_boundary"));
});

test("probeJune10LaunchGate composes live endpoint and public site smoke with ledger evidence", async () => {
  const root = makeTempRepo();
  const ledgerPath = path.join(root, "generated", "truth", "terrafusion-db-product-load-ledger.json");
  const runtimeDbContentPath = path.join(root, "generated", "truth", "runtime-db-content-audit.json");
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.writeFileSync(ledgerPath, JSON.stringify(productLoadLedger(), null, 2));
  fs.writeFileSync(runtimeDbContentPath, JSON.stringify(runtimeDbContentAudit(), null, 2));

  const server = http.createServer((req, res) => {
    res.setHeader("content-type", "application/json");

    if (req.url === "/" || req.url === "/login" || req.url === "/signup" || req.url === "/marketplace") {
      res.setHeader("content-type", "text/html");
      res.end("<html><body>Marketplace governed module Provisioned access only Sign In</body></html>");
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
      res.end('{"signupMode":"provisioned_access_only","publicSignupEnabled":false,"message":"TerraFusion access is provisioned by an administrator. Public self-signup and public access requests are disabled."}');
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
      runtimeDbContentAuditPath: runtimeDbContentPath,
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
