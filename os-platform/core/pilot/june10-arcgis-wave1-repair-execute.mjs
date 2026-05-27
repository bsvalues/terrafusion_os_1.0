#!/usr/bin/env node

import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const RECEIPT_ID = "arcgis_wave1_source_native_identity_repair_2026_05_27";
const TRUST_POSTURE = "WA_STATEWIDE_ARCGIS_SOURCE_NATIVE_IDENTITY";

const DEFAULT_PACKET = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-wave1-repair-authorization-packet.latest.json"
);
const DEFAULT_OUT_ROOT = path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-arcgis-wave1-repair-execution");
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-wave1-repair-execution.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-wave1-repair-execution.latest.md"
);
const DEFAULT_POSTURE_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-receipt-posture"
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

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
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

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function slug(value) {
  return String(value ?? "").toLowerCase().replaceAll(" ", "-");
}

function resolveRepoPath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
}

export function parseProposedRows(filePath) {
  return fs
    .readFileSync(resolveRepoPath(filePath), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const row = JSON.parse(line);
      if (!row.tfParcelId) throw new Error("Proposed row is missing tfParcelId.");
      if (!row.countyId) throw new Error("Proposed row is missing countyId.");
      if (!row.currentParcelNumber) throw new Error("Proposed row is missing currentParcelNumber.");
      if (!row.proposedParcelNumber) throw new Error("Proposed row has blank proposed ParcelNumber.");
      if (!row.proposedLegacyImportedParcelKey) throw new Error("Proposed row is missing proposedLegacyImportedParcelKey.");
      if (!row.proposedTerraFusionParcelKey) throw new Error("Proposed row is missing proposedTerraFusionParcelKey.");
      return row;
    });
}

export function evaluateAuthorizationPacket(packet) {
  const blockers = [];
  if (packet.state !== "READY_FOR_HUMAN_DECISION") blockers.push(`Authorization packet state is ${packet.state}.`);
  if (packet.executionEnabled !== false) blockers.push("Authorization packet unexpectedly enables execution.");
  if (packet.databaseMutationAttempted !== false) blockers.push("Authorization packet indicates prior mutation.");
  if (packet.productionBindingAllowed !== false) blockers.push("Authorization packet allows production binding.");
  if (packet.certificationAllowed !== false) blockers.push("Authorization packet allows certification.");
  if (packet.blockers?.length) blockers.push(...packet.blockers);
  if (packet.scope?.countiesExcluded?.some((county) => county.fips === "53023") !== true) {
    blockers.push("Garfield is not explicitly excluded.");
  }
  const included = new Set((packet.scope?.countiesIncluded ?? []).map((county) => county.fips));
  if (included.has("53023")) blockers.push("Garfield is included in execution scope.");
  return { blockers };
}

function assertHash(artifact) {
  const actual = sha256File(resolveRepoPath(artifact.path));
  if (actual !== artifact.sha256) {
    throw new Error(`Artifact hash mismatch for ${artifact.path}: ${actual} !== ${artifact.sha256}`);
  }
}

export function buildExecutionPlan({ packet, backupStamp }) {
  const counties = (packet.counties ?? []).map((county) => ({
    county: county.county,
    fips: county.fips,
    proposedRows: county.proposedRows,
    proposedRowsPath: county.artifacts.proposedRows.path,
    proposedRowsSha256: county.artifacts.proposedRows.sha256,
    sourceArtifact: county.artifacts.sourceArtifact,
    repairReceiptCandidate: county.artifacts.repairReceiptCandidate,
    rollbackPlan: county.artifacts.rollbackPlan,
    backupTable: `backup.arcgis_wave1_${county.fips}_identity_${backupStamp}`
  }));
  return {
    receiptId: RECEIPT_ID,
    backupStamp,
    totalProposedRows: counties.reduce((sum, county) => sum + county.proposedRows, 0),
    counties
  };
}

function values(rows, columns) {
  return rows.map((row) => `(${columns.map((column) => sqlString(row[column])).join(", ")})`).join(",\n");
}

function buildExecutionSql(plan, rowsByFips) {
  const allRows = [...rowsByFips.values()].flat();
  const rowValues = values(allRows, [
    "tfParcelId",
    "countyId",
    "currentParcelNumber",
    "proposedParcelNumber",
    "proposedLegacyImportedParcelKey",
    "proposedTerraFusionParcelKey"
  ]);
  const backupSql = plan.counties
    .map((county) => {
      const rows = rowsByFips.get(county.fips) ?? [];
      return `DROP TABLE IF EXISTS ${county.backupTable};
CREATE TABLE ${county.backupTable} AS
SELECT p.*
FROM canonical_tf.tf_parcel p
JOIN (VALUES ${rows.map((row) => `(${sqlString(row.tfParcelId)}::uuid)`).join(",")}) AS target(tf_parcel_id)
  ON p."TfParcelId" = target.tf_parcel_id;`;
    })
    .join("\n\n");

  return `\\set ON_ERROR_STOP on
BEGIN;

CREATE SCHEMA IF NOT EXISTS backup;

${backupSql}

CREATE TEMP TABLE arcgis_wave1_identity_repair_target (
  tf_parcel_id uuid not null,
  county_id uuid not null,
  current_parcel_number text not null,
  proposed_parcel_number text not null,
  proposed_legacy_imported_parcel_key text not null,
  proposed_terrafusion_parcel_key text not null
) ON COMMIT DROP;

INSERT INTO arcgis_wave1_identity_repair_target
  (tf_parcel_id, county_id, current_parcel_number, proposed_parcel_number, proposed_legacy_imported_parcel_key, proposed_terrafusion_parcel_key)
VALUES
${rowValues};

DO $$
DECLARE
  target_count integer;
  active_match_count integer;
  duplicate_groups integer;
  blank_targets integer;
BEGIN
  SELECT count(*) INTO target_count FROM arcgis_wave1_identity_repair_target;
  IF target_count <> ${plan.totalProposedRows} THEN
    RAISE EXCEPTION 'Wave 1 repair target count mismatch: % expected ${plan.totalProposedRows}', target_count;
  END IF;

  SELECT count(*) INTO blank_targets
  FROM arcgis_wave1_identity_repair_target
  WHERE nullif(proposed_parcel_number, '') IS NULL;
  IF blank_targets <> 0 THEN
    RAISE EXCEPTION 'Wave 1 repair has % blank proposed parcel numbers', blank_targets;
  END IF;

  SELECT count(*) INTO active_match_count
  FROM canonical_tf.tf_parcel p
  JOIN arcgis_wave1_identity_repair_target t
    ON p."TfParcelId" = t.tf_parcel_id
   AND p."CountyId" = t.county_id
   AND p."ParcelNumber" = t.current_parcel_number
  WHERE p."ParcelStatus" = 'ACTIVE';
  IF active_match_count <> ${plan.totalProposedRows} THEN
    RAISE EXCEPTION 'Wave 1 active precondition mismatch: % expected ${plan.totalProposedRows}', active_match_count;
  END IF;

  SELECT count(*) INTO duplicate_groups
  FROM (
    SELECT county_id, proposed_parcel_number
    FROM arcgis_wave1_identity_repair_target
    GROUP BY county_id, proposed_parcel_number
    HAVING count(*) > 1
  ) d;
  IF duplicate_groups <> 0 THEN
    RAISE EXCEPTION 'Wave 1 proposed target duplicates: %', duplicate_groups;
  END IF;
END $$;

UPDATE canonical_tf.tf_parcel p
SET
  "ParcelNumber" = t.proposed_parcel_number,
  "LegacyImportedParcelKey" = t.proposed_legacy_imported_parcel_key,
  "TerraFusionParcelKey" = t.proposed_terrafusion_parcel_key,
  "SourceParcelIdField" = 'ORIG_PARCEL_ID',
  "IdentityRepairReceiptId" = '${RECEIPT_ID}',
  "UpdatedAt" = now()
FROM arcgis_wave1_identity_repair_target t
WHERE p."TfParcelId" = t.tf_parcel_id
  AND p."CountyId" = t.county_id
  AND p."ParcelStatus" = 'ACTIVE';

DO $$
DECLARE
  repaired_count integer;
  duplicate_groups integer;
BEGIN
  SELECT count(*) INTO repaired_count
  FROM canonical_tf.tf_parcel p
  JOIN arcgis_wave1_identity_repair_target t
    ON p."TfParcelId" = t.tf_parcel_id
   AND p."CountyId" = t.county_id
   AND p."ParcelNumber" = t.proposed_parcel_number
   AND p."LegacyImportedParcelKey" = t.proposed_legacy_imported_parcel_key
   AND p."TerraFusionParcelKey" = t.proposed_terrafusion_parcel_key
  WHERE p."ParcelStatus" = 'ACTIVE'
    AND p."SourceParcelIdField" = 'ORIG_PARCEL_ID'
    AND p."IdentityRepairReceiptId" = '${RECEIPT_ID}';
  IF repaired_count <> ${plan.totalProposedRows} THEN
    RAISE EXCEPTION 'Wave 1 repair verification mismatch: % expected ${plan.totalProposedRows}', repaired_count;
  END IF;

  SELECT count(*) INTO duplicate_groups
  FROM (
    SELECT p."CountyId", p."ParcelNumber"
    FROM canonical_tf.tf_parcel p
    JOIN (SELECT DISTINCT county_id FROM arcgis_wave1_identity_repair_target) c ON c.county_id = p."CountyId"
    WHERE p."ParcelStatus" = 'ACTIVE'
      AND nullif(p."ParcelNumber", '') IS NOT NULL
    GROUP BY p."CountyId", p."ParcelNumber"
    HAVING count(*) > 1
  ) d;
  IF duplicate_groups <> 0 THEN
    RAISE EXCEPTION 'Wave 1 repair duplicate verification failed: %', duplicate_groups;
  END IF;
END $$;

COMMIT;
`;
}

function runPsql({ sql, dockerContainer = "terrafusion-postgres-dev", database = "terrafusion", user = "postgres" }) {
  const result = spawnSync(
    "docker",
    ["exec", "-i", dockerContainer, "psql", "-v", "ON_ERROR_STOP=1", "-U", user, "-d", database, "-At"],
    { input: sql, encoding: "utf8", maxBuffer: 1024 * 1024 * 256 }
  );
  if (result.status !== 0) {
    const error = new Error(result.stderr || result.stdout || "psql failed");
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    throw error;
  }
  return result.stdout.trim();
}

function buildAuditSql(county, rows) {
  const countyId = rows[0].countyId;
  return `select jsonb_build_object(
  'activeRows', (select count(*) from canonical_tf.tf_parcel where "CountyId"=${sqlString(countyId)}::uuid and "ParcelStatus"='ACTIVE'),
  'repairedRows', (select count(*) from canonical_tf.tf_parcel where "CountyId"=${sqlString(countyId)}::uuid and "IdentityRepairReceiptId"='${RECEIPT_ID}'),
  'legacyPreservedRows', (
    select count(*)
    from canonical_tf.tf_parcel p
    where p."CountyId"=${sqlString(countyId)}::uuid
      and p."IdentityRepairReceiptId"='${RECEIPT_ID}'
      and p."LegacyImportedParcelKey" like '${county.fips.slice(-3)}-%'
  ),
  'terraFusionKeyRows', (
    select count(*)
    from canonical_tf.tf_parcel p
    where p."CountyId"=${sqlString(countyId)}::uuid
      and p."IdentityRepairReceiptId"='${RECEIPT_ID}'
      and p."TerraFusionParcelKey" like '${county.fips}:%'
  ),
  'sourceParcelIdFieldRows', (
    select count(*)
    from canonical_tf.tf_parcel p
    where p."CountyId"=${sqlString(countyId)}::uuid
      and p."IdentityRepairReceiptId"='${RECEIPT_ID}'
      and p."SourceParcelIdField" = 'ORIG_PARCEL_ID'
  ),
  'duplicateGroups', (
    select count(*)
    from (
      select "ParcelNumber"
      from canonical_tf.tf_parcel
      where "CountyId"=${sqlString(countyId)}::uuid
        and "ParcelStatus"='ACTIVE'
        and nullif("ParcelNumber",'') is not null
      group by "ParcelNumber"
      having count(*) > 1
    ) d
  )
);`;
}

export function buildCountyPostureReceipt({ county, audit, sourceArtifact, executionReceiptPath }) {
  return {
    receiptVersion: "wa_initial_seed_post_repair_v1",
    countyName: `${county.county} County`,
    fips: county.fips,
    sourceClass: "WA_INITIAL_SEED",
    sourceSystem: "WA_STATEWIDE_ARCGIS_CURRENT_PARCELS",
    sourceParcelIdField: "ORIG_PARCEL_ID",
    preservedPrefixedField: "PARCEL_ID_NR",
    receiptStatus: "receipt_backed_full_identity",
    trustPosture: TRUST_POSTURE,
    sourceArtifact,
    executionReceiptPath,
    counts: {
      activeRows: audit.activeRows,
      repairedRows: audit.repairedRows,
      duplicateGroups: audit.duplicateGroups,
      legacyPreservedRows: audit.legacyPreservedRows,
      terraFusionKeyRows: audit.terraFusionKeyRows,
      sourceParcelIdFieldRows: audit.sourceParcelIdFieldRows
    },
    productionBindingAllowed: false,
    certificationAllowed: false,
    runtimeClaimAllowed: false,
    workflowCompleteClaimAllowed: false,
    notes: [
      "Receipt proves source-native parcel identity repair for this county.",
      "This receipt does not independently certify owner/address/value-dependent workflow completeness.",
      "Production binding remains blocked while other WA_INITIAL_SEED receipt gaps remain."
    ]
  };
}

function renderMarkdown(receipt) {
  const rows = receipt.counties
    .map(
      (county) =>
        `| ${county.county} | ${county.fips} | ${county.audit.repairedRows} | ${county.audit.duplicateGroups} | ${county.backupTable} |`
    )
    .join("\n");
  return `# ArcGIS Wave 1 Repair Execution Receipt

Generated: ${receipt.generatedAt}

## Summary

- Receipt ID: ${receipt.receiptId}
- Transaction committed: ${receipt.transactionCommitted ? "yes" : "no"}
- Proposed rows: ${receipt.summary.proposedRows}
- Repaired rows: ${receipt.summary.repairedRows}
- Duplicate groups after repair: ${receipt.summary.duplicateGroups}
- Database mutation attempted: ${receipt.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${receipt.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${receipt.certificationAllowed ? "yes" : "no"}

## County Audits

| County | FIPS | Repaired rows | Duplicate groups | Backup table |
| --- | --- | ---: | ---: | --- |
${rows}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args.has("execute")) {
    throw new Error("Refusing to mutate DB without explicit --execute.");
  }
  const paths = {
    packet: args.get("packet") ?? DEFAULT_PACKET,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD,
    postureRoot: args.get("posture-root") ?? DEFAULT_POSTURE_ROOT
  };
  const packet = readJson(paths.packet);
  const authorization = evaluateAuthorizationPacket(packet);
  if (authorization.blockers.length) {
    throw new Error(`Authorization packet is not executable: ${authorization.blockers.join(" ")}`);
  }

  const backupStamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const plan = buildExecutionPlan({ packet, backupStamp });
  const rowsByFips = new Map();
  for (const county of plan.counties) {
    assertHash({ path: county.proposedRowsPath, sha256: county.proposedRowsSha256 });
    assertHash(county.sourceArtifact);
    assertHash(county.repairReceiptCandidate);
    assertHash(county.rollbackPlan);
    const rows = parseProposedRows(county.proposedRowsPath);
    if (rows.length !== county.proposedRows) {
      throw new Error(`${county.county} proposed row count mismatch: ${rows.length} !== ${county.proposedRows}`);
    }
    rowsByFips.set(county.fips, rows);
  }

  fs.mkdirSync(paths.outRoot, { recursive: true });
  const sql = buildExecutionSql(plan, rowsByFips);
  const sqlPath = path.join(paths.outRoot, "executed-transaction.sql");
  writeText(sqlPath, sql);
  runPsql({ sql });

  const counties = [];
  for (const county of plan.counties) {
    const rows = rowsByFips.get(county.fips);
    const audit = JSON.parse(runPsql({ sql: buildAuditSql(county, rows) }));
    const countyRoot = path.join(paths.outRoot, `${county.fips}-${slug(county.county)}`);
    fs.mkdirSync(countyRoot, { recursive: true });
    const executionReceiptPath = path.join(countyRoot, "execution-receipt.json");
    const postureReceiptPath = path.join(paths.postureRoot, slug(county.county), "source-snapshot-receipt.json");
    const postureReceipt = buildCountyPostureReceipt({
      county,
      audit,
      sourceArtifact: county.sourceArtifact,
      executionReceiptPath: repoRelative(executionReceiptPath)
    });
    writeJson(postureReceiptPath, postureReceipt);
    const countyReceipt = {
      county: county.county,
      fips: county.fips,
      receiptId: RECEIPT_ID,
      backupTable: county.backupTable,
      audit,
      sourceArtifact: county.sourceArtifact,
      postureReceiptPath: repoRelative(postureReceiptPath),
      productionBindingAllowed: false,
      certificationAllowed: false
    };
    writeJson(executionReceiptPath, countyReceipt);
    counties.push({
      ...countyReceipt,
      executionReceiptPath: repoRelative(executionReceiptPath)
    });
  }

  const receipt = {
    generatedAt: new Date().toISOString(),
    receiptId: RECEIPT_ID,
    receiptType: "arcgis_wave1_source_native_identity_repair_execution",
    transactionCommitted: true,
    databaseMutationAttempted: true,
    noDeletes: true,
    scope: {
      includedCounties: plan.counties.map((county) => ({ county: county.county, fips: county.fips })),
      excludedCounties: packet.scope.countiesExcluded
    },
    summary: {
      proposedRows: plan.totalProposedRows,
      repairedRows: counties.reduce((sum, county) => sum + Number(county.audit.repairedRows), 0),
      duplicateGroups: counties.reduce((sum, county) => sum + Number(county.audit.duplicateGroups), 0)
    },
    transactionSqlPath: repoRelative(sqlPath),
    counties,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    certificationAllowed: false
  };
  writeJson(paths.outJson, receipt);
  writeText(paths.outMd, renderMarkdown(receipt));
  console.log(`ArcGIS Wave 1 repair execution written: ${repoRelative(paths.outJson)}`);
  console.log(`Repaired rows: ${receipt.summary.repairedRows}/${receipt.summary.proposedRows}`);
  console.log(`Duplicate groups after repair: ${receipt.summary.duplicateGroups}`);
  console.log(`Production binding allowed: ${receipt.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
