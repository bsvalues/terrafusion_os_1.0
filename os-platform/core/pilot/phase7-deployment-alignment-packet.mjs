#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const STAGING_BASE_URL = "https://staging.terrafusionmarket.com";
const PRODUCTION_BASE_URL = "https://terrafusionmarket.com";
const PRODUCTION_EDGE_IP = "72.60.126.11";
const LOGIN_EMAIL = process.env.TF_PHASE7_EMAIL || "admin@terrafusionmarket.com";
const LOGIN_PASSWORD = process.env.TF_PHASE7_PASSWORD || "TerraFusion2026!";
const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/phase7-deployment-alignment.latest.json"
);

function commandFor(binary) {
  if (process.platform === "win32" && binary === "curl") return "curl.exe";
  if (process.platform === "win32" && binary === "dotnet") return "dotnet.exe";
  return binary;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const outIndex = args.indexOf("--out");
  return {
    outPath:
      outIndex >= 0 && args[outIndex + 1]
        ? args[outIndex + 1]
        : process.env.PHASE7_PROOF_OUT || DEFAULT_OUT_PATH,
  };
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
      process.stderr.write(chunk);
    });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

function parseCurlStatus(output) {
  const marker = "\n__STATUS__:";
  const index = output.lastIndexOf(marker);
  if (index === -1) {
    return { body: output, status: null };
  }

  return {
    body: output.slice(0, index),
    status: Number(output.slice(index + marker.length).trim()),
  };
}

async function curlRequest(
  url,
  { method = "GET", headers = {}, data = null, resolveHost = null } = {}
) {
  const args = ["--silent", "--show-error", "--location", "--write-out", "\n__STATUS__:%{http_code}"];
  if (resolveHost) {
    args.push("--resolve", `${resolveHost.host}:443:${resolveHost.ip}`);
    args.push("--resolve", `${resolveHost.host}:80:${resolveHost.ip}`);
    args.push("-k");
  }
  if (method !== "GET") {
    args.push("-X", method);
  }
  for (const [key, value] of Object.entries(headers)) {
    args.push("-H", `${key}: ${value}`);
  }
  if (data !== null) {
    args.push("-H", "Content-Type: application/json");
    args.push("--data", typeof data === "string" ? data : JSON.stringify(data));
  }
  args.push(url);

  const result = await runCommand(commandFor("curl"), args);
  const parsed = parseCurlStatus(result.stdout);
  let json = null;
  try {
    json = JSON.parse(parsed.body.trim());
  } catch {
    json = null;
  }

  return { ...result, ...parsed, json };
}

async function login(baseUrl, resolveHost = null) {
  const response = await curlRequest(`${baseUrl}/api/auth/login`, {
    method: "POST",
    data: { email: LOGIN_EMAIL, password: LOGIN_PASSWORD },
    resolveHost,
  });

  if (response.status !== 200 || !response.json?.token) {
    return { ok: false, response };
  }

  return { ok: true, token: response.json.token, response };
}

async function readFileText(target) {
  return fs.readFile(path.resolve(process.cwd(), target), "utf8");
}

async function main() {
  const { outPath } = parseArgs(process.argv);
  const checks = [];
  const blockers = [];

  const record = (name, ok, detail, payload = null, blocker = null) => {
    checks.push({ name, ok, detail, payload, blocker });
    if (!ok && blocker) blockers.push(blocker);
  };

  const evaluateCanonicalSyncTruth = (statusJson, systemsJson, countiesJson) => {
    const totalSystems = Number(statusJson?.metrics?.TotalSystems ?? 0);
    const activeCounties = Number(statusJson?.metrics?.ActiveCounties ?? 0);
    const systems = Array.isArray(systemsJson) ? systemsJson : [];
    const counties = Array.isArray(countiesJson) ? countiesJson : [];

    const canonicalSystem = systems.find(
      (system) =>
        system?.systemId === "harris_pacs_canonical" &&
        system?.systemType === "harris_pacs"
    );

    const hasLegacyFakeDefaults = systems.some((system) =>
      ["harris_pacs_12_4_7", "tyler_iasworld", "aumentum_cama"].includes(system?.systemId)
    );

    const bentonCounty = counties.find(
      (county) =>
        county?.countyName === "Benton" &&
        county?.legacySystemId === "harris_pacs_canonical"
    );

    return {
      totalSystems,
      activeCounties,
      canonicalSystemPresent: !!canonicalSystem,
      bentonCountyPresent: !!bentonCounty,
      hasLegacyFakeDefaults,
      ok:
        totalSystems > 0 &&
        activeCounties > 0 &&
        !!canonicalSystem &&
        !!bentonCounty &&
        !hasLegacyFakeDefaults,
    };
  };

  const runtimeTruth = await runCommand(commandFor("dotnet"), [
    "test",
    "backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj",
    "--filter",
    "TerraFusionSyncRuntimeStateTests",
    "-v",
    "minimal",
  ]);
  record(
    "local.phase7.runtime_truth",
    runtimeTruth.code === 0,
    `exit=${runtimeTruth.code}`,
    { stdout: runtimeTruth.stdout, stderr: runtimeTruth.stderr },
    runtimeTruth.code === 0 ? null : "Phase 7 runtime-truth tests failed"
  );

  const prodTemplate = await readFileText("ops/prod/secrets.prod.template.env");
  const localTemplate = await readFileText("ops/prod/secrets_template.env");
  const requiredKeys = [
    "ConnectionStrings__PacsConnection",
    "ConnectionStrings__PacsSalesConnection",
    "HarrisPACS__Enabled",
  ];
  const missingKeys = requiredKeys.filter(
    (key) => !prodTemplate.includes(key) || !localTemplate.includes(key)
  );
  record(
    "local.phase7.deploy_contract",
    missingKeys.length === 0,
    missingKeys.length === 0 ? "prod templates declare PACS deployment contract" : `missing keys: ${missingKeys.join(", ")}`,
    { requiredKeys, missingKeys },
    missingKeys.length === 0 ? null : "Phase 7 deploy contract does not declare canonical Benton PACS settings"
  );

  const stagingLogin = await login(STAGING_BASE_URL);
  record(
    "staging.auth.login",
    stagingLogin.ok,
    stagingLogin.ok ? LOGIN_EMAIL : `status=${stagingLogin.response.status}`,
    stagingLogin.response.json ?? stagingLogin.response.body,
    stagingLogin.ok ? null : "Unable to authenticate against staging for Phase 7 packet"
  );

  if (stagingLogin.ok) {
    const stagingHeaders = { Authorization: `Bearer ${stagingLogin.token}` };
    const stagingStatus = await curlRequest(`${STAGING_BASE_URL}/api/TerraFusionSync/status`, { headers: stagingHeaders });
    const stagingSystems = await curlRequest(`${STAGING_BASE_URL}/api/TerraFusionSync/systems`, { headers: stagingHeaders });
    const stagingCounties = await curlRequest(`${STAGING_BASE_URL}/api/TerraFusionSync/counties`, { headers: stagingHeaders });
    const evaluation = evaluateCanonicalSyncTruth(
      stagingStatus.json,
      stagingSystems.json,
      stagingCounties.json
    );
    record(
      "staging.sync.truth",
      stagingStatus.status === 200 && evaluation.ok,
      `systems=${evaluation.totalSystems}, counties=${evaluation.activeCounties}, canonicalSystem=${evaluation.canonicalSystemPresent}, bentonCounty=${evaluation.bentonCountyPresent}, fakeDefaults=${evaluation.hasLegacyFakeDefaults}`,
      {
        status: stagingStatus.json,
        systems: stagingSystems.json,
        counties: stagingCounties.json,
      },
      stagingStatus.status === 200 && evaluation.ok
        ? null
        : "Staging deployed runtime is not advertising the canonical Benton sync spine"
    );
  }

  const productionLogin = await login(PRODUCTION_BASE_URL, {
    host: "terrafusionmarket.com",
    ip: PRODUCTION_EDGE_IP,
  });
  record(
    "production.auth.login",
    productionLogin.ok,
    productionLogin.ok ? LOGIN_EMAIL : `status=${productionLogin.response.status}`,
    productionLogin.response.json ?? productionLogin.response.body,
    productionLogin.ok ? null : "Unable to authenticate against production for Phase 7 packet"
  );

  if (productionLogin.ok) {
    const productionHeaders = { Authorization: `Bearer ${productionLogin.token}` };
    const resolveHost = { host: "terrafusionmarket.com", ip: PRODUCTION_EDGE_IP };
    const productionStatus = await curlRequest(`${PRODUCTION_BASE_URL}/api/TerraFusionSync/status`, {
      headers: productionHeaders,
      resolveHost,
    });
    const productionSystems = await curlRequest(`${PRODUCTION_BASE_URL}/api/TerraFusionSync/systems`, {
      headers: productionHeaders,
      resolveHost,
    });
    const productionCounties = await curlRequest(`${PRODUCTION_BASE_URL}/api/TerraFusionSync/counties`, {
      headers: productionHeaders,
      resolveHost,
    });
    const evaluation = evaluateCanonicalSyncTruth(
      productionStatus.json,
      productionSystems.json,
      productionCounties.json
    );
    record(
      "production.sync.truth",
      productionStatus.status === 200 && evaluation.ok,
      `systems=${evaluation.totalSystems}, counties=${evaluation.activeCounties}, canonicalSystem=${evaluation.canonicalSystemPresent}, bentonCounty=${evaluation.bentonCountyPresent}, fakeDefaults=${evaluation.hasLegacyFakeDefaults}`,
      {
        status: productionStatus.json,
        systems: productionSystems.json,
        counties: productionCounties.json,
      },
      productionStatus.status === 200 && evaluation.ok
        ? null
        : "Production deployed runtime is not advertising the canonical Benton sync spine"
    );
  }

  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 7 deployment alignment packet for Benton sync/runtime truth",
    decision: blockers.length === 0 ? "GO" : "NO_GO",
    checks,
    summary: {
      ok: blockers.length === 0,
      failures: checks.filter((check) => !check.ok).length,
      blockers,
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
    scope: "Phase 7 deployment alignment packet for Benton sync/runtime truth",
    decision: "NO_GO",
    checks: [
      {
        name: "phase7.packet",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        payload: { stack: error instanceof Error ? error.stack : null },
        blocker: "Phase 7 deployment alignment packet failed to execute",
      },
    ],
    summary: {
      ok: false,
      failures: 1,
      blockers: ["Phase 7 deployment alignment packet failed to execute"],
    },
  };
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  process.exitCode = 1;
});
