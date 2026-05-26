#!/usr/bin/env node

import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseCowlitzSourceParcno } from "./june10-cowlitz-bounded-correction-dry-run.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const COWLITZ_COUNTY_ID = "6504d940-242e-26c1-8715-6809ca9df7fb";
const COWLITZ_FIPS = "53015";
const RECEIPT_ID = "cowlitz_public_parcel_identity_correction_2026_05_26";
const TRUST_POSTURE = "COWLITZ_PUBLIC_PARCEL_IDENTITY";
const UUID_NAMESPACE_URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

const DEFAULT_DRY_RUN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-bounded-correction-dry-run.latest.json"
);
const DEFAULT_SOURCE_RAW = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-source-captures",
  "cowlitz",
  "cowlitz-parcels-parcno-raw.jsonl"
);
const DEFAULT_SUPERSEDE_LIST = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-bounded-correction-dry-run",
  "proposed-supersede-list.json"
);
const DEFAULT_INSERT_LIST = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-bounded-correction-dry-run",
  "proposed-stage-insert-list.json"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-bounded-correction-execution"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-bounded-correction-execution.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-bounded-correction-execution.latest.md"
);
const DEFAULT_POSTURE_RECEIPT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-receipt-posture",
  "cowlitz",
  "source-snapshot-receipt.json"
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
    const key = argv[index].slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, "true");
      continue;
    }
    args.set(key, next);
    index += 1;
  }
  return args;
}

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
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

function values(rows, columns) {
  return rows.map((row) => `(${columns.map((column) => sqlString(row[column])).join(", ")})`).join(",\n");
}

function assertDryRunReady(dryRun) {
  const blockers = [];
  if (dryRun.dryRunStatus !== "dry_run_pass_pending_authorization") {
    blockers.push(`Dry-run status is ${dryRun.dryRunStatus}.`);
  }
  if (dryRun.databaseMutationAttempted !== false) blockers.push("Dry-run does not prove no prior mutation.");
  if (dryRun.productionBindingAllowed !== false) blockers.push("Dry-run unexpectedly allows production binding.");
  if (dryRun.certificationAllowed !== false) blockers.push("Dry-run unexpectedly allows certification.");
  if (dryRun.sourceReceiptHashReconciliation?.acceptedForDryRun !== true) {
    blockers.push("Source receipt hash reconciliation has not been accepted by the dry-run.");
  }
  if (dryRun.currentDeltas?.sourceOnlyCount !== 321) blockers.push("Expected 321 source-only rows.");
  if (dryRun.currentDeltas?.canonicalOnlyCount !== 125) blockers.push("Expected 125 canonical-only rows.");
  if (dryRun.proposedCorrection?.duplicateGroupsAfter !== 0) {
    blockers.push("Dry-run does not prove zero duplicate groups after correction.");
  }
  if (dryRun.blockers?.length) blockers.push(...dryRun.blockers);
  if (blockers.length) {
    const error = new Error(`Cowlitz bounded correction is not ready: ${blockers.join(" ")}`);
    error.blockers = blockers;
    throw error;
  }
}

function buildRows({ supersedes, inserts }) {
  return {
    supersedes: supersedes.map((row) => ({
      parcelNumber: row.parcelNumber,
      action: row.action,
      classification: row.classification,
      deleteAllowed: row.deleteAllowed === true
    })),
    inserts: inserts.map((row) => ({
      tfParcelId: uuidV5(`cowlitz-identity-shell:${COWLITZ_FIPS}:${row.parcelNumber}`),
      parcelNumber: row.parcelNumber,
      terraFusionParcelKey: `${COWLITZ_FIPS}:${row.parcelNumber}`,
      legacyImportedParcelKey: `${COWLITZ_FIPS}:${row.parcelNumber}`,
      conversionEra: "WA_INITIAL_SEED",
      sourceParcelIdField: "PARCNO",
      parcelStatus: "ACTIVE",
      trustPosture: TRUST_POSTURE
    }))
  };
}

function buildBackupSql(rows) {
  return `select coalesce(jsonb_pretty(jsonb_agg(to_jsonb(p) order by p."ParcelNumber")), '[]')
from canonical_tf.tf_parcel p
where p."CountyId" = '${COWLITZ_COUNTY_ID}'::uuid
  and p."ParcelStatus" = 'ACTIVE'
  and p."ParcelNumber" in (${rows.supersedes.map((row) => sqlString(row.parcelNumber)).join(", ")});`;
}

function buildExecutionSql(rows) {
  const supersedeValues = values(rows.supersedes, ["parcelNumber"]);
  const insertValues = values(rows.inserts, [
    "tfParcelId",
    "parcelNumber",
    "terraFusionParcelKey",
    "legacyImportedParcelKey",
    "conversionEra",
    "sourceParcelIdField",
    "parcelStatus"
  ]);

  return `\\set ON_ERROR_STOP on
BEGIN;

CREATE TEMP TABLE cowlitz_supersede_target (
  parcel_number text not null
) ON COMMIT DROP;

INSERT INTO cowlitz_supersede_target (parcel_number)
VALUES
${supersedeValues};

CREATE TEMP TABLE cowlitz_identity_shell_insert (
  tf_parcel_id uuid not null,
  parcel_number text not null,
  terrafusion_parcel_key text not null,
  legacy_imported_parcel_key text not null,
  conversion_era text not null,
  source_parcel_id_field text not null,
  parcel_status text not null
) ON COMMIT DROP;

INSERT INTO cowlitz_identity_shell_insert
  (tf_parcel_id, parcel_number, terrafusion_parcel_key, legacy_imported_parcel_key, conversion_era, source_parcel_id_field, parcel_status)
VALUES
${insertValues};

DO $$
DECLARE
  supersede_ready integer;
  insert_conflicts integer;
  duplicate_groups integer;
BEGIN
  SELECT count(*) INTO supersede_ready
  FROM canonical_tf.tf_parcel p
  JOIN cowlitz_supersede_target t ON t.parcel_number = p."ParcelNumber"
  WHERE p."CountyId" = '${COWLITZ_COUNTY_ID}'::uuid
    AND p."ParcelStatus" = 'ACTIVE';
  IF supersede_ready <> ${rows.supersedes.length} THEN
    RAISE EXCEPTION 'Cowlitz supersede precondition failed: % ready, expected ${rows.supersedes.length}', supersede_ready;
  END IF;

  SELECT count(*) INTO insert_conflicts
  FROM canonical_tf.tf_parcel p
  JOIN cowlitz_identity_shell_insert t
    ON t.parcel_number = p."ParcelNumber"
  WHERE p."CountyId" = '${COWLITZ_COUNTY_ID}'::uuid
    AND p."ParcelStatus" = 'ACTIVE';
  IF insert_conflicts <> 0 THEN
    RAISE EXCEPTION 'Cowlitz insert precondition failed: % active parcel conflicts', insert_conflicts;
  END IF;

  SELECT count(*) INTO insert_conflicts
  FROM canonical_tf.tf_parcel p
  JOIN cowlitz_identity_shell_insert t
    ON t.terrafusion_parcel_key = p."TerraFusionParcelKey"
  WHERE p."CountyId" = '${COWLITZ_COUNTY_ID}'::uuid;
  IF insert_conflicts <> 0 THEN
    RAISE EXCEPTION 'Cowlitz insert precondition failed: % TerraFusionParcelKey conflicts', insert_conflicts;
  END IF;

  SELECT count(*) INTO duplicate_groups
  FROM (
    SELECT p."ParcelNumber"
    FROM canonical_tf.tf_parcel p
    WHERE p."CountyId" = '${COWLITZ_COUNTY_ID}'::uuid
      AND p."ParcelStatus" = 'ACTIVE'
      AND nullif(p."ParcelNumber", '') IS NOT NULL
    GROUP BY p."ParcelNumber"
    HAVING count(*) > 1
  ) d;
  IF duplicate_groups <> 0 THEN
    RAISE EXCEPTION 'Cowlitz duplicate precondition failed: % active duplicate groups exist', duplicate_groups;
  END IF;
END $$;

UPDATE canonical_tf.tf_parcel p
SET
  "ParcelStatus" = 'SUPERSEDED',
  "IdentityRepairReceiptId" = '${RECEIPT_ID}',
  "UpdatedAt" = now()
FROM cowlitz_supersede_target t
WHERE p."CountyId" = '${COWLITZ_COUNTY_ID}'::uuid
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
  '${COWLITZ_COUNTY_ID}'::uuid,
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
FROM cowlitz_identity_shell_insert t;

DO $$
DECLARE
  supersede_done integer;
  insert_done integer;
  duplicate_groups integer;
BEGIN
  SELECT count(*) INTO supersede_done
  FROM canonical_tf.tf_parcel p
  JOIN cowlitz_supersede_target t ON t.parcel_number = p."ParcelNumber"
  WHERE p."CountyId" = '${COWLITZ_COUNTY_ID}'::uuid
    AND p."ParcelStatus" = 'SUPERSEDED'
    AND p."IdentityRepairReceiptId" = '${RECEIPT_ID}';
  IF supersede_done <> ${rows.supersedes.length} THEN
    RAISE EXCEPTION 'Cowlitz supersede verification failed: % done, expected ${rows.supersedes.length}', supersede_done;
  END IF;

  SELECT count(*) INTO insert_done
  FROM canonical_tf.tf_parcel p
  JOIN cowlitz_identity_shell_insert t ON t.terrafusion_parcel_key = p."TerraFusionParcelKey"
  WHERE p."CountyId" = '${COWLITZ_COUNTY_ID}'::uuid
    AND p."ParcelStatus" = 'ACTIVE'
    AND p."IdentityRepairReceiptId" = '${RECEIPT_ID}';
  IF insert_done <> ${rows.inserts.length} THEN
    RAISE EXCEPTION 'Cowlitz insert verification failed: % done, expected ${rows.inserts.length}', insert_done;
  END IF;

  SELECT count(*) INTO duplicate_groups
  FROM (
    SELECT p."ParcelNumber"
    FROM canonical_tf.tf_parcel p
    WHERE p."CountyId" = '${COWLITZ_COUNTY_ID}'::uuid
      AND p."ParcelStatus" = 'ACTIVE'
      AND nullif(p."ParcelNumber", '') IS NOT NULL
    GROUP BY p."ParcelNumber"
    HAVING count(*) > 1
  ) d;
  IF duplicate_groups <> 0 THEN
    RAISE EXCEPTION 'Cowlitz duplicate verification failed: % active duplicate groups remain', duplicate_groups;
  END IF;
END $$;

COMMIT;
`;
}

function buildRollbackSql(rows) {
  return `\\set ON_ERROR_STOP on
BEGIN;

DELETE FROM canonical_tf.tf_parcel
WHERE "CountyId" = '${COWLITZ_COUNTY_ID}'::uuid
  AND "IdentityRepairReceiptId" = '${RECEIPT_ID}'
  AND "TerraFusionParcelKey" in (${rows.inserts.map((row) => sqlString(row.terraFusionParcelKey)).join(", ")});

UPDATE canonical_tf.tf_parcel
SET
  "ParcelStatus" = 'ACTIVE',
  "IdentityRepairReceiptId" = null,
  "UpdatedAt" = now()
WHERE "CountyId" = '${COWLITZ_COUNTY_ID}'::uuid
  AND "IdentityRepairReceiptId" = '${RECEIPT_ID}'
  AND "ParcelNumber" in (${rows.supersedes.map((row) => sqlString(row.parcelNumber)).join(", ")});

COMMIT;
`;
}

function runPsql({ sql, dockerContainer, database, user }) {
  const result = spawnSync(
    "docker",
    ["exec", "-i", dockerContainer, "psql", "-v", "ON_ERROR_STOP=1", "-U", user, "-d", database, "-At"],
    { input: sql, encoding: "utf8", maxBuffer: 1024 * 1024 * 128 }
  );
  if (result.status !== 0) {
    const error = new Error(result.stderr || result.stdout || "psql failed");
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    throw error;
  }
  return result.stdout.trim();
}

function setDifference(left, right) {
  return [...left].filter((value) => !right.has(value)).sort((a, b) => a.localeCompare(b));
}

function parseParcelLines(stdout) {
  return new Set(stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
}

function buildVerification({ sourceDistinct, activeParcelNumbers, rows, sqlCounts }) {
  const sourceOnlyRemaining = setDifference(sourceDistinct, activeParcelNumbers);
  const canonicalOnlyRemaining = setDifference(activeParcelNumbers, sourceDistinct);
  return {
    sourceDistinct: sourceDistinct.size,
    activeDistinct: activeParcelNumbers.size,
    activeRows: sqlCounts.activeRows,
    superseded: sqlCounts.superseded,
    shellInserted: sqlCounts.shellInserted,
    activeDuplicateGroups: sqlCounts.activeDuplicateGroups,
    sourceOnlyRemaining: sourceOnlyRemaining.length,
    canonicalOnlyRemaining: canonicalOnlyRemaining.length,
    proposedSupersedes: rows.supersedes.length,
    proposedShellInserts: rows.inserts.length,
    trustPosture: TRUST_POSTURE,
    trustLabelStorage: "execution_receipt_and_identity_repair_receipt_id"
  };
}

function buildVerificationCountsSql() {
  return `with duplicate_groups as (
  select p."ParcelNumber"
  from canonical_tf.tf_parcel p
  where p."CountyId"='${COWLITZ_COUNTY_ID}'::uuid
    and p."ParcelStatus"='ACTIVE'
    and nullif(p."ParcelNumber",'') is not null
  group by p."ParcelNumber"
  having count(*) > 1
)
select jsonb_build_object(
  'activeRows', (select count(*) from canonical_tf.tf_parcel where "CountyId"='${COWLITZ_COUNTY_ID}'::uuid and "ParcelStatus"='ACTIVE'),
  'superseded', (select count(*) from canonical_tf.tf_parcel where "CountyId"='${COWLITZ_COUNTY_ID}'::uuid and "ParcelStatus"='SUPERSEDED' and "IdentityRepairReceiptId"='${RECEIPT_ID}'),
  'shellInserted', (select count(*) from canonical_tf.tf_parcel where "CountyId"='${COWLITZ_COUNTY_ID}'::uuid and "ParcelStatus"='ACTIVE' and "IdentityRepairReceiptId"='${RECEIPT_ID}'),
  'activeDuplicateGroups', (select count(*) from duplicate_groups)
);`;
}

function buildReceiptRowCountSql() {
  return `select count(*) from canonical_tf.tf_parcel where "CountyId"='${COWLITZ_COUNTY_ID}'::uuid and "IdentityRepairReceiptId"='${RECEIPT_ID}';`;
}

export function buildExecutionReceipt({ dryRun, rows, verification, backupPath, rollbackPath }) {
  const parityAchieved =
    verification.sourceOnlyRemaining === 0 &&
    verification.canonicalOnlyRemaining === 0 &&
    verification.activeDuplicateGroups === 0 &&
    verification.activeDistinct === dryRun.currentDeltas.sourceDistinct;

  return {
    generatedAt: new Date().toISOString(),
    receiptType: "cowlitz_bounded_identity_correction_execution_receipt",
    receiptVersion: "june10-cowlitz-bounded-correction-v1",
    receiptId: RECEIPT_ID,
    countyName: "Cowlitz County",
    fips: COWLITZ_FIPS,
    databaseMutationAttempted: true,
    transactionCommitted: true,
    noDeletes: true,
    certificationAllowed: false,
    productionBindingAllowed: false,
    trustPosture: TRUST_POSTURE,
    backupPath,
    rollbackPath,
    expectedCounts: {
      supersedes: rows.supersedes.length,
      shellInserts: rows.inserts.length
    },
    verification,
    parityAchieved,
    receiptPosture: parityAchieved ? "receipt_backed_shell_present" : "post_execution_blocked",
    boundaries: [
      "Cowlitz source-native parcel identity parity is distinct from workflow certification.",
      "Inserted Cowlitz rows are identity shell rows from PARCNO-only public capture.",
      "Owner/address/value-dependent workflows remain blocked for inserted shell rows.",
      "Production binding remains blocked while other WA_INITIAL_SEED receipt gaps remain."
    ]
  };
}

export function buildPostureReceipt({ executionReceipt }) {
  return {
    receiptVersion: "wa_initial_seed_shell_present_v1",
    countyName: "Cowlitz County",
    fips: COWLITZ_FIPS,
    sourceClass: "WA_INITIAL_SEED",
    sourceParcelIdField: "PARCNO",
    receiptStatus: executionReceipt.receiptPosture,
    trustPosture: TRUST_POSTURE,
    counts: {
      sourceDistinct: executionReceipt.verification.sourceDistinct,
      canonicalActiveDistinct: executionReceipt.verification.activeDistinct,
      activeRows: executionReceipt.verification.activeRows,
      supersededRows: executionReceipt.verification.superseded,
      shellInsertedRows: executionReceipt.verification.shellInserted,
      sourceOnlyRemaining: executionReceipt.verification.sourceOnlyRemaining,
      canonicalOnlyRemaining: executionReceipt.verification.canonicalOnlyRemaining,
      activeDuplicateGroups: executionReceipt.verification.activeDuplicateGroups
    },
    lineage: {
      executionReceiptId: executionReceipt.receiptId,
      executionReceiptPath: "os-platform/core/pilot/evidence/june10-cowlitz-bounded-correction-execution.latest.json",
      backupPath: executionReceipt.backupPath,
      rollbackPath: executionReceipt.rollbackPath
    },
    workflowLabels: {
      parcelIdentity: "receipt_backed",
      parcelSearch: "identity_shell_only",
      officialValuation: "blocked",
      productionCertification: "blocked"
    },
    productionBindingAllowed: false,
    certificationAllowed: false,
    databaseMutationAttempted: true
  };
}

function renderMarkdown(receipt) {
  return `# Cowlitz Bounded Correction Execution Receipt

Generated: ${receipt.generatedAt}

## Verdict

- Mutation executed: ${receipt.databaseMutationAttempted ? "yes" : "no"}
- Transaction committed: ${receipt.transactionCommitted ? "yes" : "no"}
- County: ${receipt.countyName} (${receipt.fips})
- Receipt posture: ${receipt.receiptPosture}
- Parity achieved: ${receipt.parityAchieved ? "yes" : "no"}
- Certification allowed: ${receipt.certificationAllowed ? "yes" : "no"}
- Production binding allowed: ${receipt.productionBindingAllowed ? "yes" : "no"}

## Counts

- Superseded rows: ${receipt.verification.superseded}
- Shell inserted rows: ${receipt.verification.shellInserted}
- Active rows after correction: ${receipt.verification.activeRows}
- Active distinct parcel numbers: ${receipt.verification.activeDistinct}
- Source distinct parcel numbers: ${receipt.verification.sourceDistinct}
- Source-only remaining: ${receipt.verification.sourceOnlyRemaining}
- Canonical-only remaining: ${receipt.verification.canonicalOnlyRemaining}
- Active duplicate groups: ${receipt.verification.activeDuplicateGroups}

## Boundaries

${receipt.boundaries.map((item) => `- ${item}`).join("\n")}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    dryRun: args.get("dry-run") ?? DEFAULT_DRY_RUN,
    sourceRaw: args.get("source-raw") ?? DEFAULT_SOURCE_RAW,
    supersedeList: args.get("supersede-list") ?? DEFAULT_SUPERSEDE_LIST,
    insertList: args.get("insert-list") ?? DEFAULT_INSERT_LIST,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD,
    postureReceipt: args.get("posture-receipt") ?? DEFAULT_POSTURE_RECEIPT
  };
  const dockerContainer = args.get("docker-container") ?? "terrafusion-postgres-dev";
  const database = args.get("database") ?? "terrafusion";
  const user = args.get("user") ?? "postgres";

  const dryRun = readJson(paths.dryRun);
  assertDryRunReady(dryRun);

  const rows = buildRows({
    supersedes: readJson(paths.supersedeList),
    inserts: readJson(paths.insertList)
  });
  if (rows.supersedes.some((row) => row.deleteAllowed)) {
    throw new Error("Cowlitz correction refuses delete-capable supersede rows.");
  }

  fs.mkdirSync(paths.outRoot, { recursive: true });
  const backupPath = path.join(paths.outRoot, "pre-mutation-backup.json");
  const rollbackPath = path.join(paths.outRoot, "rollback.sql");
  const receiptRowsBefore = Number(runPsql({ sql: buildReceiptRowCountSql(), dockerContainer, database, user }));
  const expectedReceiptRows = rows.supersedes.length + rows.inserts.length;

  if (receiptRowsBefore === 0) {
    const backupJson = runPsql({
      sql: buildBackupSql(rows),
      dockerContainer,
      database,
      user
    });
    writeText(backupPath, `${backupJson}\n`);
    writeText(rollbackPath, buildRollbackSql(rows));

    const sqlPath = path.join(os.tmpdir(), `cowlitz-bounded-correction-${Date.now()}.sql`);
    writeText(sqlPath, buildExecutionSql(rows));
    runPsql({ sql: fs.readFileSync(sqlPath, "utf8"), dockerContainer, database, user });
  } else if (receiptRowsBefore !== expectedReceiptRows) {
    throw new Error(
      `Cowlitz correction receipt already has ${receiptRowsBefore} rows; expected ${expectedReceiptRows}. Refusing partial replay.`
    );
  } else {
    if (!fs.existsSync(backupPath)) writeText(backupPath, "[]\n");
    if (!fs.existsSync(rollbackPath)) writeText(rollbackPath, buildRollbackSql(rows));
  }

  const activeParcelNumbers = parseParcelLines(
    runPsql({
      sql: `select "ParcelNumber" from canonical_tf.tf_parcel where "CountyId"='${COWLITZ_COUNTY_ID}'::uuid and "ParcelStatus"='ACTIVE' order by "ParcelNumber";`,
      dockerContainer,
      database,
      user
    })
  );
  const sourceDistinct = parseCowlitzSourceParcno(fs.readFileSync(paths.sourceRaw, "utf8")).distinct;
  const sqlCounts = JSON.parse(runPsql({ sql: buildVerificationCountsSql(), dockerContainer, database, user }));
  const verification = buildVerification({ sourceDistinct, activeParcelNumbers, rows, sqlCounts });
  const receipt = buildExecutionReceipt({
    dryRun,
    rows,
    verification,
    backupPath: relativePath(backupPath),
    rollbackPath: relativePath(rollbackPath)
  });
  receipt.executionMode = receiptRowsBefore === 0 ? "transaction_executed" : "already_committed_verified";

  writeJson(paths.outJson, receipt);
  writeText(paths.outMd, renderMarkdown(receipt));
  writeJson(path.join(paths.outRoot, "execution-receipt.json"), receipt);
  writeJson(paths.postureReceipt, buildPostureReceipt({ executionReceipt: receipt }));

  console.log(`Cowlitz bounded correction execution receipt written: ${relativePath(paths.outJson)}`);
  console.log(`Transaction committed: ${receipt.transactionCommitted ? "yes" : "no"}`);
  console.log(`Receipt posture: ${receipt.receiptPosture}`);
  console.log(`Source-only remaining: ${verification.sourceOnlyRemaining}`);
  console.log(`Canonical-only remaining: ${verification.canonicalOnlyRemaining}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error.message);
    if (error.stderr) console.error(error.stderr);
    if (error.stdout) console.error(error.stdout);
    process.exit(1);
  });
}
