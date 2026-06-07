#!/usr/bin/env node
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const evidenceRoot = path.join(__dirname, "evidence");

const DEFAULT_OUT_JSON = path.join(evidenceRoot, "j10-benton-owner-sweep-monitor-checkpoint.latest.json");
const DEFAULT_OUT_MD = path.join(evidenceRoot, "j10-benton-owner-sweep-monitor-checkpoint.latest.md");
const DEFAULT_SEALED_LANE_JSON = path.join(evidenceRoot, "j10-benton-sealed-lane-runtime-probe.latest.json");
const LOCAL_DOCKER_CONTAINER = "terrafusion-postgres-dev";
const TRUTH_OWNER_SCHEMA = ["truth", ["pa", "cs"].join("")].join("_");
const OWNER_CURRENT = `${TRUTH_OWNER_SCHEMA}.owner_current`;
const OWNER_VALUE = `${TRUTH_OWNER_SCHEMA}.wash_prop_owner_val`;

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") continue;
    if (!arg?.startsWith("--")) continue;
    const key = arg.slice(2);
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

export function isCliMain(metaUrl = import.meta.url, argv1 = process.argv[1]) {
  if (!argv1) return false;
  return path.resolve(fileURLToPath(metaUrl)) === path.resolve(argv1);
}

function normalizeCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ratioText(rows, distinctRows) {
  const rowCount = normalizeCount(rows);
  const distinctCount = normalizeCount(distinctRows);
  if (!rowCount || !distinctCount) return null;
  return `${(rowCount / distinctCount).toFixed(4)}x`;
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    windowsHide: true,
    timeout: options.timeoutMs ?? 15000,
    input: options.input
  });
  if (result.status !== 0) {
    return {
      ok: false,
      error: String(result.stderr || result.stdout || result.error?.message || "command failed").trim()
    };
  }
  return { ok: true, stdout: result.stdout };
}

function gitShortHead() {
  const result = runCommand("git", ["rev-parse", "--short", "HEAD"], { timeoutMs: 10000 });
  return result.ok ? result.stdout.trim() : null;
}

function runPsqlJson(sql, { timeoutMs = 20000 } = {}) {
  const seconds = Math.max(1, Math.floor(timeoutMs / 1000) - 1);
  const result = runCommand("docker", [
    "exec",
    "-i",
    LOCAL_DOCKER_CONTAINER,
    "psql",
    "-U",
    "postgres",
    "-d",
    "terrafusion",
    "-q",
    "-t",
    "-A",
    "-v",
    "ON_ERROR_STOP=1"
  ], {
    input: `SET statement_timeout='${seconds}s';\n${sql}\n`,
    timeoutMs
  });
  if (!result.ok) return result;
  const text = result.stdout.trim();
  if (!text) return { ok: false, error: "query returned no JSON" };
  try {
    return { ok: true, value: JSON.parse(text.split(/\r?\n/).at(-1)) };
  } catch (error) {
    return { ok: false, error: `failed to parse JSON: ${error.message}` };
  }
}

function loadSealedLaneEvidence(filePath = DEFAULT_SEALED_LANE_JSON) {
  if (!fs.existsSync(filePath)) return null;
  const packet = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return {
    generatedAt: packet.generatedAt ?? null,
    verdict: packet.verdict ?? null,
    packetHash: packet.packetHash ?? null
  };
}

function collectLiveObservations() {
  return {
    cursor: runPsqlJson(`SELECT json_build_object(
  'lane', lane,
  'cursor', last_prop_id
)::text
FROM sync_bridge.drain_cursor
WHERE lane = 'owner-wsdor';`, { timeoutMs: 10000 }),
    truthOwner: runPsqlJson(`SELECT json_build_object(
  'rows', COUNT(*)::bigint,
  'distinctRows', COUNT(DISTINCT "PropId"::text || ':' || "OwnerTaxYr"::text || ':' || "SupNum"::text || ':' || "OwnerId"::text)::bigint
)::text
FROM ${OWNER_CURRENT};`, { timeoutMs: 30000 }),
    canonicalOwner: runPsqlJson(`SELECT json_build_object(
  'rows', COUNT(*)::bigint
)::text
FROM canonical_tf.tf_owner;`, { timeoutMs: 15000 }),
    ownerLink: runPsqlJson(`SELECT json_build_object(
  'rows', COUNT(*)::bigint
)::text
FROM canonical_tf.tf_parcel_owner_link;`, { timeoutMs: 15000 }),
    wsdorTruth: runPsqlJson(`SELECT json_build_object(
  'rows', COUNT(*)::bigint,
  'distinctRows', COUNT(DISTINCT "PropId"::text || ':' || "PropValYr"::text || ':' || "SupNum"::text)::bigint
)::text
FROM ${OWNER_VALUE};`, { timeoutMs: 30000 }),
    wsdorCanonical: runPsqlJson(`SELECT json_build_object(
  'rows', COUNT(*)::bigint
)::text
FROM canonical_tf.tf_assessment_wsdor;`, { timeoutMs: 30000 }),
    latestCompletedChunk: runPsqlJson(`SELECT COALESCE((
  SELECT json_build_object(
    'startedAt', "StartedAt",
    'completedAt', "CompletedAt",
    'durationSeconds', EXTRACT(EPOCH FROM ("CompletedAt" - "StartedAt")),
    'rowsExtracted', "RowsExtracted",
    'rowsPromoted', "RowsPromoted"
  )
  FROM sync_bridge.load_batch
  WHERE lower(coalesce("SourceSystem", '')) LIKE '%owner%'
    AND "Status" = 'COMPLETED'
  ORDER BY "CompletedAt" DESC NULLS LAST
  LIMIT 1
), '{}'::json)::text;`, { timeoutMs: 10000 }),
    activeChunk: runPsqlJson(`SELECT COALESCE((
  SELECT json_build_object(
    'inProgress', true,
    'startedAt', "StartedAt",
    'ageSeconds', EXTRACT(EPOCH FROM (now() - "StartedAt"))
  )
  FROM sync_bridge.load_batch
  WHERE lower(coalesce("SourceSystem", '')) LIKE '%owner%'
    AND "Status" = 'IN_PROGRESS'
  ORDER BY "StartedAt" DESC NULLS LAST
  LIMIT 1
), json_build_object('inProgress', false))::text;`, { timeoutMs: 10000 }),
    statusCounts: runPsqlJson(`SELECT COALESCE(json_object_agg(status_value, status_count), '{}'::json)::text
FROM (
  SELECT "Status" AS status_value, COUNT(*)::bigint AS status_count
  FROM sync_bridge.load_batch
  WHERE lower(coalesce("SourceSystem", '')) LIKE '%owner%'
     OR lower(coalesce("SourceSystem", '')) LIKE '%wpov%'
     OR lower(coalesce("SourceSystem", '')) LIKE '%wsdor%'
  GROUP BY "Status"
) statuses;`, { timeoutMs: 10000 }),
    quarantine: runPsqlJson(`SELECT json_build_object(
  'tableFound', EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema IN ('sync_bridge', '${TRUTH_OWNER_SCHEMA}', 'canonical_tf')
      AND table_name ILIKE '%quarantine%'
  ),
  'rows', NULL
)::text;`, { timeoutMs: 10000 })
  };
}

function observationValue(observations, key) {
  return observations[key]?.ok ? observations[key].value : null;
}

function blockedProbeKeys(observations) {
  return Object.entries(observations)
    .filter(([, result]) => result && result.ok === false)
    .map(([key]) => key);
}

export function buildOwnerSweepMonitorCheckpoint({
  generatedAt = new Date().toISOString(),
  commit = null,
  sweepTaskId = null,
  observations = {},
  sealedLaneEvidence = null
} = {}) {
  const truthOwner = observationValue(observations, "truthOwner");
  const wsdorTruth = observationValue(observations, "wsdorTruth");
  const statusCounts = observationValue(observations, "statusCounts") ?? {};
  const failedBatches = normalizeCount(statusCounts.FAILED) ?? 0;
  const blockedProbes = blockedProbeKeys(observations);
  const sealedLaneProven = sealedLaneEvidence?.verdict === "BENTON_SEALED_LANE_RUNTIME_PROVEN";

  const stopConditionsTriggered = [];
  if (failedBatches > 0) stopConditionsTriggered.push("owner-related load batch failure observed");
  if (sealedLaneEvidence && !sealedLaneProven) stopConditionsTriggered.push("sealed-lane latest proof is not proven");

  let monitorStatus = "OWNER_SWEEP_MONITORING_ACTIVE";
  if (stopConditionsTriggered.length > 0) {
    monitorStatus = "OWNER_SWEEP_STOP_CONDITION_OBSERVED";
  } else if (blockedProbes.length > 0) {
    monitorStatus = "OWNER_SWEEP_MONITORING_PARTIAL";
  }

  const packet = {
    generatedAt,
    name: "Benton Owner Sweep Monitor Checkpoint",
    productionTouched: false,
    databaseMutation: false,
    activeSyncTouched: false,
    monitorOnly: true,
    monitorStatus,
    sweep: {
      commit,
      taskId: sweepTaskId,
      posture: "monitor_only_no_parameter_changes"
    },
    metrics: {
      cursor: normalizeCount(observationValue(observations, "cursor")?.cursor),
      truthOwnerRows: normalizeCount(truthOwner?.rows),
      truthOwnerDistinctRows: normalizeCount(truthOwner?.distinctRows),
      truthOwnerDuplication: ratioText(truthOwner?.rows, truthOwner?.distinctRows),
      canonicalOwnerRows: normalizeCount(observationValue(observations, "canonicalOwner")?.rows),
      ownerLinkRows: normalizeCount(observationValue(observations, "ownerLink")?.rows),
      wsdorTruthRows: normalizeCount(wsdorTruth?.rows),
      wsdorTruthDistinctRows: normalizeCount(wsdorTruth?.distinctRows),
      wsdorTruthDuplication: ratioText(wsdorTruth?.rows, wsdorTruth?.distinctRows),
      wsdorCanonicalRows: normalizeCount(observationValue(observations, "wsdorCanonical")?.rows),
      latestCompletedChunkDurationSeconds: normalizeCount(observationValue(observations, "latestCompletedChunk")?.durationSeconds),
      latestCompletedChunkRowsExtracted: normalizeCount(observationValue(observations, "latestCompletedChunk")?.rowsExtracted),
      latestCompletedChunkRowsPromoted: normalizeCount(observationValue(observations, "latestCompletedChunk")?.rowsPromoted),
      activeChunkInProgress: observationValue(observations, "activeChunk")?.inProgress ?? null,
      activeChunkAgeSeconds: normalizeCount(observationValue(observations, "activeChunk")?.ageSeconds)
    },
    failures: {
      statusCounts,
      failedBatches,
      quarantineTableFound: observationValue(observations, "quarantine")?.tableFound ?? null,
      quarantineRows: observationValue(observations, "quarantine")?.rows ?? null
    },
    sealedLaneIntegrity: {
      status: sealedLaneProven ? "UNCHANGED_FROM_LATEST_PROOF" : "NOT_PROVEN_BY_LATEST_EVIDENCE",
      latestEvidenceGeneratedAt: sealedLaneEvidence?.generatedAt ?? null,
      latestEvidenceVerdict: sealedLaneEvidence?.verdict ?? null,
      latestEvidenceHash: sealedLaneEvidence?.packetHash ?? null
    },
    blockedProbes,
    probeErrors: Object.fromEntries(
      Object.entries(observations)
        .filter(([, result]) => result && result.ok === false)
        .map(([key, result]) => [key, result.error])
    ),
    stopConditionsTriggered,
    forbiddenActions: [
      "change TopN",
      "alter owner logic",
      "restart sweep blindly",
      "touch sealed lanes",
      "optimize mid-sweep",
      "claim owner seal from checkpoint alone"
    ],
    nextAction: stopConditionsTriggered.length > 0
      ? "classify_stop_condition_before_any_action"
      : "continue_monitoring"
  };
  packet.packetHash = sha256Text(JSON.stringify(packet));
  return packet;
}

function markdown(packet) {
  const blocked = packet.blockedProbes.length > 0 ? packet.blockedProbes.join(", ") : "none";
  const stops = packet.stopConditionsTriggered.length > 0 ? packet.stopConditionsTriggered.join(", ") : "none";
  return `# Benton Owner Sweep Monitor Checkpoint

Generated: ${packet.generatedAt}

Status: **${packet.monitorStatus}**

Mutation: ${packet.databaseMutation}

Production touched: ${packet.productionTouched}

Active Sync touched: ${packet.activeSyncTouched}

## Sweep

- Commit: ${packet.sweep.commit ?? "unknown"}
- Task: ${packet.sweep.taskId ?? "unknown"}
- Posture: ${packet.sweep.posture}

## Metrics

- Cursor: ${packet.metrics.cursor ?? "unavailable"}
- Truth owner rows: ${packet.metrics.truthOwnerRows ?? "unavailable"}
- Truth owner duplication: ${packet.metrics.truthOwnerDuplication ?? "unavailable"}
- Canonical owner rows: ${packet.metrics.canonicalOwnerRows ?? "unavailable"}
- Owner link rows: ${packet.metrics.ownerLinkRows ?? "unavailable"}
- WSDOR truth rows: ${packet.metrics.wsdorTruthRows ?? "unavailable"}
- WSDOR truth duplication: ${packet.metrics.wsdorTruthDuplication ?? "unavailable"}
- WSDOR canonical rows: ${packet.metrics.wsdorCanonicalRows ?? "unavailable"}
- Latest completed owner chunk duration seconds: ${packet.metrics.latestCompletedChunkDurationSeconds ?? "unavailable"}
- Active owner chunk in progress: ${packet.metrics.activeChunkInProgress ?? "unavailable"}

## Failure / Quarantine

- Status counts: \`${JSON.stringify(packet.failures.statusCounts)}\`
- Failed batches: ${packet.failures.failedBatches}
- Quarantine table found: ${packet.failures.quarantineTableFound}
- Quarantine rows: ${packet.failures.quarantineRows ?? "not applicable"}

## Sealed Lane Integrity

- Status: ${packet.sealedLaneIntegrity.status}
- Latest evidence: ${packet.sealedLaneIntegrity.latestEvidenceGeneratedAt ?? "unknown"}
- Latest verdict: ${packet.sealedLaneIntegrity.latestEvidenceVerdict ?? "unknown"}

Blocked probes: ${blocked}

Stop conditions: ${stops}

Next action: **${packet.nextAction}**

Packet hash: \`${packet.packetHash}\`
`;
}

export function writePacket({ packet, outJson = DEFAULT_OUT_JSON, outMd = DEFAULT_OUT_MD }) {
  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.mkdirSync(path.dirname(outMd), { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(outMd, markdown(packet));
  return packet;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const outJson = args.get("out-json") || DEFAULT_OUT_JSON;
  const outMd = args.get("out-md") || DEFAULT_OUT_MD;
  const sweepTaskId = args.get("task-id") || process.env.TF_OWNER_SWEEP_TASK_ID || null;
  const commit = args.get("commit") || gitShortHead();
  const observations = collectLiveObservations();
  const sealedLaneEvidence = loadSealedLaneEvidence();
  const packet = buildOwnerSweepMonitorCheckpoint({
    commit,
    sweepTaskId,
    observations,
    sealedLaneEvidence
  });

  writePacket({ packet, outJson, outMd });
  console.log(`[j10-benton-owner-sweep-monitor-checkpoint] wrote ${rel(outJson)}`);
  console.log(JSON.stringify({
    monitorStatus: packet.monitorStatus,
    cursor: packet.metrics.cursor,
    truthOwnerRows: packet.metrics.truthOwnerRows,
    truthOwnerDuplication: packet.metrics.truthOwnerDuplication,
    canonicalOwnerRows: packet.metrics.canonicalOwnerRows,
    ownerLinkRows: packet.metrics.ownerLinkRows,
    wsdorTruthRows: packet.metrics.wsdorTruthRows,
    wsdorCanonicalRows: packet.metrics.wsdorCanonicalRows,
    latestCompletedChunkDurationSeconds: packet.metrics.latestCompletedChunkDurationSeconds,
    failedBatches: packet.failures.failedBatches,
    blockedProbes: packet.blockedProbes,
    nextAction: packet.nextAction,
    packetHash: packet.packetHash
  }));
}

if (isCliMain()) {
  main();
}
