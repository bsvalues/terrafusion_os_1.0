#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const STAGING_BASE_URL = "https://staging.terrafusionmarket.com";
const PRODUCTION_BASE_URL = "https://terrafusionmarket.com";
const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/phase10-environment-identity.latest.json"
);

function parseArgs(argv) {
  const args = argv.slice(2);
  const outIndex = args.indexOf("--out");
  return {
    outPath:
      outIndex >= 0 && args[outIndex + 1]
        ? args[outIndex + 1]
        : process.env.PHASE10_PROOF_OUT || DEFAULT_OUT_PATH,
  };
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
    status: response.status,
    ok: response.ok,
    body,
    json,
    headerMap,
  };
}

async function main() {
  const { outPath } = parseArgs(process.argv);
  const checks = [];
  const blockers = [];

  const record = (name, ok, detail, payload = null, blocker = null) => {
    checks.push({ name, ok, detail, payload, blocker });
    if (!ok && blocker) blockers.push(blocker);
  };

  const stagingHealth = await fetchJson(`${STAGING_BASE_URL}/health`);
  const stagingEnv =
    stagingHealth.json?.Environment ?? stagingHealth.json?.environment ?? null;
  record(
    "staging.public_health",
    stagingHealth.status === 200,
    `status=${stagingHealth.status}`,
    {
      headers: stagingHealth.headerMap,
      body: stagingHealth.json ?? stagingHealth.body,
    },
    stagingHealth.status === 200
      ? null
      : "Staging public health endpoint is not healthy"
  );
  record(
    "staging.environment_identity",
    stagingEnv === "Staging",
    `environment=${stagingEnv ?? "missing"}`,
    {
      expected: "Staging",
      actual: stagingEnv,
      body: stagingHealth.json ?? stagingHealth.body,
    },
    stagingEnv === "Staging"
      ? null
      : "Staging public /health environment label is not 'Staging'"
  );
  record(
    "staging.release_header",
    Boolean(stagingHealth.headerMap["x-release-sha"]),
    `x-release-sha=${stagingHealth.headerMap["x-release-sha"] ?? "missing"}`,
    stagingHealth.headerMap,
    stagingHealth.headerMap["x-release-sha"]
      ? null
      : "Staging public /health is missing X-Release-Sha"
  );

  const productionHealth = await fetchJson(`${PRODUCTION_BASE_URL}/health`);
  const productionEnv =
    productionHealth.json?.Environment ?? productionHealth.json?.environment ?? null;
  record(
    "production.public_health",
    productionHealth.status === 200,
    `status=${productionHealth.status}`,
    {
      headers: productionHealth.headerMap,
      body: productionHealth.json ?? productionHealth.body,
    },
    productionHealth.status === 200
      ? null
      : "Production public health endpoint is not healthy"
  );
  record(
    "production.environment_identity",
    productionEnv === "Production",
    `environment=${productionEnv ?? "missing"}`,
    {
      expected: "Production",
      actual: productionEnv,
      body: productionHealth.json ?? productionHealth.body,
    },
    productionEnv === "Production"
      ? null
      : "Production public /health environment label is not 'Production'"
  );
  record(
    "production.release_header",
    Boolean(productionHealth.headerMap["x-release-sha"]),
    `x-release-sha=${productionHealth.headerMap["x-release-sha"] ?? "missing"}`,
    productionHealth.headerMap,
    productionHealth.headerMap["x-release-sha"]
      ? null
      : "Production public /health is missing X-Release-Sha"
  );

  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 10 environment identity truth packet",
    decision: blockers.length === 0 ? "GO" : "NO_GO",
    checks,
    summary: {
      ok: blockers.length === 0,
      failures: checks.filter((check) => !check.ok).length,
      blockers,
      environmentIdentityTruth:
        "Staging and production must identify themselves truthfully in the public /health response body and release header surface.",
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
    scope: "Phase 10 environment identity truth packet",
    decision: "NO_GO",
    checks: [
      {
        name: "phase10.packet",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        payload: {
          stack: error instanceof Error ? error.stack : null,
        },
        blocker: "Phase 10 proof packet crashed",
      },
    ],
    summary: {
      ok: false,
      failures: 1,
      blockers: ["Phase 10 proof packet crashed"],
      environmentIdentityTruth:
        "Staging and production must identify themselves truthfully in the public /health response body and release header surface.",
    },
  };
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  console.error(error);
  process.exitCode = 1;
});
