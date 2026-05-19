#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_COVERAGE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "washington-39-county-coverage.latest.json"
);
const DEFAULT_RECEIPTS = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-receipts.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-wave-plan.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-wave-plan.latest.md"
);

const REPRESENTATIVE_BY_FAMILY = new Map([
  ["Direct sales search", "Yakima"],
  ["Parcel transfer history", "Cowlitz"],
  ["Monthly sales report", "Klickitat"],
  ["Monthly report / parcel history", "Douglas"],
  ["Parcel transfer history / open data export", "Kitsap"]
]);

const FALLBACK_RANK = new Map([
  ["P1", 1],
  ["P2", 2],
  ["P3", 3]
]);

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function countyReceiptMap(receiptReport) {
  const map = new Map();
  for (const row of receiptReport?.rows ?? []) {
    if (row.county) map.set(normalize(row.county), row);
    if (row.countyToken) map.set(normalize(row.countyToken), row);
  }
  return map;
}

function sortCountyRows(rows) {
  return [...rows].sort((a, b) => {
    const priorityA = FALLBACK_RANK.get(a.priority) ?? 9;
    const priorityB = FALLBACK_RANK.get(b.priority) ?? 9;
    return priorityA - priorityB || a.county.localeCompare(b.county);
  });
}

function representativeForFamily(family, rows) {
  const preferred = REPRESENTATIVE_BY_FAMILY.get(family);
  if (preferred) {
    const match = rows.find((row) => row.county === preferred);
    if (match) return match;
  }
  return sortCountyRows(rows)[0] ?? null;
}

function nextActionForReceipt(receipt) {
  if (!receipt) return "capture_source_snapshot";
  switch (receipt.derivedStatus) {
    case "SNAPSHOT_CAPTURED":
      return "normalize_payload";
    case "NORMALIZED_READY":
      return "load_staging_terrafusion_db";
    case "LOADED_NEEDS_API_PROOF":
      return "run_api_proof";
    case "API_PROVEN_NEEDS_UI_SMOKE":
      return "run_ui_smoke";
    case "LIMITED_WORKFLOW_READY":
      return "hold_for_claim_review";
    case "BLOCKED":
      return "resolve_blocker";
    default:
      return "capture_source_snapshot";
  }
}

export function buildSeedWavePlan({ coverage, receipts }) {
  const counties = (coverage?.counties ?? []).filter((row) => row.county !== "Benton");
  const receiptMap = countyReceiptMap(receipts);
  const families = new Map();

  for (const county of counties) {
    const family = county.acquisitionFamily || "Unknown";
    if (!families.has(family)) families.set(family, []);
    families.get(family).push(county);
  }

  const familyRows = [];
  const workOrders = [];

  for (const [family, rows] of [...families.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const representative = representativeForFamily(family, rows);
    const receipt = representative ? receiptMap.get(normalize(representative.county)) : null;
    const status = receipt?.derivedStatus ?? "NO_RECEIPT";
    const nextAction = nextActionForReceipt(receipt);

    familyRows.push({
      acquisitionFamily: family,
      countyCount: rows.length,
      representativeCounty: representative?.county ?? null,
      representativePriority: representative?.priority ?? null,
      representativeStatus: representative?.status ?? null,
      receiptStatus: status,
      nextAction
    });

    if (representative) {
      workOrders.push({
        workOrderId: `J10-SEED-${normalize(family)}-${normalize(representative.county)}`.toUpperCase(),
        county: representative.county,
        countyToken: normalize(representative.county),
        acquisitionFamily: family,
        priority: representative.priority,
        registryStatus: representative.status,
        officialAssessorBaseUrl: representative.officialAssessorBaseUrl,
        primarySalesSource: representative.primarySalesSource,
        fallbackSource: representative.fallbackSource,
        gisMapSurface: representative.gisMapSurface,
        receiptStatus: status,
        nextAction,
        claimAllowed: "source/seed work order only",
        forbiddenClaims: [
          "runtime-ready",
          "full county data loaded",
          "official county-certified valuation",
          "CostForge official calibration"
        ]
      });
    }
  }

  const summary = {
    countiesInScope: counties.length,
    familiesInScope: familyRows.length,
    firstWaveWorkOrders: workOrders.length,
    workOrdersWithoutReceipt: workOrders.filter((order) => order.receiptStatus === "NO_RECEIPT").length,
    limitedWorkflowReady: workOrders.filter((order) => order.receiptStatus === "LIMITED_WORKFLOW_READY").length,
    bentonExcluded: true,
    runtimeClaimAllowed: false
  };

  return {
    generatedAtUtc: new Date().toISOString(),
    sourceCoverageGeneratedAtUtc: coverage?.generatedAtUtc ?? null,
    sourceReceiptGeneratedAtUtc: receipts?.generatedAtUtc ?? null,
    summary,
    familyRows,
    workOrders,
    rules: [
      "This is a first-wave seed work plan, not a runtime readiness certification.",
      "Benton is excluded because Benton is owned by the active Sync/runtime proof lane.",
      "A county cannot move past a work order claim without a validated seed receipt.",
      "No 38-county or 39-county runtime claim is allowed from this plan."
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 38-County Seed Wave Plan",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    "## Summary",
    "",
    `- Counties in scope: ${report.summary.countiesInScope}`,
    `- Acquisition families in scope: ${report.summary.familiesInScope}`,
    `- First-wave work orders: ${report.summary.firstWaveWorkOrders}`,
    `- Work orders without receipt: ${report.summary.workOrdersWithoutReceipt}`,
    `- Limited workflow ready: ${report.summary.limitedWorkflowReady}`,
    `- Benton excluded: ${report.summary.bentonExcluded}`,
    `- Runtime claim allowed: ${report.summary.runtimeClaimAllowed}`,
    "",
    "## Family Plan",
    "",
    "| Family | Counties | Representative | Receipt | Next action |",
    "|---|---:|---|---|---|"
  ];

  for (const row of report.familyRows) {
    lines.push(
      [
        row.acquisitionFamily,
        row.countyCount,
        row.representativeCounty ?? "-",
        row.receiptStatus,
        row.nextAction
      ].join(" | ")
    );
  }

  lines.push("", "## First-Wave Work Orders", "", "| Work order | County | Family | Next action | Claim allowed |", "|---|---|---|---|---|");

  for (const order of report.workOrders) {
    lines.push(
      [
        `\`${order.workOrderId}\``,
        order.county,
        order.acquisitionFamily,
        order.nextAction,
        order.claimAllowed
      ].join(" | ")
    );
  }

  lines.push("", "## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    coveragePath: DEFAULT_COVERAGE,
    receiptsPath: DEFAULT_RECEIPTS,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--coverage") args.coveragePath = path.resolve(argv[++i]);
    else if (arg === "--receipts") args.receiptsPath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const coverage = readJson(args.coveragePath);
  const receipts = readJson(args.receiptsPath, { rows: [] });

  if (!coverage?.counties?.length) {
    throw new Error(`Coverage artifact missing or empty: ${rel(args.coveragePath)}`);
  }

  const report = buildSeedWavePlan({ coverage, receipts });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        countiesInScope: report.summary.countiesInScope,
        firstWaveWorkOrders: report.summary.firstWaveWorkOrders,
        runtimeClaimAllowed: report.summary.runtimeClaimAllowed,
        workOrdersWithoutReceipt: report.summary.workOrdersWithoutReceipt
      },
      null,
      2
    )
  );

  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
