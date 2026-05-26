#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const KING_SERVICE_URL =
  "https://gisdata.kingcounty.gov/arcgis/rest/services/OpenDataPortal/property__parcel_area/MapServer/439";
const DEFAULT_PLAN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-correction-plan.latest.json"
);
const DEFAULT_ADJUDICATION = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-post-repair-delta-adjudication.latest.json"
);
const DEFAULT_CANONICAL_ONLY = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-post-repair-delta-adjudication",
  "king-canonical-only-parcels.txt"
);
const DEFAULT_SOURCE_ONLY = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-post-repair-delta-adjudication",
  "king-source-only-parcels.txt"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-correction-dry-run"
);
const DEFAULT_SOURCE_PROBE = path.join(DEFAULT_OUT_ROOT, "king-canonical-only-source-probe.json");
const DEFAULT_DB_DETAIL = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-correction-plan",
  "king-canonical-only-db-detail.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-correction-dry-run.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-correction-dry-run.latest.md"
);

function normalizeId(value) {
  return String(value ?? "").trim();
}

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfPresent(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return readJson(filePath);
}

function readLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function sqlStringLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function byParcelNumber(rows) {
  return new Map((rows ?? []).map((row) => [normalizeId(row.parcelNumber ?? row.ParcelNumber), row]));
}

function getCaseEdges(adjudication) {
  return adjudication.caseNormalizationEdges?.sample ?? [];
}

function splitDeltaRows({ sourceOnlyRows, canonicalOnlyRows, adjudication }) {
  const caseEdges = getCaseEdges(adjudication);
  const caseSource = new Set(caseEdges.map((edge) => normalizeId(edge.sourceValue)));
  const caseCanonical = new Set(caseEdges.map((edge) => normalizeId(edge.canonicalValue)));
  return {
    caseEdges,
    trueSourceOnlyRows: sourceOnlyRows.filter((value) => !caseSource.has(value)),
    trueCanonicalOnlyRows: canonicalOnlyRows.filter((value) => !caseCanonical.has(value))
  };
}

function buildExactProbeUrl(parcelNumbers) {
  const url = new URL(`${KING_SERVICE_URL}/query`);
  url.searchParams.set("f", "json");
  url.searchParams.set("where", `PIN in (${parcelNumbers.map(sqlStringLiteral).join(",")})`);
  url.searchParams.set("outFields", "PIN");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("resultRecordCount", String(Math.max(parcelNumbers.length * 2, 10)));
  return url;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "TerraFusion-June10-King-Correction-DryRun/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  const json = await response.json();
  if (json.error) {
    throw new Error(`ArcGIS error for ${url}: ${JSON.stringify(json.error)}`);
  }
  return json;
}

export async function probeKingSource(parcelNumbers, { batchSize = 25 } = {}) {
  const probes = {};
  for (const parcelNumber of parcelNumbers) {
    probes[parcelNumber] = {
      presentInSource: null,
      returnedRows: null,
      queryUrl: null
    };
  }

  for (const batch of chunk(parcelNumbers, batchSize)) {
    const url = buildExactProbeUrl(batch);
    try {
      const json = await fetchJson(url);
      const returned = new Set((json.features ?? []).map((feature) => normalizeId(feature.attributes?.PIN)));
      for (const parcelNumber of batch) {
        probes[parcelNumber] = {
          presentInSource: returned.has(parcelNumber),
          returnedRows: returned.has(parcelNumber) ? 1 : 0,
          queryUrl: String(url)
        };
      }
    } catch (error) {
      for (const parcelNumber of batch) {
        probes[parcelNumber] = {
          presentInSource: null,
          returnedRows: null,
          queryUrl: String(url),
          error: error.message
        };
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    countyName: "King County",
    fips: "53033",
    available: true,
    serviceUrl: KING_SERVICE_URL,
    accessMethod: "ArcGIS REST batched exact PIN query, returnGeometry=false, PIN only",
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    probes
  };
}

function buildCaseCorrections({ caseEdges, dbRowsByParcel }) {
  return caseEdges.map((edge) => {
    const existingRow = dbRowsByParcel.get(normalizeId(edge.canonicalValue)) ?? null;
    return {
      action: "update_case_to_source_exact",
      sourceValue: normalizeId(edge.sourceValue),
      currentCanonicalValue: normalizeId(edge.canonicalValue),
      tfParcelId: existingRow?.tfParcelId ?? null,
      currentTerraFusionParcelKey: existingRow?.terraFusionParcelKey ?? null,
      proposedParcelNumber: normalizeId(edge.sourceValue),
      proposedTerraFusionParcelKey: `53033:${normalizeId(edge.sourceValue)}`,
      preserveLegacyImportedParcelKey: existingRow?.legacyImportedParcelKey ?? normalizeId(edge.canonicalValue),
      safeForDryRun: Boolean(existingRow)
    };
  });
}

function buildSupersedes({ trueCanonicalOnlyRows, dbRowsByParcel, sourceProbe }) {
  const probes = sourceProbe?.probes ?? {};
  return trueCanonicalOnlyRows.map((parcelNumber) => {
    const dbRow = dbRowsByParcel.get(parcelNumber) ?? null;
    const probe = probes[parcelNumber] ?? {};
    const presentInSource = probe.presentInSource;
    return {
      action: "mark_superseded_inactive",
      parcelNumber,
      tfParcelId: dbRow?.tfParcelId ?? null,
      parcelStatus: dbRow?.parcelStatus ?? null,
      propertyType: dbRow?.propertyType ?? null,
      conversionEra: dbRow?.conversionEra ?? null,
      identityRepairReceiptId: dbRow?.identityRepairReceiptId ?? null,
      sourceProbePresent: presentInSource,
      safeToSupersede: Boolean(dbRow) && dbRow.parcelStatus === "ACTIVE" && presentInSource === false,
      blocker:
        presentInSource === true
          ? "Canonical-only row is present in current source; do not supersede."
          : presentInSource === null || presentInSource === undefined
            ? "Source absence was not proven; do not supersede."
            : !dbRow
              ? "DB detail row missing; do not supersede."
              : dbRow.parcelStatus !== "ACTIVE"
                ? "Row is not active; active supersede correction not applicable."
                : null
    };
  });
}

function buildStageRows({ trueSourceOnlyRows, adjudication }) {
  return trueSourceOnlyRows.map((parcelNumber) => ({
    action: "stage_source_only_pin_noop",
    parcelNumber,
    proposedTerraFusionParcelKey: `53033:${parcelNumber}`,
    sourceParcelIdField: "PIN",
    loadableWithCurrentArtifact: false,
    missingRequiredFields: [
      "runtime parcel payload beyond PIN",
      adjudication.serviceFacts?.geometryCaptured ? null : "geometry or explicit no-geometry policy",
      adjudication.serviceFacts?.ownerFieldsCaptured ? null : "owner/address/value fields or explicit deferred-field policy"
    ].filter(Boolean),
    placeholderReviewRequired: /TR|TRACT|PUBL|UNKN/i.test(parcelNumber)
  }));
}

function countDuplicateTargets({ proposedCaseCorrections, proposedStageRows }) {
  const targets = [
    ...proposedCaseCorrections.map((row) => row.proposedParcelNumber),
    ...proposedStageRows.map((row) => row.parcelNumber)
  ];
  const counts = new Map();
  for (const target of targets) counts.set(target, (counts.get(target) ?? 0) + 1);
  return [...counts.values()].filter((count) => count > 1).length;
}

function buildRollbackPlan({ proposedCaseCorrections, proposedSupersedes, proposedStageRows }) {
  const caseValues = proposedCaseCorrections.map((row) => sqlStringLiteral(row.currentCanonicalValue)).join(", ");
  const supersedeValues = proposedSupersedes.map((row) => sqlStringLiteral(row.parcelNumber)).join(", ");
  return `-- King correction dry-run rollback plan.
-- No mutation was executed by this dry-run.
-- If a future authorized transaction applies these changes, rollback must:
-- 1. Restore source-exact case corrections from LegacyImportedParcelKey/current backup.
-- 2. Reactivate rows marked superseded by the King correction receipt id.
-- 3. Remove staged/inserted King rows created by the King correction receipt id.
-- Case correction current values: ${caseValues || "(none)"}
-- Supersede candidate values: ${supersedeValues || "(none)"}
-- Stage candidate count: ${proposedStageRows.length}
`;
}

export function buildKingCorrectionDryRun({
  correctionPlan,
  adjudication,
  sourceOnlyRows,
  canonicalOnlyRows,
  sourceProbe
}) {
  const { caseEdges, trueSourceOnlyRows, trueCanonicalOnlyRows } = splitDeltaRows({
    sourceOnlyRows,
    canonicalOnlyRows,
    adjudication
  });
  const dbRowsByParcel = byParcelNumber(correctionPlan.canonicalOnlyPlan?.dbInspection?.rows ?? []);
  const proposedCaseCorrections = buildCaseCorrections({ caseEdges, dbRowsByParcel });
  const proposedSupersedes = buildSupersedes({ trueCanonicalOnlyRows, dbRowsByParcel, sourceProbe });
  const proposedStageRows = buildStageRows({ trueSourceOnlyRows, adjudication });
  const conflictSupersedes = proposedSupersedes.filter((row) => row.sourceProbePresent === true);
  const unprovenSupersedes = proposedSupersedes.filter((row) => row.sourceProbePresent === null || row.sourceProbePresent === undefined);
  const unsafeSupersedes = proposedSupersedes.filter((row) => !row.safeToSupersede);
  const sourceOnlyRowsLoadableWithRequiredFields = proposedStageRows.every((row) => row.loadableWithCurrentArtifact);
  const canonicalOnlyRowsSafeToSupersede = proposedSupersedes.every((row) => row.safeToSupersede);
  const caseCorrectionsSafe = proposedCaseCorrections.every((row) => row.safeForDryRun);
  const countyIdParcelNumberDuplicatesAfter = countDuplicateTargets({ proposedCaseCorrections, proposedStageRows });
  const postCorrectionIdentityParityWouldBeAchieved =
    caseCorrectionsSafe &&
    canonicalOnlyRowsSafeToSupersede &&
    proposedStageRows.length === trueSourceOnlyRows.length &&
    countyIdParcelNumberDuplicatesAfter === 0;

  const blockers = [];
  if (!caseCorrectionsSafe) blockers.push("One or more case-only correction rows lack DB detail.");
  if (conflictSupersedes.length > 0) blockers.push(`${conflictSupersedes.length} canonical-only rows are present in current source; do not supersede.`);
  if (unprovenSupersedes.length > 0) blockers.push(`${unprovenSupersedes.length} canonical-only rows lack source absence proof.`);
  if (!sourceOnlyRowsLoadableWithRequiredFields) {
    blockers.push("Source-only King PINs are staged in no-op mode but are not loadable with required runtime fields from the current PIN-only artifact.");
  }
  if (countyIdParcelNumberDuplicatesAfter > 0) {
    blockers.push(`${countyIdParcelNumberDuplicatesAfter} duplicate CountyId + ParcelNumber target groups would remain after proposed correction.`);
  }

  let result = "DRY_RUN_READY_FOR_AUTHORIZATION";
  if (conflictSupersedes.length > 0) result = "DRY_RUN_BLOCKED_CANONICAL_SOURCE_CONFLICT";
  else if (unprovenSupersedes.length > 0) result = "DRY_RUN_BLOCKED_SOURCE_PROBE_INCOMPLETE";
  else if (!sourceOnlyRowsLoadableWithRequiredFields) result = "DRY_RUN_BLOCKED_REQUIRED_FIELDS";
  else if (!postCorrectionIdentityParityWouldBeAchieved) result = "DRY_RUN_BLOCKED_IDENTITY_PARITY";

  return {
    generatedAt: new Date().toISOString(),
    countyName: "King County",
    fips: "53033",
    scope: "King only",
    result,
    databaseMutationAllowed: false,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false,
    summary: {
      caseOnlyEdges: caseEdges.length,
      trueSourceOnlyRows: trueSourceOnlyRows.length,
      trueCanonicalOnlyRows: trueCanonicalOnlyRows.length,
      proposedCaseCorrections: proposedCaseCorrections.length,
      proposedSupersedes: proposedSupersedes.filter((row) => row.safeToSupersede).length,
      proposedStageRows: proposedStageRows.length,
      unsafeSupersedes: unsafeSupersedes.length,
      conflictSupersedes: conflictSupersedes.length,
      unprovenSupersedes: unprovenSupersedes.length
    },
    validation: {
      postCorrectionIdentityParityWouldBeAchieved,
      countyIdParcelNumberDuplicatesAfter,
      sourceOnlyRowsLoadableWithRequiredFields,
      canonicalOnlyRowsSafeToSupersede,
      caseCorrectionsSafe,
      sourceProbeAvailable: sourceProbe?.available === true
    },
    proposedCaseCorrections,
    proposedSupersedes,
    proposedStageRows,
    dryRunCorrectionReceipt: {
      receiptType: "king_wa_initial_seed_identity_correction_dry_run",
      sourceClass: "WA_INITIAL_SEED",
      countyName: "King County",
      fips: "53033",
      databaseMutationAttempted: false,
      productionBindingAllowed: false,
      proposedCaseCorrections: proposedCaseCorrections.length,
      proposedSupersedes: proposedSupersedes.filter((row) => row.safeToSupersede).length,
      proposedStageRows: proposedStageRows.length,
      result
    },
    rollbackPlan: buildRollbackPlan({ proposedCaseCorrections, proposedSupersedes, proposedStageRows }),
    blockers
  };
}

function renderMarkdown(dryRun) {
  const blockers = dryRun.blockers.length ? dryRun.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  return `# King Correction Dry-Run

Generated: ${dryRun.generatedAt}

## Verdict

- Result: ${dryRun.result}
- Database mutation attempted: ${dryRun.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${dryRun.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${dryRun.certificationAllowed ? "yes" : "no"}

## Summary

- Case-only edge corrections: ${dryRun.summary.proposedCaseCorrections}
- True canonical-only rows: ${dryRun.summary.trueCanonicalOnlyRows}
- Proposed supersedes: ${dryRun.summary.proposedSupersedes}
- True source-only PINs: ${dryRun.summary.trueSourceOnlyRows}
- Proposed no-op stage rows: ${dryRun.summary.proposedStageRows}
- Unsafe supersedes: ${dryRun.summary.unsafeSupersedes}
- Source/canonical conflicts: ${dryRun.summary.conflictSupersedes}
- Unproven source probes: ${dryRun.summary.unprovenSupersedes}

## Validation

- Post-correction identity parity would be achieved: ${dryRun.validation.postCorrectionIdentityParityWouldBeAchieved ? "yes" : "no"}
- CountyId + ParcelNumber duplicate target groups after correction: ${dryRun.validation.countyIdParcelNumberDuplicatesAfter}
- Source-only rows loadable with required fields: ${dryRun.validation.sourceOnlyRowsLoadableWithRequiredFields ? "yes" : "no"}
- Canonical-only rows safe to supersede: ${dryRun.validation.canonicalOnlyRowsSafeToSupersede ? "yes" : "no"}
- Case corrections safe: ${dryRun.validation.caseCorrectionsSafe ? "yes" : "no"}

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

async function loadOrProbeSource({ sourceProbePath, trueCanonicalOnlyRows }) {
  const existing = readJsonIfPresent(sourceProbePath);
  if (existing) return existing;
  const probe = await probeKingSource(trueCanonicalOnlyRows);
  writeJson(sourceProbePath, probe);
  return probe;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    plan: args.get("plan") ?? DEFAULT_PLAN,
    adjudication: args.get("adjudication") ?? DEFAULT_ADJUDICATION,
    sourceOnly: args.get("source-only") ?? DEFAULT_SOURCE_ONLY,
    canonicalOnly: args.get("canonical-only") ?? DEFAULT_CANONICAL_ONLY,
    sourceProbe: args.get("source-probe") ?? DEFAULT_SOURCE_PROBE,
    dbDetail: args.get("db-detail") ?? DEFAULT_DB_DETAIL,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };

  const correctionPlan = readJson(paths.plan);
  const dbDetail = readJsonIfPresent(paths.dbDetail);
  if (dbDetail?.rows && !correctionPlan.canonicalOnlyPlan?.dbInspection?.rows) {
    correctionPlan.canonicalOnlyPlan.dbInspection.rows = dbDetail.rows;
  }
  const adjudication = readJson(paths.adjudication);
  const sourceOnlyRows = readLines(paths.sourceOnly);
  const canonicalOnlyRows = readLines(paths.canonicalOnly);
  const { trueCanonicalOnlyRows } = splitDeltaRows({ sourceOnlyRows, canonicalOnlyRows, adjudication });
  const sourceProbe = await loadOrProbeSource({
    sourceProbePath: paths.sourceProbe,
    trueCanonicalOnlyRows
  });
  sourceProbe.available = sourceProbe.available !== false;
  const dryRun = buildKingCorrectionDryRun({
    correctionPlan,
    adjudication,
    sourceOnlyRows,
    canonicalOnlyRows,
    sourceProbe
  });

  writeJson(paths.outJson, dryRun);
  writeText(paths.outMd, renderMarkdown(dryRun));
  writeJson(path.join(paths.outRoot, "dry-run-correction-receipt.json"), dryRun.dryRunCorrectionReceipt);
  writeJson(path.join(paths.outRoot, "proposed-case-correction-list.json"), dryRun.proposedCaseCorrections);
  writeJson(path.join(paths.outRoot, "proposed-supersede-list.json"), dryRun.proposedSupersedes);
  writeJson(path.join(paths.outRoot, "proposed-stage-list.json"), dryRun.proposedStageRows);
  writeText(path.join(paths.outRoot, "rollback-plan.sql"), dryRun.rollbackPlan);

  console.log(`King correction dry-run written: ${repoRelative(paths.outJson)}`);
  console.log(`Result: ${dryRun.result}`);
  console.log(`Proposed supersedes: ${dryRun.summary.proposedSupersedes}`);
  console.log(`Proposed stage rows: ${dryRun.summary.proposedStageRows}`);
  console.log(`Production binding allowed: ${dryRun.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
