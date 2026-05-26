#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_RECONCILIATION = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-receipt-reconciliation.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-production-db-binding-plan.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-production-db-binding-plan.latest.md"
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--") continue;
    if (!argv[index]?.startsWith("--")) continue;
    args.set(argv[index].slice(2), argv[index + 1]);
    index += 1;
  }
  return args;
}

export function buildProductionDbBindingPlan({ receiptReconciliation }) {
  const blockers = [];
  const missing = Number(receiptReconciliation.summary?.receiptsMissing ?? 0);
  if (missing > 0) blockers.push(`${missing} WA_INITIAL_SEED counties still lack verified receipt posture.`);
  if (receiptReconciliation.productionBindingAllowed !== true) {
    blockers.push("WA_INITIAL_SEED receipt reconciliation does not allow production binding.");
  }

  return {
    generatedAt: new Date().toISOString(),
    planType: "june10_canonical_postgres_production_binding_plan",
    productionBindingAllowed: false,
    targetRuntimeModel: "TerraFusion canonical Postgres DB -> terrafusionmarket.com runtime",
    currentPosture: {
      receiptsVerified: receiptReconciliation.summary?.receiptsVerified ?? 0,
      receiptsMissing: missing,
      fullIdentityReceipts: receiptReconciliation.summary?.fullIdentityReceipts ?? 0,
      shellPresentReceipts: receiptReconciliation.summary?.shellPresentReceipts ?? 0
    },
    decision: "BLOCKED",
    blockers,
    allowedNextActions: [
      "Continue county-by-county receipt closure.",
      "Adjudicate Cowlitz or Yakima next.",
      "Do not bind production until receipt posture is acceptable."
    ],
    forbiddenActions: [
      "Do not bind terrafusionmarket.com to the canonical DB from this posture.",
      "Do not claim 39-county production certification.",
      "Do not treat shell-present King as workflow-certified."
    ]
  };
}

function renderMarkdown(report) {
  const blockers = report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  return `# June 10 Production DB Binding Plan

Generated: ${report.generatedAt}

## Verdict

- Decision: ${report.decision}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}
- Receipts verified: ${report.currentPosture.receiptsVerified}
- Receipts missing: ${report.currentPosture.receiptsMissing}
- Full-identity receipts: ${report.currentPosture.fullIdentityReceipts}
- Shell-present receipts: ${report.currentPosture.shellPresentReceipts}

## Blockers

${blockers}

## Next Actions

- Continue county-by-county receipt closure.
- Adjudicate Cowlitz or Yakima next.
- Do not bind production until receipt posture is acceptable.
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    reconciliation: args.get("reconciliation") ?? DEFAULT_RECONCILIATION,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const report = buildProductionDbBindingPlan({
    receiptReconciliation: readJson(paths.reconciliation)
  });
  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`Production DB binding plan written: ${path.relative(repoRoot, paths.outJson).replaceAll(path.sep, "/")}`);
  console.log(`Decision: ${report.decision}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
