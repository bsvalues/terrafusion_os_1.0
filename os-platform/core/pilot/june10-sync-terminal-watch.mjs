#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_API_HEALTH_URL = "http://localhost:5046/health";
const DEFAULT_POSTGRES_CONTAINER = "terrafusion-postgres-dev";
const DEFAULT_POSTGRES_USER = "postgres";
const DEFAULT_POSTGRES_DB = "terrafusion";
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-sync-terminal-watch.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-sync-terminal-watch.latest.md"
);

const DEFAULT_THRESHOLDS = {
  terminalQuietMinutes: 2,
  staleInProgressMinutes: 45,
  apiHealthTimeoutMs: 10000
};

const CERTIFICATION_COMMANDS = [
  "pnpm run truth:runtime-db-identity",
  "pnpm run truth:runtime-db-content",
  "pnpm run truth:benton-parcel-count-sanity",
  "pnpm run truth:terrafusion-db-product-load-ledger",
  "pnpm run truth:runtime-row-path-proof",
  "pnpm run truth:runtime-source-lineage",
  "pnpm run truth:runtime-sale-qualification",
  "pnpm run truth:benton-runtime-pilot-closure",
  "pnpm run truth:washington-runtime-expansion-phase-a",
  "pnpm run truth:june10-full-production-data-gate"
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function asNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseTime(value) {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function minutesBetween(later, earlier) {
  const laterMs = parseTime(later);
  const earlierMs = parseTime(earlier);
  if (laterMs === null || earlierMs === null) return null;
  return (laterMs - earlierMs) / 60000;
}

function blocker(source, message, evidence = null) {
  return { source, message, evidence };
}

function restartItem(name, status, detail) {
  return { name, status, detail, action: "manual_review_only" };
}

function isTerminalStatus(status) {
  return /^(COMPLETED|TERMINAL|SUCCEEDED|SUCCESS)$/i.test(String(status ?? ""));
}

function normalizeStatusCounts(counts) {
  const normalized = {};
  for (const [key, value] of Object.entries(counts ?? {})) {
    normalized[String(key).toUpperCase()] = asNumber(value);
  }
  return normalized;
}

function buildEscalations({ generatedAtUtc, syncState, thresholds }) {
  const escalations = [];
  const latestBatch = syncState?.latestBatch ?? null;
  const inProgress = asNumber(syncState?.inProgressBatches);

  if (inProgress <= 0 || String(latestBatch?.status ?? "").toUpperCase() !== "IN_PROGRESS") {
    return escalations;
  }

  const ageMinutes = minutesBetween(generatedAtUtc, latestBatch.startedAt);
  if (ageMinutes !== null && ageMinutes >= thresholds.staleInProgressMinutes) {
    escalations.push({
      reason: `Latest Sync batch age ${ageMinutes.toFixed(1)} minutes exceeds stale threshold ${thresholds.staleInProgressMinutes} minutes.`,
      operator: latestBatch.operator ?? null,
      startedAt: latestBatch.startedAt ?? null,
      requiredAction: "Inspect Sync worker logs and batch receipt before any runtime restart or certification rerun."
    });
  }

  return escalations;
}

function syncTerminalState({ generatedAtUtc, syncState, thresholds }) {
  const latestBatch = syncState?.latestBatch ?? null;
  const inProgress = asNumber(syncState?.inProgressBatches);
  const statusCounts = normalizeStatusCounts(syncState?.statusCounts);
  const quietMinutes = minutesBetween(generatedAtUtc, latestBatch?.completedAt);
  const latestTerminal = isTerminalStatus(latestBatch?.status);
  const terminal = inProgress === 0 && latestTerminal && quietMinutes !== null && quietMinutes >= thresholds.terminalQuietMinutes;

  return {
    terminal,
    inProgress,
    latestTerminal,
    quietMinutes,
    statusCounts
  };
}

function buildCleanRestartReadiness({ syncTerminal, apiHealthy, timeoutEscalationRequired }) {
  const items = [
    restartItem(
      "Sync terminal state",
      syncTerminal ? "green" : "blocked",
      syncTerminal
        ? "No active Sync batch is reported and latest batch is terminal."
        : "Do not restart runtime while Sync is active or terminal state is unproven."
    ),
    restartItem(
      "API health recovery required",
      apiHealthy ? "green" : "blocked",
      apiHealthy
        ? "API health is already green; no recovery restart needed."
        : "API health is not green. Prepare manual clean restart only after Sync terminal state is green."
    ),
    restartItem(
      "Timeout/escalation clearance",
      timeoutEscalationRequired ? "blocked" : "green",
      timeoutEscalationRequired
        ? "A stale Sync batch requires operator escalation before restart or certification."
        : "No stale Sync timeout escalation is required."
    ),
    restartItem(
      "Certification rerun guard",
      syncTerminal && apiHealthy && !timeoutEscalationRequired ? "green" : "blocked",
      "Certification commands are listed as triggers only; this watcher does not run them."
    )
  ];

  return { items };
}

export function buildJune10SyncTerminalWatch(input) {
  const generatedAtUtc = input.generatedAtUtc ?? new Date().toISOString();
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(input.thresholds ?? {}) };
  const syncState = input.syncState ?? {};
  const apiHealth = input.apiHealth ?? { ok: false, status: null, error: "missing API health probe" };
  const syncProbeAvailable = !syncState.error && Number.isFinite(syncState.inProgressBatches);
  const terminalState = syncTerminalState({ generatedAtUtc, syncState, thresholds });
  const apiHealthy = apiHealth.ok === true && apiHealth.status === 200;
  const escalations = buildEscalations({ generatedAtUtc, syncState, thresholds });
  const timeoutEscalationRequired = escalations.length > 0;
  const blockers = [];

  if (!terminalState.terminal) {
    blockers.push(
      blocker(
        "sync_terminal",
        "TerraFusion Sync terminal state is not proven.",
        `inProgress=${terminalState.inProgress}; latestStatus=${syncState.latestBatch?.status ?? "missing"}; quietMinutes=${terminalState.quietMinutes === null ? "unknown" : terminalState.quietMinutes.toFixed(1)}`
      )
    );
  }

  if (!syncProbeAvailable) {
    blockers.push(
      blocker(
        "sync_probe",
        "Sync/DB probe is unavailable; terminal state cannot be determined.",
        syncState.error ?? "inProgressBatches missing or non-numeric"
      )
    );
  }

  if (!apiHealthy) {
    blockers.push(
      blocker(
        "api_health",
        "API health is not green; runtime recovery may be needed after Sync is terminal.",
        `status=${apiHealth.status ?? "null"}; error=${apiHealth.error ?? "none"}`
      )
    );
  }

  if (timeoutEscalationRequired) {
    blockers.push(blocker("sync_timeout", "Sync timeout escalation is required before runtime recovery or certification.", escalations));
  }

  let watchStatus = "READY_FOR_BENTON_CERTIFICATION";
  if (!syncProbeAvailable) watchStatus = "DB_PROBE_UNAVAILABLE";
  else if (timeoutEscalationRequired) watchStatus = "ESCALATE_SYNC_TIMEOUT";
  else if (!terminalState.terminal) watchStatus = "SYNC_ACTIVE";
  else if (!apiHealthy) watchStatus = "API_RECOVERY_REQUIRED";

  const triggerReady = syncProbeAvailable && watchStatus === "READY_FOR_BENTON_CERTIFICATION";
  const cleanRestartReadiness = buildCleanRestartReadiness({
    syncTerminal: terminalState.terminal,
    apiHealthy,
    timeoutEscalationRequired
  });

  cleanRestartReadiness.items.unshift({
    name: "Sync/DB probe availability",
    status: syncProbeAvailable ? "green" : "blocked",
    detail: syncProbeAvailable
      ? "Sync/DB probe returned structured batch state."
      : "Sync/DB probe failed; recover Docker/Postgres visibility before any runtime certification decision.",
    action: "manual_review_only"
  });

  return {
    generatedAtUtc,
    slice: "June 10 Sync Terminal Watch",
    watchStatus,
    passed: triggerReady,
    runtimeActionTaken: false,
    databaseMutationTaken: false,
    summary: {
      syncProbeAvailable,
      syncTerminal: terminalState.terminal,
      inProgressBatches: terminalState.inProgress,
      latestBatchStatus: syncState.latestBatch?.status ?? null,
      latestBatchOperator: syncState.latestBatch?.operator ?? null,
      terminalQuietMinutes: terminalState.quietMinutes,
      apiHealthy,
      apiHealthStatus: apiHealth.status ?? null,
      timeoutEscalationRequired,
      blockers: blockers.length
    },
    syncState: {
      observedAtUtc: syncState.observedAtUtc ?? null,
      source: syncState.source ?? "unknown",
      statusCounts: terminalState.statusCounts,
      latestBatch: syncState.latestBatch ?? null,
      tableEstimates: syncState.tableEstimates ?? {}
    },
    apiHealth,
    thresholds,
    cleanRestartReadiness,
    certificationTrigger: {
      ready: triggerReady,
      conditions: [
        {
          name: "Sync terminal",
          passed: terminalState.terminal
        },
        {
          name: "API health green",
          passed: apiHealthy
        },
        {
          name: "No stale Sync timeout escalation",
          passed: !timeoutEscalationRequired
        }
      ],
      commands: triggerReady ? CERTIFICATION_COMMANDS : [],
      blockedCommands: triggerReady ? [] : CERTIFICATION_COMMANDS
    },
    escalations,
    blockers,
    guardrails: [
      "No runtime restart was performed.",
      "No database mutation was performed.",
      "No certification command was run by this watcher.",
      "Wave A counties remain out of scope for this watcher."
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Sync Terminal Watch",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Verdict: **${report.watchStatus}**`,
    "",
    "## Summary",
    "",
    `- Sync terminal: ${report.summary.syncTerminal}`,
    `- In-progress batches: ${report.summary.inProgressBatches}`,
    `- Latest batch status: ${report.summary.latestBatchStatus ?? "-"}`,
    `- Latest batch operator: ${report.summary.latestBatchOperator ?? "-"}`,
    `- API healthy: ${report.summary.apiHealthy}`,
    `- API status: ${report.summary.apiHealthStatus ?? "-"}`,
    `- Timeout escalation required: ${report.summary.timeoutEscalationRequired}`,
    `- Benton certification trigger ready: ${report.certificationTrigger.ready}`,
    "",
    "## Clean Restart Readiness",
    ""
  ];

  report.cleanRestartReadiness.items.forEach((item) => {
    lines.push(`- ${item.status}: ${item.name} - ${item.detail}`);
  });

  lines.push("", "## Certification Trigger Commands", "");
  if (report.certificationTrigger.commands.length === 0) {
    lines.push("- Blocked until all trigger conditions are green.");
  } else {
    report.certificationTrigger.commands.forEach((command) => lines.push(`- \`${command}\``));
  }

  lines.push("", "## Escalations", "");
  if (report.escalations.length === 0) lines.push("- None");
  else report.escalations.forEach((item) => lines.push(`- ${item.reason}`));

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) lines.push("- None");
  else report.blockers.forEach((item) => lines.push(`- ${item.source}: ${item.message} (${item.evidence ?? "-"})`));

  lines.push("", "## Guardrails", "");
  report.guardrails.forEach((item) => lines.push(`- ${item}`));

  return `${lines.join("\n")}\n`;
}

function queryLiveSyncState({ container, user, database }) {
  const query = `
set statement_timeout = '15s';
with latest_batch as (
  select "Operator", "Status", "StartedAt", "CompletedAt", "RowsPromoted"
  from sync_bridge.load_batch
  order by coalesce("CompletedAt", "StartedAt") desc nulls last
  limit 1
),
status_counts as (
  select coalesce(jsonb_object_agg("Status", count), '{}'::jsonb) as counts
  from (
    select "Status", count(*)::int as count
    from sync_bridge.load_batch
    group by "Status"
  ) s
),
table_estimates as (
  select coalesce(jsonb_object_agg(table_name, estimated_rows), '{}'::jsonb) as estimates
  from (
    select n.nspname || '.' || c.relname as table_name, c.reltuples::bigint as estimated_rows
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('legacy_pacs_raw','truth_pacs','canonical_tf','sync_bridge')
      and c.relkind = 'r'
      and c.relname in ('owner','parcel_spine','tf_parcel','tf_sale','tf_improvement','tf_improvement_feature','load_batch')
  ) t
)
select jsonb_build_object(
  'observedAtUtc', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'source', 'docker:psql',
  'inProgressBatches', (select count(*)::int from sync_bridge.load_batch where "Status" = 'IN_PROGRESS'),
  'latestBatch', (
    select jsonb_build_object(
      'operator', "Operator",
      'status', "Status",
      'startedAt', to_char("StartedAt" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'completedAt', case when "CompletedAt" is null then null else to_char("CompletedAt" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end,
      'rowsPromoted', "RowsPromoted"
    )
    from latest_batch
  ),
  'statusCounts', (select counts from status_counts),
  'tableEstimates', (select estimates from table_estimates)
)::text;
`;

  const output = execFileSync(
    "docker",
    ["exec", "-i", container, "psql", "-U", user, "-d", database, "-t", "-A", "-v", "ON_ERROR_STOP=1"],
    {
      input: query,
      encoding: "utf8",
      timeout: 30000
    }
  );

  return JSON.parse(output.trim().split(/\r?\n/).at(-1));
}

async function probeApiHealth(url, timeoutMs) {
  const checkedAtUtc = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return {
      checkedAtUtc,
      url,
      status: response.status,
      ok: response.ok,
      error: null
    };
  } catch (error) {
    return {
      checkedAtUtc,
      url,
      status: null,
      ok: false,
      error: error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

function parseArgs(argv) {
  const args = {
    inputPath: null,
    apiHealthUrl: DEFAULT_API_HEALTH_URL,
    postgresContainer: DEFAULT_POSTGRES_CONTAINER,
    postgresUser: DEFAULT_POSTGRES_USER,
    postgresDatabase: DEFAULT_POSTGRES_DB,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    terminalQuietMinutes: DEFAULT_THRESHOLDS.terminalQuietMinutes,
    staleInProgressMinutes: DEFAULT_THRESHOLDS.staleInProgressMinutes,
    apiHealthTimeoutMs: DEFAULT_THRESHOLDS.apiHealthTimeoutMs,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (arg === "--api-health-url") args.apiHealthUrl = argv[++i];
    else if (arg === "--postgres-container") args.postgresContainer = argv[++i];
    else if (arg === "--postgres-user") args.postgresUser = argv[++i];
    else if (arg === "--postgres-db") args.postgresDatabase = argv[++i];
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--terminal-quiet-minutes") args.terminalQuietMinutes = Number(argv[++i]);
    else if (arg === "--stale-in-progress-minutes") args.staleInProgressMinutes = Number(argv[++i]);
    else if (arg === "--api-health-timeout-ms") args.apiHealthTimeoutMs = Number(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

async function collectInput(args) {
  if (args.inputPath) return readJson(args.inputPath);

  const thresholds = {
    terminalQuietMinutes: args.terminalQuietMinutes,
    staleInProgressMinutes: args.staleInProgressMinutes,
    apiHealthTimeoutMs: args.apiHealthTimeoutMs
  };

  let syncState;
  try {
    syncState = queryLiveSyncState({
      container: args.postgresContainer,
      user: args.postgresUser,
      database: args.postgresDatabase
    });
  } catch (error) {
    syncState = {
      observedAtUtc: new Date().toISOString(),
      source: "docker:psql",
      inProgressBatches: null,
      latestBatch: null,
      statusCounts: {},
      tableEstimates: {},
      error: error.message
    };
  }

  return {
    generatedAtUtc: new Date().toISOString(),
    syncState,
    apiHealth: await probeApiHealth(args.apiHealthUrl, thresholds.apiHealthTimeoutMs),
    thresholds
  };
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const input = await collectInput(args);
  const report = buildJune10SyncTerminalWatch(input);

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.mkdirSync(path.dirname(args.outMd), { recursive: true });
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        watchStatus: report.watchStatus,
        passed: report.passed,
        syncTerminal: report.summary.syncTerminal,
        apiHealthy: report.summary.apiHealthy,
        blockers: report.summary.blockers,
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
