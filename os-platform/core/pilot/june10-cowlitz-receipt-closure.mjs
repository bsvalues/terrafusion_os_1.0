#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_POST_REPAIR_CLOSURE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-post-repair-certification-closure.latest.json"
);
const DEFAULT_IDENTIFIER_ROOT_CAUSE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-parcel-identifier-root-cause.latest.json"
);
const DEFAULT_REPAIR_DRY_RUN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-parcel-identity-repair-dry-run",
  "cowlitz",
  "dry-run-report.json"
);
const DEFAULT_REPAIR_RECEIPT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-pilot-repair-execution",
  "repair-receipt.after-execution.json"
);
const DEFAULT_SOURCE_SNAPSHOT_RECEIPT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-reimport-dry-run",
  "cowlitz",
  "source-snapshot-receipt.json"
);
const DEFAULT_SOURCE_METADATA = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-source-captures",
  "cowlitz",
  "cowlitz-parcels-parcno-capture-metadata.json"
);
const DEFAULT_BOUNDED_EXECUTION_RECEIPT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-bounded-correction-execution.latest.json"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-receipt-closure"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-receipt-closure.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-receipt-closure.latest.md"
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

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function artifact(filePath) {
  return {
    path: path.relative(repoRoot, filePath).replaceAll(path.sep, "/"),
    sha256: fs.existsSync(filePath) ? sha256File(filePath) : null
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

function findCounty(postRepairClosure, fips) {
  return postRepairClosure.counties?.find((county) => county.fips === fips);
}

export function buildCowlitzReceiptClosure({
  postRepairCounty,
  rowCountAdjudication,
  identifierRootCause,
  repairDryRun,
  repairReceipt,
  boundedExecutionReceipt = null
}) {
  const blockers = [];
  const sourceOnlyCount = Number(postRepairCounty.sourceOnlyCount ?? 0);
  const canonicalOnlyCount = Number(postRepairCounty.canonicalOnlyCount ?? 0);
  const exactOverlap = Number(postRepairCounty.exactOverlap ?? 0);
  const canonicalDistinct = Number(postRepairCounty.canonicalDistinct ?? 0);
  const sourceDistinct = Number(postRepairCounty.sourceDistinct ?? 0);
  const sourceDuplicateGroups = Number(rowCountAdjudication.summary?.sourceDuplicateGroups ?? 0);
  const sourceDuplicateRows = Number(rowCountAdjudication.summary?.sourceRows ?? 0) - Number(rowCountAdjudication.summary?.sourceDistinctNonNull ?? 0);
  const sourceNullOrBlank = Number(rowCountAdjudication.summary?.sourceNullOrBlank ?? 0);
  const canonicalDuplicateGroups = Number(rowCountAdjudication.summary?.canonicalDuplicateGroups ?? 0);
  const repairCounty = repairReceipt.counties?.find((county) => county.fips === "53015");
  const boundedParityClosed =
    boundedExecutionReceipt?.transactionCommitted === true &&
    boundedExecutionReceipt?.parityAchieved === true &&
    boundedExecutionReceipt?.verification?.sourceOnlyRemaining === 0 &&
    boundedExecutionReceipt?.verification?.canonicalOnlyRemaining === 0 &&
    boundedExecutionReceipt?.verification?.activeDuplicateGroups === 0;

  if (repairReceipt.committed !== true) blockers.push("Pilot identity repair transaction is not committed.");
  if (repairCounty?.repairedRows !== 57362) blockers.push("Expected 57,362 repaired Cowlitz rows in repair receipt.");
  if (repairDryRun.duplicateCountyIdParcelNumberAfter !== 0) blockers.push("Dry-run repair leaves duplicate CountyId + ParcelNumber groups.");
  if (postRepairCounty.legacyImportedParcelKeyPreserved !== true) blockers.push("LegacyImportedParcelKey preservation is not proven.");
  if (postRepairCounty.terraFusionParcelKeyPopulated !== true) blockers.push("TerraFusionParcelKey population is not proven.");
  if (canonicalDuplicateGroups !== 0) blockers.push("Canonical duplicate parcel identifiers remain.");
  if (sourceNullOrBlank !== 0) blockers.push("Source artifact contains null or blank parcel identifiers.");
  if (sourceOnlyCount > 0 && !boundedParityClosed) blockers.push(`${sourceOnlyCount} source parcel identifiers are not present in canonical after repair.`);
  if (canonicalOnlyCount > 0 && !boundedParityClosed) blockers.push(`${canonicalOnlyCount} canonical parcel identifiers are not present in source after repair.`);

  const fullIdentityClosed =
    blockers.length === 0 &&
    exactOverlap === sourceDistinct &&
    exactOverlap === canonicalDistinct &&
    sourceOnlyCount === 0 &&
    canonicalOnlyCount === 0;

  const shellIdentityClosed = !fullIdentityClosed && blockers.length === 0 && boundedParityClosed;
  const status = fullIdentityClosed
    ? "receipt_backed_full_identity"
    : shellIdentityClosed
      ? "receipt_backed_shell_present"
      : "bounded_correction_plan_required";
  const overlap = {
    sourceDistinct: boundedParityClosed ? boundedExecutionReceipt.verification.sourceDistinct : sourceDistinct,
    canonicalDistinct: boundedParityClosed ? boundedExecutionReceipt.verification.activeDistinct : canonicalDistinct,
    exactOverlap: boundedParityClosed ? boundedExecutionReceipt.verification.sourceDistinct : exactOverlap,
    sourceCoverageRatio: boundedParityClosed ? 1 : sourceDistinct > 0 ? exactOverlap / sourceDistinct : 0,
    canonicalCoverageRatio: boundedParityClosed ? 1 : canonicalDistinct > 0 ? exactOverlap / canonicalDistinct : 0,
    sourceOnlyCount: boundedParityClosed ? 0 : sourceOnlyCount,
    canonicalOnlyCount: boundedParityClosed ? 0 : canonicalOnlyCount
  };

  const boundedCorrectionPlan = fullIdentityClosed || shellIdentityClosed
    ? null
    : {
        planStatus: "required_before_receipt_conversion",
        allowedMutation: false,
        productionBindingAllowed: false,
        steps: [
          "Probe the 125 Cowlitz canonical-only parcel identifiers against the current public source.",
          "Classify canonical-only rows as stale canonical rows, source capture filter gaps, or transform edge cases.",
          "Capture runtime-complete source rows for the 321 Cowlitz source-only parcel identifiers.",
          "Stage a no-op correction plan: supersede stale canonical-only rows only if source absence is proven.",
          "Stage source-only inserts only if required runtime fields and lineage receipts are present.",
          "Re-run Cowlitz closure and convert a receipt only after source-only and canonical-only counts are both zero."
        ],
        proposedCorrectionClasses: {
          canonicalOnly: {
            count: canonicalOnlyCount,
            likelyActions: ["probe_current_source", "supersede_if_absent_from_source", "preserve_no_delete"]
          },
          sourceOnly: {
            count: sourceOnlyCount,
            likelyActions: ["capture_required_runtime_fields", "stage_insert_if_loadable", "emit_load_receipt"]
          },
          sourceDuplicates: {
            groups: sourceDuplicateGroups,
            duplicateRows: sourceDuplicateRows,
            policy: "Not a receipt blocker by itself if canonical remains one active row per source-native parcel identifier."
          }
        }
      };

  const receipt = fullIdentityClosed || shellIdentityClosed
    ? {
        receiptVersion: fullIdentityClosed ? "wa_initial_seed_post_repair_v1" : "wa_initial_seed_shell_present_v1",
        countyName: "Cowlitz County",
        fips: "53015",
        sourceClass: "WA_INITIAL_SEED",
        sourceParcelIdField: "PARCNO",
        receiptStatus: status,
        trustPosture: shellIdentityClosed ? "COWLITZ_PUBLIC_PARCEL_IDENTITY" : "COWLITZ_PUBLIC_PARCEL_FULL_IDENTITY",
        counts: {
          sourceDistinct: overlap.sourceDistinct,
          canonicalDistinct: overlap.canonicalDistinct,
          exactOverlap: overlap.exactOverlap
        },
        productionBindingAllowed: false,
        certificationAllowed: false
      }
    : null;

  return {
    generatedAt: new Date().toISOString(),
    countyName: "Cowlitz County",
    fips: "53015",
    status,
    cowlitzMovesFrom: "blocked_crosswalk_delta",
    cowlitzMovesTo: status,
    productionBindingAllowed: false,
    certificationAllowed: false,
    receiptConverted: fullIdentityClosed || shellIdentityClosed,
    sourceParcelIdField: "PARCNO",
    sourceDuplicateNullSemantics: {
      sourceNullOrBlank,
      sourceDuplicateGroups,
      sourceDuplicateRows,
      canonicalDuplicateGroups,
      classification: sourceNullOrBlank === 0 && canonicalDuplicateGroups === 0
        ? "duplicates_do_not_explain_remaining_identity_delta"
        : "duplicate_or_null_blocker"
    },
    postRepairIdentityOverlap: overlap,
    repairProof: {
      repairReceiptId: repairReceipt.receiptId,
      repairCommitted: repairReceipt.committed === true,
      repairedRows: repairCounty?.repairedRows ?? null,
      dryRunStatus: repairDryRun.dryRunStatus,
      duplicateCountyIdParcelNumberAfterDryRun: repairDryRun.duplicateCountyIdParcelNumberAfter,
      legacyImportedParcelKeyPreserved: postRepairCounty.legacyImportedParcelKeyPreserved === true,
      terraFusionParcelKeyPopulated: postRepairCounty.terraFusionParcelKeyPopulated === true,
      boundedCorrectionReceiptId: boundedExecutionReceipt?.receiptId ?? null,
      boundedCorrectionCommitted: boundedExecutionReceipt?.transactionCommitted === true,
      boundedCorrectionShellInserted: boundedExecutionReceipt?.verification?.shellInserted ?? null,
      boundedCorrectionSuperseded: boundedExecutionReceipt?.verification?.superseded ?? null
    },
    rootCauseCarriedForward: {
      priorRootCause: identifierRootCause.recommendedRootCause?.id ?? null,
      prefixRepairResolved: repairDryRun.rowsRepairable === repairDryRun.rowsScanned,
      remainingIssue: "post_repair_source_canonical_delta"
    },
    receipt,
    boundedCorrectionPlan,
    supportingArtifacts: [
      artifact(DEFAULT_POST_REPAIR_CLOSURE),
      artifact(DEFAULT_IDENTIFIER_ROOT_CAUSE),
      artifact(DEFAULT_REPAIR_DRY_RUN),
      artifact(DEFAULT_REPAIR_RECEIPT),
      artifact(DEFAULT_SOURCE_SNAPSHOT_RECEIPT),
      artifact(DEFAULT_SOURCE_METADATA),
      artifact(DEFAULT_BOUNDED_EXECUTION_RECEIPT)
    ],
    blockers
  };
}

function renderMarkdown(report) {
  const blockers = report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  const correctionSteps = report.boundedCorrectionPlan
    ? report.boundedCorrectionPlan.steps.map((step) => `- ${step}`).join("\n")
    : "- none";

  return `# Cowlitz Receipt Closure

Generated: ${report.generatedAt}

## Verdict

- Status: ${report.status}
- Receipt converted: ${report.receiptConverted ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${report.certificationAllowed ? "yes" : "no"}

## Post-Repair Identity

| Metric | Value |
| --- | ---: |
| Source distinct PARCNO | ${report.postRepairIdentityOverlap.sourceDistinct} |
| Canonical distinct ParcelNumber | ${report.postRepairIdentityOverlap.canonicalDistinct} |
| Exact overlap | ${report.postRepairIdentityOverlap.exactOverlap} |
| Source-only | ${report.postRepairIdentityOverlap.sourceOnlyCount} |
| Canonical-only | ${report.postRepairIdentityOverlap.canonicalOnlyCount} |

## Source Duplicate / Null Semantics

| Metric | Value |
| --- | ---: |
| Source null/blank | ${report.sourceDuplicateNullSemantics.sourceNullOrBlank} |
| Source duplicate groups | ${report.sourceDuplicateNullSemantics.sourceDuplicateGroups} |
| Source duplicate rows | ${report.sourceDuplicateNullSemantics.sourceDuplicateRows} |
| Canonical duplicate groups | ${report.sourceDuplicateNullSemantics.canonicalDuplicateGroups} |

Classification: ${report.sourceDuplicateNullSemantics.classification}

## Bounded Correction Plan

${correctionSteps}

## Blockers

${blockers}
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const postRepairClosurePath = args.get("post-repair-closure") ?? DEFAULT_POST_REPAIR_CLOSURE;
  const identifierRootCausePath = args.get("identifier-root-cause") ?? DEFAULT_IDENTIFIER_ROOT_CAUSE;
  const repairDryRunPath = args.get("repair-dry-run") ?? DEFAULT_REPAIR_DRY_RUN;
  const repairReceiptPath = args.get("repair-receipt") ?? DEFAULT_REPAIR_RECEIPT;
  const boundedExecutionReceiptPath = args.get("bounded-execution-receipt") ?? DEFAULT_BOUNDED_EXECUTION_RECEIPT;
  const outRoot = args.get("out-root") ?? DEFAULT_OUT_ROOT;
  const outJson = args.get("out-json") ?? DEFAULT_OUT_JSON;
  const outMd = args.get("out-md") ?? DEFAULT_OUT_MD;

  const postRepairClosure = readJson(postRepairClosurePath);
  const postRepairCounty = findCounty(postRepairClosure, "53015");
  if (!postRepairCounty) throw new Error("Cowlitz County 53015 not found in post-repair closure evidence.");

  const identifierRootCause = readJson(identifierRootCausePath);
  const report = buildCowlitzReceiptClosure({
    postRepairCounty,
    rowCountAdjudication: identifierRootCause,
    identifierRootCause,
    repairDryRun: readJson(repairDryRunPath),
    repairReceipt: readJson(repairReceiptPath),
    boundedExecutionReceipt: fs.existsSync(boundedExecutionReceiptPath)
      ? readJson(boundedExecutionReceiptPath)
      : null
  });

  writeJson(outJson, report);
  writeText(outMd, renderMarkdown(report));
  writeJson(path.join(outRoot, "bounded-correction-plan.json"), report.boundedCorrectionPlan ?? {});

  console.log(`Cowlitz receipt closure written: ${path.relative(repoRoot, outJson)}`);
  console.log(`Status: ${report.status}`);
  console.log(`Receipt converted: ${report.receiptConverted ? "yes" : "no"}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
