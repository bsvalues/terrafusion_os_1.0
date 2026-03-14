#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const STAGING_BASE_URL = "https://staging.terrafusionmarket.com";
const PRODUCTION_BASE_URL = "https://terrafusionmarket.com";
const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/phase9-runtime-role-separation.latest.json"
);

function commandFor(binary) {
  if (process.platform === "win32" && binary === "curl") return "curl.exe";
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
        : process.env.PHASE9_PROOF_OUT || DEFAULT_OUT_PATH,
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

async function curlRequest(url) {
  const result = await runCommand(commandFor("curl"), [
    "--silent",
    "--show-error",
    "--location",
    "--write-out",
    "\n__STATUS__:%{http_code}",
    url,
  ]);

  const parsed = parseCurlStatus(result.stdout);
  return { ...result, ...parsed };
}

async function resolveDnsA(name) {
  const response = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=A`,
    {
      headers: {
        accept: "application/dns-json",
      },
    }
  );

  const payload = await response.json();
  const answers = Array.isArray(payload?.Answer)
    ? payload.Answer.filter((answer) => answer?.type === 1).map((answer) => answer.data)
    : [];

  return {
    ok: response.ok,
    status: response.status,
    answers,
    payload,
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

  const phase7 = await runCommand(commandFor("pnpm"), ["run", "proof:phase7"]);
  record(
    "phase7.snapshot_runtime_alignment",
    phase7.code === 0,
    `exit=${phase7.code}`,
    { stdout: phase7.stdout, stderr: phase7.stderr },
    phase7.code === 0 ? null : "Phase 7 snapshot-runtime alignment proof failed"
  );

  const phase8 = await runCommand(commandFor("pnpm"), ["run", "proof:phase8"]);
  record(
    "phase8.deployed_operator_parity",
    phase8.code === 0,
    `exit=${phase8.code}`,
    { stdout: phase8.stdout, stderr: phase8.stderr },
    phase8.code === 0 ? null : "Phase 8 deployed operator parity proof failed"
  );

  const hostingerCanonPath = path.resolve(
    process.cwd(),
    "os-platform/core/pilot/ops/hostinger-control-plane.md"
  );
  const hostingerCanon = await fs.readFile(hostingerCanonPath, "utf8");
  const canonChecks = [
    "Hostinger staging is a Benton operational-snapshot runtime",
    "Hostinger production is a Benton operational-snapshot runtime",
    "Neither environment is a PACS-connected sync runtime",
    "PACS SQL connectivity and PACS-backed sync remain local/canonical or separate infrastructure concerns",
  ];
  const missingCanonLines = canonChecks.filter((line) => !hostingerCanon.includes(line));
  record(
    "hostinger.runtime_role_canon",
    missingCanonLines.length === 0,
    missingCanonLines.length === 0
      ? "Hostinger control-plane canon declares snapshot-only runtime role"
      : `missing lines: ${missingCanonLines.join(" | ")}`,
    { missingCanonLines },
    missingCanonLines.length === 0
      ? null
      : "Hostinger control-plane canon is missing snapshot/runtime-role separation language"
  );

  const secretsTemplate = await fs.readFile(
    path.resolve(process.cwd(), "ops/prod/secrets_template.env"),
    "utf8"
  );
  const requiredSnapshotLines = [
    "ConnectionStrings__PacsConnection=",
    "ConnectionStrings__PacsSalesConnection=",
    "HarrisPACS__Enabled=false",
  ];
  const missingSnapshotLines = requiredSnapshotLines.filter(
    (line) => !secretsTemplate.includes(line)
  );
  record(
    "hostinger.snapshot_contract",
    missingSnapshotLines.length === 0,
    missingSnapshotLines.length === 0
      ? "Production secrets template encodes snapshot-runtime contract"
      : `missing lines: ${missingSnapshotLines.join(", ")}`,
    { missingSnapshotLines },
    missingSnapshotLines.length === 0
      ? null
      : "Hostinger deploy contract does not encode snapshot-only PACS settings"
  );

  const stagingDns = await resolveDnsA("staging.terrafusionmarket.com");
  record(
    "public_dns.staging",
    stagingDns.answers.includes("72.60.126.11"),
    `answers=${stagingDns.answers.join(",") || "none"}`,
    stagingDns.payload,
    stagingDns.answers.includes("72.60.126.11")
      ? null
      : "Staging public DNS is not resolving to the Hostinger edge IP"
  );

  const productionDns = await resolveDnsA("terrafusionmarket.com");
  record(
    "public_dns.production_apex",
    productionDns.answers.includes("72.60.126.11"),
    `answers=${productionDns.answers.join(",") || "none"}`,
    productionDns.payload,
    productionDns.answers.includes("72.60.126.11")
      ? null
      : "Production apex DNS is not publicly resolving to the Hostinger edge IP"
  );

  const stagingHealth = await curlRequest(`${STAGING_BASE_URL}/health`);
  record(
    "public_health.staging",
    stagingHealth.status === 200,
    `status=${stagingHealth.status}`,
    { body: stagingHealth.body, stderr: stagingHealth.stderr },
    stagingHealth.status === 200 ? null : "Staging public health endpoint is not healthy"
  );

  const productionHealth = await curlRequest(`${PRODUCTION_BASE_URL}/health`);
  record(
    "public_health.production_apex",
    productionHealth.status === 200,
    `status=${productionHealth.status}`,
    { body: productionHealth.body, stderr: productionHealth.stderr },
    productionHealth.status === 200
      ? null
      : "Production public apex health endpoint is not healthy without resolve fallback"
  );

  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 9 runtime role separation and production truth packet",
    decision: blockers.length === 0 ? "GO" : "NO_GO",
    checks,
    summary: {
      ok: blockers.length === 0,
      failures: checks.filter((check) => !check.ok).length,
      blockers,
      runtimeRoleDecision:
        "Hostinger staging/production are Benton operational-snapshot runtimes; PACS-connected sync is a separate runtime role.",
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
    scope: "Phase 9 runtime role separation and production truth packet",
    decision: "NO_GO",
    checks: [
      {
        name: "phase9.packet",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        payload: { stack: error instanceof Error ? error.stack : null },
        blocker: "Phase 9 runtime role separation packet failed to execute",
      },
    ],
    summary: {
      ok: false,
      failures: 1,
      blockers: ["Phase 9 runtime role separation packet failed to execute"],
      runtimeRoleDecision:
        "Hostinger staging/production are Benton operational-snapshot runtimes; PACS-connected sync is a separate runtime role.",
    },
  };
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  process.exitCode = 1;
});
