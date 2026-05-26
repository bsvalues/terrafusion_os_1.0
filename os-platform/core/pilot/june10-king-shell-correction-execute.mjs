#!/usr/bin/env node

import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const KING_COUNTY_ID = "3cb43a41-480a-bbaf-cfd3-f62d403225b7";
const KING_FIPS = "53033";
const RECEIPT_ID = "king_public_parcel_shell_correction_dry_run_2026_05_26";
const TRUST_LABEL = "KING_PUBLIC_PARCEL_SHELL";
const UUID_NAMESPACE_URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

const DEFAULT_GATE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-shell-correction-decision-gate.latest.json"
);
const DEFAULT_CASE_LIST = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-correction-transaction-dry-run",
  "proposed-case-correction-list.json"
);
const DEFAULT_SUPERSEDE_LIST = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-correction-transaction-dry-run",
  "proposed-supersede-list.json"
);
const DEFAULT_INSERT_LIST = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-correction-transaction-dry-run",
  "proposed-insert-list.json"
);
const DEFAULT_PLACEHOLDER_QUEUE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-load-policy",
  "king-placeholder-review-queue.json"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-shell-correction-execution"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-shell-correction-execution.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-shell-correction-execution.latest.md"
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

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function uuidV5(name, namespace = UUID_NAMESPACE_URL) {
  const namespaceBytes = Buffer.from(namespace.replaceAll("-", ""), "hex");
  const hash = crypto.createHash("sha1").update(namespaceBytes).update(name).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function assertApprovedGate(gate) {
  const blockers = [];
  if (gate.state !== "APPROVED_FOR_SHELL_CORRECTION") blockers.push(`Decision gate state is ${gate.state}.`);
  if (gate.executionEnabled !== true) blockers.push("Decision gate did not enable execution.");
  if (gate.certificationAllowed !== false) blockers.push("Decision gate unexpectedly allows certification.");
  if (gate.productionBindingAllowed !== false) blockers.push("Decision gate unexpectedly allows production binding.");
  if (gate.approvalChecks?.humanApprovalPhraseMatches !== true) blockers.push("Human approval phrase was not accepted.");
  if (gate.approvalChecks?.humanApprovalChecklistAccepted !== true) {
    blockers.push("Human approval checklist was not accepted.");
  }
  if (blockers.length) {
    const error = new Error(`King shell correction is not authorized: ${blockers.join(" ")}`);
    error.blockers = blockers;
    throw error;
  }
}

function buildRows({ caseCorrections, supersedes, inserts, placeholders }) {
  return {
    caseCorrections: caseCorrections.map((row) => ({
      tfParcelId: row.tfParcelId,
      currentParcelNumber: row.currentCanonicalValue,
      proposedParcelNumber: row.proposedParcelNumber,
      proposedTerraFusionParcelKey: row.proposedTerraFusionParcelKey
    })),
    supersedes: supersedes.map((row) => ({
      tfParcelId: row.tfParcelId,
      parcelNumber: row.parcelNumber
    })),
    inserts: inserts.map((row) => ({
      tfParcelId: uuidV5(`king-shell:${row.terraFusionParcelKey}`),
      parcelNumber: row.parcelNumber,
      terraFusionParcelKey: row.terraFusionParcelKey,
      legacyImportedParcelKey: row.terraFusionParcelKey,
      conversionEra: row.conversionEra,
      sourceParcelIdField: row.sourceParcelIdField,
      parcelStatus: row.parcelStatus,
      trustLabel: row.trustLabel
    })),
    placeholders: placeholders.map((row) => row.parcelNumber ?? row.pin ?? row.PIN).filter(Boolean)
  };
}

function values(rows, columns) {
  return rows.map((row) => `(${columns.map((column) => sqlString(row[column])).join(", ")})`).join(",\n");
}

function buildBackupSql({ caseCorrections, supersedes }) {
  const ids = [...caseCorrections.map((row) => row.tfParcelId), ...supersedes.map((row) => row.tfParcelId)];
  return `select coalesce(jsonb_pretty(jsonb_agg(to_jsonb(p) order by p."TfParcelId"::text)), '[]')
from canonical_tf.tf_parcel p
where p."TfParcelId" in (${ids.map(sqlString).join(", ")});`;
}

function buildExecutionSql(rows) {
  const caseValues = values(rows.caseCorrections, [
    "tfParcelId",
    "currentParcelNumber",
    "proposedParcelNumber",
    "proposedTerraFusionParcelKey"
  ]);
  const supersedeValues = values(rows.supersedes, ["tfParcelId", "parcelNumber"]);
  const insertValues = values(rows.inserts, [
    "tfParcelId",
    "parcelNumber",
    "terraFusionParcelKey",
    "legacyImportedParcelKey",
    "conversionEra",
    "sourceParcelIdField",
    "parcelStatus",
    "trustLabel"
  ]);
  const placeholderValues = rows.placeholders.map((parcelNumber) => `(${sqlString(parcelNumber)})`).join(",\n");

  return `\\set ON_ERROR_STOP on
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
${caseValues};

CREATE TEMP TABLE king_supersede_target (
  tf_parcel_id uuid not null,
  parcel_number text not null
) ON COMMIT DROP;

INSERT INTO king_supersede_target (tf_parcel_id, parcel_number)
VALUES
${supersedeValues};

CREATE TEMP TABLE king_public_parcel_shell_insert (
  tf_parcel_id uuid not null,
  parcel_number text not null,
  terrafusion_parcel_key text not null,
  legacy_imported_parcel_key text not null,
  conversion_era text not null,
  source_parcel_id_field text not null,
  parcel_status text not null,
  trust_label text not null
) ON COMMIT DROP;

INSERT INTO king_public_parcel_shell_insert
  (tf_parcel_id, parcel_number, terrafusion_parcel_key, legacy_imported_parcel_key, conversion_era, source_parcel_id_field, parcel_status, trust_label)
VALUES
${insertValues};

CREATE TEMP TABLE king_placeholder_review_hold (parcel_number text not null) ON COMMIT DROP;
INSERT INTO king_placeholder_review_hold (parcel_number)
VALUES
${placeholderValues || "('')"};

DO $$
DECLARE
  case_ready integer;
  supersede_ready integer;
  insert_conflicts integer;
  placeholder_conflicts integer;
BEGIN
  SELECT count(*) INTO case_ready
  FROM canonical_tf.tf_parcel p
  JOIN king_case_correction_target t ON t.tf_parcel_id = p."TfParcelId"
  WHERE p."CountyId" = '${KING_COUNTY_ID}'::uuid
    AND p."ParcelStatus" = 'ACTIVE'
    AND p."ParcelNumber" = t.current_parcel_number;
  IF case_ready <> ${rows.caseCorrections.length} THEN
    RAISE EXCEPTION 'Case correction precondition failed: % ready, expected ${rows.caseCorrections.length}', case_ready;
  END IF;

  SELECT count(*) INTO supersede_ready
  FROM canonical_tf.tf_parcel p
  JOIN king_supersede_target t ON t.tf_parcel_id = p."TfParcelId"
  WHERE p."CountyId" = '${KING_COUNTY_ID}'::uuid
    AND p."ParcelStatus" = 'ACTIVE'
    AND p."ParcelNumber" = t.parcel_number;
  IF supersede_ready <> ${rows.supersedes.length} THEN
    RAISE EXCEPTION 'Supersede precondition failed: % ready, expected ${rows.supersedes.length}', supersede_ready;
  END IF;

  SELECT count(*) INTO insert_conflicts
  FROM canonical_tf.tf_parcel p
  JOIN king_public_parcel_shell_insert t ON t.terrafusion_parcel_key = p."TerraFusionParcelKey"
  WHERE p."CountyId" = '${KING_COUNTY_ID}'::uuid;
  IF insert_conflicts <> 0 THEN
    RAISE EXCEPTION 'Insert precondition failed: % TerraFusionParcelKey conflicts', insert_conflicts;
  END IF;

  SELECT count(*) INTO placeholder_conflicts
  FROM canonical_tf.tf_parcel p
  JOIN king_placeholder_review_hold t ON t.parcel_number = p."ParcelNumber"
  WHERE p."CountyId" = '${KING_COUNTY_ID}'::uuid
    AND p."ParcelStatus" = 'ACTIVE';
  IF placeholder_conflicts <> 0 THEN
    RAISE EXCEPTION 'Placeholder exclusion precondition failed: % active placeholder rows already present', placeholder_conflicts;
  END IF;
END $$;

UPDATE canonical_tf.tf_parcel p
SET
  "LegacyImportedParcelKey" = COALESCE(p."LegacyImportedParcelKey", p."ParcelNumber"),
  "ParcelNumber" = t.proposed_parcel_number,
  "TerraFusionParcelKey" = t.proposed_terrafusion_key,
  "IdentityRepairReceiptId" = '${RECEIPT_ID}',
  "UpdatedAt" = now()
FROM king_case_correction_target t
WHERE p."TfParcelId" = t.tf_parcel_id
  AND p."CountyId" = '${KING_COUNTY_ID}'::uuid
  AND p."ParcelStatus" = 'ACTIVE'
  AND p."ParcelNumber" = t.current_parcel_number;

UPDATE canonical_tf.tf_parcel p
SET
  "ParcelStatus" = 'SUPERSEDED',
  "IdentityRepairReceiptId" = '${RECEIPT_ID}',
  "UpdatedAt" = now()
FROM king_supersede_target t
WHERE p."TfParcelId" = t.tf_parcel_id
  AND p."CountyId" = '${KING_COUNTY_ID}'::uuid
  AND p."ParcelStatus" = 'ACTIVE'
  AND p."ParcelNumber" = t.parcel_number;

INSERT INTO canonical_tf.tf_parcel (
  "TfParcelId",
  "CountyId",
  "ParcelNumber",
  "SitusAddress",
  "LegalDescription",
  "ParcelStatus",
  "PropertyType",
  "CurrentOwnerId",
  "CurrentAssessmentId",
  "CreatedAt",
  "UpdatedAt",
  "ConversionEra",
  "TerraFusionParcelKey",
  "LegacyImportedParcelKey",
  "SourceParcelIdField",
  "IdentityRepairReceiptId"
)
SELECT
  t.tf_parcel_id,
  '${KING_COUNTY_ID}'::uuid,
  t.parcel_number,
  null,
  null,
  t.parcel_status,
  null,
  null,
  null,
  now(),
  now(),
  t.conversion_era,
  t.terrafusion_parcel_key,
  t.legacy_imported_parcel_key,
  t.source_parcel_id_field,
  '${RECEIPT_ID}'
FROM king_public_parcel_shell_insert t;

DO $$
DECLARE
  case_done integer;
  supersede_done integer;
  insert_done integer;
  duplicate_groups integer;
  placeholder_done integer;
BEGIN
  SELECT count(*) INTO case_done
  FROM canonical_tf.tf_parcel p
  JOIN king_case_correction_target t ON t.tf_parcel_id = p."TfParcelId"
  WHERE p."CountyId" = '${KING_COUNTY_ID}'::uuid
    AND p."ParcelStatus" = 'ACTIVE'
    AND p."ParcelNumber" = t.proposed_parcel_number
    AND p."TerraFusionParcelKey" = t.proposed_terrafusion_key
    AND p."IdentityRepairReceiptId" = '${RECEIPT_ID}';
  IF case_done <> ${rows.caseCorrections.length} THEN
    RAISE EXCEPTION 'Case correction verification failed: % done, expected ${rows.caseCorrections.length}', case_done;
  END IF;

  SELECT count(*) INTO supersede_done
  FROM canonical_tf.tf_parcel p
  JOIN king_supersede_target t ON t.tf_parcel_id = p."TfParcelId"
  WHERE p."CountyId" = '${KING_COUNTY_ID}'::uuid
    AND p."ParcelStatus" = 'SUPERSEDED'
    AND p."IdentityRepairReceiptId" = '${RECEIPT_ID}';
  IF supersede_done <> ${rows.supersedes.length} THEN
    RAISE EXCEPTION 'Supersede verification failed: % done, expected ${rows.supersedes.length}', supersede_done;
  END IF;

  SELECT count(*) INTO insert_done
  FROM canonical_tf.tf_parcel p
  JOIN king_public_parcel_shell_insert t ON t.terrafusion_parcel_key = p."TerraFusionParcelKey"
  WHERE p."CountyId" = '${KING_COUNTY_ID}'::uuid
    AND p."ParcelStatus" = 'ACTIVE'
    AND p."IdentityRepairReceiptId" = '${RECEIPT_ID}';
  IF insert_done <> ${rows.inserts.length} THEN
    RAISE EXCEPTION 'Insert verification failed: % done, expected ${rows.inserts.length}', insert_done;
  END IF;

  SELECT count(*) INTO duplicate_groups
  FROM (
    SELECT p."ParcelNumber"
    FROM canonical_tf.tf_parcel p
    WHERE p."CountyId" = '${KING_COUNTY_ID}'::uuid
      AND p."ParcelStatus" = 'ACTIVE'
      AND nullif(p."ParcelNumber", '') IS NOT NULL
    GROUP BY p."ParcelNumber"
    HAVING count(*) > 1
  ) d;
  IF duplicate_groups <> 0 THEN
    RAISE EXCEPTION 'Duplicate verification failed: % active duplicate groups remain', duplicate_groups;
  END IF;

  SELECT count(*) INTO placeholder_done
  FROM canonical_tf.tf_parcel p
  JOIN king_placeholder_review_hold t ON t.parcel_number = p."ParcelNumber"
  WHERE p."CountyId" = '${KING_COUNTY_ID}'::uuid
    AND p."ParcelStatus" = 'ACTIVE'
    AND p."IdentityRepairReceiptId" = '${RECEIPT_ID}';
  IF placeholder_done <> 0 THEN
    RAISE EXCEPTION 'Placeholder exclusion verification failed: % placeholders inserted', placeholder_done;
  END IF;
END $$;

COMMIT;
`;
}

function buildVerificationSql(rows) {
  const placeholderValues = rows.placeholders.map((parcelNumber) => `(${sqlString(parcelNumber)})`).join(",\n");
  return `with
case_target(tf_parcel_id, parcel_number, key) as (
  values ${rows.caseCorrections.map((row) => `(${sqlString(row.tfParcelId)}::uuid, ${sqlString(row.proposedParcelNumber)}, ${sqlString(row.proposedTerraFusionParcelKey)})`).join(",\n")}
),
supersede_target(tf_parcel_id) as (
  values ${rows.supersedes.map((row) => `(${sqlString(row.tfParcelId)}::uuid)`).join(",\n")}
),
insert_target(key) as (
  values ${rows.inserts.map((row) => `(${sqlString(row.terraFusionParcelKey)})`).join(",\n")}
),
placeholder_target(parcel_number) as (
  values ${placeholderValues || "('')"}
),
duplicate_groups as (
  select p."ParcelNumber"
  from canonical_tf.tf_parcel p
  where p."CountyId"='${KING_COUNTY_ID}'::uuid
    and p."ParcelStatus"='ACTIVE'
    and nullif(p."ParcelNumber",'') is not null
  group by p."ParcelNumber"
  having count(*) > 1
)
select jsonb_pretty(jsonb_build_object(
  'caseCorrected', (select count(*) from canonical_tf.tf_parcel p join case_target t on t.tf_parcel_id=p."TfParcelId" where p."ParcelNumber"=t.parcel_number and p."TerraFusionParcelKey"=t.key and p."IdentityRepairReceiptId"='${RECEIPT_ID}'),
  'superseded', (select count(*) from canonical_tf.tf_parcel p join supersede_target t on t.tf_parcel_id=p."TfParcelId" where p."ParcelStatus"='SUPERSEDED' and p."IdentityRepairReceiptId"='${RECEIPT_ID}'),
  'shellInserted', (select count(*) from canonical_tf.tf_parcel p join insert_target t on t.key=p."TerraFusionParcelKey" where p."ParcelStatus"='ACTIVE' and p."IdentityRepairReceiptId"='${RECEIPT_ID}'),
  'activeDuplicateGroups', (select count(*) from duplicate_groups),
  'placeholderInserted', (select count(*) from canonical_tf.tf_parcel p join placeholder_target t on t.parcel_number=p."ParcelNumber" where p."CountyId"='${KING_COUNTY_ID}'::uuid and p."ParcelStatus"='ACTIVE' and p."IdentityRepairReceiptId"='${RECEIPT_ID}'),
  'receiptRowsTotal', (select count(*) from canonical_tf.tf_parcel where "CountyId"='${KING_COUNTY_ID}'::uuid and "IdentityRepairReceiptId"='${RECEIPT_ID}'),
  'kingActiveRows', (select count(*) from canonical_tf.tf_parcel where "CountyId"='${KING_COUNTY_ID}'::uuid and "ParcelStatus"='ACTIVE'),
  'trustPosture', '${TRUST_LABEL}',
  'trustLabelStorage', 'execution_receipt_and_identity_repair_receipt_id',
  'certificationAllowed', false,
  'productionBindingAllowed', false
));`;
}

function runPsql({ sql, dockerContainer, database, user }) {
  const result = spawnSync(
    "docker",
    ["exec", "-i", dockerContainer, "psql", "-v", "ON_ERROR_STOP=1", "-U", user, "-d", database, "-At"],
    { input: sql, encoding: "utf8", maxBuffer: 1024 * 1024 * 64 }
  );
  if (result.status !== 0) {
    const error = new Error(result.stderr || result.stdout || "psql failed");
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    throw error;
  }
  return result.stdout.trim();
}

function renderMarkdown(receipt) {
  return `# King Shell Correction Execution Receipt

Generated: ${receipt.generatedAt}

## Verdict

- Mutation executed: ${receipt.databaseMutationAttempted ? "yes" : "no"}
- Transaction committed: ${receipt.transactionCommitted ? "yes" : "no"}
- County: ${receipt.countyName} (${receipt.fips})
- Certification allowed: ${receipt.certificationAllowed ? "yes" : "no"}
- Production binding allowed: ${receipt.productionBindingAllowed ? "yes" : "no"}

## Counts

- Case corrections: ${receipt.expectedCounts.caseCorrections}
- Superseded rows: ${receipt.expectedCounts.supersedes}
- Shell inserts: ${receipt.expectedCounts.shellInserts}
- Placeholder rows held: ${receipt.expectedCounts.placeholderHeld}

## Verification

- Case corrected: ${receipt.verification.caseCorrected}
- Superseded: ${receipt.verification.superseded}
- Shell inserted: ${receipt.verification.shellInserted}
- Active duplicate groups: ${receipt.verification.activeDuplicateGroups}
- Placeholder inserted: ${receipt.verification.placeholderInserted}
- Receipt rows total: ${receipt.verification.receiptRowsTotal}
- King active rows after: ${receipt.verification.kingActiveRows}
- Trust posture: ${receipt.verification.trustPosture}
- Trust label storage: ${receipt.verification.trustLabelStorage}

## Boundaries

- King workflow certification remains blocked.
- Owner/address/value-dependent workflows remain blocked for shell rows.
- Placeholder/tract rows remain excluded.
- Production binding remains blocked.
`;
}

export function buildExecutionReceipt({ gate, rows, verification, backupPath }) {
  return {
    generatedAt: new Date().toISOString(),
    receiptType: "king_shell_correction_execution_receipt",
    receiptVersion: "june10-king-shell-correction-v1",
    countyName: "King County",
    fips: KING_FIPS,
    approvalToken: gate.approvalToken?.token ?? null,
    databaseMutationAttempted: true,
    transactionCommitted: true,
    certificationAllowed: false,
    productionBindingAllowed: false,
    backupPath,
    expectedCounts: {
      caseCorrections: rows.caseCorrections.length,
      supersedes: rows.supersedes.length,
      shellInserts: rows.inserts.length,
      placeholderHeld: rows.placeholders.length
    },
    verification,
    boundaries: [
      "King workflow certification remains blocked.",
      "Owner/address/value-dependent workflows remain blocked for shell rows.",
      "Placeholder/tract rows remain excluded.",
      "Production binding remains blocked."
    ]
  };
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    gate: args.get("gate") ?? DEFAULT_GATE,
    caseList: args.get("case-list") ?? DEFAULT_CASE_LIST,
    supersedeList: args.get("supersede-list") ?? DEFAULT_SUPERSEDE_LIST,
    insertList: args.get("insert-list") ?? DEFAULT_INSERT_LIST,
    placeholderQueue: args.get("placeholder-queue") ?? DEFAULT_PLACEHOLDER_QUEUE,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const dockerContainer = args.get("docker-container") ?? "terrafusion-postgres-dev";
  const database = args.get("database") ?? "terrafusion";
  const user = args.get("user") ?? "postgres";

  const gate = readJson(paths.gate);
  assertApprovedGate(gate);

  const rows = buildRows({
    caseCorrections: readJson(paths.caseList),
    supersedes: readJson(paths.supersedeList),
    inserts: readJson(paths.insertList),
    placeholders: readJson(paths.placeholderQueue)
  });

  fs.mkdirSync(paths.outRoot, { recursive: true });
  const backupSql = buildBackupSql(rows);
  const backupJson = runPsql({ sql: backupSql, dockerContainer, database, user });
  const backupPath = path.join(paths.outRoot, "pre-mutation-backup.json");
  writeText(backupPath, `${backupJson}\n`);

  const sqlPath = path.join(os.tmpdir(), `king-shell-correction-${Date.now()}.sql`);
  writeText(sqlPath, buildExecutionSql(rows));
  const executionSql = fs.readFileSync(sqlPath, "utf8");
  runPsql({ sql: executionSql, dockerContainer, database, user });

  const verification = JSON.parse(runPsql({ sql: buildVerificationSql(rows), dockerContainer, database, user }));
  const receipt = buildExecutionReceipt({
    gate,
    rows,
    verification,
    backupPath: path.relative(repoRoot, backupPath).replaceAll(path.sep, "/")
  });

  writeJson(paths.outJson, receipt);
  writeText(paths.outMd, renderMarkdown(receipt));
  writeJson(path.join(paths.outRoot, "execution-receipt.json"), receipt);

  console.log(`King shell correction execution receipt written: ${path.relative(repoRoot, paths.outJson).replaceAll(path.sep, "/")}`);
  console.log(`Transaction committed: ${receipt.transactionCommitted ? "yes" : "no"}`);
  console.log(`Shell inserted: ${verification.shellInserted}`);
  console.log(`Superseded: ${verification.superseded}`);
  console.log(`Active duplicate groups: ${verification.activeDuplicateGroups}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error.message);
    if (error.stderr) console.error(error.stderr);
    if (error.stdout) console.error(error.stdout);
    process.exit(1);
  });
}
