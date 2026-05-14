#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_ROOT = path.join(repoRoot, "evidence", "june10-38-county-seed");
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-receipts.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-receipts.latest.md"
);

const RECEIPT_FILE = "source-snapshot-receipt.json";

const STATUSES = new Set([
  "NOT_STARTED",
  "SOURCE_DECISION_READY",
  "ATTEMPT",
  "SNAPSHOT_CAPTURED",
  "NORMALIZED_READY",
  "LOADED_NEEDS_API_PROOF",
  "API_PROVEN_NEEDS_UI_SMOKE",
  "LIMITED_WORKFLOW_READY",
  "BLOCKED"
]);

const CLAIM_BY_STATUS = new Map([
  ["NOT_STARTED", "registry/provenance only"],
  ["SOURCE_DECISION_READY", "source identified"],
  ["ATTEMPT", "attempt only"],
  ["SNAPSHOT_CAPTURED", "acquisition captured"],
  ["NORMALIZED_READY", "load candidate"],
  ["LOADED_NEEDS_API_PROOF", "loaded seed, not runtime proven"],
  ["API_PROVEN_NEEDS_UI_SMOKE", "API-proven seed"],
  ["LIMITED_WORKFLOW_READY", "limited workflow"],
  ["BLOCKED", "blocked"]
]);

const ALLOWED_WORKFLOW_LABELS = new Set(["available", "limited", "blocked", "post_launch"]);

function normalizeCountyToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isIsoDate(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const time = Date.parse(value);
  return Number.isFinite(time);
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function pushIf(list, condition, message) {
  if (condition) list.push(message);
}

function hasSecretKey(key) {
  return /(^|\.)(password|secret|cookie|authorization|bearerToken|accessToken|apiKey|privateKey)$/i.test(
    key
  );
}

function collectSecretValuePaths(value, base = "") {
  const paths = [];
  if (!value || typeof value !== "object") return paths;

  for (const [key, child] of Object.entries(value)) {
    const childPath = base ? `${base}.${key}` : key;
    if (hasSecretKey(childPath) && typeof child === "string" && child.trim()) {
      paths.push(childPath);
    }
    if (child && typeof child === "object") {
      paths.push(...collectSecretValuePaths(child, childPath));
    }
  }

  return paths;
}

function gateA(receipt) {
  const blockers = [];
  const source = receipt.sourceSystem ?? {};
  const rawArtifacts = asArray(receipt.rawArtifacts);

  pushIf(blockers, !source.url, "Gate A: sourceSystem.url is required.");
  pushIf(blockers, rawArtifacts.length === 0, "Gate A: at least one raw artifact is required.");
  pushIf(blockers, receipt.noSecretValuesRecorded !== true, "Gate A: noSecretValuesRecorded must be true.");

  rawArtifacts.forEach((artifact, index) => {
    pushIf(blockers, !artifact.path, `Gate A: rawArtifacts[${index}].path is required.`);
    pushIf(blockers, !isSha256(artifact.sha256), `Gate A: rawArtifacts[${index}].sha256 must be SHA-256.`);
    pushIf(
      blockers,
      !isIsoDate(artifact.capturedAtUtc),
      `Gate A: rawArtifacts[${index}].capturedAtUtc must be an ISO timestamp.`
    );
  });

  return { passed: blockers.length === 0, blockers };
}

function gateB(receipt) {
  const blockers = [];
  const normalizedArtifacts = asArray(receipt.normalizedArtifacts);
  const counts = receipt.counts ?? {};

  pushIf(blockers, !receipt.county, "Gate B: county is required.");
  pushIf(blockers, !receipt.countyToken, "Gate B: countyToken is required.");
  pushIf(blockers, normalizeCountyToken(receipt.county) !== receipt.countyToken, "Gate B: countyToken must match normalized county.");
  pushIf(blockers, receipt.state !== "WA", "Gate B: state must be WA.");
  pushIf(blockers, !receipt.fips, "Gate B: fips is required.");
  pushIf(blockers, normalizedArtifacts.length === 0, "Gate B: at least one normalized artifact is required.");
  pushIf(
    blockers,
    asNumber(counts.parcelRowsNormalized) <= 0,
    "Gate B: parcelRowsNormalized must be greater than zero."
  );

  normalizedArtifacts.forEach((artifact, index) => {
    pushIf(blockers, !artifact.path, `Gate B: normalizedArtifacts[${index}].path is required.`);
    pushIf(
      blockers,
      !String(artifact.schema ?? "").startsWith("terrafusion-"),
      `Gate B: normalizedArtifacts[${index}].schema must be TerraFusion-owned.`
    );
    pushIf(
      blockers,
      !isSha256(artifact.sha256),
      `Gate B: normalizedArtifacts[${index}].sha256 must be SHA-256.`
    );
  });

  return { passed: blockers.length === 0, blockers };
}

function gateC(receipt) {
  const blockers = [];
  const counts = receipt.counts ?? {};
  const target = receipt.target ?? {};

  pushIf(blockers, !target.terrafusionDbIdentity, "Gate C: target.terrafusionDbIdentity is required.");
  pushIf(blockers, !target.databaseRole, "Gate C: target.databaseRole is required.");
  pushIf(blockers, !target.schema, "Gate C: target.schema is required.");
  pushIf(blockers, asArray(target.tables).length === 0, "Gate C: at least one target table is required.");
  pushIf(blockers, asNumber(counts.parcelRowsLoaded) <= 0, "Gate C: parcelRowsLoaded must be greater than zero.");
  pushIf(
    blockers,
    asNumber(counts.distinctParcelIdsLoaded) <= 0,
    "Gate C: distinctParcelIdsLoaded must be greater than zero."
  );

  return { passed: blockers.length === 0, blockers };
}

function gateD(receipt) {
  const blockers = [];
  const proof = receipt.apiProof ?? {};

  pushIf(blockers, !proof.endpoint, "Gate D: apiProof.endpoint is required.");
  pushIf(blockers, proof.status !== 200, "Gate D: apiProof.status must be 200.");
  pushIf(blockers, proof.payloadCounty !== receipt.county, "Gate D: payload county must match selected county.");
  pushIf(blockers, proof.countyEcho !== true, "Gate D: countyEcho must be true.");
  pushIf(blockers, proof.fallbackDetected === true, "Gate D: fallbackDetected must be false.");
  pushIf(blockers, asNumber(proof.rowCount) <= 0, "Gate D: apiProof.rowCount must be greater than zero.");

  return { passed: blockers.length === 0, blockers };
}

function gateE(receipt) {
  const blockers = [];
  const smoke = receipt.uiSmoke ?? {};

  pushIf(blockers, smoke.performed !== true, "Gate E: uiSmoke.performed must be true.");
  pushIf(blockers, !smoke.frontendUrl, "Gate E: uiSmoke.frontendUrl is required.");
  pushIf(blockers, !smoke.screenshotFolder, "Gate E: uiSmoke.screenshotFolder is required.");
  pushIf(blockers, smoke.trustLabelVisible !== true, "Gate E: trust label must be visible.");
  pushIf(
    blockers,
    smoke.unsupportedWorkflowLabelsVisible !== true,
    "Gate E: unsupported workflow labels must be visible."
  );

  return { passed: blockers.length === 0, blockers };
}

function deriveStatus(gates, receipt) {
  if (receipt.status === "BLOCKED") return "BLOCKED";
  if (gates.E.passed) return "LIMITED_WORKFLOW_READY";
  if (gates.D.passed) return "API_PROVEN_NEEDS_UI_SMOKE";
  if (gates.C.passed) return "LOADED_NEEDS_API_PROOF";
  if (gates.B.passed) return "NORMALIZED_READY";
  if (gates.A.passed) return "SNAPSHOT_CAPTURED";
  return "ATTEMPT";
}

function validateWorkflowLabels(receipt) {
  const blockers = [];
  const labels = receipt.workflowLabels ?? {};

  for (const [key, value] of Object.entries(labels)) {
    if (!ALLOWED_WORKFLOW_LABELS.has(value)) {
      blockers.push(`workflowLabels.${key} must be one of ${[...ALLOWED_WORKFLOW_LABELS].join(", ")}.`);
    }
  }

  if (labels.officialValuation && labels.officialValuation !== "blocked") {
    blockers.push("officialValuation must remain blocked for initial seed receipts.");
  }

  return blockers;
}

export function validateReceipt(receipt, sourcePath = "<memory>") {
  const blockers = [];
  const warnings = [];

  pushIf(blockers, receipt.receiptVersion !== "june10-seed-v1", "receiptVersion must be june10-seed-v1.");
  pushIf(blockers, !STATUSES.has(receipt.status), `status must be one of ${[...STATUSES].join(", ")}.`);
  pushIf(blockers, !isIsoDate(receipt.capturedAtUtc), "capturedAtUtc must be an ISO timestamp.");

  const secretPaths = collectSecretValuePaths(receipt);
  secretPaths.forEach((keyPath) => blockers.push(`Secret-like value must not be recorded at ${keyPath}.`));

  const gates = {
    A: gateA(receipt),
    B: gateB(receipt),
    C: gateC(receipt),
    D: gateD(receipt),
    E: gateE(receipt)
  };

  const derivedStatus = deriveStatus(gates, receipt);
  if (receipt.status && receipt.status !== derivedStatus && receipt.status !== "SOURCE_DECISION_READY") {
    blockers.push(`status ${receipt.status} does not match derived status ${derivedStatus}.`);
  }

  const expectedClaim = CLAIM_BY_STATUS.get(derivedStatus);
  if (expectedClaim && receipt.claimLabel && receipt.claimLabel !== expectedClaim) {
    warnings.push(`claimLabel '${receipt.claimLabel}' differs from derived claim '${expectedClaim}'.`);
  }

  blockers.push(...validateWorkflowLabels(receipt));

  return {
    sourcePath,
    county: receipt.county ?? null,
    countyToken: receipt.countyToken ?? null,
    status: receipt.status ?? null,
    derivedStatus,
    passed: blockers.length === 0,
    gates: Object.fromEntries(
      Object.entries(gates).map(([key, value]) => [
        key,
        {
          passed: value.passed,
          blockers: value.blockers
        }
      ])
    ),
    warnings,
    blockers
  };
}

function walkForReceipts(root) {
  const results = [];
  if (!fs.existsSync(root)) return results;

  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkForReceipts(fullPath));
    } else if (entry.isFile() && entry.name === RECEIPT_FILE) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function validateReceiptRoot(root = DEFAULT_ROOT) {
  const receiptPaths = walkForReceipts(root);
  const rows = [];

  for (const receiptPath of receiptPaths) {
    try {
      rows.push(validateReceipt(readJson(receiptPath), path.relative(repoRoot, receiptPath).replaceAll(path.sep, "/")));
    } catch (error) {
      rows.push({
        sourcePath: path.relative(repoRoot, receiptPath).replaceAll(path.sep, "/"),
        county: null,
        countyToken: null,
        status: null,
        derivedStatus: "ATTEMPT",
        passed: false,
        gates: {},
        warnings: [],
        blockers: [`Failed to parse receipt JSON: ${error.message}`]
      });
    }
  }

  const failed = rows.filter((row) => !row.passed);
  const statusCounts = rows.reduce((acc, row) => {
    acc[row.derivedStatus] = (acc[row.derivedStatus] ?? 0) + 1;
    return acc;
  }, {});

  return {
    generatedAtUtc: new Date().toISOString(),
    root: path.relative(repoRoot, root).replaceAll(path.sep, "/") || ".",
    receiptFileName: RECEIPT_FILE,
    summary: {
      receiptsFound: rows.length,
      passed: rows.length > 0 && failed.length === 0,
      failed: failed.length,
      statusCounts,
      noReceiptsFound: rows.length === 0
    },
    rows,
    limitations: rows.length === 0
      ? ["No seed receipts found. This is acceptable before the 38-county initial seed lane starts."]
      : []
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 38-County Seed Receipt Validation",
    "",
    `Generated: ${report.generatedAtUtc}`,
    `Root: \`${report.root}\``,
    "",
    "## Summary",
    "",
    `- Receipts found: ${report.summary.receiptsFound}`,
    `- Passed: ${report.summary.passed}`,
    `- Failed: ${report.summary.failed}`,
    `- No receipts found: ${report.summary.noReceiptsFound}`,
    "",
    "## Rows",
    "",
    "| County | Status | Derived | Passed | Blockers |",
    "|---|---|---|---:|---|"
  ];

  if (report.rows.length === 0) {
    lines.push("| - | - | - | - | No receipts found. |");
  } else {
    for (const row of report.rows) {
      lines.push(
        [
          row.county ?? "-",
          row.status ?? "-",
          row.derivedStatus,
          row.passed ? "yes" : "no",
          row.blockers.length ? row.blockers.join("<br>") : "-"
        ].join(" | ")
      );
    }
  }

  if (report.limitations.length) {
    lines.push("", "## Limitations", "");
    report.limitations.forEach((item) => lines.push(`- ${item}`));
  }

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = { root: DEFAULT_ROOT, outJson: DEFAULT_OUT_JSON, outMd: DEFAULT_OUT_MD, write: true };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--root") args.root = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }
  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = validateReceiptRoot(args.root);

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        receiptsFound: report.summary.receiptsFound,
        passed: report.summary.passed,
        failed: report.summary.failed,
        noReceiptsFound: report.summary.noReceiptsFound
      },
      null,
      2
    )
  );

  if (report.summary.failed > 0) process.exitCode = 1;
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
