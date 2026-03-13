#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const STAGING_BASE_URL = "https://staging.terrafusionmarket.com";
const PRODUCTION_BASE_URL = "https://terrafusionmarket.com";
const LOCAL_DB_PATH = "backend/src/TerraFusion.API/terrafusion-dev.db";
const STAGING_DB_PATH = "/opt/terrafusion/staging/data/terrafusion.db";
const PRODUCTION_DB_PATH = "/opt/terrafusion/production/data/terrafusion.db";
const MAX_SNAPSHOT_AGE_HOURS = 24;
const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/phase16-monitoring-recovery.latest.json"
);

function commandFor(binary) {
  if (process.platform === "win32" && binary === "pnpm") return "pnpm.cmd";
  return binary;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const outIndex = args.indexOf("--out");
  return {
    outPath:
      outIndex >= 0 && args[outIndex + 1]
        ? args[outIndex + 1]
        : process.env.PHASE16_PROOF_OUT || DEFAULT_OUT_PATH,
  };
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const useCmdShim =
      process.platform === "win32" && /\.(cmd|bat)$/i.test(command);
    const child = spawn(
      useCmdShim ? "cmd.exe" : command,
      useCmdShim ? ["/d", "/s", "/c", command, ...args] : args,
      {
        cwd: process.cwd(),
        env: process.env,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        ...options,
      }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
      process.stderr.write(chunk);
    });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

async function readText(relativePath) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), "utf8");
}

function includesAll(content, needles) {
  return needles.filter((needle) => !content.includes(needle));
}

async function fetchJson(url) {
  const response = await fetch(url, { redirect: "follow" });
  const body = await response.text();

  let json = null;
  try {
    json = body ? JSON.parse(body) : null;
  } catch {
    json = null;
  }

  const headerMap = {};
  for (const [name, value] of response.headers.entries()) {
    headerMap[name.toLowerCase()] = value;
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
    json,
    headerMap,
  };
}

function normalizeFingerprint(payload) {
  return JSON.stringify({
    properties: payload.Properties,
    propertyAssessments: payload.PropertyAssessments,
    comparableSales: payload.ComparableSales,
    distinctCompParcels: payload.ComparableSalesDistinctParcels,
    compFingerprint: payload.ComparableSalesFingerprint,
  });
}

function parseUtc(value) {
  if (!value || typeof value !== "string") return null;
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function ageHours(timestamp) {
  const parsed = parseUtc(timestamp);
  if (!parsed) return Number.POSITIVE_INFINITY;
  return (Date.now() - parsed.getTime()) / (1000 * 60 * 60);
}

async function getLocalSnapshotMarker() {
  const script = `
import sqlite3, json, os, tempfile
source = r"${path.resolve(process.cwd(), LOCAL_DB_PATH).replace(/\\/g, "\\\\")}"
tmp_dir = tempfile.gettempdir()
snapshot = os.path.join(tmp_dir, "phase16-local-marker.db")
src = sqlite3.connect(f"file:{source}?mode=ro", uri=True)
dst = sqlite3.connect(snapshot)
src.backup(dst)
dst.close()
src.close()
conn = sqlite3.connect(f"file:{snapshot}?mode=ro", uri=True)
cur = conn.cursor()
cur.execute("""
SELECT EntityType, Status, StartedAt, CompletedAt, Details
FROM EtlSyncJobs
WHERE EntityType = 'CamaCharacteristics,Sales,CostMatrices'
  AND lower(Status) = 'completed'
ORDER BY datetime(CompletedAt) DESC
LIMIT 1
""")
row = cur.fetchone()
cur.execute("SELECT COUNT(*) FROM CamaCharacteristics")
cama = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM CostMatrices")
matrices = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM Properties")
properties = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM PropertyAssessments")
assessments = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM ComparableSales")
comps = cur.fetchone()[0]
cur.execute("SELECT COUNT(DISTINCT ParcelId) FROM ComparableSales")
distinct_parcels = cur.fetchone()[0]
cur.execute("SELECT ParcelId, SalePrice, SaleDate FROM ComparableSales ORDER BY ParcelId, SaleDate, SalePrice LIMIT 5")
fingerprint = cur.fetchall()
conn.close()
print(json.dumps({
  "marker": {
    "EntityType": row[0] if row else None,
    "Status": row[1] if row else None,
    "StartedAt": row[2] if row else None,
    "CompletedAt": row[3] if row else None,
    "Details": row[4] if row else None
  },
  "snapshot": {
    "Properties": properties,
    "PropertyAssessments": assessments,
    "ComparableSales": comps,
    "ComparableSalesDistinctParcels": distinct_parcels,
    "ComparableSalesFingerprint": fingerprint,
    "CamaCharacteristics": cama,
    "CostMatrices": matrices
  }
}))
`;

  const result = await runCommand("python", ["-c", script]);
  if (result.code !== 0) {
    throw new Error(`Local Phase 16 snapshot marker failed: ${result.stderr || result.stdout}`);
  }

  return JSON.parse(result.stdout.trim());
}

async function getRemoteRecoveryManifests() {
  const remoteScript = `
import sqlite3, json, shutil, hashlib
from pathlib import Path
from datetime import datetime, timezone

paths = {
    "staging": Path("${STAGING_DB_PATH}"),
    "production": Path("${PRODUCTION_DB_PATH}"),
}

def stable_snapshot(conn):
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM Properties")
    properties = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM PropertyAssessments")
    assessments = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM ComparableSales")
    comparables = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT ParcelId) FROM ComparableSales")
    distinct_parcels = cur.fetchone()[0]
    cur.execute("SELECT ParcelId, SalePrice, SaleDate FROM ComparableSales ORDER BY ParcelId, SaleDate, SalePrice LIMIT 5")
    fingerprint = cur.fetchall()
    cur.execute("SELECT COUNT(*) FROM CamaCharacteristics")
    cama = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM CostMatrices")
    matrices = cur.fetchone()[0]
    return {
        "Properties": properties,
        "PropertyAssessments": assessments,
        "ComparableSales": comparables,
        "ComparableSalesDistinctParcels": distinct_parcels,
        "ComparableSalesFingerprint": fingerprint,
        "CamaCharacteristics": cama,
        "CostMatrices": matrices,
    }

def latest_full_sync(conn):
    cur = conn.cursor()
    cur.execute("""
    SELECT EntityType, Status, StartedAt, CompletedAt, Details
    FROM EtlSyncJobs
    WHERE EntityType = 'CamaCharacteristics,Sales,CostMatrices'
      AND lower(Status) = 'completed'
    ORDER BY datetime(CompletedAt) DESC
    LIMIT 1
    """)
    row = cur.fetchone()
    return {
        "EntityType": row[0] if row else None,
        "Status": row[1] if row else None,
        "StartedAt": row[2] if row else None,
        "CompletedAt": row[3] if row else None,
        "Details": row[4] if row else None,
    }

out = {}
ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
for env_name, source in paths.items():
    backup_dir = source.parent.parent / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup_path = backup_dir / f"terrafusion.phase16.{ts}.db"
    restore_path = Path(f"/tmp/{env_name}-phase16-restore-{ts}.db")

    source_conn = sqlite3.connect(f"file:{source}?mode=ro", uri=True)
    source_snapshot = stable_snapshot(source_conn)
    source_marker = latest_full_sync(source_conn)
    source_conn.close()

    shutil.copy2(source, backup_path)
    backup_conn = sqlite3.connect(f"file:{backup_path}?mode=ro", uri=True)
    backup_snapshot = stable_snapshot(backup_conn)
    backup_marker = latest_full_sync(backup_conn)
    backup_conn.close()

    shutil.copy2(backup_path, restore_path)
    restore_conn = sqlite3.connect(f"file:{restore_path}?mode=ro", uri=True)
    restore_snapshot = stable_snapshot(restore_conn)
    restore_marker = latest_full_sync(restore_conn)
    restore_conn.close()
    restore_path.unlink(missing_ok=True)

    with open(backup_path, "rb") as fh:
        backup_sha256 = hashlib.sha256(fh.read()).hexdigest()

    out[env_name] = {
        "sourcePath": str(source),
        "backupPath": str(backup_path),
        "backupSha256": backup_sha256,
        "backupSize": backup_path.stat().st_size,
        "sourceSnapshot": source_snapshot,
        "sourceMarker": source_marker,
        "backupSnapshot": backup_snapshot,
        "backupMarker": backup_marker,
        "restoreSnapshot": restore_snapshot,
        "restoreMarker": restore_marker,
    }

print(json.dumps(out))
`;

  const result = await runCommand("ssh", [
    "terrafusion-hostinger",
    `python3 - <<'PY'\n${remoteScript}\nPY`,
  ]);

  if (result.code !== 0) {
    throw new Error(`Remote recovery manifest failed: ${result.stderr || result.stdout}`);
  }

  return JSON.parse(result.stdout.trim());
}

async function main() {
  const { outPath } = parseArgs(process.argv);
  const checks = [];
  const blockers = [];

  const record = (name, ok, detail, payload = null, blocker = null) => {
    checks.push({ name, ok, detail, payload, blocker });
    if (!ok && blocker) blockers.push(blocker);
  };

  const phase15 = await runCommand(commandFor("pnpm"), ["run", "proof:phase15"]);
  record(
    "phase15.data_quality",
    phase15.code === 0,
    `exit=${phase15.code}`,
    { stdout: phase15.stdout, stderr: phase15.stderr },
    phase15.code === 0 ? null : "Phase 15 data-quality proof failed"
  );

  const stagingHealth = await fetchJson(`${STAGING_BASE_URL}/health`);
  const productionHealth = await fetchJson(`${PRODUCTION_BASE_URL}/health`);

  record(
    "monitoring.public_health",
    stagingHealth.status === 200 && productionHealth.status === 200,
    `staging=${stagingHealth.status}, production=${productionHealth.status}`,
    {
      staging: stagingHealth.json ?? stagingHealth.body,
      production: productionHealth.json ?? productionHealth.body,
    },
    stagingHealth.status === 200 && productionHealth.status === 200
      ? null
      : "Public Benton runtimes are not healthy on staging and production"
  );

  const healthIdentityOk =
    (stagingHealth.json?.environment ?? stagingHealth.json?.Environment) === "Staging" &&
    (productionHealth.json?.environment ?? productionHealth.json?.Environment) === "Production" &&
    Boolean(stagingHealth.headerMap["x-release-sha"]) &&
    Boolean(productionHealth.headerMap["x-release-sha"]);
  record(
    "monitoring.environment_identity",
    healthIdentityOk,
    `stagingEnv=${stagingHealth.json?.environment ?? stagingHealth.json?.Environment ?? "missing"}, productionEnv=${productionHealth.json?.environment ?? productionHealth.json?.Environment ?? "missing"}`,
    {
      stagingHeaders: stagingHealth.headerMap,
      productionHeaders: productionHealth.headerMap,
      stagingBody: stagingHealth.json ?? stagingHealth.body,
      productionBody: productionHealth.json ?? productionHealth.body,
    },
    healthIdentityOk
      ? null
      : "Public Benton health surface is missing truthful environment identity or release headers"
  );

  const localState = await getLocalSnapshotMarker();
  const remoteState = await getRemoteRecoveryManifests();

  const localMarker = localState.marker;
  const localMarkerAgeHours = ageHours(localMarker.CompletedAt);
  const localFreshOk =
    localMarker.EntityType === "CamaCharacteristics,Sales,CostMatrices" &&
    localMarker.Status === "completed" &&
    Number.isFinite(localMarkerAgeHours) &&
    localMarkerAgeHours <= MAX_SNAPSHOT_AGE_HOURS;
  record(
    "freshness.local.snapshot_marker",
    localFreshOk,
    `completedAt=${localMarker.CompletedAt ?? "missing"}, ageHours=${Number.isFinite(localMarkerAgeHours) ? localMarkerAgeHours.toFixed(2) : "n/a"}`,
    localState,
    localFreshOk
      ? null
      : "Local Benton canonical runtime does not have a fresh full snapshot sync marker"
  );

  const localStableSnapshot = {
    Properties: localState.snapshot.Properties,
    PropertyAssessments: localState.snapshot.PropertyAssessments,
    ComparableSales: localState.snapshot.ComparableSales,
    ComparableSalesDistinctParcels: localState.snapshot.ComparableSalesDistinctParcels,
    ComparableSalesFingerprint: localState.snapshot.ComparableSalesFingerprint,
  };

  for (const envName of ["staging", "production"]) {
    const remote = remoteState[envName];
    const remoteAge = ageHours(remote.sourceMarker.CompletedAt);
    const stableMatch =
      normalizeFingerprint(remote.sourceSnapshot) ===
      normalizeFingerprint(localStableSnapshot);

    const markerMatch =
      remote.sourceMarker.EntityType === "CamaCharacteristics,Sales,CostMatrices" &&
      remote.sourceMarker.Status === "completed" &&
      remote.sourceMarker.CompletedAt === localMarker.CompletedAt &&
      Number.isFinite(remoteAge) &&
      remoteAge <= MAX_SNAPSHOT_AGE_HOURS;

    record(
      `freshness.${envName}.snapshot_marker`,
      markerMatch && stableMatch,
      `completedAt=${remote.sourceMarker.CompletedAt ?? "missing"}, ageHours=${Number.isFinite(remoteAge) ? remoteAge.toFixed(2) : "n/a"}`,
      {
        localMarker,
        remoteMarker: remote.sourceMarker,
        localSnapshot: localState.snapshot,
        remoteSnapshot: remote.sourceSnapshot,
      },
      markerMatch && stableMatch
        ? null
        : `${envName} Benton snapshot is stale or drifted from the canonical full snapshot marker`
    );

    const backupParityOk =
      normalizeFingerprint(remote.sourceSnapshot) === normalizeFingerprint(remote.backupSnapshot) &&
      normalizeFingerprint(remote.sourceSnapshot) === normalizeFingerprint(remote.restoreSnapshot) &&
      remote.backupMarker.CompletedAt === remote.sourceMarker.CompletedAt &&
      remote.restoreMarker.CompletedAt === remote.sourceMarker.CompletedAt;

    record(
      `recovery.${envName}.backup_restore_drill`,
      backupParityOk,
      `backup=${remote.backupPath}`,
      remote,
      backupParityOk
        ? null
        : `${envName} backup/restore drill does not preserve the Benton snapshot contract`
    );
  }

  const phase16Doc = await readText(
    "os-platform/core/pilot/ops/phase16-monitoring-and-recovery-truth.md"
  );
  const hostingerCanon = await readText(
    "os-platform/core/pilot/ops/hostinger-control-plane.md"
  );

  const missingPhase16Doc = includesAll(phase16Doc, [
    "# Phase 16 Monitoring, Backup, and Recovery Truth",
    "Snapshot freshness is measured from the latest completed full Benton sync marker (`CamaCharacteristics,Sales,CostMatrices`).",
    "Hostinger staging and production must each support a backup-and-restore drill against the promoted Benton snapshot contract.",
    "Phase 16 reaches GO only when public health is truthful, snapshot freshness is bounded, and backup/restore preserves the Benton operator contract.",
  ]);
  record(
    "governance.phase16_doc",
    missingPhase16Doc.length === 0,
    missingPhase16Doc.length === 0
      ? "Phase 16 runbook records monitoring, freshness, and recovery truth"
      : `missing Phase 16 doc lines: ${missingPhase16Doc.join("; ")}`,
    { missingPhase16Doc },
    missingPhase16Doc.length === 0
      ? null
      : "Phase 16 runbook is out of sync with the proof packet"
  );

  const missingHostingerCanon = includesAll(hostingerCanon, [
    "## Phase 16 Monitoring, Backup, and Recovery Truth (2026-03-13)",
    "Snapshot freshness is bounded by the latest completed full Benton sync marker (`CamaCharacteristics,Sales,CostMatrices`) on the canonical local runtime.",
    "Hostinger staging and production each carry a verified backup-and-restore drill for the promoted Benton snapshot contract.",
  ]);
  record(
    "governance.hostinger_control_plane.phase16_truth",
    missingHostingerCanon.length === 0,
    missingHostingerCanon.length === 0
      ? "Hostinger control plane records the Phase 16 monitoring and recovery truth"
      : `missing hostinger Phase 16 canon lines: ${missingHostingerCanon.join("; ")}`,
    { missingHostingerCanon },
    missingHostingerCanon.length === 0
      ? null
      : "Hostinger control plane does not record the Phase 16 monitoring and recovery truth"
  );

  const decision = blockers.length === 0 ? "GO" : "NO_GO";
  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 16 monitoring, backup, and recovery truth packet",
    decision,
    checks,
    summary: {
      ok: blockers.length === 0,
      failures: checks.filter((check) => !check.ok).length,
      blockers,
      monitoringTruth:
        "Public health must stay truthful, the promoted Benton snapshot must remain fresh enough, and both Hostinger snapshot runtimes must survive backup/restore without breaking the Benton operator contract.",
    },
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");

  if (decision !== "GO") {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  const outPath = parseArgs(process.argv).outPath;
  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 16 monitoring, backup, and recovery truth packet",
    decision: "NO_GO",
    checks: [
      {
        name: "phase16.packet",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        payload: {
          stack: error instanceof Error ? error.stack : null,
        },
        blocker: "Phase 16 proof packet crashed",
      },
    ],
    summary: {
      ok: false,
      failures: 1,
      blockers: ["Phase 16 proof packet crashed"],
      monitoringTruth:
        "Public health must stay truthful, the promoted Benton snapshot must remain fresh enough, and both Hostinger snapshot runtimes must survive backup/restore without breaking the Benton operator contract.",
    },
  };
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  console.error(error);
  process.exitCode = 1;
});
