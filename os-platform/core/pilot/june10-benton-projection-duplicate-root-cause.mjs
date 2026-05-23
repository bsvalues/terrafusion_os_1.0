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
  "june10-benton-projection-duplicate-root-cause.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-benton-projection-duplicate-root-cause.latest.md"
);

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

function asNullableNumber(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function blocker(source, message, evidence = null) {
  return { source, message, evidence };
}

function hasColumn(columns, candidates) {
  const set = new Set(asArray(columns).map(normalize));
  return candidates.some((candidate) => set.has(normalize(candidate)));
}

function hasUniqueActiveParcelIndex(indexes) {
  return asArray(indexes).some((index) => {
    const definition = String(index.definition ?? "");
    return (
      index.unique === true &&
      /CountyId/i.test(definition) &&
      /ParcelNumber/i.test(definition) &&
      (/ParcelStatus/i.test(definition) || /ACTIVE/i.test(definition))
    );
  });
}

function sourceIdentifierColumns(columns) {
  return asArray(columns).filter((column) => /source|origin|external|record/i.test(String(column)));
}

function loadIdentifierColumns(columns) {
  return asArray(columns).filter((column) => /load|batch|receipt|sync/i.test(String(column)));
}

export function classifyProjectionDuplicateRootCause(input) {
  if (input.error) {
    return {
      primaryRootCause: "db_probe_unavailable",
      certificationImpact: "certification_blocker",
      projectionFixRequired: false,
      uniqueActiveParcelIndex: false,
      sourceIdentifierColumns: [],
      loadIdentifierColumns: [],
      evidence: [`DB probe failed: ${input.error}`],
      limitations: ["Root cause cannot be classified until the read-only DB probe completes."]
    };
  }

  const aggregate = input.aggregate ?? {};
  const duplicateGroups = asNumber(aggregate.duplicateGroups);
  const sampleGroups = asArray(input.sampleGroups);
  const sampleExactGroups = sampleGroups.filter((group) => asNumber(group.nonVolatileSignatures) === 1).length;
  const sampleFanoutGroups = sampleGroups.filter(
    (group) =>
      asNumber(group.ownerIds) > 1 ||
      asNumber(group.assessmentIds) > 1 ||
      asNumber(group.situsAddresses) > 1 ||
      asNumber(group.legalDescriptions) > 1 ||
      asNumber(group.propertyTypes) > 1 ||
      asNumber(group.conversionEras) > 1
  ).length;
  const exactGroups = asNullableNumber(aggregate.exactNonVolatileDuplicateGroups) ?? sampleExactGroups;
  const fanoutGroups =
    (asNullableNumber(aggregate.ownerFanoutGroups) ??
      asNullableNumber(aggregate.assessmentFanoutGroups) ??
      asNullableNumber(aggregate.situsFanoutGroups) ??
      asNullableNumber(aggregate.legalFanoutGroups) ??
      asNullableNumber(aggregate.propertyTypeFanoutGroups) ??
      asNullableNumber(aggregate.conversionEraFanoutGroups)) === null
      ? sampleFanoutGroups
      : asNumber(aggregate.ownerFanoutGroups) +
        asNumber(aggregate.assessmentFanoutGroups) +
        asNumber(aggregate.situsFanoutGroups) +
        asNumber(aggregate.legalFanoutGroups) +
        asNumber(aggregate.propertyTypeFanoutGroups) +
        asNumber(aggregate.conversionEraFanoutGroups);
  const sourceFanoutGroups = aggregate.sourceIdentifierFanoutGroups === null ? null : asNumber(aggregate.sourceIdentifierFanoutGroups);
  const loadBatchFanoutGroups = aggregate.loadBatchFanoutGroups === null ? null : asNumber(aggregate.loadBatchFanoutGroups);
  const columns = input.schema?.columns ?? [];
  const indexes = input.schema?.indexes ?? [];
  const uniqueActiveParcelIndex = hasUniqueActiveParcelIndex(indexes);
  const sourceColumns = sourceIdentifierColumns(columns);
  const loadColumns = loadIdentifierColumns(columns);
  const evidence = [];
  const limitations = [];

  if (duplicateGroups <= 0) {
    return {
      primaryRootCause: "none",
      certificationImpact: "none",
      projectionFixRequired: false,
      uniqueActiveParcelIndex,
      sourceIdentifierColumns: sourceColumns,
      loadIdentifierColumns: loadColumns,
      evidence: ["No active/current duplicate Benton parcel-number groups were detected."],
      limitations
    };
  }

  if (!uniqueActiveParcelIndex) {
    evidence.push("canonical_tf.tf_parcel has no unique active CountyId + ParcelNumber key in the inspected index definitions.");
  }

  if (sourceColumns.length === 0) {
    limitations.push("No source identifier column exists on canonical_tf.tf_parcel, so source duplication cannot be proven from this table alone.");
  }

  if (loadColumns.length === 0) {
    limitations.push("No load batch or receipt column exists on canonical_tf.tf_parcel, so direct duplicate-to-load-batch tracing is unavailable.");
  }

  if (sourceFanoutGroups !== null && sourceFanoutGroups > 0) {
    evidence.push(`${sourceFanoutGroups} duplicate groups differ by source identifier.`);
    return {
      primaryRootCause: "source_duplicate_proven",
      certificationImpact: "certification_blocker",
      projectionFixRequired: false,
      uniqueActiveParcelIndex,
      sourceIdentifierColumns: sourceColumns,
      loadIdentifierColumns: loadColumns,
      evidence,
      limitations
    };
  }

  if (fanoutGroups > 0) {
    evidence.push(`${fanoutGroups} duplicate-group fanout signals were observed across owner/assessment/address/legal/type/era fields.`);
    return {
      primaryRootCause: "projection_fanout_requires_adjudication",
      certificationImpact: "certification_blocker",
      projectionFixRequired: true,
      uniqueActiveParcelIndex,
      sourceIdentifierColumns: sourceColumns,
      loadIdentifierColumns: loadColumns,
      evidence,
      limitations
    };
  }

  if (exactGroups > 0 && !uniqueActiveParcelIndex) {
    evidence.push(`${exactGroups} duplicate groups have identical non-volatile parcel identity fields.`);
    if (asNumber(aggregate.createdTimestampDistinctGroups) > 0 || asNumber(aggregate.updatedTimestampDistinctGroups) > 0) {
      evidence.push("Duplicate rows differ by created/updated timestamps, consistent with repeated projection inserts instead of active-row upsert.");
    }
    return {
      primaryRootCause: loadBatchFanoutGroups && loadBatchFanoutGroups > 0 ? "stale_prior_load_residue_possible" : "projection_upsert_or_uniqueness_defect",
      certificationImpact: "certification_blocker",
      projectionFixRequired: true,
      uniqueActiveParcelIndex,
      sourceIdentifierColumns: sourceColumns,
      loadIdentifierColumns: loadColumns,
      evidence,
      limitations
    };
  }

  evidence.push("Duplicate groups exist, but inspected canonical fields do not prove source duplication, fanout, or exact projection residue.");

  return {
    primaryRootCause: "root_cause_unproven_requires_manual_adjudication",
    certificationImpact: "certification_blocker",
    projectionFixRequired: true,
    uniqueActiveParcelIndex,
    sourceIdentifierColumns: sourceColumns,
    loadIdentifierColumns: loadColumns,
    evidence,
    limitations
  };
}

export function buildBentonProjectionDuplicateRootCause(input) {
  const generatedAtUtc = input.generatedAtUtc ?? new Date().toISOString();
  const aggregate = input.aggregate ?? {};
  const duplicateGroups = asNumber(aggregate.duplicateGroups);
  const syncActive = asNumber(input.syncState?.inProgressBatches) > 0;
  const classification = classifyProjectionDuplicateRootCause(input);
  const sampleGroups = asArray(input.sampleGroups);
  const sampleExactNonVolatileDuplicateGroups = sampleGroups.filter((group) => asNumber(group.nonVolatileSignatures) === 1).length;
  const sampleFanoutGroups = sampleGroups.filter(
    (group) =>
      asNumber(group.ownerIds) > 1 ||
      asNumber(group.assessmentIds) > 1 ||
      asNumber(group.situsAddresses) > 1 ||
      asNumber(group.legalDescriptions) > 1 ||
      asNumber(group.propertyTypes) > 1 ||
      asNumber(group.conversionEras) > 1
  ).length;
  const blockers = [];

  if (input.error) {
    blockers.push(blocker("db_probe", "Projection duplicate root-cause DB probe failed.", input.error));
  }

  if (syncActive) {
    blockers.push(
      blocker(
        "sync_active",
        "TerraFusion Sync is active; root-cause evidence may be collected read-only, but Benton certification remains blocked.",
        input.syncState?.latestBatch ?? null
      )
    );
  }

  if (classification.certificationImpact === "certification_blocker") {
    blockers.push(
      blocker(
        "projection_duplicate_root_cause",
        `Active/current Benton parcel duplicates remain a certification blocker. Root cause: ${classification.primaryRootCause}.`,
        {
          duplicateGroups,
          extraActiveRows: asNumber(aggregate.extraActiveRows),
          maxRowsPerParcelNumber: asNumber(aggregate.maxRowsPerParcelNumber),
          projectionFixRequired: classification.projectionFixRequired
        }
      )
    );
  }

  const passed = blockers.length === 0 && duplicateGroups === 0;

  return {
    generatedAtUtc,
    slice: "Benton Projection Duplicate Root-Cause Gate",
    passed,
    databaseMutationTaken: false,
    certificationGranted: false,
    summary: {
      county: "Benton",
      table: input.schema?.table ?? "canonical_tf.tf_parcel",
      duplicateGroups,
      extraActiveRows: asNumber(aggregate.extraActiveRows),
      maxRowsPerParcelNumber: asNumber(aggregate.maxRowsPerParcelNumber),
      exactNonVolatileDuplicateGroups: asNullableNumber(aggregate.exactNonVolatileDuplicateGroups),
      sampleExactNonVolatileDuplicateGroups,
      sampleFanoutGroups,
      ownerFanoutGroups: asNullableNumber(aggregate.ownerFanoutGroups),
      assessmentFanoutGroups: asNullableNumber(aggregate.assessmentFanoutGroups),
      situsFanoutGroups: asNullableNumber(aggregate.situsFanoutGroups),
      legalFanoutGroups: asNullableNumber(aggregate.legalFanoutGroups),
      propertyTypeFanoutGroups: asNullableNumber(aggregate.propertyTypeFanoutGroups),
      conversionEraFanoutGroups: asNullableNumber(aggregate.conversionEraFanoutGroups),
      createdTimestampDistinctGroups: asNullableNumber(aggregate.createdTimestampDistinctGroups),
      updatedTimestampDistinctGroups: asNullableNumber(aggregate.updatedTimestampDistinctGroups),
      sourceIdentifierFanoutGroups: asNullableNumber(aggregate.sourceIdentifierFanoutGroups),
      loadBatchFanoutGroups: asNullableNumber(aggregate.loadBatchFanoutGroups),
      primaryRootCause: classification.primaryRootCause,
      certificationImpact: classification.certificationImpact,
      projectionFixRequired: classification.projectionFixRequired,
      uniqueActiveParcelIndex: classification.uniqueActiveParcelIndex,
      sourceIdentifierColumns: classification.sourceIdentifierColumns,
      loadIdentifierColumns: classification.loadIdentifierColumns,
      syncActive,
      inProgressBatches: asNumber(input.syncState?.inProgressBatches)
    },
    doctrine: [
      "TerraFusion DB is the runtime source for this root-cause gate.",
      "This gate is read-only and does not mutate canonical parcels.",
      "Benton cannot certify until active/current parcel identity is one row per parcel number or a legitimate multi-row identity key is documented.",
      "Source duplication cannot be claimed without source identifiers.",
      "Projection cleanup cannot proceed from guesswork; it needs this root-cause evidence."
    ],
    schema: {
      table: input.schema?.table ?? "canonical_tf.tf_parcel",
      columns: input.schema?.columns ?? [],
      indexes: input.schema?.indexes ?? []
    },
    syncState: input.syncState ?? null,
    rootCause: classification,
    sampleGroups: input.sampleGroups ?? [],
    blockers
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Benton Projection Duplicate Root-Cause Gate",
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
    `- Exact non-volatile duplicate groups: ${report.summary.exactNonVolatileDuplicateGroups ?? "not fully scanned"}`,
    `- Sample exact non-volatile duplicate groups: ${report.summary.sampleExactNonVolatileDuplicateGroups}`,
    `- Sample fanout groups: ${report.summary.sampleFanoutGroups}`,
    `- Owner fanout groups: ${report.summary.ownerFanoutGroups}`,
    `- Assessment fanout groups: ${report.summary.assessmentFanoutGroups}`,
    `- Created timestamp distinct groups: ${report.summary.createdTimestampDistinctGroups}`,
    `- Updated timestamp distinct groups: ${report.summary.updatedTimestampDistinctGroups}`,
    `- Primary root cause: ${report.summary.primaryRootCause}`,
    `- Certification impact: ${report.summary.certificationImpact}`,
    `- Projection fix required: ${report.summary.projectionFixRequired}`,
    `- Unique active parcel index: ${report.summary.uniqueActiveParcelIndex}`,
    `- Sync active: ${report.summary.syncActive}`,
    `- Database mutation taken: ${report.databaseMutationTaken}`,
    `- Certification granted: ${report.certificationGranted}`,
    "",
    "## Root-Cause Evidence",
    ""
  ];

  report.rootCause.evidence.forEach((item) => lines.push(`- ${item}`));
  if (report.rootCause.evidence.length === 0) lines.push("- None");

  lines.push("", "## Limitations", "");
  report.rootCause.limitations.forEach((item) => lines.push(`- ${item}`));
  if (report.rootCause.limitations.length === 0) lines.push("- None");

  lines.push("", "## Sample Groups", "");
  lines.push("| Parcel number | Rows | Non-volatile signatures | Owners | Assessments | Created timestamps | Updated timestamps |");
  lines.push("|---|---:|---:|---:|---:|---:|---:|");
  asArray(report.sampleGroups)
    .slice(0, 25)
    .forEach((group) => {
      lines.push(
        [
          group.parcelNumber,
          String(group.rows),
          String(group.nonVolatileSignatures),
          String(group.ownerIds),
          String(group.assessmentIds),
          String(group.createdTimestamps),
          String(group.updatedTimestamps)
        ].join(" | ")
      );
    });

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) lines.push("- None");
  report.blockers.forEach((item) => lines.push(`- ${item.source}: ${item.message}`));

  return `${lines.join("\n")}\n`;
}

function queryLiveRootCauseState({ container, user, database, sampleLimit }) {
  const query = `
set statement_timeout = '120000';
with schema_columns as (
  select coalesce(jsonb_agg(column_name order by ordinal_position), '[]'::jsonb) as columns
  from information_schema.columns
  where table_schema = 'canonical_tf'
    and table_name = 'tf_parcel'
),
schema_indexes as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'indexName', indexname,
    'unique', indexdef ilike 'CREATE UNIQUE INDEX%',
    'definition', indexdef
  ) order by indexname), '[]'::jsonb) as indexes
  from pg_indexes
  where schemaname = 'canonical_tf'
    and tablename = 'tf_parcel'
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
group_metrics as (
  select
    p."ParcelNumber",
    count(*)::int as rows,
    count(distinct md5(concat_ws('|',
      coalesce(p."CurrentOwnerId"::text, ''),
      coalesce(p."CurrentAssessmentId"::text, ''),
      coalesce(p."SitusAddress", ''),
      coalesce(p."LegalDescription", ''),
      coalesce(p."PropertyType", ''),
      coalesce(p."ParcelStatus", ''),
      coalesce(p."ConversionEra", '')
    )))::int as non_volatile_signatures,
    count(distinct coalesce(p."CurrentOwnerId"::text, ''))::int as owner_ids,
    count(distinct coalesce(p."CurrentAssessmentId"::text, ''))::int as assessment_ids,
    count(distinct coalesce(p."SitusAddress", ''))::int as situs_addresses,
    count(distinct coalesce(p."LegalDescription", ''))::int as legal_descriptions,
    count(distinct coalesce(p."PropertyType", ''))::int as property_types,
    count(distinct coalesce(p."ConversionEra", ''))::int as conversion_eras,
    count(distinct coalesce(to_char(p."CreatedAt" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), ''))::int as created_timestamps,
    count(distinct coalesce(to_char(p."UpdatedAt" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), ''))::int as updated_timestamps
  from canonical_tf.tf_parcel p
  join (
    select "ParcelNumber", rows
    from duplicate_groups
    order by rows desc, "ParcelNumber"
    limit ${Number(sampleLimit)}
  ) d on d."ParcelNumber" = p."ParcelNumber"
  where p."CountyId" = '${BENTON_COUNTY_ID}'::uuid
    and p."ParcelStatus" = 'ACTIVE'
  group by p."ParcelNumber"
),
aggregate as (
  select jsonb_build_object(
    'duplicateGroups', count(*)::int,
    'extraActiveRows', coalesce(sum(rows - 1), 0)::int,
    'maxRowsPerParcelNumber', coalesce(max(rows), 0)::int,
    'exactNonVolatileDuplicateGroups', null,
    'ownerFanoutGroups', null,
    'assessmentFanoutGroups', null,
    'situsFanoutGroups', null,
    'legalFanoutGroups', null,
    'propertyTypeFanoutGroups', null,
    'conversionEraFanoutGroups', null,
    'createdTimestampDistinctGroups', null,
    'updatedTimestampDistinctGroups', null,
    'sourceIdentifierFanoutGroups', null,
    'loadBatchFanoutGroups', null
  ) as value
  from duplicate_groups
),
sample_groups as (
  select *
  from group_metrics
  order by rows desc, "ParcelNumber"
  limit ${Number(sampleLimit)}
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
    'columns', (select columns from schema_columns),
    'indexes', (select indexes from schema_indexes)
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
  'aggregate', (select value from aggregate),
  'sampleGroups', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'parcelNumber', "ParcelNumber",
      'rows', rows,
      'nonVolatileSignatures', non_volatile_signatures,
      'ownerIds', owner_ids,
      'assessmentIds', assessment_ids,
      'situsAddresses', situs_addresses,
      'legalDescriptions', legal_descriptions,
      'propertyTypes', property_types,
      'conversionEras', conversion_eras,
      'createdTimestamps', created_timestamps,
      'updatedTimestamps', updated_timestamps
    ) order by rows desc, "ParcelNumber"), '[]'::jsonb)
    from sample_groups
  )
)::text;
`;

  const output = execFileSync(
    "docker",
    ["exec", "-i", container, "psql", "-U", user, "-d", database, "-t", "-A", "-v", "ON_ERROR_STOP=1"],
    {
      input: query,
      encoding: "utf8",
      timeout: 150000
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
    return queryLiveRootCauseState({
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
        columns: [],
        indexes: []
      },
      syncState: {
        source: "docker:psql",
        inProgressBatches: null,
        latestBatch: null,
        statusCounts: {}
      },
      aggregate: {
        duplicateGroups: 0,
        extraActiveRows: 0,
        maxRowsPerParcelNumber: 0,
        exactNonVolatileDuplicateGroups: 0,
        ownerFanoutGroups: 0,
        assessmentFanoutGroups: 0,
        situsFanoutGroups: 0,
        legalFanoutGroups: 0,
        propertyTypeFanoutGroups: 0,
        conversionEraFanoutGroups: 0,
        createdTimestampDistinctGroups: 0,
        updatedTimestampDistinctGroups: 0,
        sourceIdentifierFanoutGroups: null,
        loadBatchFanoutGroups: null
      },
      sampleGroups: [],
      error: error.message
    };
  }
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const input = collectInput(args);
  const report = buildBentonProjectionDuplicateRootCause(input);

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
        primaryRootCause: report.summary.primaryRootCause,
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
