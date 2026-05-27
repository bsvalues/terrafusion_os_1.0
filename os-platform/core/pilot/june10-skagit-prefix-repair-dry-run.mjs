#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const SKAGIT_COUNTY_ID = "a1c87e81-4825-f488-040b-2faa433b9905";
const RECEIPT_ID = "skagit_prefix_repair_dry_run_2026_05_27";
const DEFAULT_SOURCE_IDS = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-authoritative-recapture-wave1",
  "skagit",
  "source-native-parcel-ids.jsonl"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-skagit-prefix-repair-dry-run"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-skagit-prefix-repair-dry-run.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-skagit-prefix-repair-dry-run.latest.md"
);

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

function normalize(value) {
  return String(value ?? "").trim();
}

function stripSeedPrefix(value) {
  return normalize(value).replace(/^057-/, "").replace(/^\d{3}-/, "");
}

function sqlString(value) {
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}

function firstValues(values, limit = 25) {
  return [...values].sort((a, b) => a.localeCompare(b)).slice(0, limit);
}

export function parseSourceIds(filePath) {
  const ids = new Set();
  if (!fs.existsSync(filePath)) return ids;
  const text = fs.readFileSync(filePath, "utf8").trim();
  if (!text) return ids;
  for (const line of text.split(/\r?\n/)) {
    const parsed = JSON.parse(line);
    const id = normalize(parsed.sourceNativeParcelId ?? parsed.parcelId ?? parsed.PARCELID);
    if (id) ids.add(id);
  }
  return ids;
}

export function parseCanonicalRows(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, "utf8").trim();
  if (!text) return [];
  return text.split(/\r?\n/).map((line) => {
    const parsed = JSON.parse(line);
    return {
      tfParcelId: parsed.tfParcelId ?? parsed.TfParcelId,
      parcelNumber: normalize(parsed.parcelNumber ?? parsed.ParcelNumber),
      terraFusionParcelKey: parsed.terraFusionParcelKey ?? parsed.TerraFusionParcelKey ?? null,
      legacyImportedParcelKey: parsed.legacyImportedParcelKey ?? parsed.LegacyImportedParcelKey ?? null
    };
  });
}

function runPsql(sql) {
  return execFileSync(
    "docker",
    ["exec", "-i", "terrafusion-postgres-dev", "psql", "-U", "postgres", "-d", "terrafusion", "-At", "-c", sql],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 128 }
  );
}

function fetchCanonicalRowsFromDb() {
  const sql = `
select json_build_object(
  'tfParcelId', "TfParcelId",
  'parcelNumber', "ParcelNumber",
  'terraFusionParcelKey', "TerraFusionParcelKey",
  'legacyImportedParcelKey', "LegacyImportedParcelKey"
)::text
from canonical_tf.tf_parcel
where "CountyId"='${SKAGIT_COUNTY_ID}'::uuid
  and "ParcelStatus"='ACTIVE'
  and nullif("ParcelNumber",'') is not null
order by "ParcelNumber";`;
  const output = runPsql(sql);
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parsed = JSON.parse(line);
      return {
        tfParcelId: parsed.tfParcelId,
        parcelNumber: parsed.parcelNumber,
        terraFusionParcelKey: parsed.terraFusionParcelKey,
        legacyImportedParcelKey: parsed.legacyImportedParcelKey
      };
    });
}

export function duplicateGroupCount(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.values()].filter((count) => count > 1).length;
}

export function buildSkagitPrefixRepairPlan({ sourceIds, canonicalRows }) {
  const sourceSet = new Set(sourceIds);
  const canonicalByStripped = new Map();
  for (const row of canonicalRows) {
    const stripped = stripSeedPrefix(row.parcelNumber);
    if (!canonicalByStripped.has(stripped)) canonicalByStripped.set(stripped, []);
    canonicalByStripped.get(stripped).push(row);
  }

  const updateTargets = [];
  const supersedeTargets = [];
  const stageInsertTargets = [];

  for (const row of canonicalRows) {
    const sourceNativeParcelNumber = stripSeedPrefix(row.parcelNumber);
    if (sourceSet.has(sourceNativeParcelNumber)) {
      updateTargets.push({
        action: "repair_prefixed_parcel_number",
        tfParcelId: row.tfParcelId,
        currentParcelNumber: row.parcelNumber,
        proposedParcelNumber: sourceNativeParcelNumber,
        legacyImportedParcelKey: row.legacyImportedParcelKey ?? row.parcelNumber,
        currentTerraFusionParcelKey: row.terraFusionParcelKey ?? null,
        proposedTerraFusionParcelKey: `53057:${sourceNativeParcelNumber}`,
        identityRepairReceiptId: RECEIPT_ID
      });
    } else {
      supersedeTargets.push({
        action: "mark_superseded_inactive",
        tfParcelId: row.tfParcelId,
        parcelNumber: row.parcelNumber,
        sourceNativeParcelNumber,
        proposedParcelStatus: "SUPERSEDED",
        deleteRow: false,
        identityRepairReceiptId: RECEIPT_ID
      });
    }
  }

  for (const sourceId of sourceSet) {
    if (!canonicalByStripped.has(sourceId)) {
      stageInsertTargets.push({
        action: "stage_skagit_public_parcel_shell",
        parcelNumber: sourceId,
        terraFusionParcelKey: `53057:${sourceId}`,
        sourceParcelIdField: "PARCELID",
        parcelStatus: "ACTIVE",
        conversionEra: "WA_INITIAL_SEED",
        workflowComplete: false,
        trustLabel: "SKAGIT_PUBLIC_PARCEL_SHELL",
        blockedActions: ["owner_address_value_workflows", "valuation_certification", "workflow_complete_claims"],
        identityRepairReceiptId: RECEIPT_ID
      });
    }
  }

  const projectedActiveParcelNumbers = [
    ...updateTargets.map((target) => target.proposedParcelNumber),
    ...stageInsertTargets.map((target) => target.parcelNumber)
  ];
  const projectedSet = new Set(projectedActiveParcelNumbers);
  const sourceOnlyAfterProjection = [...sourceSet].filter((id) => !projectedSet.has(id));
  const canonicalOnlyAfterProjection = [...projectedSet].filter((id) => !sourceSet.has(id));

  return {
    updateTargets,
    supersedeTargets,
    stageInsertTargets,
    postRepairProjection: {
      projectedActiveParcelNumbers: projectedActiveParcelNumbers.length,
      projectedDistinctActiveParcelNumbers: projectedSet.size,
      duplicateGroups: duplicateGroupCount(projectedActiveParcelNumbers),
      sourceOnlyCount: sourceOnlyAfterProjection.length,
      canonicalOnlyCount: canonicalOnlyAfterProjection.length,
      sourceOnlySamples: firstValues(sourceOnlyAfterProjection),
      canonicalOnlySamples: firstValues(canonicalOnlyAfterProjection)
    }
  };
}

function writeJsonl(filePath, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : ""));
  return {
    path: repoRelative(filePath),
    rows: rows.length,
    sizeBytes: fs.statSync(filePath).size,
    sha256: sha256File(filePath)
  };
}

function writeRollbackPlan(filePath, artifacts) {
  const text = `# Skagit Prefix Repair Rollback Plan

This is a dry-run artifact. No SQL was executed.

Rollback requirement before any future mutation:

1. Back up every active Skagit canonical_tf.tf_parcel row touched by ${RECEIPT_ID}.
2. Execute repair in one transaction.
3. If verification fails, restore from the backup by TfParcelId.
4. Delete only newly inserted shell rows for this receipt ID if rollback is required.
5. Never delete existing canonical rows; stale rows must be marked superseded/inactive only.

Required artifacts:

- Update targets: ${artifacts.updateTargets.path}
- Supersede targets: ${artifacts.supersedeTargets.path}
- Stage insert targets: ${artifacts.stageInsertTargets.path}

Rollback SQL template:

\`\`\`sql
BEGIN;

-- Restore repaired existing rows from a pre-mutation backup table.
-- UPDATE canonical_tf.tf_parcel p
-- SET
--   "ParcelNumber" = b."ParcelNumber",
--   "LegacyImportedParcelKey" = b."LegacyImportedParcelKey",
--   "TerraFusionParcelKey" = b."TerraFusionParcelKey",
--   "ParcelStatus" = b."ParcelStatus",
--   "IdentityRepairReceiptId" = b."IdentityRepairReceiptId",
--   "UpdatedAt" = b."UpdatedAt"
-- FROM backup.skagit_prefix_repair_${RECEIPT_ID} b
-- WHERE p."TfParcelId" = b."TfParcelId";

-- Remove shell rows inserted by a future authorized repair.
-- DELETE FROM canonical_tf.tf_parcel
-- WHERE "CountyId" = '${SKAGIT_COUNTY_ID}'::uuid
--   AND "IdentityRepairReceiptId" = '${RECEIPT_ID}'
--   AND "LegacyImportedParcelKey" IS NULL
--   AND "ParcelStatus" = 'ACTIVE';

ROLLBACK;
\`\`\`
`;
  writeText(filePath, text);
  return {
    path: repoRelative(filePath),
    sizeBytes: fs.statSync(filePath).size,
    sha256: sha256File(filePath)
  };
}

function writeReceipt(filePath, plan, artifacts) {
  const receipt = {
    receiptVersion: "skagit_prefix_repair_dry_run_v1",
    receiptId: RECEIPT_ID,
    county: "Skagit",
    fips: "53057",
    sourceNativeField: "PARCELID",
    sourceNativeContract: "ParcelNumber must equal source PARCELID; prior 057-prefixed value is preserved as LegacyImportedParcelKey.",
    counts: {
      repairUpdates: plan.updateTargets.length,
      supersedes: plan.supersedeTargets.length,
      stagedShellInserts: plan.stageInsertTargets.length,
      postRepairDuplicateGroups: plan.postRepairProjection.duplicateGroups,
      postRepairSourceOnly: plan.postRepairProjection.sourceOnlyCount,
      postRepairCanonicalOnly: plan.postRepairProjection.canonicalOnlyCount
    },
    artifacts,
    certificationAllowed: false,
    productionBindingAllowed: false,
    databaseMutationAttempted: false
  };
  writeJson(filePath, receipt);
  return {
    path: repoRelative(filePath),
    sizeBytes: fs.statSync(filePath).size,
    sha256: sha256File(filePath)
  };
}

function buildSqlPreview(plan) {
  return {
    updateTemplate: `UPDATE canonical_tf.tf_parcel SET "LegacyImportedParcelKey" = "ParcelNumber", "ParcelNumber" = <source PARCELID>, "TerraFusionParcelKey" = '53057:' || <source PARCELID>, "IdentityRepairReceiptId" = '${RECEIPT_ID}' WHERE "CountyId"='${SKAGIT_COUNTY_ID}'::uuid AND "ParcelStatus"='ACTIVE';`,
    supersedeTemplate: `UPDATE canonical_tf.tf_parcel SET "ParcelStatus"='SUPERSEDED', "IdentityRepairReceiptId"='${RECEIPT_ID}' WHERE "CountyId"='${SKAGIT_COUNTY_ID}'::uuid AND "ParcelStatus"='ACTIVE';`,
    insertTemplate: `INSERT INTO canonical_tf.tf_parcel (...) VALUES (... source PARCELID shell row ...) -- disabled in dry-run`,
    updateSample: plan.updateTargets.slice(0, 3).map((row) => ({
      where: { TfParcelId: row.tfParcelId, ParcelNumber: row.currentParcelNumber },
      set: {
        LegacyImportedParcelKey: row.legacyImportedParcelKey,
        ParcelNumber: row.proposedParcelNumber,
        TerraFusionParcelKey: row.proposedTerraFusionParcelKey
      }
    }))
  };
}

function renderMarkdown(report) {
  return `# Skagit Prefix Repair Dry-Run

Generated: ${report.generatedAt}

## Verdict

- Status: ${report.status}
- Database mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${report.certificationAllowed ? "yes" : "no"}

## Counts

- Source PARCELID count: ${report.counts.sourceIds}
- Canonical active rows: ${report.counts.canonicalRows}
- Proposed prefix repairs: ${report.counts.updateTargets}
- Proposed supersedes: ${report.counts.supersedeTargets}
- Proposed staged shell inserts: ${report.counts.stageInsertTargets}
- Post-repair duplicate groups: ${report.postRepairProjection.duplicateGroups}
- Post-repair source-only: ${report.postRepairProjection.sourceOnlyCount}
- Post-repair canonical-only: ${report.postRepairProjection.canonicalOnlyCount}

## Artifacts

- Dry-run receipt: ${report.artifacts.repairReceipt.path}
- Update targets: ${report.artifacts.updateTargets.path}
- Supersede targets: ${report.artifacts.supersedeTargets.path}
- Stage insert targets: ${report.artifacts.stageInsertTargets.path}
- Rollback plan: ${report.artifacts.rollbackPlan.path}

## Stop Conditions

${report.stopConditions.map((condition) => `- ${condition}`).join("\n")}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    sourceIds: args.get("source-ids") ?? DEFAULT_SOURCE_IDS,
    canonicalRows: args.get("canonical-rows") ?? null,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  fs.rmSync(paths.outRoot, { recursive: true, force: true });
  const sourceIds = parseSourceIds(paths.sourceIds);
  const canonicalRows = paths.canonicalRows ? parseCanonicalRows(paths.canonicalRows) : fetchCanonicalRowsFromDb();
  const plan = buildSkagitPrefixRepairPlan({ sourceIds, canonicalRows });

  const updateTargetsPath = path.join(paths.outRoot, "update-targets.jsonl");
  const supersedeTargetsPath = path.join(paths.outRoot, "supersede-targets.jsonl");
  const stageInsertTargetsPath = path.join(paths.outRoot, "stage-insert-targets.jsonl");
  const rollbackPath = path.join(paths.outRoot, "rollback-plan.md");
  const receiptPath = path.join(paths.outRoot, "repair-receipt-candidate.json");

  const artifacts = {
    updateTargets: writeJsonl(updateTargetsPath, plan.updateTargets),
    supersedeTargets: writeJsonl(supersedeTargetsPath, plan.supersedeTargets),
    stageInsertTargets: writeJsonl(stageInsertTargetsPath, plan.stageInsertTargets)
  };
  artifacts.rollbackPlan = writeRollbackPlan(rollbackPath, artifacts);
  artifacts.repairReceipt = writeReceipt(receiptPath, plan, artifacts);

  const report = {
    generatedAt: new Date().toISOString(),
    county: "Skagit",
    fips: "53057",
    status:
      plan.postRepairProjection.duplicateGroups === 0 &&
      plan.postRepairProjection.sourceOnlyCount === 0 &&
      plan.postRepairProjection.canonicalOnlyCount === 0
        ? "DRY_RUN_REPAIR_PARITY_PROJECTED"
        : "DRY_RUN_REPAIR_BLOCKED",
    counts: {
      sourceIds: sourceIds.size,
      canonicalRows: canonicalRows.length,
      updateTargets: plan.updateTargets.length,
      supersedeTargets: plan.supersedeTargets.length,
      stageInsertTargets: plan.stageInsertTargets.length
    },
    postRepairProjection: plan.postRepairProjection,
    artifacts,
    sqlPreview: buildSqlPreview(plan),
    stopConditions: [
      "No DB mutation is authorized by this dry-run.",
      "Production binding remains blocked.",
      "Source terms posture must be reviewed before certification.",
      "Future execution requires explicit human authorization, backup, transaction, and post-repair audit."
    ],
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    certificationAllowed: false
  };

  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`Skagit prefix repair dry-run written: ${repoRelative(paths.outJson)}`);
  console.log(`Status: ${report.status}`);
  console.log(`Updates/supersedes/inserts: ${plan.updateTargets.length}/${plan.supersedeTargets.length}/${plan.stageInsertTargets.length}`);
  console.log(`Post-repair duplicate groups: ${plan.postRepairProjection.duplicateGroups}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
