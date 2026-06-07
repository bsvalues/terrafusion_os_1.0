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

const DEFAULT_OUT_JSON = path.join(evidenceRoot, "j10-benton-owner-runtime-proof.latest.json");
const DEFAULT_OUT_MD = path.join(evidenceRoot, "j10-benton-owner-runtime-proof.latest.md");
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

function runPsqlJson(sql, { timeoutMs = 120000 } = {}) {
  const seconds = Math.max(1, Math.floor(timeoutMs / 1000) - 2);
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

function collectLiveObservations() {
  return {
    truthOwner: runPsqlJson(`SELECT json_build_object(
  'rows', COUNT(*)::bigint,
  'distinctRows', COUNT(DISTINCT "PropId"::text || ':' || "OwnerTaxYr"::text || ':' || "SupNum"::text || ':' || "OwnerId"::text)::bigint
)::text
FROM ${OWNER_CURRENT};`, { timeoutMs: 150000 }),
    canonicalOwner: runPsqlJson(`SELECT json_build_object(
  'rows', COUNT(*)::bigint,
  'distinctIds', COUNT(DISTINCT "TfOwnerId")::bigint,
  'nullAcctId', COUNT(*) FILTER (WHERE "AcctId" IS NULL)::bigint,
  'blankDisplayName', COUNT(*) FILTER (WHERE NULLIF(btrim("DisplayName"), '') IS NULL)::bigint
)::text
FROM canonical_tf.tf_owner;`, { timeoutMs: 90000 }),
    ownerLink: runPsqlJson(`SELECT json_build_object(
  'rows', COUNT(*)::bigint
)::text
FROM canonical_tf.tf_parcel_owner_link;`, { timeoutMs: 150000 }),
    wsdorTruth: runPsqlJson(`SELECT json_build_object(
  'rows', COUNT(*)::bigint,
  'distinctRows', COUNT(DISTINCT "PropId"::text || ':' || "PropValYr"::text || ':' || "SupNum"::text)::bigint
)::text
FROM ${OWNER_VALUE};`, { timeoutMs: 150000 }),
    wsdorCanonical: runPsqlJson(`SELECT json_build_object(
  'rows', COUNT(*)::bigint
)::text
FROM canonical_tf.tf_assessment_wsdor;`, { timeoutMs: 90000 }),
    statusCounts: runPsqlJson(`SELECT COALESCE(json_object_agg(status_value, status_count), '{}'::json)::text
FROM (
  SELECT "Status" AS status_value, COUNT(*)::bigint AS status_count
  FROM sync_bridge.load_batch
  WHERE lower(coalesce("SourceSystem", '')) LIKE '%owner%'
     OR lower(coalesce("SourceSystem", '')) LIKE '%wpov%'
     OR lower(coalesce("SourceSystem", '')) LIKE '%wsdor%'
  GROUP BY "Status"
) statuses;`, { timeoutMs: 30000 })
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

export function buildOwnerRuntimeProofPacket({
  generatedAt = new Date().toISOString(),
  observations = {}
} = {}) {
  const truthOwner = observationValue(observations, "truthOwner");
  const canonicalOwner = observationValue(observations, "canonicalOwner");
  const ownerLink = observationValue(observations, "ownerLink");
  const wsdorTruth = observationValue(observations, "wsdorTruth");
  const wsdorCanonical = observationValue(observations, "wsdorCanonical");
  const statusCounts = observationValue(observations, "statusCounts") ?? {};
  const blockedProbes = blockedProbeKeys(observations);
  const failedBatches = normalizeCount(statusCounts.FAILED) ?? 0;

  const truthDuplication = ratioText(truthOwner?.rows, truthOwner?.distinctRows);
  const wsdorDuplication = ratioText(wsdorTruth?.rows, wsdorTruth?.distinctRows);
  const blockers = [];
  if (blockedProbes.length > 0) blockers.push(`Read-only probes blocked: ${blockedProbes.join(", ")}.`);
  if ((normalizeCount(truthOwner?.rows) ?? 0) <= 0) blockers.push("Owner truth rows are missing.");
  if (truthDuplication !== "1.0000x") blockers.push("Owner truth duplication is not 1.0000x.");
  if ((normalizeCount(canonicalOwner?.rows) ?? 0) <= 0) blockers.push("Canonical owner rows are missing.");
  if (normalizeCount(canonicalOwner?.rows) !== normalizeCount(canonicalOwner?.distinctIds)) {
    blockers.push("Canonical owner identity is not distinct.");
  }
  if ((normalizeCount(canonicalOwner?.nullAcctId) ?? 0) > 0) blockers.push("Canonical owner account IDs contain nulls.");
  if ((normalizeCount(canonicalOwner?.blankDisplayName) ?? 0) > 0) blockers.push("Canonical owner display names contain blanks.");
  if ((normalizeCount(ownerLink?.rows) ?? 0) <= 0) blockers.push("Parcel-owner link rows are missing.");
  if (failedBatches > 0) blockers.push("Owner-related failed load batches exist.");

  const runtimeProven = blockers.length === 0;
  const wsdorStatus = wsdorDuplication === "1.0000x"
    ? normalizeCount(wsdorCanonical?.rows) === normalizeCount(wsdorTruth?.rows)
      ? "WSDOR_CANONICAL_COMPLETE"
      : "WSDOR_CANONICAL_CONTINUING"
    : "WSDOR_TRUTH_NOT_PROVEN";

  const packet = {
    generatedAt,
    name: "Benton Owner Runtime Proof",
    productionTouched: false,
    databaseMutation: false,
    activeSyncTouched: false,
    runtimeProven,
    verdict: runtimeProven ? "BENTON_OWNER_RUNTIME_TRUTH_PROVEN" : "BENTON_OWNER_RUNTIME_BLOCKED",
    scope: "Benton canonical owner-current read runtime",
    metrics: {
      truthOwnerRows: normalizeCount(truthOwner?.rows),
      truthOwnerDistinctRows: normalizeCount(truthOwner?.distinctRows),
      truthOwnerDuplication: truthDuplication,
      canonicalOwnerRows: normalizeCount(canonicalOwner?.rows),
      canonicalOwnerDistinctIds: normalizeCount(canonicalOwner?.distinctIds),
      canonicalOwnerNullAcctId: normalizeCount(canonicalOwner?.nullAcctId),
      canonicalOwnerBlankDisplayName: normalizeCount(canonicalOwner?.blankDisplayName),
      ownerLinkRows: normalizeCount(ownerLink?.rows),
      wsdorTruthRows: normalizeCount(wsdorTruth?.rows),
      wsdorTruthDistinctRows: normalizeCount(wsdorTruth?.distinctRows),
      wsdorTruthDuplication: wsdorDuplication,
      wsdorCanonicalRows: normalizeCount(wsdorCanonical?.rows),
      failedBatches
    },
    ownerReadiness: {
      status: runtimeProven ? "OWNER_CURRENT_RUNTIME_PROVEN" : "OWNER_RUNTIME_BLOCKED",
      readReady: runtimeProven,
      sealStatus: runtimeProven ? "SEALED_OWNER_CURRENT_TRUTH" : "NOT_SEAL_READY",
      explanation: runtimeProven
        ? "Owner-current truth is complete and duplicate-free; canonical owner and parcel-owner link runtime rows are present."
        : "Owner runtime proof is blocked until all required read-only probes and owner integrity checks pass."
    },
    wsdorStatus,
    wsdorExplanation: wsdorStatus === "WSDOR_CANONICAL_CONTINUING"
      ? "WSDOR truth is duplicate-free, but canonical WSDOR projection is still below truth count; this does not block owner-current runtime proof."
      : null,
    statusCounts,
    blockedProbes,
    probeErrors: Object.fromEntries(
      Object.entries(observations)
        .filter(([, result]) => result && result.ok === false)
        .map(([key, result]) => [key, result.error])
    ),
    blockers,
    forbiddenClaims: [
      "production readiness",
      "full statewide certification",
      "WSDOR canonical completion unless WSDOR counts match",
      "owner write readiness"
    ],
    nextAction: runtimeProven
      ? "update_benton_board_owner_sealed_runtime_proven"
      : "classify_owner_runtime_blocker"
  };
  packet.packetHash = sha256Text(JSON.stringify(packet));
  return packet;
}

function markdown(packet) {
  const blockers = packet.blockers.length > 0 ? packet.blockers.map((item) => `- ${item}`).join("\n") : "- none";
  return `# Benton Owner Runtime Proof

Generated: ${packet.generatedAt}

Verdict: **${packet.verdict}**

Runtime proven: ${packet.runtimeProven}

Production touched: ${packet.productionTouched}

Mutation: ${packet.databaseMutation}

## Metrics

- Truth owner rows: ${packet.metrics.truthOwnerRows ?? "unavailable"}
- Truth owner duplication: ${packet.metrics.truthOwnerDuplication ?? "unavailable"}
- Canonical owner rows: ${packet.metrics.canonicalOwnerRows ?? "unavailable"}
- Owner link rows: ${packet.metrics.ownerLinkRows ?? "unavailable"}
- WSDOR truth rows: ${packet.metrics.wsdorTruthRows ?? "unavailable"}
- WSDOR truth duplication: ${packet.metrics.wsdorTruthDuplication ?? "unavailable"}
- WSDOR canonical rows: ${packet.metrics.wsdorCanonicalRows ?? "unavailable"}
- Failed owner-related batches: ${packet.metrics.failedBatches}

## Readiness

- Owner readiness: ${packet.ownerReadiness.status}
- Owner seal status: ${packet.ownerReadiness.sealStatus}
- WSDOR status: ${packet.wsdorStatus}

## Blockers

${blockers}

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
  const packet = buildOwnerRuntimeProofPacket({ observations: collectLiveObservations() });
  writePacket({ packet, outJson, outMd });
  console.log(`[j10-benton-owner-runtime-proof] wrote ${rel(outJson)}`);
  console.log(JSON.stringify({
    verdict: packet.verdict,
    runtimeProven: packet.runtimeProven,
    truthOwnerRows: packet.metrics.truthOwnerRows,
    truthOwnerDuplication: packet.metrics.truthOwnerDuplication,
    canonicalOwnerRows: packet.metrics.canonicalOwnerRows,
    ownerLinkRows: packet.metrics.ownerLinkRows,
    wsdorStatus: packet.wsdorStatus,
    blockers: packet.blockers,
    packetHash: packet.packetHash
  }));
  if (!packet.runtimeProven) process.exitCode = 1;
}

if (isCliMain()) {
  main();
}
