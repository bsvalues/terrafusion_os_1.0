#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_WORK_ORDER_PACK = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-work-order-pack.latest.json"
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
  "june10-38-county-seed-execution-status.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-execution-status.latest.md"
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function receiptMap(receiptReport) {
  const map = new Map();
  for (const row of receiptReport?.rows ?? []) {
    if (row.county) map.set(normalize(row.county), row);
    if (row.countyToken) map.set(normalize(row.countyToken), row);
  }
  return map;
}

function actionForStatus(status) {
  switch (status) {
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
    case "NO_RECEIPT":
    default:
      return "capture_source_snapshot";
  }
}

function executionStatusFor(receipt) {
  if (!receipt) return "AWAITING_SOURCE_CAPTURE";
  if (receipt.passed === false || receipt.derivedStatus === "BLOCKED") return "BLOCKED_BY_RECEIPT";

  switch (receipt.derivedStatus) {
    case "SNAPSHOT_CAPTURED":
      return "RECEIPT_CAPTURED";
    case "NORMALIZED_READY":
      return "NORMALIZED_READY";
    case "LOADED_NEEDS_API_PROOF":
      return "LOADED_NEEDS_API_PROOF";
    case "API_PROVEN_NEEDS_UI_SMOKE":
      return "API_PROVEN_NEEDS_UI_SMOKE";
    case "LIMITED_WORKFLOW_READY":
      return "LIMITED_WORKFLOW_READY";
    default:
      return "AWAITING_SOURCE_CAPTURE";
  }
}

export function buildSeedExecutionStatus({ workOrderPack, receiptReport }) {
  const receipts = receiptMap(receiptReport);

  const rows = (workOrderPack?.workOrders ?? []).map((order) => {
    const receipt = receipts.get(normalize(order.countyToken)) ?? receipts.get(normalize(order.county));
    const receiptStatus = receipt?.derivedStatus ?? "NO_RECEIPT";
    const executionStatus = executionStatusFor(receipt);

    return {
      workOrderId: order.workOrderId,
      county: order.county,
      countyToken: order.countyToken,
      receiptTarget: order.receiptTarget,
      receiptStatus,
      receiptPassed: receipt?.passed ?? null,
      executionStatus,
      nextOperatorAction: actionForStatus(receiptStatus),
      runtimeClaimAllowed: false,
      blockers: receipt?.blockers ?? []
    };
  });

  const summary = {
    sourceWorkOrderPackGeneratedAtUtc: workOrderPack?.generatedAtUtc ?? null,
    sourceReceiptGeneratedAtUtc: receiptReport?.generatedAtUtc ?? null,
    workOrders: rows.length,
    receiptsFound: receiptReport?.summary?.receiptsFound ?? receiptReport?.rows?.length ?? 0,
    awaitingSourceCapture: rows.filter((row) => row.executionStatus === "AWAITING_SOURCE_CAPTURE").length,
    receiptCaptured: rows.filter((row) => row.executionStatus === "RECEIPT_CAPTURED").length,
    normalizedReady: rows.filter((row) => row.executionStatus === "NORMALIZED_READY").length,
    loadedNeedsApiProof: rows.filter((row) => row.executionStatus === "LOADED_NEEDS_API_PROOF").length,
    apiProvenNeedsUiSmoke: rows.filter((row) => row.executionStatus === "API_PROVEN_NEEDS_UI_SMOKE").length,
    limitedWorkflowReady: rows.filter((row) => row.executionStatus === "LIMITED_WORKFLOW_READY").length,
    blockedByReceiptFailure: rows.filter((row) => row.executionStatus === "BLOCKED_BY_RECEIPT").length,
    runtimeClaimAllowed: false
  };

  return {
    generatedAtUtc: new Date().toISOString(),
    summary,
    rows,
    rules: [
      "This status is a work-order control plane, not runtime readiness proof.",
      "Runtime claims remain blocked until receipts pass load, API proof, and UI smoke gates.",
      "Missing receipts mean acquisition work is pending, not complete.",
      "Failed receipts block promotion until corrected."
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 38-County Seed Execution Status",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    "## Summary",
    "",
    `- Work orders: ${report.summary.workOrders}`,
    `- Receipts found: ${report.summary.receiptsFound}`,
    `- Awaiting source capture: ${report.summary.awaitingSourceCapture}`,
    `- Receipt captured: ${report.summary.receiptCaptured}`,
    `- Normalized ready: ${report.summary.normalizedReady}`,
    `- Loaded needs API proof: ${report.summary.loadedNeedsApiProof}`,
    `- API proven needs UI smoke: ${report.summary.apiProvenNeedsUiSmoke}`,
    `- Limited workflow ready: ${report.summary.limitedWorkflowReady}`,
    `- Blocked by receipt failure: ${report.summary.blockedByReceiptFailure}`,
    `- Runtime claim allowed: ${report.summary.runtimeClaimAllowed}`,
    "",
    "## Work Orders",
    "",
    "| Work order | County | Execution status | Receipt | Next action |",
    "|---|---|---|---|---|"
  ];

  for (const row of report.rows) {
    lines.push(
      [
        `\`${row.workOrderId}\``,
        row.county,
        row.executionStatus,
        row.receiptStatus,
        row.nextOperatorAction
      ].join(" | ")
    );
  }

  lines.push("", "## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    workOrderPackPath: DEFAULT_WORK_ORDER_PACK,
    receiptsPath: DEFAULT_RECEIPTS,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--work-order-pack") args.workOrderPackPath = path.resolve(argv[++i]);
    else if (arg === "--receipts") args.receiptsPath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const workOrderPack = readJson(args.workOrderPackPath);
  const receiptReport = readJson(args.receiptsPath);
  const report = buildSeedExecutionStatus({ workOrderPack, receiptReport });

  if (report.summary.workOrders === 0) {
    throw new Error(`No seed work orders found in ${rel(args.workOrderPackPath)}`);
  }

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        workOrders: report.summary.workOrders,
        awaitingSourceCapture: report.summary.awaitingSourceCapture,
        receiptCaptured: report.summary.receiptCaptured,
        blockedByReceiptFailure: report.summary.blockedByReceiptFailure,
        runtimeClaimAllowed: report.summary.runtimeClaimAllowed
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
