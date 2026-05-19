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
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-work-order-pack.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-work-order-pack.latest.md"
);

const REQUIRED_RECEIPT_FIELDS = [
  "county",
  "countyToken",
  "state",
  "fips",
  "sourceSystem.url",
  "sourceSystem.systemName",
  "rawArtifacts[].path",
  "rawArtifacts[].sha256",
  "rawArtifacts[].capturedAtUtc",
  "noSecretValuesRecorded",
  "normalizedArtifacts[].schema",
  "normalizedArtifacts[].sha256",
  "target.terrafusionDbIdentity",
  "target.databaseRole",
  "target.schema",
  "target.tables[]",
  "counts.parcelRowsNormalized",
  "counts.parcelRowsLoaded",
  "counts.distinctParcelIdsLoaded",
  "workflowLabels"
];

const DOCTRINE = [
  "TerraFusion DB is product runtime truth.",
  "Legacy/public source systems are acquisition inputs only.",
  "Product runtime claims require TerraFusion API proof over TerraFusion DB rows.",
  "No 38-county or 39-county runtime claim is allowed from source acquisition work orders.",
  "No official county-certified valuation claim is allowed from public-source seed data."
];

const STOP_CONDITIONS = [
  "Source content is sample, demo, or synthetic.",
  "Source identity cannot be tied to the named county.",
  "Raw artifact hash or capture timestamp is missing.",
  "Receipt would require storing a secret, cookie, bearer token, or password.",
  "Normalized schema is not TerraFusion-owned.",
  "TerraFusion DB target identity is missing before load claims.",
  "Loaded rows cannot be proven through TerraFusion API without fallback."
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function stageForAction(nextAction) {
  switch (nextAction) {
    case "normalize_payload":
      return "normalization";
    case "load_staging_terrafusion_db":
      return "staging_load";
    case "run_api_proof":
      return "api_proof";
    case "run_ui_smoke":
      return "ui_smoke";
    case "hold_for_claim_review":
      return "claim_review";
    case "resolve_blocker":
      return "blocked";
    case "capture_source_snapshot":
    default:
      return "source_snapshot";
  }
}

function receiptTargetFor(order) {
  return `evidence/june10-38-county-seed/${order.countyToken}/source-snapshot-receipt.json`;
}

function sourceCaptureChecklist(order) {
  return [
    `Verify official assessor/source URL for ${order.county}: ${order.officialAssessorBaseUrl}`,
    `Capture the primary sales or parcel source named by the registry: ${order.primarySalesSource}`,
    `Record fallback source if primary source is unavailable: ${order.fallbackSource}`,
    `Record GIS/map surface for parcel identity cross-check: ${order.gisMapSurface}`,
    "Store raw artifacts by path, SHA-256, and capturedAtUtc timestamp.",
    "Confirm no secrets, cookies, passwords, or bearer tokens are stored in the receipt."
  ];
}

function normalizationChecklist() {
  return [
    "Normalize only into TerraFusion-owned seed schemas.",
    "Preserve county, countyToken, state, and FIPS fields.",
    "Emit parcel row count and distinct parcel identifier count.",
    "Reject payloads that cannot prove county identity."
  ];
}

function loadProofChecklist() {
  return [
    "Record TerraFusion DB identity before any load claim.",
    "Load into staging/seed-owned TerraFusion DB tables only.",
    "Record target schema, table names, loaded row count, and distinct parcel count.",
    "Do not use direct product runtime access to source systems."
  ];
}

function apiUiProofChecklist() {
  return [
    "Probe TerraFusion API for the selected county after load.",
    "Verify payload county identity and row count.",
    "Reject Benton fallback or any other county fallback.",
    "Run UI smoke only after API proof exists."
  ];
}

export function buildSeedWorkOrderPack({ wavePlan }) {
  const workOrders = (wavePlan?.workOrders ?? []).map((order) => ({
    workOrderId: order.workOrderId,
    county: order.county,
    countyToken: order.countyToken,
    acquisitionFamily: order.acquisitionFamily,
    priority: order.priority,
    registryStatus: order.registryStatus,
    currentStage: stageForAction(order.nextAction),
    nextAction: order.nextAction,
    receiptStatus: order.receiptStatus,
    receiptTarget: receiptTargetFor(order),
    runtimeClaimAllowed: false,
    claimAllowed: order.claimAllowed,
    forbiddenClaims: [
      ...new Set([
        ...(order.forbiddenClaims ?? []),
        "runtime-ready",
        "full county data loaded",
        "official county-certified valuation",
        "CostForge official calibration"
      ])
    ],
    doctrine: DOCTRINE,
    requiredReceiptFields: REQUIRED_RECEIPT_FIELDS,
    sourceCaptureChecklist: sourceCaptureChecklist(order),
    normalizationChecklist: normalizationChecklist(),
    loadProofChecklist: loadProofChecklist(),
    apiUiProofChecklist: apiUiProofChecklist(),
    stopConditions: STOP_CONDITIONS
  }));

  const summary = {
    sourceWavePlanGeneratedAtUtc: wavePlan?.generatedAtUtc ?? null,
    workOrders: workOrders.length,
    runtimeClaimAllowed: false,
    sourceSnapshotStage: workOrders.filter((order) => order.currentStage === "source_snapshot").length,
    blocked: workOrders.filter((order) => order.currentStage === "blocked").length,
    receiptTargets: workOrders.map((order) => order.receiptTarget)
  };

  return {
    generatedAtUtc: new Date().toISOString(),
    summary,
    doctrine: DOCTRINE,
    workOrders
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 38-County Seed Work Order Pack",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    "## Summary",
    "",
    `- Work orders: ${report.summary.workOrders}`,
    `- Runtime claim allowed: ${report.summary.runtimeClaimAllowed}`,
    `- Source snapshot stage: ${report.summary.sourceSnapshotStage}`,
    `- Blocked: ${report.summary.blocked}`,
    "",
    "## Doctrine",
    ""
  ];

  report.doctrine.forEach((item) => lines.push(`- ${item}`));

  lines.push(
    "",
    "## Work Orders",
    "",
    "| Work order | County | Stage | Receipt target | Next action |",
    "|---|---|---|---|---|"
  );

  for (const order of report.workOrders) {
    lines.push(
      [
        `\`${order.workOrderId}\``,
        order.county,
        order.currentStage,
        `\`${order.receiptTarget}\``,
        order.nextAction
      ].join(" | ")
    );
  }

  lines.push("", "## Required Receipt Fields", "");
  REQUIRED_RECEIPT_FIELDS.forEach((field) => lines.push(`- \`${field}\``));

  lines.push("", "## Stop Conditions", "");
  STOP_CONDITIONS.forEach((condition) => lines.push(`- ${condition}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    wavePlanPath: DEFAULT_WAVE_PLAN,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--wave-plan") args.wavePlanPath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const wavePlan = readJson(args.wavePlanPath);
  const report = buildSeedWorkOrderPack({ wavePlan });

  if (report.summary.workOrders === 0) {
    throw new Error(`No seed work orders found in ${rel(args.wavePlanPath)}`);
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
        runtimeClaimAllowed: report.summary.runtimeClaimAllowed,
        sourceSnapshotStage: report.summary.sourceSnapshotStage,
        blocked: report.summary.blocked
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
