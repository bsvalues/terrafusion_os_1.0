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
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-receipt-template-pack.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-seed-receipt-template-pack.latest.md"
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function templateReceiptFor(order) {
  return {
    receiptVersion: "june10-seed-v1",
    status: "ATTEMPT",
    claimLabel: "attempt only",
    capturedAtUtc: "REPLACE_WITH_CAPTURE_TIMESTAMP_UTC",
    county: order.county,
    countyToken: order.countyToken,
    state: "WA",
    fips: "REPLACE_WITH_COUNTY_FIPS",
    sourceSystem: {
      systemName: "REPLACE_WITH_PUBLIC_SOURCE_SYSTEM_NAME",
      url: "REPLACE_WITH_VERIFIED_PUBLIC_SOURCE_URL",
      accessMethod: "browser_or_public_download",
      notes: "Do not record secrets, cookies, bearer tokens, passwords, or private credentials."
    },
    noSecretValuesRecorded: true,
    rawArtifacts: [
      {
        path: `evidence/june10-38-county-seed/${order.countyToken}/raw/REPLACE_WITH_ARTIFACT_FILE`,
        sha256: "REPLACE_WITH_SHA256",
        capturedAtUtc: "REPLACE_WITH_CAPTURE_TIMESTAMP_UTC",
        sourceUrl: "REPLACE_WITH_ARTIFACT_SOURCE_URL"
      }
    ],
    normalizedArtifacts: [
      {
        path: `evidence/june10-38-county-seed/${order.countyToken}/normalized/REPLACE_WITH_NORMALIZED_FILE`,
        schema: "terrafusion-seed-parcel-v1",
        sha256: "REPLACE_WITH_SHA256"
      }
    ],
    target: {
      terrafusionDbIdentity: "REPLACE_AFTER_TERRAFUSION_DB_IDENTITY_PROOF",
      databaseRole: "initial_seed_staging",
      schema: "REPLACE_WITH_TERRAFUSION_SEED_SCHEMA",
      tables: ["REPLACE_WITH_TARGET_TABLE"]
    },
    counts: {
      parcelRowsNormalized: 0,
      parcelRowsLoaded: 0,
      distinctParcelIdsLoaded: 0
    },
    apiProof: {
      endpoint: "REPLACE_AFTER_LOAD",
      status: null,
      payloadCounty: order.county,
      countyEcho: false,
      fallbackDetected: null,
      rowCount: 0
    },
    uiSmoke: {
      performed: false,
      frontendUrl: "REPLACE_AFTER_API_PROOF",
      screenshotFolder: `evidence/june10-38-county-seed/${order.countyToken}/ui-smoke`,
      trustLabelVisible: false,
      unsupportedWorkflowLabelsVisible: false
    },
    workflowLabels: {
      inspectParcels: "blocked",
      previewScenario: "blocked",
      costForgeEstimate: "blocked",
      officialValuation: "blocked"
    },
    notes: [
      "This template is intentionally not a passing receipt.",
      "Replace every REPLACE_* value with observed evidence before validation.",
      "Do not record source-system secrets or private credentials.",
      "Do not claim runtime readiness until load, API proof, and UI smoke gates pass."
    ]
  };
}

export function buildSeedReceiptTemplatePack({ workOrderPack }) {
  const templates = (workOrderPack?.workOrders ?? []).map((order) => ({
    workOrderId: order.workOrderId,
    county: order.county,
    countyToken: order.countyToken,
    receiptTarget: order.receiptTarget,
    templateOnly: true,
    runtimeClaimAllowed: false,
    receipt: templateReceiptFor(order)
  }));

  return {
    generatedAtUtc: new Date().toISOString(),
    sourceWorkOrderPackGeneratedAtUtc: workOrderPack?.generatedAtUtc ?? null,
    summary: {
      templates: templates.length,
      templateOnly: true,
      runtimeClaimAllowed: false
    },
    rules: [
      "Templates are not receipts and must not be counted as acquisition evidence.",
      "Only files written to the receipt target path and passing the seed receipt validator may advance status.",
      "All REPLACE_* placeholders must be replaced by observed evidence.",
      "No runtime claim is allowed from this template pack."
    ],
    templates
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 38-County Seed Receipt Template Pack",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    "## Summary",
    "",
    `- Templates: ${report.summary.templates}`,
    `- Template only: ${report.summary.templateOnly}`,
    `- Runtime claim allowed: ${report.summary.runtimeClaimAllowed}`,
    "",
    "## Templates",
    "",
    "| Work order | County | Receipt target | Template only |",
    "|---|---|---|---|"
  ];

  for (const template of report.templates) {
    lines.push(
      [
        `\`${template.workOrderId}\``,
        template.county,
        `\`${template.receiptTarget}\``,
        String(template.templateOnly)
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
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--work-order-pack") args.workOrderPackPath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const workOrderPack = readJson(args.workOrderPackPath);
  const report = buildSeedReceiptTemplatePack({ workOrderPack });

  if (report.summary.templates === 0) {
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
        templates: report.summary.templates,
        templateOnly: report.summary.templateOnly,
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
