#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const LOCAL_BASE_URL =
  process.env.TF_API_BASE_URL || `http://localhost:${process.env.TF_API_PORT || "5000"}`;
const STAGING_BASE_URL = "https://staging.terrafusionmarket.com";
const PRODUCTION_BASE_URL = "https://terrafusionmarket.com";
const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/phase12-pacs-connected-runtime.latest.json"
);

function commandFor(binary) {
  if (process.platform === "win32" && binary === "pnpm") return "pnpm.cmd";
  return binary;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const outIndex = args.indexOf("--out");
  return {
    outPath:
      outIndex >= 0 && args[outIndex + 1]
        ? args[outIndex + 1]
        : process.env.PHASE12_PROOF_OUT || DEFAULT_OUT_PATH,
  };
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const useCmdShim =
      process.platform === "win32" && /\.(cmd|bat)$/i.test(command);
    const child = spawn(
      useCmdShim ? "cmd.exe" : command,
      useCmdShim ? ["/d", "/s", "/c", command, ...args] : args,
      {
        cwd: process.cwd(),
        env: process.env,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        ...options,
      }
    );

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

async function readText(relativePath) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), "utf8");
}

async function readJson(relativePath) {
  return JSON.parse(
    await fs.readFile(path.resolve(process.cwd(), relativePath), "utf8")
  );
}

function includesAll(content, needles) {
  return needles.filter((needle) => !content.includes(needle));
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    redirect: "follow",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    json,
    body: text,
  };
}

async function getJson(url, token) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    json,
    body: text,
  };
}

function extractSyncStatusPayload(payload) {
  if (payload && typeof payload === "object" && payload.data && typeof payload.data === "object") {
    return payload.data;
  }

  return payload;
}

async function login(baseUrl, { email, password }) {
  const loginResponse = await postJson(`${baseUrl}/api/auth/login`, {
    email,
    password,
  });

  return {
    ok: loginResponse.ok && Boolean(loginResponse.json?.token),
    status: loginResponse.status,
    token: loginResponse.json?.token ?? null,
    payload: loginResponse.json ?? loginResponse.body,
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

  const bentonProof = await runCommand(commandFor("pnpm"), [
    "run",
    "proof:benton:sync",
  ]);
  record(
    "local.benton_sync_proof",
    bentonProof.code === 0,
    `exit=${bentonProof.code}`,
    { stdout: bentonProof.stdout, stderr: bentonProof.stderr },
    bentonProof.code === 0
      ? null
      : "Local Benton sync proof failed on the PACS-connected runtime"
  );

  const bentonEvidence = await readJson(
    "os-platform/core/pilot/evidence/benton-sync-proof.latest.json"
  );
  record(
    "local.benton_sync_evidence",
    bentonEvidence?.summary?.ok === true,
    bentonEvidence?.summary?.ok === true
      ? "Benton sync evidence reports success"
      : "Benton sync evidence reports failure",
    bentonEvidence,
    bentonEvidence?.summary?.ok === true
      ? null
      : "Benton sync evidence is not successful"
  );

  const appsettingsDevelopment = await readText(
    "backend/src/TerraFusion.API/appsettings.Development.json"
  );
  const missingDevelopmentConnections = includesAll(appsettingsDevelopment, [
    'Database=pacs_oltp',
    'Database=pacs_golive',
  ]);
  record(
    "local.runtime.connections",
    missingDevelopmentConnections.length === 0,
    missingDevelopmentConnections.length === 0
      ? "Development runtime points parcel truth to pacs_oltp and sales truth to pacs_golive"
      : `missing connection targets: ${missingDevelopmentConnections.join(", ")}`,
    { missingDevelopmentConnections },
    missingDevelopmentConnections.length === 0
      ? null
      : "Local PACS-connected runtime config does not declare both PACS source databases"
  );

  const localLogin = await login(LOCAL_BASE_URL, {
    email: process.env.TF_PILOT_EMAIL || "admin@gov.",
    password: process.env.TF_PILOT_PASSWORD || "TerraFusion2026!",
  });
  record(
    "local.runtime.login",
    localLogin.ok,
    localLogin.ok ? "local PACS-connected runtime login succeeded" : `status=${localLogin.status}`,
    localLogin.payload,
    localLogin.ok ? null : "Local PACS-connected runtime login failed"
  );

  if (localLogin.ok) {
    const localHealth = await getJson(`${LOCAL_BASE_URL}/health`, localLogin.token);
    record(
      "local.runtime.health",
      localHealth.status === 200 && localHealth.json?.environment === "Development",
      `status=${localHealth.status}, environment=${localHealth.json?.environment ?? "unknown"}`,
      localHealth.json ?? localHealth.body,
      localHealth.status === 200 && localHealth.json?.environment === "Development"
        ? null
        : "Local PACS-connected runtime health is not reporting Development"
    );

    const localStatus = await getJson(
      `${LOCAL_BASE_URL}/api/TerraFusionSync/status`,
      localLogin.token
    );
    const localStatusPayload = extractSyncStatusPayload(localStatus.json);
    const localSystems = Number(localStatusPayload?.metrics?.TotalSystems ?? -1);
    const localCounties = Number(localStatusPayload?.metrics?.ActiveCounties ?? -1);
    record(
      "local.runtime.sync_status",
      localStatus.status === 200 && localSystems >= 1 && localCounties >= 1,
      `status=${localStatus.status}, systems=${localSystems}, counties=${localCounties}`,
      localStatusPayload ?? localStatus.body,
      localStatus.status === 200 && localSystems >= 1 && localCounties >= 1
        ? null
        : "Local PACS-connected runtime is not advertising an active sync/counties lane"
    );
  }

  const remoteCredentials = {
    email: process.env.TF_PHASE12_EMAIL || process.env.TF_PHASE8_EMAIL || "admin@terrafusionmarket.com",
    password:
      process.env.TF_PHASE12_PASSWORD || process.env.TF_PHASE8_PASSWORD || "TerraFusion2026!",
  };

  for (const env of [
    { name: "staging", baseUrl: STAGING_BASE_URL },
    { name: "production", baseUrl: PRODUCTION_BASE_URL },
  ]) {
    const remoteLogin = await login(env.baseUrl, remoteCredentials);
    record(
      `${env.name}.runtime.login`,
      remoteLogin.ok,
      remoteLogin.ok ? "login succeeded" : `status=${remoteLogin.status}`,
      remoteLogin.payload,
      remoteLogin.ok ? null : `${env.name} snapshot runtime login failed`
    );

    if (!remoteLogin.ok) continue;

    const statusResponse = await getJson(
      `${env.baseUrl}/api/TerraFusionSync/status`,
      remoteLogin.token
    );
    const systemsResponse = await getJson(
      `${env.baseUrl}/api/TerraFusionSync/systems`,
      remoteLogin.token
    );
    const countiesResponse = await getJson(
      `${env.baseUrl}/api/TerraFusionSync/counties`,
      remoteLogin.token
    );

    const statusPayload = extractSyncStatusPayload(statusResponse.json);
    const totalSystems = Number(statusPayload?.metrics?.TotalSystems ?? -1);
    const activeCounties = Number(statusPayload?.metrics?.ActiveCounties ?? -1);
    const systems = Array.isArray(systemsResponse.json) ? systemsResponse.json : [];
    const counties = Array.isArray(countiesResponse.json) ? countiesResponse.json : [];

    record(
      `${env.name}.runtime.snapshot_status`,
      statusResponse.status === 200 && totalSystems === 0 && activeCounties === 0,
      `status=${statusResponse.status}, systems=${totalSystems}, counties=${activeCounties}`,
      statusPayload ?? statusResponse.body,
      statusResponse.status === 200 && totalSystems === 0 && activeCounties === 0
        ? null
        : `${env.name} runtime is advertising PACS-connected sync instead of snapshot-only role`
    );

    record(
      `${env.name}.runtime.snapshot_lists`,
      systemsResponse.status === 200 &&
        countiesResponse.status === 200 &&
        systems.length === 0 &&
        counties.length === 0,
      `systems=${systems.length}, counties=${counties.length}`,
      {
        systemsStatus: systemsResponse.status,
        countiesStatus: countiesResponse.status,
        systems,
        counties,
      },
      systemsResponse.status === 200 &&
        countiesResponse.status === 200 &&
        systems.length === 0 &&
        counties.length === 0
        ? null
        : `${env.name} snapshot runtime still exposes active sync systems or counties`
    );
  }

  const hostingerCanon = await readText(
    "os-platform/core/pilot/ops/hostinger-control-plane.md"
  );
  const phase12Doc = await readText(
    "os-platform/core/pilot/ops/phase12-pacs-connected-runtime-track.md"
  );

  const missingHostingerCanon = includesAll(hostingerCanon, [
    "PACS-connected runtime remains local/canonical or separate SQL-reachable infrastructure.",
    "Hostinger staging and production continue to serve Benton operational snapshots only.",
  ]);
  record(
    "hostinger.phase12_runtime_role_canon",
    missingHostingerCanon.length === 0,
    missingHostingerCanon.length === 0
      ? "Hostinger control-plane canon records the PACS-connected runtime split"
      : `missing lines: ${missingHostingerCanon.join(", ")}`,
    { missingHostingerCanon },
    missingHostingerCanon.length === 0
      ? null
      : "Hostinger control-plane canon is missing the Phase 12 runtime-role split"
  );

  const missingPhase12Doc = includesAll(phase12Doc, [
    "Canonical PACS-connected runtime",
    "Hostinger snapshot runtime",
    "This phase does not make Hostinger PACS-connected.",
  ]);
  record(
    "phase12.doc.runtime_track",
    missingPhase12Doc.length === 0,
    missingPhase12Doc.length === 0
      ? "Phase 12 doc records the PACS-connected runtime track and boundaries"
      : `missing lines: ${missingPhase12Doc.join(", ")}`,
    { missingPhase12Doc },
    missingPhase12Doc.length === 0
      ? null
      : "Phase 12 runtime-track doc is incomplete"
  );

  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 12 PACS-connected runtime track packet",
    decision: blockers.length === 0 ? "GO" : "NO_GO",
    checks,
    summary: {
      ok: blockers.length === 0,
      failures: checks.filter((check) => !check.ok).length,
      blockers,
      runtimeTrackDecision:
        "Local/canonical Benton runtime is PACS-connected for sync/conversion; Hostinger staging and production remain snapshot-only operator runtimes.",
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
    scope: "Phase 12 PACS-connected runtime track packet",
    decision: "NO_GO",
    checks: [
      {
        name: "phase12.packet",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        payload: { stack: error instanceof Error ? error.stack : null },
        blocker: "Phase 12 PACS-connected runtime packet failed to execute",
      },
    ],
    summary: {
      ok: false,
      failures: 1,
      blockers: ["Phase 12 PACS-connected runtime packet failed to execute"],
      runtimeTrackDecision:
        "Local/canonical Benton runtime is PACS-connected for sync/conversion; Hostinger staging and production remain snapshot-only operator runtimes.",
    },
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  process.exitCode = 1;
});
