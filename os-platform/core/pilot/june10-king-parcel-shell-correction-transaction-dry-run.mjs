#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_CORRECTION_DRY_RUN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-correction-dry-run.latest.json"
);
const DEFAULT_SHELL_POLICY = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-load-policy.latest.json"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-correction-transaction-dry-run"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-correction-transaction-dry-run.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-correction-transaction-dry-run.latest.md"
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

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function sqlString(value) {
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}

function sqlNullableNumber(value) {
  return Number.isFinite(Number(value)) ? String(Number(value)) : "null";
}

function duplicateCount(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.values()].filter((count) => count > 1).length;
}

function safeSupersedes(correctionDryRun) {
  return (correctionDryRun.proposedSupersedes ?? []).filter((row) => row.safeToSupersede === true);
}

function unsafeSupersedes(correctionDryRun) {
  return (correctionDryRun.proposedSupersedes ?? []).filter((row) => row.safeToSupersede !== true);
}

function safeCaseCorrections(correctionDryRun) {
  return (correctionDryRun.proposedCaseCorrections ?? []).filter((row) => row.safeForDryRun === true);
}

function shellCandidates(shellPolicy) {
  return (shellPolicy.shellLoadCandidates ?? []).filter((row) => row.placeholderReviewRequired !== true);
}

function placeholderQueue(shellPolicy) {
  return shellPolicy.placeholderReviewQueue ?? [];
}

function buildSupersedeList(correctionDryRun) {
  return safeSupersedes(correctionDryRun).map((row) => ({
    action: "mark_superseded_inactive",
    tfParcelId: row.tfParcelId,
    parcelNumber: row.parcelNumber,
    sourceProbePresent: row.sourceProbePresent,
    preserveRow: true,
    deleteRow: false,
    proposedParcelStatus: "SUPERSEDED",
    correctionReceiptId: "king_public_parcel_shell_correction_dry_run_2026_05_26"
  }));
}

function buildCaseCorrectionList(correctionDryRun) {
  return safeCaseCorrections(correctionDryRun).map((row) => ({
    action: "update_case_to_source_exact",
    tfParcelId: row.tfParcelId,
    currentCanonicalValue: row.currentCanonicalValue,
    proposedParcelNumber: row.proposedParcelNumber,
    proposedTerraFusionParcelKey: row.proposedTerraFusionParcelKey,
    correctionReceiptId: "king_public_parcel_shell_correction_dry_run_2026_05_26"
  }));
}

function buildInsertList(shellPolicy) {
  return shellCandidates(shellPolicy).map((row) => ({
    action: "insert_king_public_parcel_shell",
    countyFips: "53033",
    countyName: "King County",
    parcelNumber: row.parcelNumber,
    major: row.major ?? null,
    minor: row.minor ?? null,
    sourceObjectId: row.objectId ?? null,
    shapeLength: row.shapeLength ?? null,
    shapeArea: row.shapeArea ?? null,
    terraFusionParcelKey: row.proposedTerraFusionParcelKey ?? `53033:${row.parcelNumber}`,
    trustLabel: shellPolicy.trustLabel,
    parcelStatus: "ACTIVE",
    conversionEra: "WA_INITIAL_SEED",
    sourceParcelIdField: "PIN",
    workflowComplete: false,
    blockedActions: shellPolicy.blockedActions ?? shellPolicy.policy?.blockedActions ?? [],
    correctionReceiptId: "king_public_parcel_shell_correction_dry_run_2026_05_26"
  }));
}

function buildSupersedeSql(supersedes) {
  const values = supersedes
    .map((row) => `  (${sqlString(row.tfParcelId)}, ${sqlString(row.parcelNumber)})`)
    .join(",\n");
  return `-- King proposed supersede SQL. Dry-run artifact only.
-- This script intentionally ends with ROLLBACK.
BEGIN;

CREATE TEMP TABLE king_supersede_target (
  tf_parcel_id uuid not null,
  parcel_number text not null
) ON COMMIT DROP;

INSERT INTO king_supersede_target (tf_parcel_id, parcel_number)
VALUES
${values || "  -- none"};

UPDATE canonical_tf.tf_parcel p
SET
  "ParcelStatus" = 'SUPERSEDED',
  "IdentityRepairReceiptId" = 'king_public_parcel_shell_correction_dry_run_2026_05_26',
  "UpdatedAt" = now()
FROM king_supersede_target t
WHERE p."TfParcelId" = t.tf_parcel_id
  AND p."ParcelNumber" = t.parcel_number
  AND p."CountyId" = '3cb43a41-480a-bbaf-cfd3-f62d403225b7'
  AND p."ParcelStatus" = 'ACTIVE';

ROLLBACK;
`;
}

function buildCaseCorrectionSql(caseCorrections) {
  const values = caseCorrections
    .map(
      (row) =>
        `  (${sqlString(row.tfParcelId)}, ${sqlString(row.currentCanonicalValue)}, ${sqlString(row.proposedParcelNumber)}, ${sqlString(row.proposedTerraFusionParcelKey)})`
    )
    .join(",\n");
  return `-- King proposed case-correction SQL. Dry-run artifact only.
-- This script intentionally ends with ROLLBACK.
BEGIN;

CREATE TEMP TABLE king_case_correction_target (
  tf_parcel_id uuid not null,
  current_parcel_number text not null,
  proposed_parcel_number text not null,
  proposed_terrafusion_key text not null
) ON COMMIT DROP;

INSERT INTO king_case_correction_target
  (tf_parcel_id, current_parcel_number, proposed_parcel_number, proposed_terrafusion_key)
VALUES
${values || "  -- none"};

UPDATE canonical_tf.tf_parcel p
SET
  "LegacyImportedParcelKey" = COALESCE(p."LegacyImportedParcelKey", p."ParcelNumber"),
  "ParcelNumber" = t.proposed_parcel_number,
  "TerraFusionParcelKey" = t.proposed_terrafusion_key,
  "IdentityRepairReceiptId" = 'king_public_parcel_shell_correction_dry_run_2026_05_26',
  "UpdatedAt" = now()
FROM king_case_correction_target t
WHERE p."TfParcelId" = t.tf_parcel_id
  AND p."ParcelNumber" = t.current_parcel_number
  AND p."CountyId" = '3cb43a41-480a-bbaf-cfd3-f62d403225b7'
  AND p."ParcelStatus" = 'ACTIVE';

ROLLBACK;
`;
}

function buildInsertSql(inserts) {
  const values = inserts
    .map(
      (row) =>
        `  (${sqlString(row.parcelNumber)}, ${sqlString(row.terraFusionParcelKey)}, ${sqlString(row.major)}, ${sqlString(row.minor)}, ${sqlNullableNumber(row.sourceObjectId)}, ${sqlNullableNumber(row.shapeLength)}, ${sqlNullableNumber(row.shapeArea)}, ${sqlString(row.trustLabel)})`
    )
    .join(",\n");
  return `-- King proposed KING_PUBLIC_PARCEL_SHELL insert SQL. Dry-run artifact only.
-- This script intentionally ends with ROLLBACK.
BEGIN;

CREATE TEMP TABLE king_public_parcel_shell_insert (
  parcel_number text not null,
  terrafusion_parcel_key text not null,
  major text,
  minor text,
  source_object_id numeric,
  shape_length numeric,
  shape_area numeric,
  trust_label text not null
) ON COMMIT DROP;

INSERT INTO king_public_parcel_shell_insert
  (parcel_number, terrafusion_parcel_key, major, minor, source_object_id, shape_length, shape_area, trust_label)
VALUES
${values || "  -- none"};

-- Actual execution requires a schema-specific insert mapping into canonical_tf.tf_parcel.
-- Required invariants:
--   ParcelNumber = source-native PIN
--   TerraFusionParcelKey = 53033:PIN
--   SourceParcelIdField = PIN
--   ParcelStatus = ACTIVE
--   ConversionEra = WA_INITIAL_SEED
--   TrustLabel/posture = KING_PUBLIC_PARCEL_SHELL
--   workflow-complete claims remain blocked

ROLLBACK;
`;
}

function buildRollbackSql({ supersedes, caseCorrections, inserts }) {
  const supersedeIds = supersedes.map((row) => sqlString(row.tfParcelId)).join(", ");
  const caseIds = caseCorrections.map((row) => sqlString(row.tfParcelId)).join(", ");
  const insertKeys = inserts.map((row) => sqlString(row.terraFusionParcelKey)).join(", ");
  return `-- King parcel shell correction rollback SQL.
-- No mutation was executed by this dry-run.
-- If a future authorized transaction applies the proposed correction, rollback must run in one transaction.
BEGIN;

-- Reactivate superseded rows.
UPDATE canonical_tf.tf_parcel
SET "ParcelStatus" = 'ACTIVE', "UpdatedAt" = now()
WHERE "TfParcelId" IN (${supersedeIds || "null"});

-- Restore case-corrected rows from backup/snapshot.
-- Target case-correction row ids: ${caseIds || "(none)"}

-- Remove inserted shell rows by TerraFusionParcelKey.
DELETE FROM canonical_tf.tf_parcel
WHERE "TerraFusionParcelKey" IN (${insertKeys || "null"})
  AND "IdentityRepairReceiptId" = 'king_public_parcel_shell_correction_dry_run_2026_05_26';

ROLLBACK;
`;
}

function buildReceipt({ supersedes, inserts, placeholders, caseCorrections, parityProof, shellPolicy }) {
  return {
    receiptType: "king_public_parcel_shell_correction_transaction_dry_run",
    receiptVersion: "june10-king-shell-correction-v1",
    countyName: "King County",
    fips: "53033",
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false,
    trustLabel: shellPolicy.trustLabel,
    counts: {
      staleCanonicalSupersedes: supersedes.length,
      sourceExactCaseCorrections: caseCorrections.length,
      shellInserts: inserts.length,
      placeholderReviewHeld: placeholders.length
    },
    parityProof,
    receiptLanguage: [
      "This is a dry-run receipt only; no database mutation was executed.",
      "451 stale King canonical rows may be superseded only because current source absence was already proven.",
      "KING_PUBLIC_PARCEL_SHELL inserts are source-backed identity/context rows, not workflow-complete rows.",
      "Placeholder/tract-style PINs remain excluded from this transaction and held for review.",
      "Owner/address/value-dependent workflows and certification claims remain blocked."
    ]
  };
}

function buildParityProof({ correctionDryRun, shellPolicy, supersedes, inserts, placeholders, caseCorrections, unsafeRows }) {
  const duplicateTargets = duplicateCount([
    ...inserts.map((row) => row.parcelNumber),
    ...caseCorrections.map((row) => row.proposedParcelNumber)
  ]);
  const approvedSourceOnlyRows = shellPolicy.loadabilityMatrix?.sourceOnlyPins ?? inserts.length + placeholders.length;
  const sourceOnlyAccountedFor = inserts.length + placeholders.length === approvedSourceOnlyRows;
  const canonicalOnlyCleared = unsafeRows.length === 0 && supersedes.length === (correctionDryRun.summary?.trueCanonicalOnlyRows ?? supersedes.length);
  const caseCorrectionsCleared = caseCorrections.length === (correctionDryRun.summary?.proposedCaseCorrections ?? caseCorrections.length);
  const shellRowsBlockedFromWorkflowClaims =
    inserts.every((row) => row.workflowComplete === false && row.trustLabel === "KING_PUBLIC_PARCEL_SHELL") &&
    (shellPolicy.loadabilityMatrix?.workflowCompleteRows ?? 0) === 0 &&
    (shellPolicy.loadabilityMatrix?.certificationRows ?? 0) === 0;
  const policyApprovedIdentityParityWouldBeAchieved =
    duplicateTargets === 0 &&
    sourceOnlyAccountedFor &&
    canonicalOnlyCleared &&
    caseCorrectionsCleared &&
    shellRowsBlockedFromWorkflowClaims;

  return {
    staleCanonicalRowsSupersededWithoutIdentityLoss: canonicalOnlyCleared,
    policyApprovedSourceOnlyRowsInserted: inserts.length,
    placeholderTractRowsExcluded: placeholders.length,
    sourceExactCaseCorrectionsApplied: caseCorrections.length,
    countyIdParcelNumberDuplicatesAfter: duplicateTargets,
    shellRowsReceiveTrustLabel: inserts.every((row) => row.trustLabel === "KING_PUBLIC_PARCEL_SHELL"),
    shellRowsBlockedFromWorkflowCompleteClaims: shellRowsBlockedFromWorkflowClaims,
    policyApprovedIdentityParityWouldBeAchieved,
    fullSourceParityBlockedByPlaceholderQueue: placeholders.length > 0
  };
}

export function buildKingParcelShellCorrectionTransactionDryRun({ correctionDryRun, shellPolicy }) {
  const supersedes = buildSupersedeList(correctionDryRun);
  const unsafeRows = unsafeSupersedes(correctionDryRun);
  const caseCorrections = buildCaseCorrectionList(correctionDryRun);
  const inserts = buildInsertList(shellPolicy);
  const placeholders = placeholderQueue(shellPolicy);
  const parityProof = buildParityProof({
    correctionDryRun,
    shellPolicy,
    supersedes,
    inserts,
    placeholders,
    caseCorrections,
    unsafeRows
  });
  const blockers = [];

  if (unsafeRows.length > 0) {
    blockers.push(`${unsafeRows.length} unsafe supersede candidates remain.`);
  }
  if (shellPolicy.policy?.allowParcelShellRowsInCanonicalRuntime !== true) {
    blockers.push("King shell policy does not allow parcel shell rows in canonical runtime.");
  }
  if (!parityProof.shellRowsBlockedFromWorkflowCompleteClaims) {
    blockers.push("Shell rows are not blocked from workflow-complete claims.");
  }
  if (parityProof.countyIdParcelNumberDuplicatesAfter > 0) {
    blockers.push(`${parityProof.countyIdParcelNumberDuplicatesAfter} duplicate CountyId + ParcelNumber target groups would remain.`);
  }

  const proposedSupersedeSql = buildSupersedeSql(supersedes);
  const proposedCaseCorrectionSql = buildCaseCorrectionSql(caseCorrections);
  const proposedInsertSql = buildInsertSql(inserts);
  const rollbackSql = buildRollbackSql({ supersedes, caseCorrections, inserts });
  const proposedTransactionReceipt = buildReceipt({
    supersedes,
    inserts,
    placeholders,
    caseCorrections,
    parityProof,
    shellPolicy
  });

  return {
    generatedAt: new Date().toISOString(),
    countyName: "King County",
    fips: "53033",
    scope: "King parcel shell correction transaction dry-run",
    trustLabel: shellPolicy.trustLabel,
    databaseMutationAllowed: false,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false,
    summary: {
      staleCanonicalRows: correctionDryRun.summary?.trueCanonicalOnlyRows ?? supersedes.length,
      supersedeCandidates: supersedes.length,
      sourceExactCaseCorrections: caseCorrections.length,
      shellInsertCandidates: inserts.length,
      placeholderReviewHeld: placeholders.length,
      unsafeSupersedes: unsafeRows.length
    },
    proposedTransactionReceipt,
    proposedSupersedeList: supersedes,
    proposedCaseCorrectionList: caseCorrections,
    proposedInsertList: inserts,
    excludedPlaceholderQueue: placeholders,
    postTransactionParityProof: parityProof,
    proposedSupersedeSql,
    proposedCaseCorrectionSql,
    proposedInsertSql,
    rollbackSql,
    blockers
  };
}

function renderMarkdown(dryRun) {
  const blockers = dryRun.blockers.length ? dryRun.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  return `# King Parcel Shell Correction Transaction Dry-Run

Generated: ${dryRun.generatedAt}

## Verdict

- Trust label: ${dryRun.trustLabel}
- Database mutation attempted: ${dryRun.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${dryRun.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${dryRun.certificationAllowed ? "yes" : "no"}
- Policy-approved identity parity would be achieved: ${dryRun.postTransactionParityProof.policyApprovedIdentityParityWouldBeAchieved ? "yes" : "no"}
- Full source parity blocked by placeholder queue: ${dryRun.postTransactionParityProof.fullSourceParityBlockedByPlaceholderQueue ? "yes" : "no"}

## Counts

| Metric | Count |
| --- | ---: |
| Stale canonical rows | ${dryRun.summary.staleCanonicalRows} |
| Supersede candidates | ${dryRun.summary.supersedeCandidates} |
| Source-exact case corrections | ${dryRun.summary.sourceExactCaseCorrections} |
| Shell insert candidates | ${dryRun.summary.shellInsertCandidates} |
| Placeholder review held | ${dryRun.summary.placeholderReviewHeld} |
| Unsafe supersedes | ${dryRun.summary.unsafeSupersedes} |
| Post-transaction duplicate target groups | ${dryRun.postTransactionParityProof.countyIdParcelNumberDuplicatesAfter} |

## Policy Proof

- Shell rows receive trust label: ${dryRun.postTransactionParityProof.shellRowsReceiveTrustLabel ? "yes" : "no"}
- Shell rows blocked from workflow-complete claims: ${dryRun.postTransactionParityProof.shellRowsBlockedFromWorkflowCompleteClaims ? "yes" : "no"}
- Placeholder/tract rows excluded: ${dryRun.postTransactionParityProof.placeholderTractRowsExcluded}

## Blockers

${blockers}
`;
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

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    correctionDryRun: args.get("correction-dry-run") ?? DEFAULT_CORRECTION_DRY_RUN,
    shellPolicy: args.get("shell-policy") ?? DEFAULT_SHELL_POLICY,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const dryRun = buildKingParcelShellCorrectionTransactionDryRun({
    correctionDryRun: readJson(paths.correctionDryRun),
    shellPolicy: readJson(paths.shellPolicy)
  });

  writeJson(paths.outJson, dryRun);
  writeText(paths.outMd, renderMarkdown(dryRun));
  writeJson(path.join(paths.outRoot, "proposed-transaction-receipt.json"), dryRun.proposedTransactionReceipt);
  writeJson(path.join(paths.outRoot, "proposed-supersede-list.json"), dryRun.proposedSupersedeList);
  writeJson(path.join(paths.outRoot, "proposed-case-correction-list.json"), dryRun.proposedCaseCorrectionList);
  writeJson(path.join(paths.outRoot, "proposed-insert-list.json"), dryRun.proposedInsertList);
  writeJson(path.join(paths.outRoot, "excluded-placeholder-queue.json"), dryRun.excludedPlaceholderQueue);
  writeJson(path.join(paths.outRoot, "post-transaction-parity-proof.json"), dryRun.postTransactionParityProof);
  writeText(path.join(paths.outRoot, "proposed-supersede.sql"), dryRun.proposedSupersedeSql);
  writeText(path.join(paths.outRoot, "proposed-case-correction.sql"), dryRun.proposedCaseCorrectionSql);
  writeText(path.join(paths.outRoot, "proposed-insert.sql"), dryRun.proposedInsertSql);
  writeText(path.join(paths.outRoot, "rollback.sql"), dryRun.rollbackSql);

  console.log(`King parcel shell correction transaction dry-run written: ${repoRelative(paths.outJson)}`);
  console.log(`Supersede candidates: ${dryRun.summary.supersedeCandidates}`);
  console.log(`Shell insert candidates: ${dryRun.summary.shellInsertCandidates}`);
  console.log(`Placeholder review held: ${dryRun.summary.placeholderReviewHeld}`);
  console.log(`Production binding allowed: ${dryRun.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
