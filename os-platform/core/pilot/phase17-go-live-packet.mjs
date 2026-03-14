#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const STAGING_BASE_URL = "https://staging.terrafusionmarket.com";
const PRODUCTION_BASE_URL = "https://terrafusionmarket.com";
const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/phase17-go-live.latest.json"
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
        : process.env.PHASE17_PROOF_OUT || DEFAULT_OUT_PATH,
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

async function readJson(relativePath) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  return JSON.parse(await fs.readFile(fullPath, "utf8"));
}

async function readText(relativePath) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), "utf8");
}

function includesAll(content, needles) {
  return needles.filter((needle) => !content.includes(needle));
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

async function main() {
  const { outPath } = parseArgs(process.argv);
  const checks = [];
  const blockers = [];

  const record = (name, ok, detail, payload = null, blocker = null) => {
    checks.push({ name, ok, detail, payload, blocker });
    if (!ok && blocker) blockers.push(blocker);
  };

  const proofChain = [
    { id: "phase9", command: ["run", "proof:phase9"] },
    { id: "phase10", command: ["run", "proof:phase10"] },
    { id: "phase11", command: ["run", "proof:phase11"] },
    { id: "phase16", command: ["run", "proof:phase16"] },
  ];

  for (const proof of proofChain) {
    const result = await runCommand(commandFor("pnpm"), proof.command);
    record(
      `${proof.id}.proof`,
      result.code === 0,
      `exit=${result.code}`,
      { stdout: result.stdout, stderr: result.stderr },
      result.code === 0 ? null : `${proof.id} proof failed`
    );
  }

  const evidenceMap = [
    {
      name: "phase9.runtime_role",
      path: "os-platform/core/pilot/evidence/phase9-runtime-role-separation.latest.json",
    },
    {
      name: "phase10.environment_identity",
      path: "os-platform/core/pilot/evidence/phase10-environment-identity.latest.json",
    },
    {
      name: "phase11.deployment_contract",
      path: "os-platform/core/pilot/evidence/phase11-deployment-contract.latest.json",
    },
    {
      name: "phase14.operator_workflow",
      path: "os-platform/core/pilot/evidence/phase14-benton-operator-workflow.latest.json",
    },
    {
      name: "phase15.data_quality",
      path: "os-platform/core/pilot/evidence/phase15-data-quality.latest.json",
    },
    {
      name: "phase16.monitoring_recovery",
      path: "os-platform/core/pilot/evidence/phase16-monitoring-recovery.latest.json",
    },
  ];

  const evidencePayload = {};
  for (const entry of evidenceMap) {
    const json = await readJson(entry.path);
    evidencePayload[entry.name] = json;
    record(
      `${entry.name}.decision`,
      json.decision === "GO",
      `decision=${json.decision}`,
      {
        generatedAt: json.generatedAt,
        summary: json.summary,
      },
      json.decision === "GO" ? null : `${entry.name} evidence is not GO`
    );
  }

  const stagingHealth = await fetchJson(`${STAGING_BASE_URL}/health`);
  const productionHealth = await fetchJson(`${PRODUCTION_BASE_URL}/health`);
  const publicHealthOk =
    stagingHealth.status === 200 &&
    productionHealth.status === 200 &&
    (stagingHealth.json?.environment ?? stagingHealth.json?.Environment) === "Staging" &&
    (productionHealth.json?.environment ?? productionHealth.json?.Environment) === "Production" &&
    Boolean(stagingHealth.headerMap["x-release-sha"]) &&
    Boolean(productionHealth.headerMap["x-release-sha"]);

  record(
    "phase17.public_runtime_truth",
    publicHealthOk,
    `staging=${stagingHealth.status}/${stagingHealth.json?.environment ?? stagingHealth.json?.Environment ?? "missing"}, production=${productionHealth.status}/${productionHealth.json?.environment ?? productionHealth.json?.Environment ?? "missing"}`,
    {
      staging: {
        status: stagingHealth.status,
        body: stagingHealth.json ?? stagingHealth.body,
        headers: stagingHealth.headerMap,
      },
      production: {
        status: productionHealth.status,
        body: productionHealth.json ?? productionHealth.body,
        headers: productionHealth.headerMap,
      },
    },
    publicHealthOk ? null : "Public Benton snapshot runtimes are not truthfully healthy"
  );

  const phase17Doc = await readText(
    "os-platform/core/pilot/ops/phase17-go-live-decision.md"
  );
  const hostingerCanon = await readText(
    "os-platform/core/pilot/ops/hostinger-control-plane.md"
  );

  const missingPhase17Doc = includesAll(phase17Doc, [
    "# Phase 17 Benton Go-Live Decision",
    "Current approved go-live scope is the Benton operational-snapshot runtime on Hostinger staging and production.",
    "This go-live scope explicitly excludes live PACS-connected sync on Hostinger.",
    "Phase 17 reaches GO only when Phase 9, Phase 10, Phase 11, Phase 14, Phase 15, and Phase 16 all remain GO on the active runtime.",
    "A Phase 17 GO means the Benton operator surface, promoted snapshot contract, and recovery posture are proven for the current Hostinger runtime role.",
  ]);
  record(
    "governance.phase17_doc",
    missingPhase17Doc.length === 0,
    missingPhase17Doc.length === 0
      ? "Phase 17 runbook records the final go-live scope and decision rule"
      : `missing Phase 17 doc lines: ${missingPhase17Doc.join("; ")}`,
    { missingPhase17Doc },
    missingPhase17Doc.length === 0
      ? null
      : "Phase 17 runbook is out of sync with the final go-live packet"
  );

  const missingHostingerCanon = includesAll(hostingerCanon, [
    "## Phase 17 Benton Go-Live Decision (2026-03-13)",
    "The approved go-live scope is the Benton operational-snapshot runtime served from Hostinger staging and production.",
    "This go-live scope excludes live PACS-connected sync on Hostinger; PACS-connected sync remains a separate canonical runtime role.",
    "Phase 17 reached `GO` only after Phase 9 through Phase 16 evidence remained green on the active Benton runtime.",
  ]);
  record(
    "governance.hostinger_control_plane.phase17_truth",
    missingHostingerCanon.length === 0,
    missingHostingerCanon.length === 0
      ? "Hostinger control plane records the final Benton go-live scope"
      : `missing hostinger Phase 17 canon lines: ${missingHostingerCanon.join("; ")}`,
    { missingHostingerCanon },
    missingHostingerCanon.length === 0
      ? null
      : "Hostinger control plane does not record the Phase 17 go-live truth"
  );

  const decision = blockers.length === 0 ? "GO" : "NO_GO";
  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 17 Benton go-live decision packet",
    decision,
    checks,
    summary: {
      ok: blockers.length === 0,
      failures: checks.filter((check) => !check.ok).length,
      blockers,
      goLiveScope:
        "Benton operational-snapshot runtime on Hostinger staging and production only. PACS-connected sync remains a separate canonical runtime role.",
      operatorTruth:
        "A Phase 17 GO means operator workflow, promoted snapshot truth, environment identity, deployment contract, monitoring freshness, and recovery posture are all proven on the active Hostinger runtime role.",
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
    scope: "Phase 17 Benton go-live decision packet",
    decision: "NO_GO",
    checks: [
      {
        name: "phase17.packet",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        payload: {
          stack: error instanceof Error ? error.stack : null,
        },
        blocker: "Phase 17 proof packet crashed",
      },
    ],
    summary: {
      ok: false,
      failures: 1,
      blockers: ["Phase 17 proof packet crashed"],
      goLiveScope:
        "Benton operational-snapshot runtime on Hostinger staging and production only. PACS-connected sync remains a separate canonical runtime role.",
      operatorTruth:
        "A Phase 17 GO means operator workflow, promoted snapshot truth, environment identity, deployment contract, monitoring freshness, and recovery posture are all proven on the active Hostinger runtime role.",
    },
  };
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  console.error(error);
  process.exitCode = 1;
});
