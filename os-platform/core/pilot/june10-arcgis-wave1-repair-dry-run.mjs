#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_CAPTURE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-source-capture-wave1.latest.json"
);
const DEFAULT_OUT_ROOT = path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-arcgis-wave1-repair-dry-run");
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-wave1-repair-dry-run.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-wave1-repair-dry-run.latest.md"
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

function normalizeId(value) {
  return String(value ?? "").trim();
}

export function stripSeedPrefix(value) {
  return normalizeId(value).replace(/^\d{3}-/, "");
}

function sqlString(value) {
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}

export function duplicateTargetCount(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.values()].filter((count) => count > 1).length;
}

export function parseSourceArtifactRows(filePath) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
  return fs
    .readFileSync(absolute, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const parsed = JSON.parse(line);
      return {
        sourceNativeParcelNumber: normalizeId(parsed.ORIG_PARCEL_ID),
        legacyImportedParcelKey: normalizeId(parsed.PARCEL_ID_NR),
        fipsSuffix: normalizeId(parsed.FIPS_NR),
        countyName: normalizeId(parsed.COUNTY_NM)
      };
    });
}

function sourceByPrefixedId(sourceRows) {
  const map = new Map();
  for (const row of sourceRows) {
    if (!row.legacyImportedParcelKey) continue;
    if (!map.has(row.legacyImportedParcelKey) || row.sourceNativeParcelNumber) {
      map.set(row.legacyImportedParcelKey, row);
    }
  }
  return map;
}

export function plannedRepairRow({ county, canonicalRow, sourceByPrefixedId }) {
  const sourceRow = sourceByPrefixedId.get(canonicalRow.parcelNumber);
  const proposedParcelNumber = sourceRow?.sourceNativeParcelNumber || stripSeedPrefix(canonicalRow.parcelNumber);
  const proposedLegacyImportedParcelKey =
    canonicalRow.legacyImportedParcelKey || sourceRow?.legacyImportedParcelKey || canonicalRow.parcelNumber;
  return {
    tfParcelId: canonicalRow.tfParcelId,
    countyId: canonicalRow.countyId,
    currentParcelNumber: canonicalRow.parcelNumber,
    proposedParcelNumber,
    currentLegacyImportedParcelKey: canonicalRow.legacyImportedParcelKey || null,
    proposedLegacyImportedParcelKey,
    currentTerraFusionParcelKey: canonicalRow.terraFusionParcelKey || null,
    proposedTerraFusionParcelKey: `${county.fips}:${proposedParcelNumber}`,
    sourceNativeParcelIdField: "ORIG_PARCEL_ID",
    statewidePrefixedParcelIdField: "PARCEL_ID_NR",
    action: "restore_source_native_parcel_number_from_arcgis_orig_parcel_id",
    deleteRow: false
  };
}

function runPsql(sql) {
  return execFileSync(
    "docker",
    ["exec", "-i", "terrafusion-postgres-dev", "psql", "-U", "postgres", "-d", "terrafusion", "-At", "-c", sql],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 128 }
  );
}

function fetchCanonicalRowsByCountyPrefix(fips) {
  const prefix = String(fips).slice(-3);
  const countyIdSql = `select "CountyId" from canonical_tf.tf_parcel where "ParcelStatus"='ACTIVE' and "ParcelNumber" like '${prefix}-%' group by "CountyId" order by count(*) desc limit 1;`;
  const countyId = runPsql(countyIdSql).trim();
  if (!countyId) return [];
  const sql = `select "TfParcelId", "CountyId", "ParcelNumber", coalesce("LegacyImportedParcelKey",''), coalesce("TerraFusionParcelKey",'')
from canonical_tf.tf_parcel
where "CountyId"=${sqlString(countyId)}::uuid
  and "ParcelStatus"='ACTIVE'
  and nullif("ParcelNumber",'') is not null
order by "ParcelNumber";`;
  return runPsql(sql)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [tfParcelId, countyIdValue, parcelNumber, legacyImportedParcelKey, terraFusionParcelKey] = line.split("|");
      return {
        tfParcelId,
        countyId: countyIdValue,
        parcelNumber,
        legacyImportedParcelKey,
        terraFusionParcelKey
      };
    });
}

function fixtureCanonicalRows(county, sourceRows) {
  return sourceRows
    .filter((row) => row.sourceNativeParcelNumber)
    .map((row, index) => ({
      tfParcelId: `fixture-${county.fips}-${index}`,
      countyId: `fixture-county-${county.fips}`,
      parcelNumber: row.legacyImportedParcelKey,
      legacyImportedParcelKey: "",
      terraFusionParcelKey: ""
    }));
}

function buildRollbackPlan({ county, receiptId, waveId = "wave1" }) {
  return {
    requiredPreMutationBackup: `Before execution, export active canonical_tf.tf_parcel rows for ${county.county} ${county.fips} into a dated backup table.`,
    rollbackStrategy:
      "Restore ParcelNumber, LegacyImportedParcelKey, TerraFusionParcelKey, IdentityRepairReceiptId, and UpdatedAt from the pre-mutation backup in one transaction.",
    rollbackSqlTemplate: `-- Template only. Requires a populated backup table before any mutation.
BEGIN;

-- UPDATE canonical_tf.tf_parcel p
-- SET
--   "ParcelNumber" = b."ParcelNumber",
--   "LegacyImportedParcelKey" = b."LegacyImportedParcelKey",
--   "TerraFusionParcelKey" = b."TerraFusionParcelKey",
--   "IdentityRepairReceiptId" = b."IdentityRepairReceiptId",
--   "UpdatedAt" = b."UpdatedAt"
-- FROM backup.arcgis_${waveId}_${county.fips}_tf_parcel_identity b
-- WHERE p."TfParcelId" = b."TfParcelId";

ROLLBACK; -- template only
`,
    receiptId
  };
}

export function buildCleanRepairDryRun({ county, captureRow, sourceRows, canonicalRows, waveId = "wave1" }) {
  const prefixedMap = sourceByPrefixedId(sourceRows);
  const proposedRows = canonicalRows.map((canonicalRow) =>
    plannedRepairRow({ county, canonicalRow, sourceByPrefixedId: prefixedMap })
  );
  const proposedParcelNumbers = proposedRows.map((row) => row.proposedParcelNumber);
  const duplicateCountyIdParcelNumberAfter = duplicateTargetCount(proposedParcelNumbers);
  const missingSourceMappings = proposedRows.filter((row) => !prefixedMap.has(row.currentParcelNumber)).length;
  const blankProposedParcelNumbers = proposedRows.filter((row) => !row.proposedParcelNumber).length;
  const proposedRowsText = proposedRows.map((row) => JSON.stringify(row)).join("\n");
  const receiptId = `arcgis_${waveId}_${county.fips}_source_native_identity_repair_dry_run`;
  const blockers = [];
  if (duplicateCountyIdParcelNumberAfter > 0) blockers.push("Proposed source-native ParcelNumber values create duplicates.");
  if (missingSourceMappings > 0) blockers.push(`${missingSourceMappings} canonical rows lack matching PARCEL_ID_NR source rows.`);
  if (blankProposedParcelNumbers > 0) blockers.push(`${blankProposedParcelNumbers} proposed ParcelNumber values are blank.`);
  if (captureRow.identityComparison?.sourceNativeOnlyCount !== 0 || captureRow.identityComparison?.canonicalOnlyAfterPrefixStripCount !== 0) {
    blockers.push("Capture row is not a clean prefix-only identity match.");
  }

  const classification =
    blockers.length === 0 ? "repair_dry_run_ready_for_authorization" : "repair_dry_run_blocked_by_validation";

  return {
    county: county.county,
    fips: county.fips,
    classification,
    validation: {
      activeCanonicalRows: canonicalRows.length,
      proposedRows: proposedRows.length,
      sourceRows: sourceRows.length,
      duplicateCountyIdParcelNumberAfter,
      missingSourceMappings,
      blankProposedParcelNumbers,
      proposedRowsSha256: sha256Text(proposedRowsText),
      proposedRowsSample: proposedRows.slice(0, 8)
    },
    receiptCandidate: {
      receiptVersion: "arcgis_source_native_identity_repair_dry_run_v1",
      receiptId,
      countyName: `${county.county} County`,
      fips: county.fips,
      sourceCaptureReceipt: captureRow.receiptCandidate ?? null,
      sourceArtifact: captureRow.sourceArtifact ?? null,
      repairSemantics: {
        setParcelNumberFrom: "ORIG_PARCEL_ID",
        preservePrefixedValueAs: "LegacyImportedParcelKey",
        generateTerraFusionParcelKey: `${county.fips}:{ORIG_PARCEL_ID}`,
        deleteRows: false
      },
      counts: {
        activeCanonicalRows: canonicalRows.length,
        proposedRows: proposedRows.length,
        duplicateCountyIdParcelNumberAfter,
        missingSourceMappings,
        blankProposedParcelNumbers
      },
      classification,
      certificationAllowed: false,
      productionBindingAllowed: false
    },
    rollbackPlan: buildRollbackPlan({ county, receiptId, waveId }),
    blockers,
    doctrine: {
      databaseMutationAttempted: false,
      productionBindingAllowed: false,
      runtimeClaimAllowed: false,
      certificationAllowed: false
    },
    proposedRows
  };
}

export function buildGarfieldDeltaAdjudication({ captureRow, sourceRows }) {
  const blankSourceRows = sourceRows.filter((row) => !row.sourceNativeParcelNumber);
  const canonicalOnlySamples = captureRow.identityComparison?.canonicalOnlyAfterPrefixStripSamples ?? [];
  const isBlankOnlyDelta =
    captureRow.identityComparison?.sourceNativeOnlyCount === 0 &&
    captureRow.identityComparison?.canonicalOnlyAfterPrefixStripCount === 1 &&
    canonicalOnlySamples.length === 1 &&
    canonicalOnlySamples[0] === "";

  return {
    county: "Garfield",
    fips: "53023",
    classification: isBlankOnlyDelta ? "garfield_blank_source_native_delta_hold" : "garfield_delta_requires_manual_adjudication",
    canonicalOnlyAfterPrefixStripSamples: canonicalOnlySamples,
    blankSourceRows: blankSourceRows.slice(0, 10),
    blankSourceRowCount: blankSourceRows.length,
    sourceOnlyCount: captureRow.identityComparison?.sourceNativeOnlyCount ?? null,
    canonicalOnlyCount: captureRow.identityComparison?.canonicalOnlyAfterPrefixStripCount ?? null,
    adjudication:
      "Garfield has a canonical prefixed row that strips to an empty ParcelNumber. It aligns with a source row whose ORIG_PARCEL_ID is blank. Do not repair this row into a blank ParcelNumber; hold for county-specific supersede/exclude policy.",
    repairAllowed: false,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    certificationAllowed: false,
    databaseMutationAttempted: false
  };
}

function writeCountyArtifacts(outRoot, dryRun, waveLabel = "Wave 1") {
  const slug = `${dryRun.fips}-${dryRun.county.toLowerCase().replaceAll(" ", "-")}`;
  const countyRoot = path.join(outRoot, slug);
  fs.mkdirSync(countyRoot, { recursive: true });
  const proposedRowsPath = path.join(countyRoot, "proposed-repair-rows.jsonl");
  const receiptPath = path.join(countyRoot, "repair-receipt-candidate.json");
  const rollbackPath = path.join(countyRoot, "rollback-plan.md");
  fs.writeFileSync(proposedRowsPath, `${dryRun.proposedRows.map((row) => JSON.stringify(row)).join("\n")}\n`);
  writeJson(receiptPath, dryRun.receiptCandidate);
  writeText(
    rollbackPath,
    `# ${dryRun.county} ArcGIS ${waveLabel} Repair Rollback Plan

Receipt: ${dryRun.rollbackPlan.receiptId}

${dryRun.rollbackPlan.requiredPreMutationBackup}

${dryRun.rollbackPlan.rollbackStrategy}

\`\`\`sql
${dryRun.rollbackPlan.rollbackSqlTemplate}
\`\`\`
`
  );
  return {
    proposedRowsPath: repoRelative(proposedRowsPath),
    repairReceiptCandidatePath: repoRelative(receiptPath),
    rollbackPlanPath: repoRelative(rollbackPath),
    proposedRowsSha256: sha256File(proposedRowsPath),
    repairReceiptCandidateSha256: sha256File(receiptPath),
    rollbackPlanSha256: sha256File(rollbackPath)
  };
}

function writeGarfieldAdjudication(outRoot, adjudication) {
  const countyRoot = path.join(outRoot, "53023-garfield");
  fs.mkdirSync(countyRoot, { recursive: true });
  const adjudicationPath = path.join(countyRoot, "delta-adjudication.json");
  writeJson(adjudicationPath, adjudication);
  return {
    adjudicationPath: repoRelative(adjudicationPath),
    adjudicationSha256: sha256File(adjudicationPath)
  };
}

function renderMarkdown(report) {
  const rows = report.repairDryRuns
    .map(
      (row) =>
        `| ${row.county} | ${row.fips} | ${row.validation.proposedRows} | ${row.validation.duplicateCountyIdParcelNumberAfter} | ${row.validation.missingSourceMappings} | ${row.classification} |`
    )
    .join("\n");
  const garfield = report.garfieldAdjudication
    ? `\n## Garfield Delta\n\n- Classification: ${report.garfieldAdjudication.classification}\n- Repair allowed: ${report.garfieldAdjudication.repairAllowed ? "yes" : "no"}\n- Reason: ${report.garfieldAdjudication.adjudication}\n`
    : "";
  return `# ArcGIS ${report.waveLabel} Repair Dry-Run

Generated: ${report.generatedAt}

## Summary

- Clean repair-ready counties: ${report.summary.cleanRepairReadyCount}
- Garfield repair allowed: ${report.summary.garfieldRepairAllowed ? "yes" : "no"}
- Proposed rows: ${report.summary.proposedRows}
- Duplicate groups after repair: ${report.summary.duplicateCountyIdParcelNumberAfter}
- Database mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${report.certificationAllowed ? "yes" : "no"}

## Repair Matrix

| County | FIPS | Proposed rows | Duplicates after | Missing source mappings | Classification |
| --- | --- | ---: | ---: | ---: | --- |
${rows}
${garfield}
`;
}

function summarize(repairDryRuns, garfieldAdjudication) {
  return repairDryRuns.reduce(
    (acc, row) => {
      if (row.classification === "repair_dry_run_ready_for_authorization") acc.cleanRepairReadyCount += 1;
      acc.proposedRows += row.validation.proposedRows;
      acc.duplicateCountyIdParcelNumberAfter += row.validation.duplicateCountyIdParcelNumberAfter;
      acc.byClassification[row.classification] = (acc.byClassification[row.classification] ?? 0) + 1;
      return acc;
    },
    {
      cleanRepairReadyCount: 0,
      proposedRows: 0,
      duplicateCountyIdParcelNumberAfter: 0,
      garfieldRepairAllowed: garfieldAdjudication?.repairAllowed === true,
      byClassification: {}
    }
  );
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    capture: args.get("capture") ?? DEFAULT_CAPTURE,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD,
    waveLabel: args.get("wave-label") ?? "Wave 1",
    waveId: args.get("wave-id") ?? "wave1",
    fixture: args.has("fixture")
  };
  const capture = readJson(paths.capture);
  const cleanRows = (capture.rows ?? []).filter((row) => row.classification === "prefixed_repair_candidate");
  const garfieldRow = (capture.rows ?? []).find((row) => row.county === "Garfield");
  const repairDryRuns = [];

  for (const captureRow of cleanRows) {
    const sourceRows = parseSourceArtifactRows(captureRow.sourceArtifact.path);
    const canonicalRows = paths.fixture
      ? sourceRows
          .filter((row) => row.sourceNativeParcelNumber)
          .map((row, index) => ({
            tfParcelId: `fixture-${captureRow.fips}-${index}`,
            countyId: `fixture-county-${captureRow.fips}`,
            parcelNumber: row.legacyImportedParcelKey,
            legacyImportedParcelKey: "",
            terraFusionParcelKey: ""
          }))
      : fetchCanonicalRowsByCountyPrefix(captureRow.fips);
    const dryRun = buildCleanRepairDryRun({ county: captureRow, captureRow, sourceRows, canonicalRows, waveId: paths.waveId });
    const artifacts = writeCountyArtifacts(paths.outRoot, dryRun, paths.waveLabel);
    repairDryRuns.push({ ...dryRun, artifacts, proposedRows: undefined });
  }

  let garfieldAdjudication = null;
  if (garfieldRow) {
    const sourceRows = parseSourceArtifactRows(garfieldRow.sourceArtifact.path);
    garfieldAdjudication = buildGarfieldDeltaAdjudication({ captureRow: garfieldRow, sourceRows });
    garfieldAdjudication.artifacts = writeGarfieldAdjudication(paths.outRoot, garfieldAdjudication);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    scope: `ArcGIS ${paths.waveLabel} source-native identity repair dry-run.`,
    waveLabel: paths.waveLabel,
    waveId: paths.waveId,
    summary: summarize(repairDryRuns, garfieldAdjudication),
    repairDryRuns,
    garfieldAdjudication,
    artifactRoot: repoRelative(paths.outRoot),
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    certificationAllowed: false
  };
  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`ArcGIS ${paths.waveLabel} repair dry-run written: ${repoRelative(paths.outJson)}`);
  console.log(`Clean repair-ready counties: ${report.summary.cleanRepairReadyCount}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
