#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_WAVE2_ACQUISITION = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave2-source-acquisition.latest.json"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave2-prefixed-identity-repair-dry-run"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave2-prefixed-identity-repair-dry-run.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave2-prefixed-identity-repair-dry-run.latest.md"
);

const WAVE2_REPAIR_COUNTIES = [
  { county: "Kitsap", fips: "53035", countyId: "500ef839-e1cf-9c95-60b5-3b1b12f5851d" },
  { county: "Pierce", fips: "53053", countyId: "d4f5c5a1-8c6d-d91e-932e-de7f6b4f83e8" },
  { county: "Klickitat", fips: "53039", countyId: "9d619518-23ca-f6e9-03c9-6219db494501" },
  { county: "Okanogan", fips: "53047", countyId: "2ca5f53a-275d-d1b7-3266-80383d5e2387" }
];

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

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
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

function normalizeParcelId(value) {
  return String(value ?? "").trim();
}

function stripSeedPrefix(value) {
  return normalizeParcelId(value).replace(/^\d{3}-/, "");
}

function sqlString(value) {
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}

function parseSourceIdsJsonl(filePath) {
  if (!fs.existsSync(filePath)) return new Set();
  const ids = new Set();
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line);
    const id = normalizeParcelId(parsed.sourceNativeParcelId);
    if (id) ids.add(id);
  }
  return ids;
}

function runPsql(sql) {
  return execFileSync(
    "docker",
    ["exec", "-i", "terrafusion-postgres-dev", "psql", "-U", "postgres", "-d", "terrafusion", "-At", "-c", sql],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 128 }
  );
}

function fetchCanonicalRows(county) {
  const sql = `select
  "TfParcelId",
  "CountyId",
  "ParcelNumber",
  coalesce("LegacyImportedParcelKey",''),
  coalesce("TerraFusionParcelKey",'')
from canonical_tf.tf_parcel
where "CountyId"=${sqlString(county.countyId)}::uuid
  and "ParcelStatus"='ACTIVE'
  and nullif("ParcelNumber",'') is not null
order by "ParcelNumber";`;
  return runPsql(sql)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [tfParcelId, countyId, parcelNumber, legacyImportedParcelKey, terraFusionParcelKey] = line.split("|");
      return { tfParcelId, countyId, parcelNumber, legacyImportedParcelKey, terraFusionParcelKey };
    });
}

export function plannedRepairRow({ county, canonicalRow }) {
  const proposedParcelNumber = stripSeedPrefix(canonicalRow.parcelNumber);
  return {
    tfParcelId: canonicalRow.tfParcelId,
    currentParcelNumber: canonicalRow.parcelNumber,
    proposedParcelNumber,
    currentLegacyImportedParcelKey: canonicalRow.legacyImportedParcelKey || null,
    proposedLegacyImportedParcelKey: canonicalRow.legacyImportedParcelKey || canonicalRow.parcelNumber,
    currentTerraFusionParcelKey: canonicalRow.terraFusionParcelKey || null,
    proposedTerraFusionParcelKey: `${county.fips}:${proposedParcelNumber}`,
    deleteRow: false,
    action: "restore_source_native_parcel_number_preserve_prefixed_key"
  };
}

export function duplicateTargetCount(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.values()].filter((count) => count > 1).length;
}

function countIntersection(left, right) {
  let count = 0;
  for (const value of left) {
    if (right.has(value)) count += 1;
  }
  return count;
}

function samples(values, limit = 8) {
  return [...values].sort((a, b) => a.localeCompare(b)).slice(0, limit);
}

export function classifyRepairDryRun({ duplicateCountyIdParcelNumberAfter, transformedOverlapCount, sourceDistinctCount }) {
  if (duplicateCountyIdParcelNumberAfter > 0) return "dry_run_blocked_duplicate_risk";
  if (sourceDistinctCount > 0 && transformedOverlapCount === 0) return "dry_run_blocked_source_mismatch";
  return "dry_run_pass_pending_delta_adjudication";
}

function buildRollbackPlan({ county, receiptId }) {
  return {
    requiredPreMutationBackup: `Before any execution, export affected active canonical_tf.tf_parcel rows for ${county.county} ${county.fips} where CountyId=${county.countyId}.`,
    rollbackStrategy:
      "Restore ParcelNumber, LegacyImportedParcelKey, TerraFusionParcelKey, IdentityRepairReceiptId, and UpdatedAt from the pre-mutation backup inside one transaction.",
    rollbackSqlTemplate: `-- Template only. Requires backup table populated before execution.
BEGIN;

-- UPDATE canonical_tf.tf_parcel p
-- SET
--   "ParcelNumber" = b."ParcelNumber",
--   "LegacyImportedParcelKey" = b."LegacyImportedParcelKey",
--   "TerraFusionParcelKey" = b."TerraFusionParcelKey",
--   "IdentityRepairReceiptId" = b."IdentityRepairReceiptId",
--   "UpdatedAt" = b."UpdatedAt"
-- FROM backup.wave2_${county.fips}_tf_parcel_identity b
-- WHERE p."TfParcelId" = b."TfParcelId";

ROLLBACK; -- template only
`,
    receiptId
  };
}

export function buildCountyRepairDryRun({ county, sourceIds, canonicalRows, sourceReceiptCandidate }) {
  const receiptId = `wave2_${county.fips}_prefixed_identity_repair_dry_run_2026_05_26`;
  const proposedRows = canonicalRows.map((canonicalRow) => plannedRepairRow({ county, canonicalRow }));
  const proposedParcelNumbers = proposedRows.map((row) => row.proposedParcelNumber);
  const proposedParcelNumberSet = new Set(proposedParcelNumbers);
  const duplicateCountyIdParcelNumberAfter = duplicateTargetCount(proposedParcelNumbers);
  const sourceOverlapAfterPrefixRemoval = countIntersection(sourceIds, proposedParcelNumberSet);
  const proposedRowsText = proposedRows
    .map((row) =>
      [
        row.tfParcelId,
        row.currentParcelNumber,
        row.proposedParcelNumber,
        row.proposedLegacyImportedParcelKey,
        row.proposedTerraFusionParcelKey
      ].join("|")
    )
    .join("\n");
  const classification = classifyRepairDryRun({
    duplicateCountyIdParcelNumberAfter,
    transformedOverlapCount: sourceOverlapAfterPrefixRemoval,
    sourceDistinctCount: sourceIds.size
  });
  const blockers = [];
  if (classification === "dry_run_blocked_duplicate_risk") {
    blockers.push("Proposed source-native ParcelNumber targets create duplicate CountyId + ParcelNumber groups.");
  }
  if (classification === "dry_run_blocked_source_mismatch") {
    blockers.push("Source artifact IDs do not overlap proposed source-native canonical ParcelNumber targets.");
  }
  if (classification === "dry_run_pass_pending_delta_adjudication") {
    blockers.push("Dry-run repair is duplicate-safe, but source artifact is partial; county delta adjudication is still required before receipt-backed closure.");
  }

  return {
    county: county.county,
    fips: county.fips,
    countyId: county.countyId,
    classification,
    validation: {
      activeCanonicalRows: canonicalRows.length,
      proposedRows: proposedRows.length,
      sourceDistinctCount: sourceIds.size,
      sourceOverlapAfterPrefixRemoval,
      duplicateCountyIdParcelNumberAfter,
      proposedRowsSha256: sha256Text(proposedRowsText),
      proposedRowsSample: proposedRows.slice(0, 8)
    },
    receiptCandidate: {
      receiptVersion: "wa_initial_seed_prefixed_identity_repair_dry_run_v1",
      receiptId,
      countyName: `${county.county} County`,
      fips: county.fips,
      sourceClass: "WA_INITIAL_SEED",
      sourceReceiptCandidate,
      repairSemantics: {
        sourceNativeParcelNumberTarget: true,
        preservePrefixedValueAsLegacyImportedParcelKey: true,
        generateTerraFusionParcelKey: `${county.fips}:{sourceNativeParcelNumber}`,
        deleteRows: false
      },
      counts: {
        proposedRows: proposedRows.length,
        sourceDistinctIds: sourceIds.size,
        sourceOverlapAfterPrefixRemoval,
        duplicateCountyIdParcelNumberAfter
      },
      classification,
      certificationAllowed: false,
      productionBindingAllowed: false
    },
    rollbackPlan: buildRollbackPlan({ county, receiptId }),
    blockers,
    doctrine: {
      databaseMutationAttempted: false,
      productionBindingAllowed: false,
      runtimeClaimAllowed: false,
      certificationAllowed: false
    }
  };
}

function sourceArtifactPathFromReceipt(countyAcquisition) {
  return countyAcquisition.receiptCandidate?.artifacts?.find((artifact) =>
    artifact.path?.endsWith("/source-native-parcel-ids.jsonl")
  )?.path;
}

function writeCountyOutputs(outRoot, countyDryRun) {
  const slug = countyDryRun.county.toLowerCase().replaceAll(" ", "-");
  const countyRoot = path.join(outRoot, slug);
  fs.mkdirSync(countyRoot, { recursive: true });
  const receiptPath = path.join(countyRoot, "repair-receipt-candidate.json");
  const rollbackPath = path.join(countyRoot, "rollback-plan.md");
  writeJson(receiptPath, countyDryRun.receiptCandidate);
  writeText(
    rollbackPath,
    `# ${countyDryRun.county} Wave 2 Prefix Repair Rollback Plan

Receipt: ${countyDryRun.rollbackPlan.receiptId}

${countyDryRun.rollbackPlan.requiredPreMutationBackup}

${countyDryRun.rollbackPlan.rollbackStrategy}

\`\`\`sql
${countyDryRun.rollbackPlan.rollbackSqlTemplate}
\`\`\`
`
  );
  return {
    repairReceiptCandidatePath: repoRelative(receiptPath),
    rollbackPlanPath: repoRelative(rollbackPath),
    repairReceiptCandidateSha256: sha256File(receiptPath),
    rollbackPlanSha256: sha256File(rollbackPath)
  };
}

async function buildWave2RepairDryRun({ acquisition, outRoot }) {
  const counties = [];
  const acquisitionByCounty = new Map(acquisition.counties.map((county) => [county.county, county]));
  for (const county of WAVE2_REPAIR_COUNTIES) {
    const countyAcquisition = acquisitionByCounty.get(county.county);
    const sourcePath = sourceArtifactPathFromReceipt(countyAcquisition);
    const sourceIds = sourcePath ? parseSourceIdsJsonl(path.join(repoRoot, sourcePath)) : new Set();
    const canonicalRows = fetchCanonicalRows(county);
    const dryRun = buildCountyRepairDryRun({
      county,
      sourceIds,
      canonicalRows,
      sourceReceiptCandidate: countyAcquisition?.receiptCandidate ?? null
    });
    const outputArtifacts = writeCountyOutputs(outRoot, dryRun);
    counties.push({ ...dryRun, outputArtifacts });
  }

  const summary = counties.reduce(
    (acc, county) => {
      acc.byClassification[county.classification] = (acc.byClassification[county.classification] ?? 0) + 1;
      acc.proposedRows += county.validation.proposedRows;
      acc.duplicateRiskCount += county.validation.duplicateCountyIdParcelNumberAfter;
      return acc;
    },
    { countiesChecked: counties.length, proposedRows: 0, duplicateRiskCount: 0, byClassification: {} }
  );

  return {
    generatedAt: new Date().toISOString(),
    scope: "Wave 2 prefixed identity repair dry-run for Kitsap, Pierce, Klickitat, and Okanogan. San Juan excluded because source access is blocked.",
    summary,
    excluded: [{ county: "San Juan", fips: "53055", reason: "blocked_source_access" }],
    counties,
    doctrine: {
      databaseMutationAttempted: false,
      productionBindingAllowed: false,
      runtimeClaimAllowed: false,
      certificationAllowed: false
    },
    blockers: [
      "No DB mutation has been authorized or attempted.",
      "Dry-run pass means duplicate-safe prefix repair only; each county still needs delta adjudication before receipt-backed closure.",
      "Production binding remains blocked."
    ]
  };
}

function renderMarkdown(report) {
  const rows = report.counties
    .map(
      (county) =>
        `| ${county.county} | ${county.fips} | ${county.validation.proposedRows} | ${county.validation.sourceDistinctCount} | ${county.validation.sourceOverlapAfterPrefixRemoval} | ${county.validation.duplicateCountyIdParcelNumberAfter} | ${county.classification} |`
    )
    .join("\n");
  const blockers = report.blockers.map((blocker) => `- ${blocker}`).join("\n");
  return `# Wave 2 Prefixed Identity Repair Dry-Run

Generated: ${report.generatedAt}

## Summary

- Counties checked: ${report.summary.countiesChecked}
- Proposed canonical rows touched if later authorized: ${report.summary.proposedRows}
- Duplicate target groups after dry-run: ${report.summary.duplicateRiskCount}
- Database mutation attempted: ${report.doctrine.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.doctrine.productionBindingAllowed ? "yes" : "no"}

## County Results

| County | FIPS | Proposed rows | Source IDs | Source overlap after prefix removal | Duplicate groups after | Classification |
| --- | --- | ---: | ---: | ---: | ---: | --- |
${rows}

## Excluded

| County | FIPS | Reason |
| --- | --- | --- |
${report.excluded.map((row) => `| ${row.county} | ${row.fips} | ${row.reason} |`).join("\n")}

## Blockers

${blockers}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    acquisition: args.get("acquisition") ?? DEFAULT_WAVE2_ACQUISITION,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const report = await buildWave2RepairDryRun({
    acquisition: readJson(paths.acquisition),
    outRoot: paths.outRoot
  });
  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`Wave 2 prefixed identity repair dry-run written: ${repoRelative(paths.outJson)}`);
  console.log(`Classifications: ${JSON.stringify(report.summary.byClassification)}`);
  console.log(`Database mutation attempted: ${report.doctrine.databaseMutationAttempted ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
