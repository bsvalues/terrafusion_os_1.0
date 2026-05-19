#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildJune10ProductionReadinessAudit } from "./june10-production-readiness-audit.mjs";

function sampleInputs(overrides = {}) {
  return {
    readiness: {
      status: "FAIL",
      shipBlockers: [{ source: "productLoadLedger", message: "ProductLoadReceipts table is missing." }],
      warnings: new Array(3).fill(null).map((_, index) => ({ message: `warning ${index}` }))
    },
    redTeam: {
      verdict: "RED",
      summary: { criticalAttacks: 2, shipBlockers: 23 },
      bannedNarratives: ["All data flows end to end"]
    },
    productLoadLedger: {
      passed: false,
      summary: {
        tablesChecked: 10,
        lineageProven: 0,
        rowsExistLineageUnproven: 5,
        emptyTables: 5
      },
      rows: [
        {
          tableName: "canonical_tf.tf_parcel",
          rowCount: 3197521,
          lineageStatus: "rows_exist_lineage_unproven",
          blockers: ["Rows exist but no product load receipt proves lineage."]
        }
      ]
    },
    runtimeDbIdentity: {
      passed: true,
      apiBaseUrl: "http://127.0.0.1:5050",
      provider: "Npgsql.EntityFrameworkCore.PostgreSQL",
      database: "terrafusion"
    },
    publicSite: {
      baseUrl: "https://terrafusionmarket.com",
      routes: [
        {
          path: "/signup",
          status: 200,
          bodyText: "Your session has expired. Public self-signup is disabled. Sign In",
          screenshotPath: "artifacts/audit/terrafusionmarket-signup.png"
        },
        {
          path: "/marketplace",
          status: 200,
          bodyText: "Your session has expired. Provisioned access only. Sign In",
          screenshotPath: "artifacts/audit/terrafusionmarket-marketplace.png"
        }
      ],
      apiProbes: [{ path: "/api/health", status: 401 }]
    },
    endpointContract: {
      localRuntimeProbes: [
        { url: "http://localhost:5046/health", status: null, error: "ECONNREFUSED" },
        { url: "http://localhost:5056/api/counties/benton/parcels?limit=5", status: null, error: "ECONNREFUSED" }
      ],
      contractMismatches: [
        {
          surface: "marketplace",
          frontendEndpoint: "/api/marketplace/plugins",
          backendEvidence: "not_proven"
        }
      ]
    },
    rust: {
      crates: [
        "packages/terrabuild/kernels/terraforge.kernel.cost/src/main.rs",
        "packages/terrabuild/kernels/terraforge.kernel.valuation/src/main.rs"
      ],
      runtimeIntegrations: [
        {
          endpoint: "/api/Valuation/kernel-cost-approach",
          filePath: "backend/src/TerraFusion.API/Controllers/ValuationController.cs",
          liveProven: false
        }
      ],
      normalWorkflowStubs: [
        {
          endpoint: "/api/Valuation/approaches/{parcelId}",
          status: "pending-implementation"
        }
      ]
    },
    ...overrides
  };
}

test("marks production readiness not_ready when readiness, lineage, public UX, and runtime probes fail", () => {
  const report = buildJune10ProductionReadinessAudit(sampleInputs());

  assert.equal(report.verdict, "not_ready");
  assert.equal(report.summary.shipBlockers, 7);
  assert.ok(report.blockers.some((blocker) => blocker.source === "readiness"));
  assert.ok(report.blockers.some((blocker) => blocker.source === "product_load_lineage"));
  assert.ok(report.blockers.some((blocker) => blocker.source === "public_site_signup"));
  assert.ok(report.blockers.some((blocker) => blocker.source === "runtime_endpoint"));
  assert.ok(report.blockers.some((blocker) => blocker.source === "rust_runtime"));
});

test("allows only partial readiness when proof is mostly green but Rust deployment is unproven", () => {
  const report = buildJune10ProductionReadinessAudit(
    sampleInputs({
      readiness: { status: "PASS", shipBlockers: [], warnings: [] },
      redTeam: { verdict: "YELLOW", summary: { criticalAttacks: 0, shipBlockers: 0 }, bannedNarratives: [] },
      productLoadLedger: {
        passed: true,
        summary: { tablesChecked: 10, lineageProven: 10, rowsExistLineageUnproven: 0, emptyTables: 0 },
        rows: []
      },
      publicSite: {
        baseUrl: "https://terrafusionmarket.com",
        routes: [
          { path: "/signup", status: 200, bodyText: "Request provisioned access" },
          { path: "/marketplace", status: 200, bodyText: "Marketplace registry" }
        ],
        apiProbes: [{ path: "/api/health", status: 200 }]
      },
      endpointContract: {
        localRuntimeProbes: [{ url: "http://localhost:5046/health", status: 200 }],
        contractMismatches: []
      },
      rust: {
        crates: ["packages/terrabuild/kernels/terraforge.kernel.cost/src/main.rs"],
        runtimeIntegrations: [{ endpoint: "/api/Valuation/kernel-cost-approach", liveProven: false }],
        normalWorkflowStubs: []
      }
    })
  );

  assert.equal(report.verdict, "partially_ready");
  assert.equal(report.summary.shipBlockers, 0);
  assert.ok(report.warnings.some((warning) => warning.source === "rust_runtime"));
});

test("uses public-site smoke failure as the canonical public UX blocker", () => {
  const report = buildJune10ProductionReadinessAudit(
    sampleInputs({
      publicSite: {
        baseUrl: "https://terrafusionmarket.com",
        passed: false,
        summary: { blockers: 1, warnings: 1 },
        blockers: [
          {
            source: "access_policy",
            message: "Public signup is disabled and no access-request channel is exposed by /api/auth/access-policy."
          }
        ],
        routes: [],
        apiProbes: []
      }
    })
  );

  assert.ok(report.blockers.some((blocker) => blocker.source === "public_site"));
  assert.ok(report.blockers.some((blocker) => blocker.evidence?.includes("access_policy")));
});

test("uses fresher endpoint smoke DB identity when standalone runtime DB identity evidence is stale", () => {
  const report = buildJune10ProductionReadinessAudit(
    sampleInputs({
      runtimeDbIdentity: {
        generatedAt: "2026-05-19T19:20:10.231Z",
        passed: false,
        identity: {
          apiBaseUrl: "http://localhost:5046",
          database: "terrafusion",
          provider: "Npgsql.EntityFrameworkCore.PostgreSQL"
        },
        blockers: ["Runtime Properties count 128788 does not match configured Benton parcel count 89447."]
      },
      endpointContract: {
        generatedAtUtc: "2026-05-19T22:01:32.192Z",
        localRuntimeProbes: [
          {
            id: "runtime_db_identity",
            path: "/api/runtime/truth/db-identity",
            status: 200,
            bodyText: JSON.stringify({
              apiBaseUrl: "http://localhost:5046",
              provider: "Npgsql.EntityFrameworkCore.PostgreSQL",
              database: "terrafusion",
              passed: true,
              blockers: []
            })
          }
        ],
        contractMismatches: []
      }
    })
  );

  assert.equal(report.summary.runtimeDbIdentityPassed, true);
  assert.equal(report.summary.runtimeDbIdentitySource, "endpoint_contract");
  assert.equal(report.blockers.some((blocker) => blocker.source === "runtime_db_identity"), false);
});

test("omits endpoint repair actions from fix order when endpoint probes and contracts are green", () => {
  const report = buildJune10ProductionReadinessAudit(
    sampleInputs({
      endpointContract: {
        localRuntimeProbes: [
          { id: "health", url: "http://localhost:5046/health", status: 200 },
          { id: "runtime_db_identity", url: "http://localhost:5046/api/runtime/truth/db-identity", status: 200 }
        ],
        contractMismatches: []
      }
    })
  );

  assert.equal(report.summary.failedRuntimeProbes, 0);
  assert.equal(report.summary.contractMismatches, 0);
  assert.equal(report.requiredFixOrder.some((item) => item.includes("Restore live runtime endpoint probes")), false);
  assert.equal(report.requiredFixOrder.some((item) => item.includes("Resolve frontend/backend endpoint contract mismatches")), false);
});

test("CLI writes production readiness audit JSON and Markdown reports", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-june10-prod-audit-"));
  const inputs = sampleInputs();
  const paths = {
    readiness: path.join(tmp, "readiness.json"),
    redTeam: path.join(tmp, "red-team.json"),
    productLoadLedger: path.join(tmp, "product-load-ledger.json"),
    runtimeDbIdentity: path.join(tmp, "runtime-db-identity.json"),
    publicSite: path.join(tmp, "public-site.json"),
    endpointContract: path.join(tmp, "endpoint-contract.json"),
    rust: path.join(tmp, "rust.json"),
    outJson: path.join(tmp, "audit.json"),
    outMd: path.join(tmp, "audit.md")
  };

  fs.writeFileSync(paths.readiness, `${JSON.stringify(inputs.readiness, null, 2)}\n`);
  fs.writeFileSync(paths.redTeam, `${JSON.stringify(inputs.redTeam, null, 2)}\n`);
  fs.writeFileSync(paths.productLoadLedger, `${JSON.stringify(inputs.productLoadLedger, null, 2)}\n`);
  fs.writeFileSync(paths.runtimeDbIdentity, `${JSON.stringify(inputs.runtimeDbIdentity, null, 2)}\n`);
  fs.writeFileSync(paths.publicSite, `${JSON.stringify(inputs.publicSite, null, 2)}\n`);
  fs.writeFileSync(paths.endpointContract, `${JSON.stringify(inputs.endpointContract, null, 2)}\n`);
  fs.writeFileSync(paths.rust, `${JSON.stringify(inputs.rust, null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-production-readiness-audit.mjs",
      "--readiness",
      paths.readiness,
      "--red-team",
      paths.redTeam,
      "--product-load-ledger",
      paths.productLoadLedger,
      "--runtime-db-identity",
      paths.runtimeDbIdentity,
      "--public-site",
      paths.publicSite,
      "--endpoint-contract",
      paths.endpointContract,
      "--rust",
      paths.rust,
      "--out-json",
      paths.outJson,
      "--out-md",
      paths.outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(paths.outJson, "utf8"));
  const markdown = fs.readFileSync(paths.outMd, "utf8");

  assert.equal(report.verdict, "not_ready");
  assert.match(markdown, /June 10 Production Readiness Audit/);
  assert.match(markdown, /terrafusionmarket.com signup is not a usable signup or access-request flow/);
});
