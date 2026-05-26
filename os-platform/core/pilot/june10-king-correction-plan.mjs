#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

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
  "june10-king-correction-plan"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-correction-plan.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-correction-plan.latest.md"
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

function readLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function parsePsqlJson(output) {
  const text = String(output ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== "SET")
    .join("\n");
  if (!text) return null;
  return JSON.parse(text);
}

function summarizeBy(rows, fieldName) {
  const counts = new Map();
  for (const row of rows) {
    const key = normalizeId(row[fieldName]) || "__blank__";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([value, count]) => ({ value: value === "__blank__" ? null : value, count }));
}

function inspectCanonicalOnlyRowsFromDb(parcelNumbers) {
  if (parcelNumbers.length === 0) {
    return { available: true, rows: [], error: null };
  }

  const pgContainer = process.env.TF_PG_CONTAINER ?? "terrafusion-postgres-dev";
  const pgDatabase = process.env.TF_PG_DATABASE ?? "terrafusion";
  const pgUser = process.env.TF_PG_USER ?? "postgres";
  const values = parcelNumbers.map((parcelNumber) => `(${sqlLiteral(parcelNumber)})`).join(",\n");
  const sql = `set statement_timeout = '300s';
with target(parcel_number) as (
  values
    ${values}
),
rows as (
  select
    p."TfParcelId"::text as "tfParcelId",
    p."CountyId"::text as "countyId",
    p."ParcelNumber" as "parcelNumber",
    p."ParcelStatus" as "parcelStatus",
    p."PropertyType" as "propertyType",
    p."ConversionEra" as "conversionEra",
    p."LegacyImportedParcelKey" as "legacyImportedParcelKey",
    p."TerraFusionParcelKey" as "terraFusionParcelKey",
    p."SourceParcelIdField" as "sourceParcelIdField",
    p."IdentityRepairReceiptId" as "identityRepairReceiptId",
    p."CreatedAt"::text as "createdAt",
    p."UpdatedAt"::text as "updatedAt"
  from canonical_tf.tf_parcel p
  join "Counties" c on c."Id" = p."CountyId"
  join target t on t.parcel_number = p."ParcelNumber"
  where c."FipsCode" = '53033'
  order by p."ParcelNumber"
)
select coalesce(json_agg(rows), '[]'::json) from rows;`;

  try {
    const output = execFileSync(
      "docker",
      ["exec", "-i", pgContainer, "psql", "-U", pgUser, "-d", pgDatabase, "-v", "ON_ERROR_STOP=1", "-t", "-A", "-c", sql],
      { input: "", encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 }
    );
    return {
      available: true,
      rows: parsePsqlJson(output) ?? [],
      error: null,
      container: pgContainer,
      database: pgDatabase
    };
  } catch (error) {
    return {
      available: false,
      rows: [],
      error: error.stderr?.toString?.() || error.message,
      container: pgContainer,
      database: pgDatabase
    };
  }
}

function buildCasePolicy(adjudication) {
  return {
    selectedPolicy: "preserve_source_pin_case_exactly",
    rationale:
      "ParcelNumber is source-native. King source PIN values include mixed-case tract/unknown suffixes; silently uppercasing them would reintroduce an unapproved transform.",
    caseOnlyEdgeCount: adjudication.caseNormalizationEdges?.count ?? 0,
    correctionRule:
      "For the case-only pairs, update the existing canonical row ParcelNumber and TerraFusionParcelKey to the exact source PIN spelling, preserve the previous value in LegacyImportedParcelKey, and emit a correction receipt.",
    alternativePolicyRejected:
      "Uppercase normalization remains possible only if a future identity contract explicitly approves uppercase as a canonical transform and records the transform receipt."
  };
}

function buildCanonicalOnlyPlan({ adjudication, dbInspection }) {
  const caseOnlyCount = adjudication.caseNormalizationEdges?.count ?? 0;
  const totalCanonicalOnly = adjudication.summary?.canonicalOnlyCount ?? 0;
  const trueCanonicalOnly = Math.max(0, totalCanonicalOnly - caseOnlyCount);
  const rows = dbInspection.rows ?? [];

  return {
    totalCanonicalOnly,
    caseOnlyCorrectionRows: caseOnlyCount,
    trueCanonicalOnlyRows: trueCanonicalOnly,
    dbInspection: {
      available: dbInspection.available,
      inspectedRows: rows.length,
      expectedRows: totalCanonicalOnly,
      statusCounts: summarizeBy(rows, "parcelStatus"),
      propertyTypeCounts: summarizeBy(rows, "propertyType"),
      conversionEraCounts: summarizeBy(rows, "conversionEra"),
      identityRepairReceiptCounts: summarizeBy(rows, "identityRepairReceiptId"),
      error: dbInspection.error ?? null
    },
    classification:
      trueCanonicalOnly > 0
        ? "canonical_stale_or_unproven_seed_rows"
        : "case_only_identity_correction_only",
    correctionRule:
      "Do not delete canonical-only rows. For rows still absent from source after exact source recapture/probe, mark them superseded/inactive in a transaction and preserve lineage/rollback evidence.",
    requiredEvidenceBeforeMutation: [
      "DB detail export for all canonical-only rows, including status, property type, conversion era, legacy key, TerraFusion key, and repair receipt id.",
      "Exact source probe or source recapture proving each true canonical-only ParcelNumber is absent from the current source PIN set.",
      "Case-only edge list proving which rows are in-place source-case corrections instead of supersede candidates.",
      "Transaction plan that marks stale rows superseded/inactive and does not delete rows.",
      "Rollback snapshot and correction receipt path."
    ]
  };
}

function buildSourceOnlyPlan(adjudication) {
  const caseOnlyCount = adjudication.caseNormalizationEdges?.count ?? 0;
  const totalSourceOnly = adjudication.summary?.sourceOnlyCount ?? 0;
  const trueSourceOnly = Math.max(0, totalSourceOnly - caseOnlyCount);

  return {
    totalSourceOnly,
    caseOnlyCorrectionRows: caseOnlyCount,
    trueSourceOnlyRows: trueSourceOnly,
    sourceCaptureComplete: adjudication.summary?.sourceCaptureComplete === true,
    classification: "current_source_pins_missing_from_canonical",
    shouldBeLoaded:
      "Presumptively yes for source PINs that represent tax parcels. Tract/place-holder/unknown patterns require explicit load/exclusion policy because King source documents placeholder polygons.",
    stagingRequirements: [
      "Capture allowed King source payload needed for minimum canonical insert fields; current identity capture has PIN only and is not enough for full runtime parcel rows.",
      "Stage into a no-op/dry-run table or artifact first, not production runtime rows.",
      "Reject blank PINs and collapse duplicate PIN geometry rows to one parcel identity candidate.",
      "Classify placeholder/tract/unknown PINs before runtime projection.",
      "Emit source artifact hash, normalized artifact hash, rejected-row report, load candidate count, and row-count reconciliation."
    ],
    receiptRequirements: [
      "source URL and access timestamp",
      "raw artifact path and sha256",
      "normalized staging artifact path and sha256",
      "source PIN field name",
      "duplicate PIN normalization summary",
      "placeholder/tract inclusion policy",
      "insert/update/supersede counts",
      "rollback receipt"
    ]
  };
}

export function buildKingCorrectionPlan({ adjudication, canonicalOnlyRows, sourceOnlyRows, dbInspection }) {
  const casePolicy = buildCasePolicy(adjudication);
  const canonicalOnlyPlan = buildCanonicalOnlyPlan({ adjudication, dbInspection });
  const sourceOnlyPlan = buildSourceOnlyPlan(adjudication);
  const blockers = [
    "King cannot convert to WA_INITIAL_SEED receipt-backed posture until identity parity is restored.",
    "No production binding while King correction remains planned-only.",
    "No DB mutation in this slice."
  ];

  if (!dbInspection.available || dbInspection.rows.length !== canonicalOnlyPlan.totalCanonicalOnly) {
    blockers.push("Canonical-only DB row detail is missing or incomplete.");
  }
  if (sourceOnlyPlan.trueSourceOnlyRows > 0) {
    blockers.push(`${sourceOnlyPlan.trueSourceOnlyRows} true source-only King PINs require staged load or documented exclusion.`);
  }
  if (canonicalOnlyPlan.trueCanonicalOnlyRows > 0) {
    blockers.push(`${canonicalOnlyPlan.trueCanonicalOnlyRows} true canonical-only King rows require source absence proof and supersede/exclusion decision.`);
  }
  if ((adjudication.caseNormalizationEdges?.count ?? 0) > 0) {
    blockers.push(`${adjudication.caseNormalizationEdges.count} case-only King identifier edges require source-exact correction policy.`);
  }

  return {
    generatedAt: new Date().toISOString(),
    countyName: "King County",
    fips: "53033",
    scope: "King only",
    databaseMutationAllowed: false,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false,
    inputEvidence: {
      adjudicationPath: repoRelative(DEFAULT_ADJUDICATION),
      sourceOnlyPath: repoRelative(DEFAULT_SOURCE_ONLY),
      canonicalOnlyPath: repoRelative(DEFAULT_CANONICAL_ONLY)
    },
    baseline: {
      sourceOnlyCount: adjudication.summary?.sourceOnlyCount ?? sourceOnlyRows.length,
      canonicalOnlyCount: adjudication.summary?.canonicalOnlyCount ?? canonicalOnlyRows.length,
      exactOverlap: adjudication.summary?.exactOverlap ?? null,
      sourceDuplicateExtraRows: adjudication.summary?.sourceDuplicateExtraRows ?? null,
      caseOnlyEdgeCount: adjudication.caseNormalizationEdges?.count ?? 0
    },
    casePolicy,
    canonicalOnlyPlan,
    sourceOnlyPlan,
    correctionApproach: {
      sequence: [
        "Freeze King source artifact and current canonical export used by this plan.",
        "Apply source-exact case policy to the 12 case-only edge rows in dry-run first.",
        "Run DB detail export and live source absence probe for the 451 true canonical-only rows.",
        `Build a no-op staging artifact for the ${sourceOnlyPlan.trueSourceOnlyRows} true source-only PINs with duplicate and placeholder classification.`,
        "Generate a transaction plan that supersedes proven stale canonical rows and inserts/updates valid staged source-only rows.",
        "Run the correction in a single authorized King-only transaction after backup approval.",
        "Rerun King adjudication, post-repair closure, WA_INITIAL_SEED receipt reconciliation, and production DB binding plan."
      ],
      stopConditions: [
        "STOP if DB detail row count does not match the canonical-only list.",
        "STOP if source-only staging lacks required source payload beyond PIN.",
        "STOP if proposed correction creates duplicate active CountyId + ParcelNumber.",
        "STOP if rollback snapshot cannot be written.",
        "STOP if production binding is attempted before King receipt conversion passes."
      ],
      expectedPostCorrectionEvidence: [
        "King source-only count = 0 or every remaining source-only PIN has documented exclusion.",
        "King canonical-only count = 0 or every remaining canonical-only row has documented legitimate identity key.",
        "Case-only edge count = 0 under selected source-exact policy.",
        "WA_INITIAL_SEED King receipt candidate emitted with raw/normalized hashes and correction receipt.",
        "Production binding remains blocked until the broader 37-county receipt posture is acceptable."
      ]
    },
    samples: {
      sourceOnly: sourceOnlyRows.slice(0, 50),
      canonicalOnly: canonicalOnlyRows.slice(0, 50),
      caseOnlyEdges: adjudication.caseNormalizationEdges?.sample ?? []
    },
    blockers
  };
}

function renderMarkdown(plan) {
  const dbStatusRows = plan.canonicalOnlyPlan.dbInspection.statusCounts
    .map((row) => `| ${row.value ?? "(blank)"} | ${row.count} |`)
    .join("\n") || "| - | 0 |";
  const propertyTypeRows = plan.canonicalOnlyPlan.dbInspection.propertyTypeCounts
    .map((row) => `| ${row.value ?? "(blank)"} | ${row.count} |`)
    .join("\n") || "| - | 0 |";
  const sequence = plan.correctionApproach.sequence.map((item) => `- ${item}`).join("\n");
  const blockers = plan.blockers.map((item) => `- ${item}`).join("\n");

  return `# King Correction Plan

Generated: ${plan.generatedAt}

## Verdict

- Scope: ${plan.scope}
- Database mutation allowed: ${plan.databaseMutationAllowed ? "yes" : "no"}
- Production binding allowed: ${plan.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${plan.certificationAllowed ? "yes" : "no"}
- Source-only PINs: ${plan.baseline.sourceOnlyCount}
- Canonical-only ParcelNumbers: ${plan.baseline.canonicalOnlyCount}
- Case-only edges: ${plan.baseline.caseOnlyEdgeCount}
- True source-only PINs after case policy: ${plan.sourceOnlyPlan.trueSourceOnlyRows}
- True canonical-only rows after case policy: ${plan.canonicalOnlyPlan.trueCanonicalOnlyRows}

## Case Policy

- Selected policy: ${plan.casePolicy.selectedPolicy}
- Rationale: ${plan.casePolicy.rationale}
- Correction rule: ${plan.casePolicy.correctionRule}
- Rejected alternative: ${plan.casePolicy.alternativePolicyRejected}

## 463 Canonical-Only Rows

- Classification: ${plan.canonicalOnlyPlan.classification}
- DB inspection available: ${plan.canonicalOnlyPlan.dbInspection.available ? "yes" : "no"}
- DB rows inspected: ${plan.canonicalOnlyPlan.dbInspection.inspectedRows}
- Expected rows: ${plan.canonicalOnlyPlan.dbInspection.expectedRows}
- Correction rule: ${plan.canonicalOnlyPlan.correctionRule}

### DB Status Counts

| ParcelStatus | Count |
| --- | ---: |
${dbStatusRows}

### DB Property Type Counts

| PropertyType | Count |
| --- | ---: |
${propertyTypeRows}

## 1,173 Source-Only PINs

- Classification: ${plan.sourceOnlyPlan.classification}
- Source capture complete: ${plan.sourceOnlyPlan.sourceCaptureComplete ? "yes" : "no"}
- Should be loaded: ${plan.sourceOnlyPlan.shouldBeLoaded}

## Correction Sequence

${sequence}

## Stop Conditions

${plan.correctionApproach.stopConditions.map((item) => `- ${item}`).join("\n")}

## Receipt Requirements

${plan.sourceOnlyPlan.receiptRequirements.map((item) => `- ${item}`).join("\n")}

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
    adjudication: args.get("adjudication") ?? DEFAULT_ADJUDICATION,
    canonicalOnly: args.get("canonical-only") ?? DEFAULT_CANONICAL_ONLY,
    sourceOnly: args.get("source-only") ?? DEFAULT_SOURCE_ONLY,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT
  };
  const adjudication = readJson(paths.adjudication);
  const canonicalOnlyRows = readLines(paths.canonicalOnly);
  const sourceOnlyRows = readLines(paths.sourceOnly);
  const dbInspection = inspectCanonicalOnlyRowsFromDb(canonicalOnlyRows);
  const plan = buildKingCorrectionPlan({
    adjudication,
    canonicalOnlyRows,
    sourceOnlyRows,
    dbInspection
  });

  writeJson(paths.outJson, plan);
  fs.writeFileSync(paths.outMd, renderMarkdown(plan));
  writeJson(path.join(paths.outRoot, "king-canonical-only-db-detail.json"), dbInspection);

  console.log(`King correction plan written: ${repoRelative(paths.outJson)}`);
  console.log(`True source-only PINs after case policy: ${plan.sourceOnlyPlan.trueSourceOnlyRows}`);
  console.log(`True canonical-only rows after case policy: ${plan.canonicalOnlyPlan.trueCanonicalOnlyRows}`);
  console.log(`DB detail rows inspected: ${plan.canonicalOnlyPlan.dbInspection.inspectedRows}`);
  console.log(`Production binding allowed: ${plan.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
