#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_API_BASE_URL = "http://localhost:5046";
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-endpoint-contract-smoke.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-endpoint-contract-smoke.latest.md"
);

const REQUIRED_PROBES = [
  {
    id: "health",
    method: "GET",
    path: "/health",
    required: true,
    validate: validateHealth
  },
  {
    id: "runtime_db_identity",
    method: "GET",
    path: "/api/runtime/truth/db-identity",
    required: true,
    validate: validateRuntimeDbIdentity
  },
  {
    id: "benton_parcels",
    method: "GET",
    path: "/api/counties/benton/parcels?limit=5",
    required: true,
    validate: validateBentonParcels
  },
  {
    id: "access_policy",
    method: "GET",
    path: "/api/auth/access-policy",
    required: true,
    validate: validateAccessPolicy
  }
];

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function snippet(text, limit = 4000) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function findProbe(probes, id) {
  return probes.find((probe) => probe.id === id) ?? null;
}

function rowsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.parcels)) return payload.parcels;
  return [];
}

function countFromPayload(payload, rows) {
  const candidates = [payload?.total, payload?.totalCount, payload?.count, payload?.rowCount];
  for (const candidate of candidates) {
    if (Number.isFinite(candidate)) return candidate;
  }
  return rows.length;
}

function payloadContainsBenton(payload, rows) {
  const countyCandidates = [
    payload?.county,
    payload?.countyName,
    payload?.countyToken,
    payload?.selectedCounty,
    payload?.stateCounty
  ]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).toLowerCase());

  if (countyCandidates.some((value) => value.includes("benton"))) return true;

  return rows.some((row) => {
    const rowCounty = String(row?.county ?? row?.countyName ?? row?.countyToken ?? "").toLowerCase();
    return rowCounty.includes("benton");
  });
}

function validateHealth(probe) {
  const payload = parseJson(probe.bodyText);
  const body = String(probe.bodyText ?? "").toLowerCase();
  return Boolean(payload?.status || payload?.ok || body.includes("ok") || body.includes("healthy"));
}

function validateRuntimeDbIdentity(probe) {
  const payload = parseJson(probe.bodyText);
  const identity = payload?.identity ?? payload ?? {};
  return Boolean(identity.database || identity.provider || payload?.passed === true);
}

function validateBentonParcels(probe) {
  const payload = parseJson(probe.bodyText);
  if (!payload) return false;
  const rows = rowsFromPayload(payload);
  const count = countFromPayload(payload, rows);
  return count > 0 && rows.length > 0 && payloadContainsBenton(payload, rows);
}

function validateAccessPolicy(probe) {
  const payload = parseJson(probe.bodyText);
  if (!payload) return false;
  return Boolean(
    "publicSignupEnabled" in payload ||
      payload.signupMode ||
      payload.accessRequestUrl ||
      payload.requestAccessUrl ||
      payload.contactUrl ||
      payload.supportEmail
  );
}

function contractMismatchFor(probeDefinition, probe) {
  if (!probeDefinition.required) return null;

  if (!probe) {
    return {
      endpointId: probeDefinition.id,
      endpoint: probeDefinition.path,
      reason: "required probe missing"
    };
  }

  if (probe.status !== 200) {
    return {
      endpointId: probeDefinition.id,
      endpoint: probeDefinition.path,
      reason: `expected status 200, got ${probe.status ?? probe.error ?? "error"}`
    };
  }

  if (!probeDefinition.validate(probe)) {
    return {
      endpointId: probeDefinition.id,
      endpoint: probeDefinition.path,
      reason: "response body did not match required launch-control shape",
      evidence: probe.bodySnippet
    };
  }

  return null;
}

function addBlocker(blockers, source, message, evidence = null) {
  blockers.push({ source, message, evidence });
}

async function fetchProbe(apiBaseUrl, probeDefinition, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${normalizeBaseUrl(apiBaseUrl)}${probeDefinition.path}`;

  try {
    const response = await fetch(url, {
      method: probeDefinition.method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent": "TerraFusion-June10-EndpointContractSmoke/1.0",
        connection: "close"
      }
    });
    const contentType = response.headers.get("content-type") ?? "";
    const bodyText = snippet(await response.text());

    return {
      id: probeDefinition.id,
      method: probeDefinition.method,
      path: probeDefinition.path,
      url,
      status: response.status,
      contentType,
      bodyText,
      bodySnippet: bodyText.slice(0, 240),
      ok: response.status >= 200 && response.status < 400,
      error: null
    };
  } catch (error) {
    return {
      id: probeDefinition.id,
      method: probeDefinition.method,
      path: probeDefinition.path,
      url,
      status: null,
      contentType: null,
      bodyText: "",
      bodySnippet: "",
      ok: false,
      error: error.name === "AbortError" ? `Timed out after ${timeoutMs}ms` : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function buildJune10EndpointContractSmokeReport({ apiBaseUrl, probes }) {
  const blockers = [];
  const contractMismatches = [];
  const failedRuntimeProbes = probes.filter((probe) => probe.status !== 200);

  for (const probe of failedRuntimeProbes) {
    addBlocker(
      blockers,
      "runtime_probe",
      `${probe.method} ${probe.path} did not return 200.`,
      probe.error ?? `status=${probe.status}`
    );
  }

  for (const definition of REQUIRED_PROBES) {
    const mismatch = contractMismatchFor(definition, findProbe(probes, definition.id) ?? probes.find((probe) => probe.path === definition.path));
    if (mismatch) contractMismatches.push(mismatch);
  }

  if (contractMismatches.length > 0) {
    addBlocker(
      blockers,
      "contract_shape",
      "One or more endpoint responses do not match the June 10 launch-control contract.",
      `${contractMismatches.length} mismatch(es)`
    );
  }

  return {
    generatedAtUtc: new Date().toISOString(),
    apiBaseUrl: normalizeBaseUrl(apiBaseUrl),
    passed: blockers.length === 0,
    summary: {
      requiredProbes: REQUIRED_PROBES.length,
      localRuntimeProbes: probes.length,
      failedRuntimeProbes: failedRuntimeProbes.length,
      contractMismatches: contractMismatches.length,
      blockers: blockers.length
    },
    localRuntimeProbes: probes,
    contractMismatches,
    blockers,
    interpretation:
      blockers.length === 0
        ? "Endpoint contract smoke passed for the required June 10 runtime API probes."
        : "Endpoint contract smoke is not passing; production readiness cannot claim all endpoints match contracts."
  };
}

export async function probeJune10EndpointContracts({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  timeoutMs = 10000
} = {}) {
  const probes = [];
  for (const probeDefinition of REQUIRED_PROBES) {
    probes.push(await fetchProbe(apiBaseUrl, probeDefinition, timeoutMs));
  }

  return buildJune10EndpointContractSmokeReport({ apiBaseUrl, probes });
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Endpoint Contract Smoke",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `API base URL: ${report.apiBaseUrl}`,
    `Passed: ${report.passed}`,
    "",
    "## Summary",
    "",
    `- Required probes: ${report.summary.requiredProbes}`,
    `- Runtime probes: ${report.summary.localRuntimeProbes}`,
    `- Failed runtime probes: ${report.summary.failedRuntimeProbes}`,
    `- Contract mismatches: ${report.summary.contractMismatches}`,
    `- Blockers: ${report.summary.blockers}`,
    "",
    "## Runtime Probes",
    "",
    "| ID | Method | Path | Status | Shape OK | Evidence |",
    "|---|---|---|---:|---:|---|"
  ];

  for (const probe of report.localRuntimeProbes) {
    const definition = REQUIRED_PROBES.find((item) => item.id === probe.id);
    const shapeOk = definition ? definition.validate(probe) : "unknown";
    lines.push([probe.id, probe.method, probe.path, probe.status ?? "error", shapeOk, probe.error ?? probe.bodySnippet ?? "-"].join(" | "));
  }

  lines.push("", "## Contract Mismatches", "");
  if (report.contractMismatches.length === 0) lines.push("- None");
  else {
    for (const mismatch of report.contractMismatches) {
      lines.push(`- **${mismatch.endpointId}** ${mismatch.endpoint}: ${mismatch.reason}${mismatch.evidence ? ` (${mismatch.evidence})` : ""}`);
    }
  }

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) lines.push("- None");
  else {
    for (const blocker of report.blockers) {
      lines.push(`- **${blocker.source}**: ${blocker.message}${blocker.evidence ? ` (${blocker.evidence})` : ""}`);
    }
  }

  lines.push("", "## Interpretation", "", report.interpretation);

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    apiBaseUrl: process.env.TF_API_BASE_URL ?? DEFAULT_API_BASE_URL,
    timeoutMs: Number.parseInt(process.env.TF_ENDPOINT_CONTRACT_TIMEOUT_MS ?? "10000", 10),
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--api-base-url") args.apiBaseUrl = argv[++i];
    else if (arg === "--timeout-ms") args.timeoutMs = Number.parseInt(argv[++i], 10);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = await probeJune10EndpointContracts({ apiBaseUrl: args.apiBaseUrl, timeoutMs: args.timeoutMs });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        passed: report.passed,
        failedRuntimeProbes: report.summary.failedRuntimeProbes,
        contractMismatches: report.summary.contractMismatches,
        blockers: report.summary.blockers,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main()
    .then(() => {})
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
