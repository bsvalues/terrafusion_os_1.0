#!/usr/bin/env node

import crypto from "node:crypto";
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
const DEFAULT_AUTHORIZATION = "BENTON_PROJECTION_UNIQUENESS_REPAIR_APPROVED";
const BENTON_COUNTY_ID = "19190019-1919-1919-1919-191919191919";
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-benton-projection-uniqueness-repair-execution.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-benton-projection-uniqueness-repair-execution.latest.md"
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function blocker(source, message, evidence = null) {
  return { source, message, evidence };
}

function psql({ container, user, database, sql, timeout = 120000 }) {
  const output = execFileSync(
    "docker",
    ["exec", "-i", container, "psql", "-U", user, "-d", database, "-t", "-A", "-v", "ON_ERROR_STOP=1"],
    {
      input: sql,
      encoding: "utf8",
      timeout
    }
  );

  return output.trim();
}

function readLastJson(output) {
  const line = output.split(/\r?\n/).filter(Boolean).at(-1);
  return line ? JSON.parse(line) : null;
}

export function buildRepairSql({ runId }) {
  return `
BEGIN;
SET LOCAL statement_timeout = '120000';
LOCK TABLE canonical_tf.tf_parcel IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM sync_bridge.load_batch WHERE "Status" = 'IN_PROGRESS') THEN
    RAISE EXCEPTION 'TerraFusion Sync is active; Benton projection uniqueness repair is blocked.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sync_bridge.projection_repair_receipt (
  run_id uuid PRIMARY KEY,
  county_id uuid NOT NULL,
  repair_name text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  duplicate_groups_before integer NOT NULL,
  extra_active_rows_before integer NOT NULL,
  loser_rows_superseded integer NOT NULL DEFAULT 0,
  active_duplicate_groups_after integer NULL,
  active_distinct_parcels_after integer NULL,
  unique_index_name text NULL,
  rollback_sql text NOT NULL,
  created_by text NOT NULL DEFAULT current_user
);

CREATE TABLE IF NOT EXISTS sync_bridge.projection_repair_row_snapshot (
  run_id uuid NOT NULL REFERENCES sync_bridge.projection_repair_receipt(run_id),
  tf_parcel_id uuid NOT NULL,
  county_id uuid NOT NULL,
  parcel_number text NOT NULL,
  original_parcel_status text NOT NULL,
  winner_tf_parcel_id uuid NOT NULL,
  row_snapshot jsonb NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (run_id, tf_parcel_id)
);

WITH duplicate_groups AS (
  SELECT "ParcelNumber", count(*)::int AS rows
  FROM canonical_tf.tf_parcel
  WHERE "CountyId" = '${BENTON_COUNTY_ID}'::uuid
    AND "ParcelStatus" = 'ACTIVE'
    AND nullif("ParcelNumber", '') IS NOT NULL
  GROUP BY "ParcelNumber"
  HAVING count(*) > 1
),
before_counts AS (
  SELECT
    count(*)::int AS duplicate_groups_before,
    coalesce(sum(rows - 1), 0)::int AS extra_active_rows_before
  FROM duplicate_groups
)
INSERT INTO sync_bridge.projection_repair_receipt (
  run_id,
  county_id,
  repair_name,
  status,
  duplicate_groups_before,
  extra_active_rows_before,
  rollback_sql
)
SELECT
  '${runId}'::uuid,
  '${BENTON_COUNTY_ID}'::uuid,
  'benton_projection_uniqueness_repair',
  'IN_PROGRESS',
  duplicate_groups_before,
  extra_active_rows_before,
  'Use sync_bridge.projection_repair_row_snapshot for this run_id to restore each superseded row status and fields; drop ux_tf_parcel_active_county_parcel_number if created.'
FROM before_counts;

CREATE TEMP TABLE tf_benton_duplicate_losers ON COMMIT DROP AS
WITH ranked AS (
  SELECT
    p.*,
    first_value(p."TfParcelId") OVER (
      PARTITION BY p."CountyId", p."ParcelNumber"
      ORDER BY p."UpdatedAt" DESC NULLS LAST, p."CreatedAt" DESC NULLS LAST, p."TfParcelId" ASC
    ) AS winner_tf_parcel_id,
    row_number() OVER (
      PARTITION BY p."CountyId", p."ParcelNumber"
      ORDER BY p."UpdatedAt" DESC NULLS LAST, p."CreatedAt" DESC NULLS LAST, p."TfParcelId" ASC
    ) AS repair_rank
  FROM canonical_tf.tf_parcel p
  WHERE p."CountyId" = '${BENTON_COUNTY_ID}'::uuid
    AND p."ParcelStatus" = 'ACTIVE'
    AND nullif(p."ParcelNumber", '') IS NOT NULL
)
SELECT *
FROM ranked
WHERE repair_rank > 1;

INSERT INTO sync_bridge.projection_repair_row_snapshot (
  run_id,
  tf_parcel_id,
  county_id,
  parcel_number,
  original_parcel_status,
  winner_tf_parcel_id,
  row_snapshot
)
SELECT
  '${runId}'::uuid,
  l."TfParcelId",
  l."CountyId",
  l."ParcelNumber",
  l."ParcelStatus",
  l.winner_tf_parcel_id,
  to_jsonb(l)
FROM tf_benton_duplicate_losers l;

UPDATE canonical_tf.tf_parcel p
SET
  "ParcelStatus" = 'SUPERSEDED_DUPLICATE',
  "UpdatedAt" = now()
FROM tf_benton_duplicate_losers l
WHERE p."TfParcelId" = l."TfParcelId";

WITH after_duplicate_groups AS (
  SELECT "ParcelNumber", count(*)::int AS rows
  FROM canonical_tf.tf_parcel
  WHERE "CountyId" = '${BENTON_COUNTY_ID}'::uuid
    AND "ParcelStatus" = 'ACTIVE'
    AND nullif("ParcelNumber", '') IS NOT NULL
  GROUP BY "ParcelNumber"
  HAVING count(*) > 1
),
after_counts AS (
  SELECT
    (SELECT count(*)::int FROM tf_benton_duplicate_losers) AS loser_rows_superseded,
    (SELECT count(*)::int FROM after_duplicate_groups) AS active_duplicate_groups_after,
    (
      SELECT count(DISTINCT "ParcelNumber")::int
      FROM canonical_tf.tf_parcel
      WHERE "CountyId" = '${BENTON_COUNTY_ID}'::uuid
        AND "ParcelStatus" = 'ACTIVE'
        AND nullif("ParcelNumber", '') IS NOT NULL
    ) AS active_distinct_parcels_after
)
UPDATE sync_bridge.projection_repair_receipt r
SET
  status = 'ROW_REPAIR_COMPLETE',
  completed_at = now(),
  loser_rows_superseded = after_counts.loser_rows_superseded,
  active_duplicate_groups_after = after_counts.active_duplicate_groups_after,
  active_distinct_parcels_after = after_counts.active_distinct_parcels_after
FROM after_counts
WHERE r.run_id = '${runId}'::uuid;

DO $$
DECLARE
  remaining integer;
BEGIN
  SELECT active_duplicate_groups_after
  INTO remaining
  FROM sync_bridge.projection_repair_receipt
  WHERE run_id = '${runId}'::uuid;

  IF remaining > 0 THEN
    RAISE EXCEPTION 'Benton active duplicate groups remain after repair: %', remaining;
  END IF;
END $$;

COMMIT;
`;
}

function buildUniqueIndexSql() {
  return `
set statement_timeout = '300000';
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "ux_tf_parcel_active_county_parcel_number"
ON canonical_tf.tf_parcel ("CountyId", "ParcelNumber")
WHERE "ParcelStatus" = 'ACTIVE' AND nullif("ParcelNumber", '') IS NOT NULL;
`;
}

function buildReceiptIndexUpdateSql({ runId }) {
  return `
UPDATE sync_bridge.projection_repair_receipt
SET unique_index_name = 'ux_tf_parcel_active_county_parcel_number',
    status = 'VERIFIED'
WHERE run_id = '${runId}'::uuid;
`;
}

function queryLiveState({ container, user, database }) {
  const sql = `
with duplicate_groups as (
  select "ParcelNumber", count(*)::int as rows
  from canonical_tf.tf_parcel
  where "CountyId" = '${BENTON_COUNTY_ID}'::uuid
    and "ParcelStatus" = 'ACTIVE'
    and nullif("ParcelNumber", '') is not null
  group by "ParcelNumber"
  having count(*) > 1
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
),
index_state as (
  select exists (
    select 1
    from pg_indexes
    where schemaname = 'canonical_tf'
      and tablename = 'tf_parcel'
      and indexname = 'ux_tf_parcel_active_county_parcel_number'
  ) as exists
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
  'counts', jsonb_build_object(
    'duplicateGroups', (select count(*)::int from duplicate_groups),
    'extraActiveRows', (select coalesce(sum(rows - 1), 0)::int from duplicate_groups),
    'bentonActiveDistinctParcels', (
      select count(distinct "ParcelNumber")::int
      from canonical_tf.tf_parcel
      where "CountyId" = '${BENTON_COUNTY_ID}'::uuid
        and "ParcelStatus" = 'ACTIVE'
        and nullif("ParcelNumber", '') is not null
    )
  ),
  'uniqueIndex', jsonb_build_object(
    'exists', (select exists from index_state)
  )
)::text;
`;

  return readLastJson(psql({ container, user, database, sql, timeout: 120000 }));
}

function queryReceipt({ container, user, database, runId }) {
  const sql = `
select coalesce((
  select jsonb_build_object(
    'runId', run_id::text,
    'status', status,
    'loserRowsSuperseded', loser_rows_superseded,
    'receiptWritten', true,
    'activeDuplicateGroupsAfter', active_duplicate_groups_after,
    'activeDistinctParcelsAfter', active_distinct_parcels_after,
    'uniqueIndexName', unique_index_name,
    'completedAt', case when completed_at is null then null else to_char(completed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end
  )
  from sync_bridge.projection_repair_receipt
  where run_id = '${runId}'::uuid
), jsonb_build_object('runId', '${runId}', 'receiptWritten', false))::text;
`;
  return readLastJson(psql({ container, user, database, sql, timeout: 30000 }));
}

function authorizationOk(token) {
  return token === DEFAULT_AUTHORIZATION;
}

export function buildBentonProjectionUniquenessRepairExecution(input) {
  const generatedAtUtc = input.generatedAtUtc ?? new Date().toISOString();
  const mode = input.mode ?? "observe";
  const before = input.before ?? { duplicateGroups: 0, extraActiveRows: 0, bentonActiveDistinctParcels: 0 };
  const after = input.after ?? null;
  const syncActive = asNumber(input.syncState?.inProgressBatches) > 0;
  const authorized = authorizationOk(input.authorizationToken);
  const execution = input.execution ?? null;
  const uniqueIndex = input.uniqueIndex ?? { exists: false, created: false, error: null };
  const blockers = [];
  let executionStatus = "READY_FOR_AUTHORIZED_EXECUTION";

  if (input.error) {
    executionStatus = "EXECUTION_ERROR";
    blockers.push(blocker("execution_error", "Repair execution gate encountered an error.", input.error));
  }

  if (syncActive) {
    executionStatus = "WAITING_SYNC_TERMINAL";
    blockers.push(
      blocker(
        "sync_active",
        "TerraFusion Sync is active; Benton projection uniqueness repair must not mutate DB.",
        input.syncState?.latestBatch ?? null
      )
    );
  }

  if (mode === "execute" && !authorized) {
    executionStatus = "AUTHORIZATION_REQUIRED";
    blockers.push(
      blocker(
        "authorization",
        `Execution requires --authorization ${DEFAULT_AUTHORIZATION} or TF_BENTON_REPAIR_AUTHORIZATION with that exact value.`
      )
    );
  }

  if (!syncActive && mode === "observe" && asNumber(before.duplicateGroups) <= 0) {
    executionStatus = "NO_REPAIR_NEEDED";
  }

  if (!syncActive && mode === "execute" && authorized && after) {
    if (asNumber(after.duplicateGroups) === 0 && uniqueIndex.exists === true && execution?.receiptWritten === true) {
      executionStatus = "REPAIR_VERIFIED";
    } else {
      executionStatus = "REPAIR_INCOMPLETE";
    }
  }

  if (!syncActive && asNumber(before.duplicateGroups) > 0 && executionStatus === "READY_FOR_AUTHORIZED_EXECUTION") {
    blockers.push(
      blocker(
        "active_duplicates_remaining",
        `${before.duplicateGroups} active/current Benton duplicate parcel-number groups remain. Run authorized repair only after confirming Sync terminal state.`
      )
    );
  }

  if (executionStatus === "REPAIR_INCOMPLETE") {
    blockers.push(
      blocker("repair_incomplete", "Repair executed but post-check did not prove zero duplicates, receipt, and active uniqueness index.", {
        after,
        uniqueIndex,
        execution
      })
    );
  }

  const passed = executionStatus === "REPAIR_VERIFIED" || executionStatus === "NO_REPAIR_NEEDED";
  const databaseMutationTaken = mode === "execute" && authorized && !syncActive && Boolean(execution);

  return {
    generatedAtUtc,
    slice: "Benton Projection Uniqueness Repair Execution Gate",
    passed,
    executionStatus,
    databaseMutationTaken,
    certificationGranted: false,
    summary: {
      county: "Benton",
      table: "canonical_tf.tf_parcel",
      mode,
      beforeDuplicateGroups: asNumber(before.duplicateGroups),
      beforeExtraActiveRows: asNumber(before.extraActiveRows),
      beforeBentonActiveDistinctParcels: asNumber(before.bentonActiveDistinctParcels),
      afterDuplicateGroups: after ? asNumber(after.duplicateGroups) : null,
      afterExtraActiveRows: after ? asNumber(after.extraActiveRows) : null,
      afterBentonActiveDistinctParcels: after ? asNumber(after.bentonActiveDistinctParcels) : null,
      loserRowsSuperseded: execution ? asNumber(execution.loserRowsSuperseded) : null,
      repairRunId: execution?.runId ?? null,
      receiptWritten: execution?.receiptWritten ?? false,
      uniqueIndexExists: uniqueIndex.exists === true,
      uniqueIndexCreated: uniqueIndex.created === true,
      syncActive,
      blockers: blockers.length
    },
    certificationGate: {
      unblockedByThisGate: passed,
      requiredNextProof: passed
        ? [
            "pnpm run truth:june10-benton-duplicate-parcel-adjudication",
            "pnpm run truth:june10-benton-projection-duplicate-root-cause",
            "pnpm run truth:benton-parcel-count-sanity",
            "pnpm run truth:washington-runtime-expansion-phase-a"
          ]
        : ["Wait for Sync terminal state and/or execute authorized repair until active duplicates are zero."]
    },
    authorization: {
      requiredToken: DEFAULT_AUTHORIZATION,
      provided: Boolean(input.authorizationToken),
      accepted: authorized
    },
    syncState: input.syncState ?? null,
    before,
    after,
    execution,
    uniqueIndex,
    blockers
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Benton Projection Uniqueness Repair Execution Gate",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Verdict: **${report.passed ? "PASS" : "FAIL"}**`,
    "",
    `Execution status: **${report.executionStatus}**`,
    "",
    "## Summary",
    "",
    `- Mode: ${report.summary.mode}`,
    `- Before duplicate groups: ${report.summary.beforeDuplicateGroups}`,
    `- Before extra active rows: ${report.summary.beforeExtraActiveRows}`,
    `- Before active distinct parcels: ${report.summary.beforeBentonActiveDistinctParcels}`,
    `- After duplicate groups: ${report.summary.afterDuplicateGroups ?? "not run"}`,
    `- After extra active rows: ${report.summary.afterExtraActiveRows ?? "not run"}`,
    `- After active distinct parcels: ${report.summary.afterBentonActiveDistinctParcels ?? "not run"}`,
    `- Loser rows superseded: ${report.summary.loserRowsSuperseded ?? "not run"}`,
    `- Repair run id: ${report.summary.repairRunId ?? "none"}`,
    `- Receipt written: ${report.summary.receiptWritten}`,
    `- Unique index exists: ${report.summary.uniqueIndexExists}`,
    `- Database mutation taken: ${report.databaseMutationTaken}`,
    `- Certification granted: ${report.certificationGranted}`,
    "",
    "## Authorization",
    "",
    `- Required token: \`${report.authorization.requiredToken}\``,
    `- Provided: ${report.authorization.provided}`,
    `- Accepted: ${report.authorization.accepted}`,
    "",
    "## Certification Gate",
    ""
  ];

  report.certificationGate.requiredNextProof.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) lines.push("- None");
  report.blockers.forEach((item) => lines.push(`- ${item.source}: ${item.message}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    inputPath: null,
    execute: false,
    authorizationToken: process.env.TF_BENTON_REPAIR_AUTHORIZATION ?? null,
    postgresContainer: DEFAULT_POSTGRES_CONTAINER,
    postgresUser: DEFAULT_POSTGRES_USER,
    postgresDatabase: DEFAULT_POSTGRES_DB,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (arg === "--execute") args.execute = true;
    else if (arg === "--authorization") args.authorizationToken = argv[++i];
    else if (arg === "--postgres-container") args.postgresContainer = argv[++i];
    else if (arg === "--postgres-user") args.postgresUser = argv[++i];
    else if (arg === "--postgres-db") args.postgresDatabase = argv[++i];
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

function collectFromInput(args) {
  const input = readJson(args.inputPath);
  return {
    ...input,
    mode: args.execute ? "execute" : input.mode ?? "observe",
    authorizationToken: args.authorizationToken ?? input.authorizationToken ?? null
  };
}

function collectLive(args) {
  const db = {
    container: args.postgresContainer,
    user: args.postgresUser,
    database: args.postgresDatabase
  };
  const beforeState = queryLiveState(db);
  const input = {
    generatedAtUtc: beforeState.generatedAtUtc,
    mode: args.execute ? "execute" : "observe",
    authorizationToken: args.authorizationToken,
    syncState: beforeState.syncState,
    before: beforeState.counts,
    after: null,
    execution: null,
    uniqueIndex: {
      exists: beforeState.uniqueIndex?.exists === true,
      created: false,
      error: null
    },
    error: null
  };

  if (!args.execute || asNumber(beforeState.syncState?.inProgressBatches) > 0 || !authorizationOk(args.authorizationToken)) {
    return input;
  }

  const runId = crypto.randomUUID();
  try {
    psql({ ...db, sql: buildRepairSql({ runId }), timeout: 180000 });
    let uniqueIndex = { exists: false, created: false, error: null };
    try {
      psql({ ...db, sql: buildUniqueIndexSql(), timeout: 360000 });
      psql({ ...db, sql: buildReceiptIndexUpdateSql({ runId }), timeout: 30000 });
      uniqueIndex = { exists: true, created: true, error: null };
    } catch (error) {
      uniqueIndex = { exists: false, created: false, error: error.message };
    }

    const afterState = queryLiveState(db);
    const receipt = queryReceipt({ ...db, runId });
    return {
      ...input,
      generatedAtUtc: new Date().toISOString(),
      syncState: afterState.syncState,
      after: afterState.counts,
      execution: receipt,
      uniqueIndex: {
        exists: afterState.uniqueIndex?.exists === true || uniqueIndex.exists,
        created: uniqueIndex.created,
        error: uniqueIndex.error
      }
    };
  } catch (error) {
    const afterState = queryLiveState(db);
    return {
      ...input,
      generatedAtUtc: new Date().toISOString(),
      syncState: afterState.syncState,
      after: afterState.counts,
      error: error.message
    };
  }
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const input = args.inputPath ? collectFromInput(args) : collectLive(args);
  const report = buildBentonProjectionUniquenessRepairExecution(input);

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
        executionStatus: report.executionStatus,
        beforeDuplicateGroups: report.summary.beforeDuplicateGroups,
        afterDuplicateGroups: report.summary.afterDuplicateGroups,
        databaseMutationTaken: report.databaseMutationTaken,
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
