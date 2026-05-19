#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_WAVE_PLAN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-wave-plan.latest.json"
);
const DEFAULT_WORK_ORDER_PACK = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-work-order-pack.latest.json"
);
const DEFAULT_RECEIPT_TEMPLATE_PACK = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-receipt-template-pack.latest.json"
);
const DEFAULT_RECEIPTS = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-receipts.latest.json"
);
const DEFAULT_EXECUTION_STATUS = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-execution-status.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-control-plane.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-control-plane.latest.md"
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function indexByWorkOrder(rows) {
  const map = new Map();
  for (const row of rows ?? []) {
    if (row.workOrderId) map.set(row.workOrderId, row);
  }
  return map;
}

function assertRuntimeClaimBlocked(blockers, label, artifact) {
  if (artifact?.summary?.runtimeClaimAllowed !== false) {
    blockers.push(`${label}: runtimeClaimAllowed must remain false.`);
  }
}

function compareTargets(blockers, workOrder, template, status) {
  if (!template) {
    blockers.push(`${workOrder.workOrderId}: missing receipt template.`);
    return;
  }
  if (!status) {
    blockers.push(`${workOrder.workOrderId}: missing execution status row.`);
    return;
  }

  if (template.receiptTarget !== workOrder.receiptTarget) {
    blockers.push(`${workOrder.workOrderId}: receipt target mismatch between work order and template.`);
  }
  if (status.receiptTarget !== workOrder.receiptTarget) {
    blockers.push(`${workOrder.workOrderId}: receipt target mismatch between work order and execution status.`);
  }
  if (template.templateOnly !== true) {
    blockers.push(`${workOrder.workOrderId}: receipt template must remain templateOnly=true.`);
  }
  if (workOrder.runtimeClaimAllowed !== false || template.runtimeClaimAllowed !== false || status.runtimeClaimAllowed !== false) {
    blockers.push(`${workOrder.workOrderId}: runtimeClaimAllowed must remain false.`);
  }
}

export function buildSeedControlPlane({ wavePlan, workOrderPack, receiptTemplates, receiptReport, executionStatus }) {
  const blockers = [];
  const workOrders = workOrderPack?.workOrders ?? [];
  const templateById = indexByWorkOrder(receiptTemplates?.templates);
  const statusById = indexByWorkOrder(executionStatus?.rows);
  const waveById = indexByWorkOrder(wavePlan?.workOrders);

  assertRuntimeClaimBlocked(blockers, "wave plan", wavePlan);
  assertRuntimeClaimBlocked(blockers, "work order pack", workOrderPack);
  assertRuntimeClaimBlocked(blockers, "receipt template pack", receiptTemplates);
  assertRuntimeClaimBlocked(blockers, "execution status", executionStatus);

  if ((wavePlan?.summary?.firstWaveWorkOrders ?? 0) !== workOrders.length) {
    blockers.push("wave plan firstWaveWorkOrders does not match work order pack count.");
  }
  if ((receiptTemplates?.summary?.templates ?? 0) !== workOrders.length) {
    blockers.push("receipt template count does not match work order pack count.");
  }
  if ((executionStatus?.summary?.workOrders ?? 0) !== workOrders.length) {
    blockers.push("execution status work order count does not match work order pack count.");
  }

  for (const workOrder of workOrders) {
    const wave = waveById.get(workOrder.workOrderId);
    const template = templateById.get(workOrder.workOrderId);
    const status = statusById.get(workOrder.workOrderId);

    if (!wave) {
      blockers.push(`${workOrder.workOrderId}: missing wave plan row.`);
    }
    compareTargets(blockers, workOrder, template, status);
  }

  const rows = workOrders.map((workOrder) => {
    const status = statusById.get(workOrder.workOrderId);
    const template = templateById.get(workOrder.workOrderId);
    return {
      workOrderId: workOrder.workOrderId,
      county: workOrder.county,
      countyToken: workOrder.countyToken,
      receiptTarget: workOrder.receiptTarget,
      executionStatus: status?.executionStatus ?? "MISSING",
      templateOnly: template?.templateOnly ?? null,
      runtimeClaimAllowed: false
    };
  });

  const summary = {
    workOrders: workOrders.length,
    templates: receiptTemplates?.summary?.templates ?? 0,
    receiptsFound: receiptReport?.summary?.receiptsFound ?? 0,
    awaitingSourceCapture: executionStatus?.summary?.awaitingSourceCapture ?? 0,
    blockedByReceiptFailure: executionStatus?.summary?.blockedByReceiptFailure ?? 0,
    runtimeClaimAllowed: false,
    blockers: blockers.length
  };

  return {
    generatedAtUtc: new Date().toISOString(),
    passed: blockers.length === 0,
    summary,
    rows,
    blockers,
    rules: [
      "This control plane reconciles seed artifacts only; it is not runtime readiness proof.",
      "Runtime claims remain blocked until validated receipts, API proof, and UI smoke exist.",
      "Receipt templates must never be counted as acquisition evidence.",
      "Work order, template, and execution status receipt targets must match exactly."
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 38-County Seed Control Plane",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Passed: ${report.passed}`,
    "",
    "## Summary",
    "",
    `- Work orders: ${report.summary.workOrders}`,
    `- Templates: ${report.summary.templates}`,
    `- Receipts found: ${report.summary.receiptsFound}`,
    `- Awaiting source capture: ${report.summary.awaitingSourceCapture}`,
    `- Blocked by receipt failure: ${report.summary.blockedByReceiptFailure}`,
    `- Runtime claim allowed: ${report.summary.runtimeClaimAllowed}`,
    `- Blockers: ${report.summary.blockers}`,
    "",
    "## Work Orders",
    "",
    "| Work order | County | Execution status | Receipt target |",
    "|---|---|---|---|"
  ];

  for (const row of report.rows) {
    lines.push([`\`${row.workOrderId}\``, row.county, row.executionStatus, `\`${row.receiptTarget}\``].join(" | "));
  }

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) {
    lines.push("- None");
  } else {
    report.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
  }

  lines.push("", "## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    wavePlanPath: DEFAULT_WAVE_PLAN,
    workOrderPackPath: DEFAULT_WORK_ORDER_PACK,
    receiptTemplatePackPath: DEFAULT_RECEIPT_TEMPLATE_PACK,
    receiptsPath: DEFAULT_RECEIPTS,
    executionStatusPath: DEFAULT_EXECUTION_STATUS,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--wave-plan") args.wavePlanPath = path.resolve(argv[++i]);
    else if (arg === "--work-order-pack") args.workOrderPackPath = path.resolve(argv[++i]);
    else if (arg === "--receipt-template-pack") args.receiptTemplatePackPath = path.resolve(argv[++i]);
    else if (arg === "--receipts") args.receiptsPath = path.resolve(argv[++i]);
    else if (arg === "--execution-status") args.executionStatusPath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildSeedControlPlane({
    wavePlan: readJson(args.wavePlanPath),
    workOrderPack: readJson(args.workOrderPackPath),
    receiptTemplates: readJson(args.receiptTemplatePackPath),
    receiptReport: readJson(args.receiptsPath),
    executionStatus: readJson(args.executionStatusPath)
  });

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
        passed: report.passed,
        workOrders: report.summary.workOrders,
        receiptsFound: report.summary.receiptsFound,
        blockers: report.summary.blockers,
        runtimeClaimAllowed: report.summary.runtimeClaimAllowed
      },
      null,
      2
    )
  );

  if (!report.passed) {
    process.exitCode = 2;
  }

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
