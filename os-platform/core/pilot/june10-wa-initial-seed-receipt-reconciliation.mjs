#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const WA_SEED_FIPS = [
  "53001", "53003", "53007", "53009", "53011", "53013", "53015", "53017", "53019",
  "53021", "53023", "53025", "53027", "53029", "53031", "53033", "53035", "53037", "53039",
  "53041", "53043", "53045", "53047", "53049", "53051", "53053", "53055", "53057", "53059",
  "53061", "53063", "53065", "53067", "53069", "53071", "53073", "53075", "53077"
];

const DEFAULT_RECEIPT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-receipt-posture"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-receipt-reconciliation.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-receipt-reconciliation.latest.md"
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

function classifyReceipt(receipt) {
  if (receipt.receiptVersion === "wa_initial_seed_post_repair_v1") {
    return "receipt_backed_full_identity";
  }
  if (receipt.receiptVersion === "wa_initial_seed_shell_present_v1") {
    return "receipt_backed_shell_present";
  }
  return "unknown_receipt_version";
}

function findReceipts(root) {
  if (!fs.existsSync(root)) return [];
  const receipts = [];
  for (const countyDir of fs.readdirSync(root, { withFileTypes: true })) {
    if (!countyDir.isDirectory()) continue;
    const receiptPath = path.join(root, countyDir.name, "source-snapshot-receipt.json");
    if (!fs.existsSync(receiptPath)) continue;
    const receipt = readJson(receiptPath);
    receipts.push({
      countySlug: countyDir.name,
      path: path.relative(repoRoot, receiptPath).replaceAll(path.sep, "/"),
      countyName: receipt.countyName,
      fips: String(receipt.fips),
      receiptVersion: receipt.receiptVersion,
      status: classifyReceipt(receipt),
      trustPosture: receipt.trustPosture ?? null,
      productionBindingAllowed: receipt.productionBindingAllowed === true,
      certificationAllowed: receipt.certificationAllowed === true
    });
  }
  return receipts.sort((a, b) => a.fips.localeCompare(b.fips));
}

export function buildWaInitialSeedReceiptReconciliation({ receipts }) {
  const verifiedReceipts = receipts.filter((receipt) =>
    ["receipt_backed_full_identity", "receipt_backed_shell_present"].includes(receipt.status)
  );
  const byFips = new Map(verifiedReceipts.map((receipt) => [receipt.fips, receipt]));
  const missingFips = WA_SEED_FIPS.filter((fips) => !byFips.has(fips));
  const shellPresent = verifiedReceipts.filter((receipt) => receipt.status === "receipt_backed_shell_present");
  const fullIdentity = verifiedReceipts.filter((receipt) => receipt.status === "receipt_backed_full_identity");

  return {
    generatedAt: new Date().toISOString(),
    scope: "38 WA_INITIAL_SEED counties; Benton is excluded from this public-source seed receipt count.",
    productionBindingAllowed: false,
    summary: {
      expectedSeedCounties: WA_SEED_FIPS.length,
      receiptsVerified: verifiedReceipts.length,
      fullIdentityReceipts: fullIdentity.length,
      shellPresentReceipts: shellPresent.length,
      receiptsMissing: missingFips.length
    },
    verifiedReceipts,
    missingFips,
    blockers:
      missingFips.length > 0
        ? [`${missingFips.length} WA_INITIAL_SEED counties still lack verified receipt posture.`]
        : [],
    notes: [
      "King shell-present receipt is identity/context only and does not certify workflow completeness.",
      "Spokane full-identity receipt remains receipt-backed.",
      "Production binding remains blocked while any WA_INITIAL_SEED receipt gaps remain."
    ]
  };
}

function renderMarkdown(report) {
  const receipts = report.verifiedReceipts
    .map((receipt) => `| ${receipt.countyName} | ${receipt.fips} | ${receipt.status} | ${receipt.trustPosture ?? "-"} |`)
    .join("\n");
  const blockers = report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  return `# WA_INITIAL_SEED Receipt Reconciliation

Generated: ${report.generatedAt}

## Summary

- Expected seed counties: ${report.summary.expectedSeedCounties}
- Receipts verified: ${report.summary.receiptsVerified}
- Full-identity receipts: ${report.summary.fullIdentityReceipts}
- Shell-present receipts: ${report.summary.shellPresentReceipts}
- Receipts missing: ${report.summary.receiptsMissing}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}

## Verified Receipts

| County | FIPS | Status | Trust posture |
| --- | --- | --- | --- |
${receipts || "| - | - | - | - |"}

## Blockers

${blockers}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    receiptRoot: args.get("receipt-root") ?? DEFAULT_RECEIPT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const report = buildWaInitialSeedReceiptReconciliation({
    receipts: findReceipts(paths.receiptRoot)
  });
  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`WA_INITIAL_SEED receipt reconciliation written: ${path.relative(repoRoot, paths.outJson).replaceAll(path.sep, "/")}`);
  console.log(`Receipts verified: ${report.summary.receiptsVerified}`);
  console.log(`Receipts missing: ${report.summary.receiptsMissing}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
