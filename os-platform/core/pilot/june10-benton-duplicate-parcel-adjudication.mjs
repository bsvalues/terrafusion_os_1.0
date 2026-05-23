#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_POSTGRES_CONTAINER = "terrafusion-postgres-dev";
const DEFAULT_POSTGRES_USER = "postgres";
const DEFAULT_POSTGRES_DB = "terrafusion";
const BENTON_COUNTY_ID = "19190019-1919-1919-1919-191919191919";
const DEFAULT_SAMPLE_LIMIT = 50;
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-benton-duplicate-parcel-adjudication.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-benton-duplicate-parcel-adjudication.latest.md"
);

const LEGITIMATE_VERSION_OR_SPLIT_KEYS = [
  "taxyear",
  "assessmentyear",
  "rollyear",
  "effectiveyear",
  "effectivedate",
  "snapshotid",
  "snapshotdate",
  "version",
  "versionid",
  "versionkey",
  "geometryid",
  "geometryhash",
  "shapeid",
  "splitid",
  "parcelpartid"
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeKey(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizedColumns(schemaColumns) {
  return new Set(asArray(schemaColumns).map(normalizeKey));
}

function pick(row, keys) {
  const wanted = new Set(keys.map(normalizeKey));
  for (const [key, value] of Object.entries(row ?? {})) {
    if (wanted.has(normalizeKey(key))) return value ?? null;
  }
  return null;
}

function uniqueValues(rows, keys) {
  return new Set(
    rows.map((row) => {
      const value = pick(row, keys);
      return value === null || value === undefined ? "" : String(value);
    })
  );
}

function allEqual(rows, keys) {
  return uniqueValues(rows, keys).size <= 1;
}

function hasExplainingVersionOrSplitKey(rows, schemaColumns) {
  const columns = normalizedColumns(schemaColumns);
  const availableKeys = LEGITIMATE_VERSION_OR_SPLIT_KEYS.filter((key) => columns.has(key));

  return availableKeys.some((key) => uniqueValues(rows, [key]).size > 1);
}

function blocker(source, message, evidence = null) {
  return { source, message, evidence };
}

export function classifyDuplicateGroup({ parcelNumber, rows, schemaColumns }) {
  const activeRows = asArray(rows).filter((row) => String(pick(row, ["parcelStatus", "ParcelStatus"]) ?? "").toUpperCase() === "ACTIVE");
  const inactiveRows = asArray(rows).length - activeRows.length;
  const allActive = inactiveRows === 0;
  const rowCount = asArray(rows).length;
  const sameOwner = allEqual(rows, ["currentOwnerId", "CurrentOwnerId"]);
  const sameAssessment = allEqual(rows, ["currentAssessmentId", "CurrentAssessmentId"]);
  const sameSitusAddress = allEqual(rows, ["situsAddress", "SitusAddress"]);
  const sameLegalDescription = allEqual(rows, ["legalDescription", "LegalDescription"]);
  const samePropertyType = allEqual(rows, ["propertyType", "PropertyType"]);
  const sameConversionEra = allEqual(rows, ["conversionEra", "ConversionEra"]);
  const legitimateMultiRowProven = allActive && hasExplainingVersionOrSplitKey(rows, schemaColumns);

  let classification = "projection_identity_conflict_requires_adjudication";
  let certificationImpact = "certification_blocker";
  let projectionFixRequired = true;
  const reasons = [];

  if (rowCount <= 1) {
    classification = "not_duplicate";
    certificationImpact = "none";
    projectionFixRequired = false;
    reasons.push("Only one row is present for this parcel number.");
  } else if (!allActive) {
    classification = "inactive_current_flag_issue";
    reasons.push("Duplicate group includes non-active rows in the active/current adjudication sample.");
  } else if (legitimateMultiRowProven) {
    classification = "legitimate_multi_row_history_or_split_proven";
    certificationImpact = "acceptable_warning";
    projectionFixRequired = false;
    reasons.push("Schema/sample contains a distinct version, history, geometry, or split key explaining multiple active rows.");
  } else if (!sameOwner || !sameAssessment) {
    classification = "ownership_or_assessment_split_requires_adjudication";
    reasons.push("Multiple active rows share a parcel number but differ by owner or assessment identity.");
  } else if (sameSitusAddress && sameLegalDescription && samePropertyType && sameConversionEra) {
    classification = "exact_or_near_duplicate_projection_bug";
    reasons.push("Multiple active rows share the same parcel number and same core identity fields without an explaining key.");
  } else {
    reasons.push("Multiple active rows share a parcel number and no schema-supported version/split key explains the group.");
  }

  return {
    parcelNumber,
    rowCount,
    activeRows: activeRows.length,
    inactiveRows,
    sameOwner,
    sameAssessment,
    sameSitusAddress,
    sameLegalDescription,
    samePropertyType,
    sameConversionEra,
    legitimateMultiRowProven,
    sourceDuplicateProven: false,
    geometrySplitProven: legitimateMultiRowProven && hasExplainingVersionOrSplitKey(rows, ["GeometryId", "GeometryHash", "ShapeId", "SplitId"]),
    classification,
    certificationImpact,
    projectionFixRequired,
    reasons
  };
}

function groupSampleRows(sampleRows) {
  const groups = new Map();
  for (const row of asArray(sampleRows)) {
    const parcelNumber = String(row.parcelNumber ?? row.ParcelNumber ?? "");
    if (!parcelNumber) continue;
    if (!groups.has(parcelNumber)) groups.set(parcelNumber, []);
    groups.get(parcelNumber).push(row);
  }
  return groups;
}

function summarizeClassifications(groups) {
  const counts = {};
  for (const group of groups) {
    counts[group.classification] = (counts[group.classification] ?? 0) + 1;
  }
  return counts;
}

export function buildBentonDuplicateParcelAdjudication(input) {
  const generatedAtUtc = input.generatedAtUtc ?? new Date().toISOString();
  const schemaColumns = input.schema?.columns ?? [];
  const duplicateGroups = asNumber(input.aggregate?.duplicateGroups);
  const extraActiveRows = asNumber(input.aggregate?.extraActiveRows);
  const maxRowsPerParcelNumber = asNumber(input.aggregate?.maxRowsPerParcelNumber);
  const syncActive = asNumber(input.syncState?.inProgressBatches) > 0;
  const sampleGroups = groupSampleRows(input.sampleRows);
  const adjudicatedSampleGroups = [...sampleGroups.entries()].map(([parcelNumber, rows]) =>
    classifyDuplicateGroup({ parcelNumber, rows, schemaColumns })
  );
  const classificationCounts = summarizeClassifications(adjudicatedSampleGroups);
  const sampleHasBlocker = adjudicatedSampleGroups.some((group) => group.certificationImpact === "certification_blocker");
  const sampleHasOnlyAcceptableWarnings =
    adjudicatedSampleGroups.length > 0 &&
    adjudicatedSampleGroups.every((group) => group.certificationImpact === "acceptable_warning" || group.certificationImpact === "none");
  const projectionFixRequired = duplicateGroups > 0 && (sampleHasBlocker || !sampleHasOnlyAcceptableWarnings);
  const certificationImpact =
    duplicateGroups <= 0 ? "none" : projectionFixRequired ? "certification_blocker" : "acceptable_warning";
  const blockers = [];

  if (input.error) {
    blockers.push(blocker("db_probe", "Duplicate parcel adjudication DB probe failed.", input.error));
  }

  if (syncActive) {
    blockers.push(
      blocker(
        "sync_active",
        "TerraFusion Sync is active; Benton certification must remain blocked even though this adjudication is read-only.",
        input.syncState?.latestBatch ?? null
      )
    );
  }

  if (duplicateGroups > 0 && projectionFixRequired) {
    blockers.push(
      blocker(
        "duplicate_active_parcel_numbers",
        `${duplicateGroups} active/current Benton parcel-number groups have duplicate canonical rows without an explaining version/split key.`,
        {
          extraActiveRows,
          maxRowsPerParcelNumber,
          sampleClassifications: classificationCounts
        }
      )
    );
  }

  const passed = blockers.length === 0 && certificationImpact !== "certification_blocker";

  return {
    generatedAtUtc,
    slice: "Benton Duplicate Parcel-Number Adjudication",
    passed,
    databaseMutationTaken: false,
    certificationGranted: false,
    summary: {
      county: "Benton",
      table: input.schema?.table ?? "canonical_tf.tf_parcel",
      duplicateGroups,
      extraActiveRows,
      maxRowsPerParcelNumber,
      sampleGroupsAdjudicated: adjudicatedSampleGroups.length,
      classificationCounts,
      certificationImpact,
      projectionFixRequired,
      syncActive,
      inProgressBatches: asNumber(input.syncState?.inProgressBatches),
      legitimateMultiRowGroupsProvenInSample: adjudicatedSampleGroups.filter((group) => group.legitimateMultiRowProven).length,
      sourceDuplicateProven: false,
      geometrySplitProven: adjudicatedSampleGroups.some((group) => group.geometrySplitProven)
    },
    doctrine: [
      "TerraFusion DB is the runtime source for this adjudication.",
      "This gate is read-only and does not certify Benton while Sync is active.",
      "Duplicate active/current parcel numbers are not acceptable unless schema-supported version, history, split, or geometry semantics explain them.",
      "Source duplicates cannot be claimed from canonical_tf.tf_parcel alone.",
      "A warning becomes acceptable only when the duplicate semantics are proven, not inferred."
    ],
    schema: {
      table: input.schema?.table ?? "canonical_tf.tf_parcel",
      columns: schemaColumns,
      hasTaxYearOrVersionKey: LEGITIMATE_VERSION_OR_SPLIT_KEYS.some((key) => normalizedColumns(schemaColumns).has(key)),
      hasGeometryOrSplitKey: ["geometryid", "geometryhash", "shapeid", "splitid", "parcelpartid"].some((key) =>
        normalizedColumns(schemaColumns).has(key)
      )
    },
    syncState: input.syncState ?? null,
    aggregate: {
      duplicateGroups,
      extraActiveRows,
      maxRowsPerParcelNumber
    },
    sampleGroups: input.sampleGroups ?? [],
    adjudicatedSampleGroups,
    blockers
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Benton Duplicate Parcel-Number Adjudication",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Verdict: **${report.passed ? "PASS" : "FAIL"}**`,
    "",
    "## Summary",
    "",
    `- County: ${report.summary.county}`,
    `- Table: ${report.summary.table}`,
    `- Duplicate active parcel-number groups: ${report.summary.duplicateGroups}`,
    `- Extra active rows: ${report.summary.extraActiveRows}`,
    `- Max rows per parcel number: ${report.summary.maxRowsPerParcelNumber}`,
    `- Sample groups adjudicated: ${report.summary.sampleGroupsAdjudicated}`,
    `- Certification impact: ${report.summary.certificationImpact}`,
    `- Projection fix required: ${report.summary.projectionFixRequired}`,
    `- Sync active: ${report.summary.syncActive}`,
    `- Database mutation taken: ${report.databaseMutationTaken}`,
    `- Certification granted: ${report.certificationGranted}`,
    "",
    "## Doctrine",
    ""
  ];

  report.doctrine.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Schema Signals", "");
  lines.push(`- Has tax year/version key: ${report.schema.hasTaxYearOrVersionKey}`);
  lines.push(`- Has geometry/split key: ${report.schema.hasGeometryOrSplitKey}`);
  lines.push(`- Columns: ${report.schema.columns.join(", ")}`);

  lines.push("", "## Classification Counts", "");
  const classifications = Object.entries(report.summary.classificationCounts);
  if (classifications.length === 0) lines.push("- None");
  classifications.forEach(([classification, count]) => lines.push(`- ${classification}: ${count}`));

  lines.push("", "## Sample Groups", "");
  lines.push("| Parcel number | Rows | Classification | Impact | Projection fix |");
  lines.push("|---|---:|---|---|---:|");
  report.adjudicatedSampleGroups.slice(0, 25).forEach((group) => {
    lines.push(
      [
        group.parcelNumber,
        String(group.rowCount),
        group.classification,
        group.certificationImpact,
        String(group.projectionFixRequired)
      ].join(" | ")
    );
  });

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) lines.push("- None");
  report.blockers.forEach((item) => lines.push(`- ${item.source}: ${item.message}`));

  return `${lines.join("\n")}\n`;
}

function queryLiveDuplicateState({ container, user, database, sampleLimit }) {
  const query = `
set statement_timeout = '90000';
with schema_columns as (
  select coalesce(jsonb_agg(column_name order by ordinal_position), '[]'::jsonb) as columns
  from information_schema.columns
  where table_schema = 'canonical_tf'
    and table_name = 'tf_parcel'
),
duplicate_groups as (
  select "ParcelNumber", count(*)::int as rows
  from canonical_tf.tf_parcel
  where "CountyId" = '${BENTON_COUNTY_ID}'::uuid
    and "ParcelStatus" = 'ACTIVE'
    and nullif("ParcelNumber", '') is not null
  group by "ParcelNumber"
  having count(*) > 1
),
sample_groups as (
  select "ParcelNumber", rows
  from duplicate_groups
  order by rows desc, "ParcelNumber"
  limit ${Number(sampleLimit)}
),
sample_rows as (
  select
    p."ParcelNumber" as parcel_number,
    p."TfParcelId"::text as tf_parcel_id,
    p."CurrentOwnerId"::text as current_owner_id,
    p."CurrentAssessmentId"::text as current_assessment_id,
    p."SitusAddress" as situs_address,
    p."LegalDescription" as legal_description,
    p."PropertyType" as property_type,
    p."ParcelStatus" as parcel_status,
    p."ConversionEra" as conversion_era,
    to_char(p."CreatedAt" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at,
    to_char(p."UpdatedAt" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as updated_at
  from canonical_tf.tf_parcel p
  join sample_groups s on s."ParcelNumber" = p."ParcelNumber"
  where p."CountyId" = '${BENTON_COUNTY_ID}'::uuid
    and p."ParcelStatus" = 'ACTIVE'
  order by p."ParcelNumber", p."TfParcelId"
),
status_counts as (
  select coalesce(jsonb_object_agg("Status", row_count), '{}'::jsonb) as counts
  from (
    select "Status", count(*)::int as row_count
    from sync_bridge.load_batch
    group by "Status"
  ) s
),
latest_batch as (
  select "Operator", "Status", "StartedAt", "CompletedAt", "RowsPromoted"
  from sync_bridge.load_batch
  order by "StartedAt" desc nulls last
  limit 1
)
select jsonb_build_object(
  'generatedAtUtc', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'schema', jsonb_build_object(
    'table', 'canonical_tf.tf_parcel',
    'columns', (select columns from schema_columns)
  ),
  'syncState', jsonb_build_object(
    'source', 'docker:psql',
    'inProgressBatches', (select count(*)::int from sync_bridge.load_batch where "Status" = 'IN_PROGRESS'),
    'statusCounts', (select counts from status_counts),
    'latestBatch', (
      select jsonb_build_object(
        'operator', "Operator",
        'status', "Status",
        'startedAt', to_char("StartedAt" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'completedAt', case when "CompletedAt" is null then null else to_char("CompletedAt" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end,
        'rowsPromoted', "RowsPromoted"
      )
      from latest_batch
    )
  ),
  'aggregate', (
    select jsonb_build_object(
      'duplicateGroups', count(*)::int,
      'extraActiveRows', coalesce(sum(rows - 1), 0)::int,
      'maxRowsPerParcelNumber', coalesce(max(rows), 0)::int
    )
    from duplicate_groups
  ),
  'sampleGroups', (
    select coalesce(jsonb_agg(jsonb_build_object('parcelNumber', "ParcelNumber", 'rows', rows) order by rows desc, "ParcelNumber"), '[]'::jsonb)
    from sample_groups
  ),
  'sampleRows', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'parcelNumber', parcel_number,
      'tfParcelId', tf_parcel_id,
      'currentOwnerId', current_owner_id,
      'currentAssessmentId', current_assessment_id,
      'situsAddress', situs_address,
      'legalDescription', legal_description,
      'propertyType', property_type,
      'parcelStatus', parcel_status,
      'conversionEra', conversion_era,
      'createdAt', created_at,
      'updatedAt', updated_at
    ) order by parcel_number, tf_parcel_id), '[]'::jsonb)
    from sample_rows
  )
)::text;
`;

  const output = execFileSync(
    "docker",
    ["exec", "-i", container, "psql", "-U", user, "-d", database, "-t", "-A", "-v", "ON_ERROR_STOP=1"],
    {
      input: query,
      encoding: "utf8",
      timeout: 120000
    }
  );

  return JSON.parse(output.trim().split(/\r?\n/).at(-1));
}

function parseArgs(argv) {
  const args = {
    inputPath: null,
    postgresContainer: DEFAULT_POSTGRES_CONTAINER,
    postgresUser: DEFAULT_POSTGRES_USER,
    postgresDatabase: DEFAULT_POSTGRES_DB,
    sampleLimit: DEFAULT_SAMPLE_LIMIT,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (arg === "--postgres-container") args.postgresContainer = argv[++i];
    else if (arg === "--postgres-user") args.postgresUser = argv[++i];
    else if (arg === "--postgres-db") args.postgresDatabase = argv[++i];
    else if (arg === "--sample-limit") args.sampleLimit = Number(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

function collectInput(args) {
  if (args.inputPath) return readJson(args.inputPath);

  try {
    return queryLiveDuplicateState({
      container: args.postgresContainer,
      user: args.postgresUser,
      database: args.postgresDatabase,
      sampleLimit: args.sampleLimit
    });
  } catch (error) {
    return {
      generatedAtUtc: new Date().toISOString(),
      schema: {
        table: "canonical_tf.tf_parcel",
        columns: []
      },
      aggregate: {
        duplicateGroups: 0,
        extraActiveRows: 0,
        maxRowsPerParcelNumber: 0
      },
      sampleGroups: [],
      sampleRows: [],
      syncState: {
        source: "docker:psql",
        inProgressBatches: null,
        latestBatch: null,
        statusCounts: {}
      },
      error: error.message
    };
  }
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const input = collectInput(args);
  const report = buildBentonDuplicateParcelAdjudication(input);

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.mkdirSync(path.dirname(args.outMd), { recursive: true });
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        passed: report.passed,
        duplicateGroups: report.summary.duplicateGroups,
        certificationImpact: report.summary.certificationImpact,
        projectionFixRequired: report.summary.projectionFixRequired,
        syncActive: report.summary.syncActive,
        blockers: report.blockers.length,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    const report = await main();
    if (!report.passed) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
