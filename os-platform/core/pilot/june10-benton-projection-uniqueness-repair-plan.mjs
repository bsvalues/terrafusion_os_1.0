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
const DEFAULT_ROOT_CAUSE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-benton-projection-duplicate-root-cause.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-benton-projection-uniqueness-repair-plan.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-benton-projection-uniqueness-repair-plan.latest.md"
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

function parseTime(value) {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function blocker(source, message, evidence = null) {
  return { source, message, evidence };
}

function compareRowsForWinner(left, right) {
  const updatedDiff = parseTime(right.updatedAt) - parseTime(left.updatedAt);
  if (updatedDiff !== 0) return updatedDiff;

  const createdDiff = parseTime(right.createdAt) - parseTime(left.createdAt);
  if (createdDiff !== 0) return createdDiff;

  return String(left.tfParcelId ?? "").localeCompare(String(right.tfParcelId ?? ""));
}

export function chooseCanonicalWinner(rows) {
  const sorted = [...asArray(rows)].sort(compareRowsForWinner);
  const [winner, ...losers] = sorted;
  return {
    winner: winner ?? null,
    losers
  };
}

function groupRowsByParcelNumber(rows) {
  const groups = new Map();
  for (const row of asArray(rows)) {
    const parcelNumber = String(row.parcelNumber ?? "");
    if (!parcelNumber) continue;
    if (!groups.has(parcelNumber)) groups.set(parcelNumber, []);
    groups.get(parcelNumber).push(row);
  }
  return groups;
}

function buildRepairPlan() {
  return {
    activeUniquenessRule: {
      name: "ux_tf_parcel_active_county_parcel_number",
      intent: "Exactly one ACTIVE canonical parcel row per CountyId + ParcelNumber.",
      sql:
        'CREATE UNIQUE INDEX CONCURRENTLY "ux_tf_parcel_active_county_parcel_number" ON canonical_tf.tf_parcel ("CountyId", "ParcelNumber") WHERE "ParcelStatus" = \'ACTIVE\' AND nullif("ParcelNumber", \'\') IS NOT NULL;',
      preconditions: [
        "Sync terminal state is proven.",
        "Dry-run duplicate count is 0 after repair candidate selection.",
        "Rollback receipt table exists and captures every loser row before status mutation.",
        "No product runtime certification is active during repair."
      ]
    },
    deterministicUpsertBehavior: {
      conflictTargetSql:
        'ON CONFLICT ("CountyId", "ParcelNumber") WHERE "ParcelStatus" = \'ACTIVE\' AND nullif("ParcelNumber", \'\') IS NOT NULL DO UPDATE',
      rule:
        "Projection writes ACTIVE parcels by CountyId + ParcelNumber. Inserts create a row only when no active row exists; otherwise projection updates the existing canonical row in place and preserves the winning TfParcelId.",
      createdAtPolicy: "Preserve CreatedAt from the winning canonical row on update.",
      updatedAtPolicy: "Set UpdatedAt to the projection/write timestamp on update.",
      lineagePolicy:
        "Every projection run must emit a product-load receipt that records source snapshot, load batch, affected table, inserted count, updated count, superseded duplicate count, and validation counts."
    },
    duplicateResolutionRule: {
      winnerOrder: ["latest UpdatedAt", "latest CreatedAt", "lowest TfParcelId as deterministic tie-breaker"],
      loserAction:
        "Do not delete. Mark loser rows non-active with a governed duplicate-superseded status only inside an authorized repair transaction after recording full row snapshots in a rollback receipt.",
      certificationRequirement:
        "Benton cannot certify until active/current parcel identity is one row per parcel number or a documented legitimate multi-row identity key exists."
    },
    rollbackPlan: {
      receiptRequired: true,
      receiptTables: [
        "sync_bridge.projection_repair_receipt",
        "sync_bridge.projection_repair_row_snapshot"
      ],
      rollbackRule:
        "Rollback restores every loser row to its prior ParcelStatus and field values from the row snapshot receipt, then drops the active uniqueness index if it was created.",
      verificationAfterRollback: [
        "Re-run duplicate adjudication.",
        "Re-run projection duplicate root-cause gate.",
        "Re-run Benton parcel count sanity."
      ]
    }
  };
}

function buildDryRun(duplicateRows) {
  const sampleResolutionGroups = [];
  for (const [parcelNumber, rows] of groupRowsByParcelNumber(duplicateRows).entries()) {
    if (rows.length <= 1) continue;
    const { winner, losers } = chooseCanonicalWinner(rows);
    sampleResolutionGroups.push({
      parcelNumber,
      rows: rows.length,
      winnerTfParcelId: winner?.tfParcelId ?? null,
      loserTfParcelIds: losers.map((row) => row.tfParcelId),
      winnerRule: "latest UpdatedAt, latest CreatedAt, lowest TfParcelId",
      mutationPreviewOnly: true
    });
  }

  return {
    mode: "read_only_preview",
    productionDbWritePerformed: false,
    sampleResolutionGroups,
    sampleGroups: sampleResolutionGroups.length,
    sampledLoserRows: sampleResolutionGroups.reduce((sum, group) => sum + group.loserTfParcelIds.length, 0)
  };
}

export function buildBentonProjectionUniquenessRepairPlan(input) {
  const generatedAtUtc = input.generatedAtUtc ?? new Date().toISOString();
  const aggregate = input.aggregate ?? {};
  const rootCause = input.rootCause ?? {};
  const duplicateGroups = asNumber(aggregate.duplicateGroups);
  const syncActive = asNumber(input.syncState?.inProgressBatches) > 0;
  const rootCauseName = rootCause.primaryRootCause ?? "unknown";
  const repairPlan = buildRepairPlan();
  const dryRun = buildDryRun(input.duplicateRows);
  const blockers = [];

  if (input.error) {
    blockers.push(blocker("db_probe", "Repair-plan dry-run DB probe failed.", input.error));
  }

  if (syncActive) {
    blockers.push(
      blocker(
        "sync_active",
        "TerraFusion Sync is active; repair planning may run read-only, but DB mutation is forbidden.",
        input.syncState?.latestBatch ?? null
      )
    );
  }

  if (rootCauseName !== "projection_upsert_or_uniqueness_defect" && duplicateGroups > 0) {
    blockers.push(
      blocker(
        "root_cause_not_projection_upsert",
        `Repair plan requires projection_upsert_or_uniqueness_defect; observed ${rootCauseName}.`,
        rootCause
      )
    );
  }

  if (duplicateGroups > 0) {
    blockers.push(
      blocker(
        "active_duplicates_remaining",
        `${duplicateGroups} active/current Benton duplicate parcel-number groups remain. Certification stays blocked until dry-run shows 0.`,
        {
          extraActiveRows: asNumber(aggregate.extraActiveRows),
          maxRowsPerParcelNumber: asNumber(aggregate.maxRowsPerParcelNumber)
        }
      )
    );
  }

  const certificationBlockedUntilDryRunZero = duplicateGroups > 0 || blockers.length > 0;
  const passed = blockers.length === 0 && duplicateGroups === 0;

  return {
    generatedAtUtc,
    slice: "Benton Projection Uniqueness Repair Plan",
    passed,
    databaseMutationTaken: false,
    certificationGranted: false,
    summary: {
      county: "Benton",
      table: "canonical_tf.tf_parcel",
      rootCause: rootCauseName,
      duplicateGroups,
      extraActiveRows: asNumber(aggregate.extraActiveRows),
      maxRowsPerParcelNumber: asNumber(aggregate.maxRowsPerParcelNumber),
      dryRunSampleGroups: dryRun.sampleGroups,
      dryRunSampledLoserRows: dryRun.sampledLoserRows,
      certificationBlockedUntilDryRunZero,
      syncActive,
      blockers: blockers.length
    },
    repairAuthorization: {
      mutationAllowedNow: false,
      reason: syncActive
        ? "Sync is active. No repair mutation is authorized."
        : "This slice is a repair plan and dry-run only. Mutation requires a separate explicit repair slice.",
      requiredBeforeMutation: [
        "Sync terminal state proven.",
        "Operator approves repair transaction.",
        "Rollback receipt tables and row snapshots are ready.",
        "Dry-run candidate report is reviewed.",
        "Maintenance window is active."
      ]
    },
    doctrine: [
      "TerraFusion DB is the runtime source, but repair planning is not repair execution.",
      "No production DB mutation is allowed while Sync is active.",
      "Active/current parcel identity must be one row per CountyId + ParcelNumber before Benton certification.",
      "Duplicate rows must be superseded with receipt-backed rollback, not manually deleted.",
      "The active uniqueness rule is applied only after duplicates are resolved."
    ],
    repairPlan,
    dryRun,
    blockers
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Benton Projection Uniqueness Repair Plan",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Verdict: **${report.passed ? "PASS" : "FAIL"}**`,
    "",
    "## Summary",
    "",
    `- County: ${report.summary.county}`,
    `- Table: ${report.summary.table}`,
    `- Root cause: ${report.summary.rootCause}`,
    `- Duplicate active parcel-number groups: ${report.summary.duplicateGroups}`,
    `- Extra active rows: ${report.summary.extraActiveRows}`,
    `- Max rows per parcel number: ${report.summary.maxRowsPerParcelNumber}`,
    `- Dry-run sample groups: ${report.summary.dryRunSampleGroups}`,
    `- Dry-run sampled loser rows: ${report.summary.dryRunSampledLoserRows}`,
    `- Certification blocked until dry-run zero: ${report.summary.certificationBlockedUntilDryRunZero}`,
    `- Sync active: ${report.summary.syncActive}`,
    `- Database mutation taken: ${report.databaseMutationTaken}`,
    `- Certification granted: ${report.certificationGranted}`,
    "",
    "## Active Uniqueness Rule",
    "",
    "```sql",
    report.repairPlan.activeUniquenessRule.sql,
    "```",
    "",
    "## Deterministic Upsert Behavior",
    "",
    `- Conflict target: \`${report.repairPlan.deterministicUpsertBehavior.conflictTargetSql}\``,
    `- Rule: ${report.repairPlan.deterministicUpsertBehavior.rule}`,
    `- CreatedAt: ${report.repairPlan.deterministicUpsertBehavior.createdAtPolicy}`,
    `- UpdatedAt: ${report.repairPlan.deterministicUpsertBehavior.updatedAtPolicy}`,
    `- Lineage: ${report.repairPlan.deterministicUpsertBehavior.lineagePolicy}`,
    "",
    "## Duplicate Resolution Rule",
    "",
    `- Winner order: ${report.repairPlan.duplicateResolutionRule.winnerOrder.join(" -> ")}`,
    `- Loser action: ${report.repairPlan.duplicateResolutionRule.loserAction}`,
    `- Certification requirement: ${report.repairPlan.duplicateResolutionRule.certificationRequirement}`,
    "",
    "## Dry-Run Sample",
    "",
    "| Parcel number | Rows | Winner TfParcelId | Loser TfParcelIds |",
    "|---|---:|---|---|"
  ];

  report.dryRun.sampleResolutionGroups.slice(0, 25).forEach((group) => {
    lines.push([group.parcelNumber, String(group.rows), group.winnerTfParcelId, group.loserTfParcelIds.join(", ")].join(" | "));
  });
  if (report.dryRun.sampleResolutionGroups.length === 0) lines.push("| - | 0 | - | - |");

  lines.push("", "## Rollback Plan", "");
  lines.push(`- Receipt required: ${report.repairPlan.rollbackPlan.receiptRequired}`);
  lines.push(`- Receipt tables: ${report.repairPlan.rollbackPlan.receiptTables.join(", ")}`);
  lines.push(`- Rule: ${report.repairPlan.rollbackPlan.rollbackRule}`);
  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) lines.push("- None");
  report.blockers.forEach((item) => lines.push(`- ${item.source}: ${item.message}`));

  return `${lines.join("\n")}\n`;
}

function queryLiveRepairPlanState({ container, user, database, sampleLimit }) {
  const query = `
set statement_timeout = '90000';
with duplicate_groups as (
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
  order by p."ParcelNumber", p."UpdatedAt" desc nulls last, p."CreatedAt" desc nulls last, p."TfParcelId"
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
  'duplicateRows', (
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
    ) order by parcel_number, updated_at desc, created_at desc, tf_parcel_id), '[]'::jsonb)
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
    rootCausePath: DEFAULT_ROOT_CAUSE,
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
    else if (arg === "--root-cause") args.rootCausePath = path.resolve(argv[++i]);
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

function rootCauseFromReport(rootCauseReport) {
  return {
    primaryRootCause: rootCauseReport?.summary?.primaryRootCause ?? rootCauseReport?.rootCause?.primaryRootCause ?? "unknown",
    projectionFixRequired: rootCauseReport?.summary?.projectionFixRequired ?? rootCauseReport?.rootCause?.projectionFixRequired ?? null,
    certificationImpact: rootCauseReport?.summary?.certificationImpact ?? rootCauseReport?.rootCause?.certificationImpact ?? null
  };
}

function collectInput(args) {
  if (args.inputPath) return readJson(args.inputPath);

  let liveState;
  try {
    liveState = queryLiveRepairPlanState({
      container: args.postgresContainer,
      user: args.postgresUser,
      database: args.postgresDatabase,
      sampleLimit: args.sampleLimit
    });
  } catch (error) {
    liveState = {
      generatedAtUtc: new Date().toISOString(),
      syncState: {
        source: "docker:psql",
        inProgressBatches: null,
        latestBatch: null,
        statusCounts: {}
      },
      aggregate: {
        duplicateGroups: 0,
        extraActiveRows: 0,
        maxRowsPerParcelNumber: 0
      },
      duplicateRows: [],
      error: error.message
    };
  }

  let rootCause = { primaryRootCause: "unknown" };
  if (fs.existsSync(args.rootCausePath)) {
    rootCause = rootCauseFromReport(readJson(args.rootCausePath));
  }

  return {
    ...liveState,
    rootCause
  };
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const input = collectInput(args);
  const report = buildBentonProjectionUniquenessRepairPlan(input);

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
        rootCause: report.summary.rootCause,
        mutationAllowedNow: report.repairAuthorization.mutationAllowedNow,
        dryRunSampleGroups: report.summary.dryRunSampleGroups,
        blockers: report.blockers.map((item) => item.source),
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
