#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const STAGING_BASE_URL = "https://staging.terrafusionmarket.com";
const PRODUCTION_BASE_URL = "https://terrafusionmarket.com";
const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/phase11-deployment-contract.latest.json"
);

function parseArgs(argv) {
  const args = argv.slice(2);
  const outIndex = args.indexOf("--out");
  return {
    outPath:
      outIndex >= 0 && args[outIndex + 1]
        ? args[outIndex + 1]
        : process.env.PHASE11_PROOF_OUT || DEFAULT_OUT_PATH,
  };
}

async function readText(relativePath) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), "utf8");
}

async function fetchJson(url) {
  const response = await fetch(url, { redirect: "follow" });
  const body = await response.text();

  let json = null;
  try {
    json = body ? JSON.parse(body) : null;
  } catch {
    json = null;
  }

  const headerMap = {};
  for (const [name, value] of response.headers.entries()) {
    headerMap[name.toLowerCase()] = value;
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
    json,
    headerMap,
  };
}

function includesAll(content, needles) {
  return needles.filter((needle) => !content.includes(needle));
}

async function main() {
  const { outPath } = parseArgs(process.argv);
  const checks = [];
  const blockers = [];

  const record = (name, ok, detail, payload = null, blocker = null) => {
    checks.push({ name, ok, detail, payload, blocker });
    if (!ok && blocker) blockers.push(blocker);
  };

  const releaseLane = await readText(".github/workflows/release-lane.yml");
  const rollbackStaging = await readText(".github/workflows/rollback-staging.yml");
  const rollbackProduction = await readText(".github/workflows/rollback-production.yml");
  const phase11Doc = await readText(
    "os-platform/core/pilot/ops/phase11-deployment-contract-hardening.md"
  );
  const hostingerCanon = await readText(
    "os-platform/core/pilot/ops/hostinger-control-plane.md"
  );

  const workflowResolveViolations = [
    [".github/workflows/release-lane.yml", releaseLane],
    [".github/workflows/rollback-staging.yml", rollbackStaging],
    [".github/workflows/rollback-production.yml", rollbackProduction],
  ]
    .filter(([, content]) => content.includes("--resolve") || content.includes("health_mode=\"resolve\""))
    .map(([file]) => file);

  record(
    "workflows.no_resolve_fallback",
    workflowResolveViolations.length === 0,
    workflowResolveViolations.length === 0
      ? "release and rollback workflows no longer accept IP-resolve fallback"
      : `resolve fallback still present in: ${workflowResolveViolations.join(", ")}`,
    { workflowResolveViolations },
    workflowResolveViolations.length === 0
      ? null
      : "Deploy/rollback workflows still accept resolve fallback instead of public DNS truth"
  );

  const dnsPreflightMissing = [
    [".github/workflows/release-lane.yml", releaseLane],
    [".github/workflows/rollback-staging.yml", rollbackStaging],
    [".github/workflows/rollback-production.yml", rollbackProduction],
  ]
    .filter(([, content]) => !content.includes("nslookup \"$PUBLIC_HOST\""))
    .map(([file]) => file);

  record(
    "workflows.require_public_dns",
    dnsPreflightMissing.length === 0,
    dnsPreflightMissing.length === 0
      ? "release and rollback workflows require public DNS preflight"
      : `missing DNS preflight in: ${dnsPreflightMissing.join(", ")}`,
    { dnsPreflightMissing },
    dnsPreflightMissing.length === 0
      ? null
      : "Deploy/rollback workflows do not require public DNS to resolve before proceeding"
  );

  const evidenceRequirements = includesAll(releaseLane, [
    "aspnetcore_environment=${ASPNETCORE_ENV_LABEL}",
    "\"aspnetcoreEnvironment\": \"${ASPNETCORE_ENV_LABEL}\"",
  ]);
  record(
    "release_lane.evidence_fields",
    evidenceRequirements.length === 0,
    evidenceRequirements.length === 0
      ? "release-lane evidence records ASPNETCORE environment identity"
      : `missing evidence fields: ${evidenceRequirements.join(", ")}`,
    { missing: evidenceRequirements },
    evidenceRequirements.length === 0
      ? null
      : "Release evidence is missing ASPNETCORE environment identity"
  );

  const stagingOverlayMissing = includesAll(releaseLane, [
    "runtime/config/appsettings.Staging.json",
    "./config/appsettings.Staging.json:/app/appsettings.Staging.json:ro",
  ]);
  record(
    "release_lane.staging_overlay",
    stagingOverlayMissing.length === 0,
    stagingOverlayMissing.length === 0
      ? "release-lane mounts a valid staging config overlay"
      : `missing staging overlay wiring: ${stagingOverlayMissing.join(", ")}`,
    { missing: stagingOverlayMissing },
    stagingOverlayMissing.length === 0
      ? null
      : "Release lane does not mount a valid staging config overlay"
  );

  const rollbackStagingMissing = includesAll(rollbackStaging, [
    "config/appsettings.Staging.json",
    "./config/appsettings.Staging.json:/app/appsettings.Staging.json:ro",
  ]);
  record(
    "rollback_staging.staging_overlay",
    rollbackStagingMissing.length === 0,
    rollbackStagingMissing.length === 0
      ? "rollback-staging recreates and mounts the staging config overlay"
      : `missing rollback staging overlay wiring: ${rollbackStagingMissing.join(", ")}`,
    { missing: rollbackStagingMissing },
    rollbackStagingMissing.length === 0
      ? null
      : "rollback-staging does not preserve a valid staging config overlay"
  );

  const phase11DocMissing = includesAll(phase11Doc, [
    "public DNS truth is mandatory",
    "IP-resolve fallback is no longer an acceptable success mode",
    "staging needs a valid `appsettings.Staging.json` overlay",
  ]);
  record(
    "phase11.doc_truth",
    phase11DocMissing.length === 0,
    phase11DocMissing.length === 0
      ? "Phase 11 doc records the hardened deploy contract"
      : `missing doc lines: ${phase11DocMissing.join(", ")}`,
    { missing: phase11DocMissing },
    phase11DocMissing.length === 0
      ? null
      : "Phase 11 doc does not record the hardened deploy contract"
  );

  const hostingerMissing = includesAll(hostingerCanon, [
    "Environment identity truth is a separate gate from runtime health",
    "Staging also requires a mounted valid `/app/appsettings.Staging.json` overlay",
  ]);
  record(
    "hostinger.phase10_truth_canon",
    hostingerMissing.length === 0,
    hostingerMissing.length === 0
      ? "Hostinger control-plane canon records environment identity truth"
      : `missing control-plane lines: ${hostingerMissing.join(", ")}`,
    { missing: hostingerMissing },
    hostingerMissing.length === 0
      ? null
      : "Hostinger control-plane canon is missing Phase 10/11 contract truth"
  );

  const stagingHealth = await fetchJson(`${STAGING_BASE_URL}/health`);
  const productionHealth = await fetchJson(`${PRODUCTION_BASE_URL}/health`);

  record(
    "public_health.direct_dns",
    stagingHealth.status === 200 && productionHealth.status === 200,
    `staging=${stagingHealth.status}, production=${productionHealth.status}`,
    {
      staging: stagingHealth.json ?? stagingHealth.body,
      production: productionHealth.json ?? productionHealth.body,
    },
    stagingHealth.status === 200 && productionHealth.status === 200
      ? null
      : "Public health does not pass directly through public DNS"
  );

  record(
    "public_release_headers.present",
    Boolean(stagingHealth.headerMap["x-release-sha"]) &&
      Boolean(productionHealth.headerMap["x-release-sha"]) &&
      stagingHealth.headerMap["x-release-environment"] === "staging" &&
      productionHealth.headerMap["x-release-environment"] === "production",
    `stagingEnv=${stagingHealth.headerMap["x-release-environment"] ?? "missing"}, productionEnv=${productionHealth.headerMap["x-release-environment"] ?? "missing"}`,
    {
      stagingHeaders: stagingHealth.headerMap,
      productionHeaders: productionHealth.headerMap,
    },
    Boolean(stagingHealth.headerMap["x-release-sha"]) &&
      Boolean(productionHealth.headerMap["x-release-sha"]) &&
      stagingHealth.headerMap["x-release-environment"] === "staging" &&
      productionHealth.headerMap["x-release-environment"] === "production"
      ? null
      : "Public release headers are missing or inconsistent with environment truth"
  );

  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 11 deployment contract hardening packet",
    decision: blockers.length === 0 ? "GO" : "NO_GO",
    checks,
    summary: {
      ok: blockers.length === 0,
      failures: checks.filter((check) => !check.ok).length,
      blockers,
      deploymentContract:
        "Deploy and rollback workflows must require public DNS truth, forbid resolve fallback, preserve environment identity, and keep staging config overlays valid.",
    },
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");

  if (blockers.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  const outPath = parseArgs(process.argv).outPath;
  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 11 deployment contract hardening packet",
    decision: "NO_GO",
    checks: [
      {
        name: "phase11.packet",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        payload: {
          stack: error instanceof Error ? error.stack : null,
        },
        blocker: "Phase 11 proof packet crashed",
      },
    ],
    summary: {
      ok: false,
      failures: 1,
      blockers: ["Phase 11 proof packet crashed"],
      deploymentContract:
        "Deploy and rollback workflows must require public DNS truth, forbid resolve fallback, preserve environment identity, and keep staging config overlays valid.",
    },
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  console.error(error);
  process.exitCode = 1;
});
