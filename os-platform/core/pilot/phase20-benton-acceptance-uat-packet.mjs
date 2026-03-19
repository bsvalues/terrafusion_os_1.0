#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const STAGING_BASE_URL = "https://staging.terrafusionmarket.com";
const PRODUCTION_BASE_URL = "https://terrafusionmarket.com";
const EVIDENCE_DIR = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence"
);
const DEFAULT_OUT_PATH = path.resolve(
  EVIDENCE_DIR,
  "phase20-benton-acceptance-uat.latest.json"
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
        : process.env.PHASE20_PROOF_OUT || DEFAULT_OUT_PATH,
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

  // ── Layer 1a: verify prerequisite evidence files show GO ──
  // Phase 20 reads existing evidence from previous proof runs rather than
  // re-running the full chain (which requires the local PACS backend).
  // The evidence files were generated when the respective phases last ran
  // with the backend online; Phase 20 verifies their decisions are still GO.
  const evidenceFiles = [
    {
      name: "phase17.go_live",
      path: "os-platform/core/pilot/evidence/phase17-go-live.latest.json",
    },
    {
      name: "phase19.snapshot_promotion",
      path: "os-platform/core/pilot/evidence/phase19-snapshot-promotion-automation.latest.json",
    },
    {
      name: "phase15.data_quality",
      path: "os-platform/core/pilot/evidence/phase15-data-quality.latest.json",
    },
    {
      name: "phase14.operator_workflow",
      path: "os-platform/core/pilot/evidence/phase14-benton-operator-workflow.latest.json",
    },
    {
      name: "phase16.monitoring_recovery",
      path: "os-platform/core/pilot/evidence/phase16-monitoring-recovery.latest.json",
    },
    {
      name: "phase18.pacs_runtime",
      path: "os-platform/core/pilot/evidence/phase18-pacs-runtime-productization.latest.json",
    },
  ];

  const evidencePayload = {};
  for (const entry of evidenceFiles) {
    try {
      const json = await readJson(entry.path);
      evidencePayload[entry.name] = {
        decision: json.decision,
        generatedAt: json.generatedAt,
      };
      record(
        `${entry.name}.decision`,
        json.decision === "GO",
        `decision=${json.decision}`,
        { generatedAt: json.generatedAt, summary: json.summary },
        json.decision === "GO" ? null : `${entry.name} evidence is not GO`
      );
    } catch (err) {
      record(
        `${entry.name}.decision`,
        false,
        `file read error: ${err.message}`,
        null,
        `${entry.name} evidence file not found or invalid`
      );
    }
  }

  // ── Layer 1c: public runtime health ──
  const stagingHealth = await fetchJson(`${STAGING_BASE_URL}/health`);
  const productionHealth = await fetchJson(`${PRODUCTION_BASE_URL}/health`);

  const stagingEnv =
    stagingHealth.json?.environment ?? stagingHealth.json?.Environment;
  const productionEnv =
    productionHealth.json?.environment ?? productionHealth.json?.Environment;
  const stagingReleaseSha = stagingHealth.headerMap["x-release-sha"];
  const productionReleaseSha = productionHealth.headerMap["x-release-sha"];

  const publicHealthOk =
    stagingHealth.status === 200 &&
    productionHealth.status === 200 &&
    stagingEnv === "Staging" &&
    productionEnv === "Production" &&
    Boolean(stagingReleaseSha) &&
    Boolean(productionReleaseSha);

  record(
    "uat.public_runtime_health",
    publicHealthOk,
    `staging=${stagingHealth.status}/${stagingEnv ?? "missing"}, production=${productionHealth.status}/${productionEnv ?? "missing"}`,
    {
      staging: {
        status: stagingHealth.status,
        environment: stagingEnv,
        releaseSha: stagingReleaseSha,
      },
      production: {
        status: productionHealth.status,
        environment: productionEnv,
        releaseSha: productionReleaseSha,
      },
    },
    publicHealthOk
      ? null
      : "Public Benton runtimes are not truthfully healthy for UAT"
  );

  // ── Layer 1d: governance doc checks ──
  const phase20Doc = await readText(
    "os-platform/core/pilot/ops/phase20-benton-acceptance-uat.md"
  );
  const hostingerCanon = await readText(
    "os-platform/core/pilot/ops/hostinger-control-plane.md"
  );
  const checklist = await readText(
    "os-platform/core/pilot/ops/post-go-live-phase-execution-checklist.md"
  );

  const missingPhase20Doc = includesAll(phase20Doc, [
    "# Phase 20 Benton Acceptance / UAT Packet",
    "Layer 1: Technical UAT Readiness (automated)",
    "Layer 2: Assessor/Operator Signoff (manual, not automated)",
    "Phase 20 Final GO is complete only when the assessor signoff artifact is committed.",
  ]);
  record(
    "governance.phase20_doc",
    missingPhase20Doc.length === 0,
    missingPhase20Doc.length === 0
      ? "Phase 20 runbook records the two-layer decision model"
      : `missing Phase 20 doc lines: ${missingPhase20Doc.join("; ")}`,
    { missingPhase20Doc },
    missingPhase20Doc.length === 0
      ? null
      : "Phase 20 runbook is incomplete"
  );

  const missingHostingerCanon = includesAll(hostingerCanon, [
    "## Phase 20 Benton Acceptance / UAT Packet (2026-03-13)",
    "Technical UAT readiness is automated and must remain reproducible from the current Phase 17 and Phase 19 packets.",
    "Final Phase 20 `GO` requires an explicit Benton assessor/operator signoff artifact",
  ]);
  record(
    "governance.hostinger_control_plane.phase20_truth",
    missingHostingerCanon.length === 0,
    missingHostingerCanon.length === 0
      ? "Hostinger control plane records the Phase 20 UAT contract"
      : `missing hostinger Phase 20 canon lines: ${missingHostingerCanon.join("; ")}`,
    { missingHostingerCanon },
    missingHostingerCanon.length === 0
      ? null
      : "Hostinger control plane does not record the Phase 20 truth"
  );

  const missingChecklist = includesAll(checklist, [
    "## Phase 20 -- Benton Acceptance / UAT Packet",
    "Status: READY_FOR_SIGNOFF",
    "proof:phase20",
  ]);
  record(
    "governance.checklist.phase20",
    missingChecklist.length === 0,
    missingChecklist.length === 0
      ? "Post-go-live checklist tracks Phase 20"
      : `missing checklist lines: ${missingChecklist.join("; ")}`,
    { missingChecklist },
    missingChecklist.length === 0
      ? null
      : "Post-go-live checklist does not track Phase 20 correctly"
  );

  // ── Layer 2: signoff artifact check (expected to be absent until assessor signs) ──
  let signoffArtifactExists = false;
  try {
    await fs.access(
      path.resolve(
        process.cwd(),
        "os-platform/core/pilot/evidence/phase20-assessor-signoff.json"
      )
    );
    signoffArtifactExists = true;
  } catch {
    signoffArtifactExists = false;
  }

  record(
    "uat.assessor_signoff_artifact",
    true, // not a blocker — absence is expected
    signoffArtifactExists
      ? "assessor signoff artifact exists"
      : "assessor signoff artifact not yet committed (expected — Phase 20 remains READY_FOR_SIGNOFF)",
    { signoffArtifactExists },
    null
  );

  // ── Decision ──
  const technicalReady = blockers.length === 0;
  const decision = technicalReady
    ? signoffArtifactExists
      ? "GO"
      : "READY_FOR_SIGNOFF"
    : "NO_GO";

  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 20 Benton Acceptance / UAT Packet",
    decision,
    technicalUatReady: technicalReady,
    assessorSignoffPresent: signoffArtifactExists,
    checks,
    summary: {
      ok: technicalReady,
      failures: checks.filter((check) => !check.ok).length,
      blockers,
      uatScope:
        "Benton operational-snapshot runtime on Hostinger staging and production. Technical UAT readiness is derived from Phase 17 go-live baseline and Phase 19 promoted snapshot contract.",
      signoffRequirement:
        "Final GO requires an explicit Benton assessor/operator signoff artifact at os-platform/core/pilot/evidence/phase20-assessor-signoff.json",
      knownLimitations: [
        "ComparableSales.Bedrooms null on 76773/76775 rows (PACS source characteristic)",
        "ComparableSales.Bathrooms populated on 42012 rows after Phase 15 correction",
        "GrossLivingArea null on 3068 comparable sales rows",
        "LotSizeSqft null on 12461 comparable sales rows",
        "YearBuilt null on 8636 comparable sales rows",
        "1022 placeholder PACS-prefix addresses in comparable sales",
        "Hostinger runtimes are snapshot-only; no live PACS sync",
      ],
    },
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });

  await fs.writeFile(outPath, JSON.stringify(packet, null, 2));
  console.log(`\n[phase20] wrote proof packet to ${outPath}`);
  console.log(`[phase20] decision=${decision}`);

  // small delay to avoid libuv cleanup race on Windows
  setTimeout(() => process.exit(technicalReady ? 0 : 1), 50);
}

main().catch((err) => {
  console.error("[phase20] fatal:", err);
  process.exit(1);
});
