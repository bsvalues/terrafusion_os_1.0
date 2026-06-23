#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-real-dev-backend-health.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "county-studio-real-dev-backend-health.md"
);

export const CANONICAL_BACKEND_LAUNCH_COMMAND = "pnpm run dev:backend:api";
export const CANONICAL_BACKEND_HEALTH_ENDPOINTS = [
  "http://localhost:5046/health",
  "http://localhost:5046/api/health",
  "http://localhost:5000/health",
  "http://localhost:5000/api/health"
];

function healthPort(url) {
  try {
    const parsed = new URL(url);
    return Number(parsed.port || (parsed.protocol === "https:" ? 443 : 80));
  } catch {
    return null;
  }
}

function uniquePorts(urls) {
  return [...new Set(urls.map(healthPort).filter((port) => Number.isInteger(port)))];
}

function remediation() {
  return [
    `Start the TerraFusion API backend in a separate terminal with \`${CANONICAL_BACKEND_LAUNCH_COMMAND}\`.`,
    "Wait until `http://localhost:5046/health` returns 200.",
    "Then rerun `pnpm run dev:county-studio:real-benton`.",
    "The real Benton dev command runs evidence gates before the final `pnpm run dev` stage, so backend health must be available before DB readiness can pass."
  ].join(" ");
}

export function buildCountyStudioRealDevBackendHealthReport({
  healthChecks,
  generatedAtUtc = new Date().toISOString()
} = {}) {
  const checks = Array.isArray(healthChecks) ? healthChecks : [];
  const passing = checks.find((check) => check.ok === true);
  const backendHealthy = Boolean(passing);
  const expectedBackendPorts = uniquePorts(
    checks.length > 0 ? checks.map((check) => check.url) : CANONICAL_BACKEND_HEALTH_ENDPOINTS
  );

  return {
    generatedAtUtc,
    gate: "county-studio-real-dev-backend-health",
    status: backendHealthy ? "REAL_DEV_BACKEND_HEALTH_PASS" : "REAL_DEV_BACKEND_HEALTH_BLOCKED",
    expectedBackendPorts,
    backendLaunchCommand: CANONICAL_BACKEND_LAUNCH_COMMAND,
    healthEndpoint: passing?.url ?? null,
    backendStartedByDevCommand: false,
    backendHealthy,
    healthChecks: checks,
    failureReason: backendHealthy
      ? null
      : "No TerraFusion API backend health endpoint responded before the real Benton dev readiness gate.",
    remediation: backendHealthy ? null : remediation(),
    productionProofAllowed: false,
    operationalProofAllowed: false,
    boundaries: [
      "This backend health gate does not touch County Studio UI.",
      "This backend health gate does not mutate TerraFusion Sync.",
      "This backend health gate does not change DB seeding.",
      "This backend health gate does not weaken evidence gates.",
      "This backend health gate does not set productionProofAllowed=true.",
      "This backend health gate does not set operationalProofAllowed=true.",
      "This backend health gate does not hide DATA_TRUTH_FAIL."
    ]
  };
}

export function renderCountyStudioRealDevBackendHealthMarkdown(report) {
  const lines = [
    "# County Studio Real Dev Backend Health",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Status: \`${report.status}\``,
    "",
    "## Decision",
    "",
    `- backendHealthy=${report.backendHealthy}`,
    `- backendStartedByDevCommand=${report.backendStartedByDevCommand}`,
    `- backendLaunchCommand=${report.backendLaunchCommand}`,
    `- healthEndpoint=${report.healthEndpoint ?? "none"}`,
    `- productionProofAllowed=${report.productionProofAllowed}`,
    `- operationalProofAllowed=${report.operationalProofAllowed}`,
    "",
    "## Expected Backend Ports",
    ""
  ];

  report.expectedBackendPorts.forEach((port) => lines.push(`- ${port}`));

  lines.push("", "## Health Checks", "", "| Endpoint | OK | Status/Error |", "| --- | --- | --- |");
  report.healthChecks.forEach((check) => {
    lines.push(`| ${check.url} | ${check.ok} | ${check.statusCode ?? check.error ?? "unknown"} |`);
  });

  lines.push("", "## Bootstrap");
  lines.push("");
  if (report.backendHealthy) {
    lines.push("Backend API health is available for the real Benton dev readiness gate.");
  } else {
    lines.push(report.failureReason);
    lines.push("");
    lines.push(report.remediation);
  }

  lines.push("", "## Boundaries", "");
  report.boundaries.forEach((boundary) => lines.push(`- ${boundary}`));

  return `${lines.join("\n")}\n`;
}

async function probeHealthUrl(url, timeoutMs) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return {
      url,
      port: healthPort(url),
      ok: response.ok,
      statusCode: response.status
    };
  } catch (error) {
    return {
      url,
      port: healthPort(url),
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function collectHealthChecks(urls, timeoutMs) {
  const checks = [];
  for (const url of urls) {
    checks.push(await probeHealthUrl(url, timeoutMs));
  }
  return checks;
}

function parseArgs(argv) {
  const args = {
    healthUrls: [...CANONICAL_BACKEND_HEALTH_ENDPOINTS],
    timeoutMs: Number(process.env.TF_BACKEND_HEALTH_TIMEOUT_MS ?? "3000"),
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--health-url") args.healthUrls = [argv[++i]];
    else if (arg === "--timeout-ms") args.timeoutMs = Number(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const healthChecks = await collectHealthChecks(args.healthUrls, args.timeoutMs);
  const report = buildCountyStudioRealDevBackendHealthReport({ healthChecks });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderCountyStudioRealDevBackendHealthMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        status: report.status,
        backendHealthy: report.backendHealthy,
        healthEndpoint: report.healthEndpoint,
        backendLaunchCommand: report.backendLaunchCommand,
        productionProofAllowed: report.productionProofAllowed,
        operationalProofAllowed: report.operationalProofAllowed,
        output: path.relative(repoRoot, args.outJson).replaceAll(path.sep, "/")
      },
      null,
      2
    )
  );

  return report.backendHealthy ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
