#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "benton-sync-drain-state-evidence.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "benton-sync-drain-state-evidence.md"
);

export const DB_COUNT_QUERIES = {
  legacyProperty: 'SELECT count(*) FROM legacy_pacs_raw.property;',
  legacyOwner: 'SELECT count(*) FROM legacy_pacs_raw.owner;',
  legacyPropSuppAssoc: 'SELECT count(*) FROM legacy_pacs_raw.prop_supp_assoc;',
  legacyWashPropOwnerVal: 'SELECT count(*) FROM legacy_pacs_raw.wash_prop_owner_val;',
  legacyAccount: 'SELECT count(*) FROM legacy_pacs_raw.account;',
  truthParcel: 'SELECT count(*) FROM truth_pacs.parcel_spine;',
  truthOwner: 'SELECT count(*) FROM truth_pacs.owner_current;',
  truthWsdor: 'SELECT count(*) FROM truth_pacs.wash_prop_owner_val;',
  canonicalParcel: 'SELECT count(*) FROM canonical_tf.tf_parcel;',
  canonicalOwner: 'SELECT count(*) FROM canonical_tf.tf_owner;',
  canonicalWsdor: 'SELECT count(*) FROM canonical_tf.tf_assessment_wsdor;',
  gisParcelGeometry: 'SELECT count(*) FROM gis_tf.tf_parcel_geom;'
};

export const LATEST_LOAD_BATCH_QUERY = `
SELECT
  "LoadBatchId"::text AS load_batch_id,
  COALESCE("Operator"::text, 'UNKNOWN') AS stage,
  COALESCE("Status"::text, 'UNKNOWN') AS status
FROM sync_bridge.load_batch
ORDER BY "StartedAt" DESC
LIMIT 1;
`;

export const LATEST_OWNER_SUPNUM_FAILURE_QUERY = `
SELECT
  "LoadBatchId"::text AS load_batch_id,
  COALESCE("Operator"::text, 'UNKNOWN') AS stage,
  COALESCE("Status"::text, 'UNKNOWN') AS status
FROM sync_bridge.load_batch
WHERE "Operator" ILIKE 'owner-supnum%'
  AND "Status" = 'FAILED'
ORDER BY "StartedAt" DESC
LIMIT 1;
`;

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function processAlive(pid) {
  if (!pid) return null;
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

async function probeBackendHealth(apiBases) {
  for (const rawBase of apiBases) {
    const base = String(rawBase ?? "").replace(/\/$/, "");
    if (!base) continue;
    for (const route of ["/health", "/api/health"]) {
      const url = `${base}${route}`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (response.ok) return { status: "healthy", ok: true, statusCode: response.status, url };
      } catch {
        // Probe next route/base.
      }
    }
  }
  return { status: "unknown", ok: false, reason: "No backend health endpoint responded." };
}

function normalizeConnectionString(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (/^postgres(ql)?:\/\//i.test(text)) return text;

  const parts = Object.fromEntries(
    text
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index < 0) return [part.toLowerCase(), ""];
        return [part.slice(0, index).trim().toLowerCase(), part.slice(index + 1).trim()];
      })
  );
  const host = parts.host ?? parts.server ?? "localhost";
  const port = parts.port ?? "5432";
  const database = parts.database ?? parts.db ?? "terrafusion";
  const user = parts.username ?? parts.user ?? "postgres";
  const password = parts.password ?? "";
  const auth = password ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}` : encodeURIComponent(user);
  return `postgresql://${auth}@${host}:${port}/${database}`;
}

function configuredConnectionString() {
  return normalizeConnectionString(
    process.env.TF_BENTON_SYNC_DB_URL ??
      process.env.TF_SYNC_DB_URL ??
      process.env.TERRAFUSION_DB_URL ??
      process.env.DATABASE_URL ??
      process.env.ConnectionStrings__DefaultConnection
  );
}

function parseScalar(text) {
  const value = String(text ?? "").trim();
  if (!value) return 0;
  const number = Number(value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).at(-1));
  return Number.isFinite(number) ? number : 0;
}

function parseLoadBatch(text) {
  const line = String(text ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .at(-1);
  if (!line) return { status: "UNKNOWN" };
  const [loadBatchId, stage, status] = line.split("|");
  return {
    loadBatchId: loadBatchId || null,
    stage: stage || "UNKNOWN",
    status: status || "UNKNOWN"
  };
}

function psqlOutputToValue(name, result) {
  if (result.error) {
    return { unavailable: true, reason: result.error.message };
  }
  if (result.status !== 0) {
    return {
      unavailable: true,
      reason: String(result.stderr || result.stdout || `psql exited ${result.status}`).trim()
    };
  }
  if (name === "latestLoadBatch" || name === "latestOwnerSupnumFailure") return parseLoadBatch(result.stdout);
  return parseScalar(result.stdout);
}

function directPsqlArgs(connectionString, sql) {
  return [connectionString, "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", sql];
}

function dockerPsqlArgs({ pgContainer, pgDatabase, pgUser, sql }) {
  return [
    "exec",
    pgContainer,
    "psql",
    "-U",
    pgUser,
    "-d",
    pgDatabase,
    "-X",
    "-A",
    "-t",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    sql
  ];
}

function queryViaDirectPsql({ name, sql, connectionString, psqlPath, spawn }) {
  if (!connectionString) return { unavailable: true, reason: "No database connection string configured." };
  return psqlOutputToValue(
    name,
    spawn(psqlPath, directPsqlArgs(connectionString, sql), {
      encoding: "utf8",
      timeout: 10000
    })
  );
}

function queryViaDockerPsql({ name, sql, dockerPath, pgContainer, pgDatabase, pgUser, queryTimeoutMs, spawn }) {
  return psqlOutputToValue(
    name,
    spawn(dockerPath, dockerPsqlArgs({ pgContainer, pgDatabase, pgUser, sql }), {
      encoding: "utf8",
      timeout: queryTimeoutMs
    })
  );
}

export function makeRuntimeDbQueryRunner({
  dbRuntime = process.env.TF_BENTON_SYNC_DB_RUNTIME ?? process.env.TF_DB_EVIDENCE_RUNTIME ?? "auto",
  connectionString = configuredConnectionString(),
  psqlPath = process.env.TF_PSQL_PATH ?? "psql",
  dockerPath = process.env.TF_DOCKER_PATH ?? "docker",
  pgContainer = process.env.TF_PG_CONTAINER ?? "terrafusion-postgres-dev",
  pgDatabase = process.env.TF_PG_DATABASE ?? process.env.TF_PG_DB ?? "terrafusion",
  pgUser = process.env.TF_PG_USER ?? "postgres",
  queryTimeoutMs = Number.parseInt(process.env.TF_DB_EVIDENCE_TIMEOUT_MS ?? "60000", 10),
  spawn = spawnSync
} = {}) {
  const runtime = String(dbRuntime ?? "auto").toLowerCase();

  return async function query(name, sql) {
    if (runtime === "none") {
      return { unavailable: true, reason: "DB runtime probing disabled." };
    }

    const failures = [];
    if (runtime === "direct" || (runtime === "auto" && connectionString)) {
      const direct = queryViaDirectPsql({ name, sql, connectionString, psqlPath, spawn });
      if (!direct?.unavailable) return direct;
      failures.push(`direct psql: ${direct.reason}`);
      if (runtime === "direct") return direct;
    }

    if (runtime === "docker" || runtime === "auto") {
      const docker = queryViaDockerPsql({
        name,
        sql,
        dockerPath,
        pgContainer,
        pgDatabase,
        pgUser,
        queryTimeoutMs,
        spawn
      });
      if (!docker?.unavailable) return docker;
      failures.push(`docker psql: ${docker.reason}`);
      return {
        unavailable: true,
        reason: `No readable DB runtime path. ${failures.join(" | ")}`
      };
    }

    return { unavailable: true, reason: `Unsupported DB runtime path: ${dbRuntime}` };
  };
}

export function makePsqlQueryRunner({ connectionString = configuredConnectionString(), psqlPath = "psql" } = {}) {
  return makeRuntimeDbQueryRunner({ dbRuntime: "direct", connectionString, psqlPath });
}

function countValue(value) {
  if (value && typeof value === "object" && value.unavailable) return 0;
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function classificationForCount(value, preferred = "PARTIAL_SEEDED") {
  if (value && typeof value === "object" && value.unavailable) return "UNKNOWN";
  return countValue(value) > 0 ? preferred : "UNKNOWN";
}

function readable(value) {
  return !(value && typeof value === "object" && value.unavailable);
}

function dependencyClassification({ geometryCount, canonicalParcel, truthParcel }) {
  if (countValue(geometryCount) > 0 && countValue(canonicalParcel) > 0) return "PARTIAL_SEEDED";
  if (countValue(canonicalParcel) > 0 || countValue(truthParcel) > 0) return "SYNC_DERIVED";
  return "UNKNOWN";
}

function ownerSupnumBackfillDependency(loadBatch, latestFailed = null) {
  return {
    stage: loadBatch?.stage ?? "UNKNOWN",
    status: loadBatch?.status ?? "UNKNOWN",
    latestFailed: latestFailed && !latestFailed.unavailable
      ? {
        loadBatchId: latestFailed.loadBatchId ?? null,
        stage: latestFailed.stage ?? "UNKNOWN",
        status: latestFailed.status ?? "UNKNOWN"
      }
      : null,
    classification: "NOT_REQUIRED_FOR_FORGE_DEV",
    requiredForCountyStudioForgeDev: false,
    requiredForPacketProof: true,
    requiredForOperationalProof: true,
    ownerIdentityConsumedByForgeSurfaces: false,
    consumedSurfaces: [],
    audit: {
      finding: "County Studio is a TerraForge valuation surface; current Forge valuation paths do not consume owner name, taxpayer identity, mailing identity, owner-current, or owner-supnum data.",
      forgeValuationSources: [
        "parcel/property identity",
        "property characteristics",
        "valuation metrics",
        "ratio-study context",
        "risk objects",
        "geometry/map context"
      ],
      packetOpsSources: [
        "Dossier packet owner identity",
        "Dais/notice/appeal taxpayer identity",
        "operational packet owner references"
      ]
    }
  };
}

function decisionFor(evidence) {
  const requiredReadable = [
    evidence.queryResults.legacyProperty,
    evidence.queryResults.truthParcel,
    evidence.queryResults.gisParcelGeometry
  ].every((value) => readable(value) && countValue(value) > 0);
  return {
    realDevEvidenceReadable: requiredReadable,
    productionProofAllowed: false,
    operationalProofAllowed: false
  };
}

export async function buildBentonSyncDrainStateEvidence({
  drainPid = process.env.TF_BENTON_DRAIN_PID ?? null,
  dbRuntime = process.env.TF_BENTON_SYNC_DB_RUNTIME ?? process.env.TF_DB_EVIDENCE_RUNTIME ?? "auto",
  pgContainer = process.env.TF_PG_CONTAINER ?? "terrafusion-postgres-dev",
  pgDatabase = process.env.TF_PG_DATABASE ?? process.env.TF_PG_DB ?? "terrafusion",
  pgUser = process.env.TF_PG_USER ?? "postgres",
  probeBackendHealth: backendProbe = () =>
    probeBackendHealth([
      process.env.TF_BENTON_DEV_API_BASE,
      process.env.TF_RUNTIME_BASE_URL,
      process.env.VITE_API_URL,
      "http://localhost:5000",
      "http://localhost:5046"
    ]),
  processAlive: aliveProbe = processAlive,
  query = makeRuntimeDbQueryRunner({ dbRuntime, pgContainer, pgDatabase, pgUser })
} = {}) {
  const backendHealth = await backendProbe();
  const activeDrainAlive = aliveProbe(drainPid);
  const queryResults = {
    latestLoadBatch: await query("latestLoadBatch", LATEST_LOAD_BATCH_QUERY),
    latestOwnerSupnumFailure: await query("latestOwnerSupnumFailure", LATEST_OWNER_SUPNUM_FAILURE_QUERY)
  };

  for (const [name, sql] of Object.entries(DB_COUNT_QUERIES)) {
    queryResults[name] = await query(name, sql);
  }

  const evidence = {
    generatedAtUtc: new Date().toISOString(),
    adapter: "benton-sync-drain-state-evidence",
    backendHealth,
    activeDrain: {
      pid: drainPid ? Number(drainPid) : null,
      alive: activeDrainAlive,
      status: activeDrainAlive === true ? "IN_PROGRESS" : activeDrainAlive === false ? "NOT_RUNNING" : "UNKNOWN"
    },
    runtimeDbAccess: {
      mode: String(dbRuntime ?? "auto").toLowerCase(),
      canonicalPath: "docker exec <TF_PG_CONTAINER> psql -U <TF_PG_USER> -d <TF_PG_DATABASE>",
      pgContainer,
      pgDatabase,
      pgUser,
      directConnectionConfigured: Boolean(configuredConnectionString())
    },
    loadBatch: {
      stage: queryResults.latestLoadBatch?.stage ?? "UNKNOWN",
      status: queryResults.latestLoadBatch?.status ?? "UNKNOWN",
      loadBatchId: queryResults.latestLoadBatch?.loadBatchId ?? null
    },
    queryResults,
    counts: {
      landingTables: {
        property: countValue(queryResults.legacyProperty),
        owner: countValue(queryResults.legacyOwner),
        propSuppAssoc: countValue(queryResults.legacyPropSuppAssoc),
        washPropOwnerVal: countValue(queryResults.legacyWashPropOwnerVal)
      },
      truthTables: {
        parcel: countValue(queryResults.truthParcel),
        owner: countValue(queryResults.truthOwner),
        wsdor: countValue(queryResults.truthWsdor)
      },
      canonical: {
        parcel: countValue(queryResults.canonicalParcel),
        owner: countValue(queryResults.canonicalOwner),
        account: countValue(queryResults.legacyAccount),
        wsdor: countValue(queryResults.canonicalWsdor)
      },
      gis: {
        parcelGeometry: countValue(queryResults.gisParcelGeometry)
      }
    },
    countClassifications: {
      legacyProperty: classificationForCount(queryResults.legacyProperty),
      legacyOwner: classificationForCount(queryResults.legacyOwner),
      legacyPropSuppAssoc: classificationForCount(queryResults.legacyPropSuppAssoc),
      legacyWashPropOwnerVal: classificationForCount(queryResults.legacyWashPropOwnerVal),
      legacyAccount: classificationForCount(queryResults.legacyAccount, "SEEDED"),
      truthParcel: classificationForCount(queryResults.truthParcel, "SYNC_DERIVED"),
      truthOwner: classificationForCount(queryResults.truthOwner, "SYNC_DERIVED"),
      truthWsdor: classificationForCount(queryResults.truthWsdor, "SYNC_DERIVED"),
      canonicalParcel: classificationForCount(queryResults.canonicalParcel, "SEEDED"),
      canonicalOwner: classificationForCount(queryResults.canonicalOwner, "SEEDED"),
      canonicalWsdor: classificationForCount(queryResults.canonicalWsdor, "SEEDED"),
      gisParcelGeometry: classificationForCount(queryResults.gisParcelGeometry)
    },
    countyStudioDependencies: {
      map: dependencyClassification({
        geometryCount: queryResults.gisParcelGeometry,
        canonicalParcel: queryResults.canonicalParcel,
        truthParcel: queryResults.truthParcel
      }),
      ledger: countValue(queryResults.truthParcel) > 0 || countValue(queryResults.canonicalParcel) > 0 ? "SYNC_DERIVED" : "UNKNOWN",
      inspector: countValue(queryResults.truthParcel) > 0 || countValue(queryResults.canonicalParcel) > 0 ? "SYNC_DERIVED" : "UNKNOWN",
      ownerSupnumBackfill: ownerSupnumBackfillDependency(
        queryResults.latestLoadBatch,
        queryResults.latestOwnerSupnumFailure
      )
    },
    decisions: {
      realDevEvidenceReadable: false,
      productionProofAllowed: false,
      operationalProofAllowed: false
    },
    rules: [
      "Read-only evidence collector only.",
      "Unavailable DB connection reports UNKNOWN, not PASS.",
      "Partial seed may enable real dev readiness, not production proof.",
      "Production and operational proof remain false."
    ]
  };

  evidence.decisions = decisionFor(evidence);
  return evidence;
}

export function evidenceToReadinessSource(evidence) {
  return {
    backendHealth: evidence.backendHealth,
    activeDrain: evidence.activeDrain,
    loadBatch: evidence.loadBatch,
    counts: evidence.counts,
    countyStudioDependencies: evidence.countyStudioDependencies,
    blockers: evidence.decisions.realDevEvidenceReadable ? [] : ["Sync/DB evidence is not readable enough for real dev readiness."]
  };
}

function renderMarkdown(evidence) {
  const rows = Object.entries(evidence.countClassifications).map(([name, classification]) => {
    const value = evidence.queryResults[name];
    const count = countValue(value);
    const reason = value?.unavailable ? value.reason : count > 0 ? "count present" : "count missing";
    return `| ${name} | ${classification} | ${count} | ${String(reason).replaceAll("\n", " ")} |`;
  });

  return [
    "# Benton Sync Drain State Evidence",
    "",
    `Generated: ${evidence.generatedAtUtc}`,
    "",
    "## Decision",
    "",
    `- Real dev evidence readable: ${evidence.decisions.realDevEvidenceReadable}`,
    `- Production proof allowed: ${evidence.decisions.productionProofAllowed}`,
    `- Operational proof allowed: ${evidence.decisions.operationalProofAllowed}`,
    "",
    "## Runtime",
    "",
    `- Backend health: ${evidence.backendHealth.status ?? "unknown"}`,
    `- Drain PID: ${evidence.activeDrain.pid ?? "none"}`,
    `- Drain alive: ${evidence.activeDrain.alive}`,
    `- load_batch stage: ${evidence.loadBatch.stage}`,
    `- load_batch status: ${evidence.loadBatch.status}`,
    "",
    "## DB Runtime Access",
    "",
    `- Mode: ${evidence.runtimeDbAccess.mode}`,
    `- Canonical path: \`${evidence.runtimeDbAccess.canonicalPath}\``,
    `- Container: ${evidence.runtimeDbAccess.pgContainer}`,
    `- Database: ${evidence.runtimeDbAccess.pgDatabase}`,
    `- User: ${evidence.runtimeDbAccess.pgUser}`,
    `- Direct connection configured: ${evidence.runtimeDbAccess.directConnectionConfigured}`,
    "",
    "## Counts",
    "",
    "| Source | Classification | Count | Reason |",
    "| --- | --- | ---: | --- |",
    ...rows,
    "",
    "## County Studio Dependencies",
    "",
    `- Map: ${evidence.countyStudioDependencies.map}`,
    `- Ledger: ${evidence.countyStudioDependencies.ledger}`,
    `- Inspector: ${evidence.countyStudioDependencies.inspector}`,
    `- Owner-supnum backfill status: ${evidence.countyStudioDependencies.ownerSupnumBackfill.status}`,
    `- Owner-supnum latest failed stage: ${evidence.countyStudioDependencies.ownerSupnumBackfill.latestFailed?.stage ?? "none"}`,
    `- Owner-supnum latest failed status: ${evidence.countyStudioDependencies.ownerSupnumBackfill.latestFailed?.status ?? "none"}`,
    `- Owner-supnum required for Forge dev: ${evidence.countyStudioDependencies.ownerSupnumBackfill.requiredForCountyStudioForgeDev}`,
    `- Owner-supnum required for packet proof: ${evidence.countyStudioDependencies.ownerSupnumBackfill.requiredForPacketProof}`,
    `- Owner-supnum required for operational proof: ${evidence.countyStudioDependencies.ownerSupnumBackfill.requiredForOperationalProof}`,
    "",
    "## Rules",
    "",
    ...evidence.rules.map((rule) => `- ${rule}`)
  ].join("\n") + "\n";
}

function parseArgs(argv) {
  const args = {
    drainPid: process.env.TF_BENTON_DRAIN_PID ?? null,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    noBackendProbe: false,
    dbRuntime: process.env.TF_BENTON_SYNC_DB_RUNTIME ?? process.env.TF_DB_EVIDENCE_RUNTIME ?? "auto",
    pgContainer: process.env.TF_PG_CONTAINER ?? "terrafusion-postgres-dev",
    pgDatabase: process.env.TF_PG_DATABASE ?? process.env.TF_PG_DB ?? "terrafusion",
    pgUser: process.env.TF_PG_USER ?? "postgres",
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--drain-pid") args.drainPid = argv[++i];
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-backend-probe") args.noBackendProbe = true;
    else if (arg === "--db-runtime") args.dbRuntime = argv[++i];
    else if (arg === "--pg-container") args.pgContainer = argv[++i];
    else if (arg === "--pg-database") args.pgDatabase = argv[++i];
    else if (arg === "--pg-user") args.pgUser = argv[++i];
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const evidence = await buildBentonSyncDrainStateEvidence({
    drainPid: args.drainPid,
    dbRuntime: args.dbRuntime,
    pgContainer: args.pgContainer,
    pgDatabase: args.pgDatabase,
    pgUser: args.pgUser,
    probeBackendHealth: args.noBackendProbe
      ? async () => ({ status: "unknown", ok: false, reason: "Backend probe disabled." })
      : undefined
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(evidence, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(evidence));
  }

  console.log(
    JSON.stringify(
      {
        status: evidence.decisions.realDevEvidenceReadable ? "SYNC_DB_EVIDENCE_READABLE" : "SYNC_DB_EVIDENCE_UNKNOWN",
        realDevEvidenceReadable: evidence.decisions.realDevEvidenceReadable,
        productionProofAllowed: evidence.decisions.productionProofAllowed,
        operationalProofAllowed: evidence.decisions.operationalProofAllowed,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  if (!evidence.decisions.realDevEvidenceReadable) {
    process.exitCode = 1;
  }

  return evidence;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
