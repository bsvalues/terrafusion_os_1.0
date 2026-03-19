#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const LOCAL_API_BASE_URL = process.env.TF_API_BASE_URL || `http://localhost:${process.env.TF_API_PORT || "5046"}`;
const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/phase18-pacs-runtime-productization.latest.json"
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
        : process.env.PHASE18_PROOF_OUT || DEFAULT_OUT_PATH,
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
  return JSON.parse(await readText(relativePath));
}

function includesAll(content, needles) {
  return needles.filter((needle) => !content.includes(needle));
}

async function fetchJson(url, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(url, {
    redirect: "follow",
    headers,
  });
  const body = await response.text();

  let json = null;
  try {
    json = body ? JSON.parse(body) : null;
  } catch {
    json = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
    json,
  };
}

async function loginLocal() {
  const response = await fetch(`${LOCAL_API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@gov.",
      password: "dev-password-unused",
    }),
  });

  const body = await response.text();
  let json = null;
  try {
    json = body ? JSON.parse(body) : null;
  } catch {
    json = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
    json,
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

  const phase17 = await runCommand(commandFor("pnpm"), ["run", "proof:phase17"]);
  record(
    "phase17.go_live_scope",
    phase17.code === 0,
    `exit=${phase17.code}`,
    { stdout: phase17.stdout, stderr: phase17.stderr },
    phase17.code === 0 ? null : "Phase 17 go-live packet failed"
  );

  const phase17Evidence = await readJson(
    "os-platform/core/pilot/evidence/phase17-go-live.latest.json"
  );
  record(
    "phase17.evidence",
    phase17Evidence.decision === "GO",
    `decision=${phase17Evidence.decision}`,
    {
      generatedAt: phase17Evidence.generatedAt,
      summary: phase17Evidence.summary,
    },
    phase17Evidence.decision === "GO"
      ? null
      : "Phase 17 evidence is not GO"
  );

  const appSettings = JSON.parse(
    await readText("backend/src/TerraFusion.API/appsettings.Development.json")
  );
  const pacsConnection = appSettings?.ConnectionStrings?.PacsConnection ?? "";
  const pacsSalesConnection = appSettings?.ConnectionStrings?.PacsSalesConnection ?? "";
  const connectionTruthOk =
    pacsConnection.includes("Database=pacs_oltp") &&
    pacsSalesConnection.includes("Database=pacs_golive");
  record(
    "phase18.local.connection_contract",
    connectionTruthOk,
    connectionTruthOk
      ? "Development connection contract points parcel truth to pacs_oltp and sales truth to pacs_golive"
      : "Development PACS connection contract drifted from the canonical split",
    {
      pacsConnection,
      pacsSalesConnection,
    },
    connectionTruthOk
      ? null
      : "Local PACS connection contract no longer matches the canonical Benton split"
  );

  const dockerStatus = await runCommand("docker", [
    "ps",
    "--format",
    "{{.Names}}|{{.Status}}",
  ]);
  const dockerLines = dockerStatus.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const tfMssqlLine = dockerLines.find((line) => line.startsWith("tf-mssql|")) ?? null;
  record(
    "phase18.local.sql_runtime",
    dockerStatus.code === 0 && Boolean(tfMssqlLine),
    tfMssqlLine ?? `exit=${dockerStatus.code}`,
    { dockerLines, stderr: dockerStatus.stderr },
    dockerStatus.code === 0 && Boolean(tfMssqlLine)
      ? null
      : "The PACS-connected SQL runtime is not up on the canonical Benton host"
  );

  const login = await loginLocal();
  const loginOk = login.ok && typeof login.json?.token === "string";
  record(
    "phase18.local.runtime_login",
    loginOk,
    `status=${login.status}`,
    login.json ?? login.body,
    loginOk ? null : "Canonical local Benton runtime login failed"
  );

  let health = { ok: false, status: 0, json: null };
  let syncStatus = { ok: false, status: 0, json: null };
  let systems = { ok: false, status: 0, json: null };
  let counties = { ok: false, status: 0, json: null };
  let pacsProof = { ok: false, status: 0, json: null };

  if (loginOk) {
    const token = login.json.token;
    [health, syncStatus, systems, counties, pacsProof] = await Promise.all([
      fetchJson(`${LOCAL_API_BASE_URL}/health`),
      fetchJson(`${LOCAL_API_BASE_URL}/api/TerraFusionSync/status`, token),
      fetchJson(`${LOCAL_API_BASE_URL}/api/TerraFusionSync/systems`, token),
      fetchJson(`${LOCAL_API_BASE_URL}/api/TerraFusionSync/counties`, token),
      fetchJson(`${LOCAL_API_BASE_URL}/ops/pacs/proof`, token),
    ]);
  }

  record(
    "phase18.local.runtime_health",
    health.status === 200 && (health.json?.environment ?? health.json?.Environment) === "Development",
    `status=${health.status}, environment=${health.json?.environment ?? health.json?.Environment ?? "missing"}`,
    health.json ?? health.body,
    health.status === 200 && (health.json?.environment ?? health.json?.Environment) === "Development"
      ? null
      : "Canonical local Benton runtime health is not truthful"
  );

  const systemsCount = Array.isArray(systems.json) ? systems.json.length : -1;
  const countiesCount = Array.isArray(counties.json) ? counties.json.length : -1;
  const syncOk =
    syncStatus.status === 200 &&
    (syncStatus.json?.metrics?.TotalSystems ?? 0) >= 1 &&
    (syncStatus.json?.metrics?.ActiveCounties ?? 0) >= 1 &&
    systemsCount >= 1 &&
    countiesCount >= 1;
  record(
    "phase18.local.sync_role_truth",
    syncOk,
    `status=${syncStatus.status}, systems=${syncStatus.json?.metrics?.TotalSystems ?? "missing"}, counties=${syncStatus.json?.metrics?.ActiveCounties ?? "missing"}, listSystems=${systemsCount}, listCounties=${countiesCount}`,
    {
      syncStatus: syncStatus.json ?? syncStatus.body,
      systems: systems.json ?? systems.body,
      counties: counties.json ?? counties.body,
    },
    syncOk
      ? null
      : "Canonical local Benton runtime is not advertising the PACS-connected sync role truthfully"
  );

  const pacsProofOk =
    pacsProof.status === 200 &&
    pacsProof.json?.enabled === true &&
    pacsProof.json?.contractValid === true &&
    pacsProof.json?.readOnly === true &&
    pacsProof.json?.dbName === "pacs_oltp";
  record(
    "phase18.local.pacs_contract",
    pacsProofOk,
    `status=${pacsProof.status}, db=${pacsProof.json?.dbName ?? "missing"}, contractValid=${pacsProof.json?.contractValid ?? "missing"}`,
    pacsProof.json ?? pacsProof.body,
    pacsProofOk
      ? null
      : "Canonical local Benton runtime cannot prove the PACS contract boundary"
  );

  const phase18Doc = await readText(
    "os-platform/core/pilot/ops/phase18-pacs-runtime-productization.md"
  );
  const hostingerCanon = await readText(
    "os-platform/core/pilot/ops/hostinger-control-plane.md"
  );
  const postGoLiveChecklist = await readText(
    "os-platform/core/pilot/ops/post-go-live-phase-execution-checklist.md"
  );

  const missingPhase18Doc = includesAll(phase18Doc, [
    "# Phase 18 PACS-Connected Runtime Productization",
    "Current productized PACS-connected runtime is the canonical secured Benton workstation/runtime.",
    "This runtime remains the source Benton sync and conversion host until a separate PACS-reachable sync host is commissioned.",
    "Phase 18 reaches GO only when the local Benton runtime proves PACS contract truth, sync-role truth, and the canonical parcel/sales connection split.",
  ]);
  record(
    "governance.phase18_doc",
    missingPhase18Doc.length === 0,
    missingPhase18Doc.length === 0
      ? "Phase 18 runbook records the PACS-connected runtime productization contract"
      : `missing Phase 18 doc lines: ${missingPhase18Doc.join("; ")}`,
    { missingPhase18Doc },
    missingPhase18Doc.length === 0
      ? null
      : "Phase 18 runbook is out of sync with the PACS-connected runtime contract"
  );

  const missingHostingerCanon = includesAll(hostingerCanon, [
    "## Phase 18 PACS-Connected Runtime Productization (2026-03-13)",
    "The current productized PACS-connected Benton runtime is the canonical secured workstation/runtime, not Hostinger.",
    "Hostinger staging and production remain excluded from live PACS-connected sync responsibilities.",
  ]);
  record(
    "governance.hostinger_control_plane.phase18_truth",
    missingHostingerCanon.length === 0,
    missingHostingerCanon.length === 0
      ? "Hostinger control plane records the productized PACS-connected runtime boundary"
      : `missing hostinger Phase 18 canon lines: ${missingHostingerCanon.join("; ")}`,
    { missingHostingerCanon },
    missingHostingerCanon.length === 0
      ? null
      : "Hostinger control plane does not record the Phase 18 runtime boundary"
  );

  const missingChecklistLines = includesAll(postGoLiveChecklist, [
    "# Post-Go-Live Phase Execution Checklist",
    "## Phase 18 -- PACS-Connected Runtime Productization",
    "Status: COMPLETE (`GO`)",
    "## Phase 19 -- Snapshot Promotion Automation",
    "## Phase 25 -- County Replication Model",
  ]);
  record(
    "governance.post_go_live_checklist",
    missingChecklistLines.length === 0,
    missingChecklistLines.length === 0
      ? "Post-go-live checklist tracks Phase 18 through Phase 25"
      : `missing checklist lines: ${missingChecklistLines.join("; ")}`,
    { missingChecklistLines },
    missingChecklistLines.length === 0
      ? null
      : "Post-go-live execution checklist is incomplete"
  );

  const decision = blockers.length === 0 ? "GO" : "NO_GO";
  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 18 PACS-connected runtime productization packet",
    decision,
    checks,
    summary: {
      ok: blockers.length === 0,
      failures: checks.filter((check) => !check.ok).length,
      blockers,
      runtimeRole:
        "Canonical PACS-connected Benton runtime is the secured local workstation/runtime. Hostinger remains snapshot-only.",
      productizationTruth:
        "A Phase 18 GO means the current PACS-connected runtime role is explicitly documented, locally provable, and no longer implied by tribal knowledge.",
    },
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");

  if (decision !== "GO") {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  const outPath = parseArgs(process.argv).outPath;
  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 18 PACS-connected runtime productization packet",
    decision: "NO_GO",
    checks: [
      {
        name: "phase18.packet",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        payload: {
          stack: error instanceof Error ? error.stack : null,
        },
        blocker: "Phase 18 proof packet crashed",
      },
    ],
    summary: {
      ok: false,
      failures: 1,
      blockers: ["Phase 18 proof packet crashed"],
      runtimeRole:
        "Canonical PACS-connected Benton runtime is the secured local workstation/runtime. Hostinger remains snapshot-only.",
      productizationTruth:
        "A Phase 18 GO means the current PACS-connected runtime role is explicitly documented, locally provable, and no longer implied by tribal knowledge.",
    },
  };
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  console.error(error);
  process.exitCode = 1;
});
