#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_EXECUTION_RECEIPT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-shell-correction-execution.latest.json"
);
const DEFAULT_POST_EXECUTION_AUDIT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-shell-correction-post-execution-audit.latest.json"
);
const DEFAULT_SOURCE_ARTIFACT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-source-captures",
  "king",
  "king-parcels-source-native-raw.jsonl"
);
const DEFAULT_SOURCE_METADATA = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-source-captures",
  "king",
  "king-parcel-identity-capture-metadata.json"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-post-repair-certification-closure"
);
const DEFAULT_RECEIPT_PATH = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-receipt-posture",
  "king",
  "source-snapshot-receipt.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-post-repair-certification-closure.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-post-repair-certification-closure.latest.md"
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfPresent(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function artifact(filePath) {
  return {
    path: path.relative(repoRoot, filePath).replaceAll(path.sep, "/"),
    sha256: sha256File(filePath)
  };
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

export function buildKingPostRepairCertificationClosure({
  executionReceipt,
  postExecutionAudit,
  sourceArtifactPath,
  sourceMetadataPath
}) {
  const blockers = [];
  const verification = executionReceipt.verification ?? {};
  const identity = postExecutionAudit.sourceCanonicalIdentityVerification ?? {};
  const verdict = postExecutionAudit.postExecutionVerdict ?? {};

  if (executionReceipt.transactionCommitted !== true) blockers.push("King shell correction transaction is not committed.");
  if (verification.shellInserted !== 1137) blockers.push("Expected 1,137 King shell rows inserted.");
  if (verification.superseded !== 451) blockers.push("Expected 451 stale King rows superseded.");
  if (verification.caseCorrected !== 12) blockers.push("Expected 12 source-exact case corrections.");
  if (verification.activeDuplicateGroups !== 0) blockers.push("Active King duplicate parcel groups remain.");
  if (verification.placeholderInserted !== 0) blockers.push("Placeholder/tract rows were inserted.");
  if (identity.sourceOnlyNonPlaceholder !== 0) blockers.push("Non-placeholder source-only King identifiers remain.");
  if (identity.canonicalOnly !== 0) blockers.push("Canonical-only King identifiers remain.");
  if (verdict.identityParityAchievedUnderPolicyApprovedScope !== true) {
    blockers.push("Policy-approved King shell identity parity is not proven.");
  }

  const receiptStatus = blockers.length === 0 ? "receipt_backed_shell_present" : "blocked";
  const receipt = {
    receiptVersion: "wa_initial_seed_shell_present_v1",
    generatedAt: new Date().toISOString(),
    countyName: "King County",
    fips: "53033",
    sourceClass: "WA_INITIAL_SEED",
    sourceParcelIdField: "PIN",
    receiptStatus,
    trustPosture: "KING_PUBLIC_PARCEL_SHELL",
    counts: {
      parcelRowsLoaded: Number(verification.kingActiveRows ?? 0),
      distinctParcelIdsLoaded: Number(identity.canonicalActiveDistinct ?? 0),
      shellRowsInserted: Number(verification.shellInserted ?? 0),
      supersededRows: Number(verification.superseded ?? 0),
      placeholderRowsHeld: Number(executionReceipt.expectedCounts?.placeholderHeld ?? 0),
      canonicalOnlyAfter: Number(identity.canonicalOnly ?? 0),
      sourceOnlyNonPlaceholderAfter: Number(identity.sourceOnlyNonPlaceholder ?? 0)
    },
    rawArtifacts: fs.existsSync(sourceArtifactPath) ? [artifact(sourceArtifactPath)] : [],
    normalizedArtifacts: [
      {
        path: "canonical_tf.tf_parcel",
        sha256: null,
        note: "Runtime canonical table; row-level proof is in the execution receipt and post-execution audit."
      }
    ],
    supportingArtifacts: [
      artifact(DEFAULT_EXECUTION_RECEIPT),
      artifact(DEFAULT_POST_EXECUTION_AUDIT),
      ...(fs.existsSync(sourceMetadataPath) ? [artifact(sourceMetadataPath)] : [])
    ],
    transformationPath: [
      "public-source parcel identity capture",
      "King shell correction execution",
      "canonical_tf.tf_parcel source-native ParcelNumber posture",
      "KING_PUBLIC_PARCEL_SHELL trust posture"
    ],
    target: {
      terrafusionDbIdentity: "local canonical Postgres terrafusion/canonical_tf.tf_parcel",
      schema: "canonical_tf",
      table: "tf_parcel"
    },
    workflowLabels: {
      parcelIdentity: "available",
      ownerAddressValueDependentWorkflows: "blocked",
      officialValuation: "blocked",
      workflowCertification: "blocked"
    },
    noSecretValuesRecorded: true,
    productionBindingAllowed: false,
    certificationAllowed: false,
    blockers
  };

  return {
    generatedAt: new Date().toISOString(),
    countyName: "King County",
    fips: "53033",
    status: receiptStatus,
    kingMovesFrom: "blocked_identity_gap",
    kingMovesTo: receiptStatus,
    productionBindingAllowed: false,
    certificationAllowed: false,
    receiptConverted: blockers.length === 0,
    receipt,
    blockers
  };
}

function renderMarkdown(report) {
  const blockers = report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  return `# King Post-Repair Certification Closure

Generated: ${report.generatedAt}

## Verdict

- Status: ${report.status}
- Moved from: ${report.kingMovesFrom}
- Moved to: ${report.kingMovesTo}
- Receipt converted: ${report.receiptConverted ? "yes" : "no"}
- Certification allowed: ${report.certificationAllowed ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}

## Scope

King is receipt-backed for shell-present identity/context only. This does not certify King workflow completeness, owner/address/value workflows, official valuation, placeholder/tract rows, or production binding.

## Blockers

${blockers}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    executionReceipt: args.get("execution-receipt") ?? DEFAULT_EXECUTION_RECEIPT,
    postExecutionAudit: args.get("post-execution-audit") ?? DEFAULT_POST_EXECUTION_AUDIT,
    sourceArtifact: args.get("source-artifact") ?? DEFAULT_SOURCE_ARTIFACT,
    sourceMetadata: args.get("source-metadata") ?? DEFAULT_SOURCE_METADATA,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    receiptPath: args.get("receipt-path") ?? DEFAULT_RECEIPT_PATH,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };

  const report = buildKingPostRepairCertificationClosure({
    executionReceipt: readJson(paths.executionReceipt),
    postExecutionAudit: readJson(paths.postExecutionAudit),
    sourceArtifactPath: paths.sourceArtifact,
    sourceMetadataPath: paths.sourceMetadata,
    sourceMetadata: readJsonIfPresent(paths.sourceMetadata)
  });

  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  writeJson(path.join(paths.outRoot, "king-receipt.json"), report.receipt);
  writeJson(paths.receiptPath, report.receipt);

  console.log(`King post-repair certification closure written: ${path.relative(repoRoot, paths.outJson).replaceAll(path.sep, "/")}`);
  console.log(`Status: ${report.status}`);
  console.log(`Receipt converted: ${report.receiptConverted ? "yes" : "no"}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
