#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const LOCAL_DB_PATH = "backend/src/TerraFusion.API/terrafusion-dev.db";
const STAGING_DB_PATH = "/opt/terrafusion/staging/data/terrafusion.db";
const PRODUCTION_DB_PATH = "/opt/terrafusion/production/data/terrafusion.db";
const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence/phase13-snapshot-promotion.latest.json"
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
        : process.env.PHASE13_PROOF_OUT || DEFAULT_OUT_PATH,
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

async function fetchJson(url, token = null) {
  const headers = { accept: "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers,
  });

  const body = await response.text();
  let json = null;
  try {
    json = body ? JSON.parse(body) : null;
  } catch {
    json = null;
  }

  return { ok: response.ok, status: response.status, json, body };
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    redirect: "follow",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { ok: response.ok, status: response.status, json, body: text };
}

async function login(baseUrl, email, password) {
  const response = await postJson(`${baseUrl}/api/auth/login`, { email, password });
  return {
    ok: response.ok && Boolean(response.json?.token),
    status: response.status,
    token: response.json?.token ?? null,
    payload: response.json ?? response.body,
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

async function getLocalSnapshotManifest() {
  const script = `
import sqlite3, json, hashlib, os, tempfile
source = r"${path.resolve(process.cwd(), LOCAL_DB_PATH).replace(/\\/g, "\\\\")}"
tmp_dir = tempfile.gettempdir()
snapshot = os.path.join(tmp_dir, "phase13-local-promoted-snapshot.db")
src = sqlite3.connect(f"file:{source}?mode=ro", uri=True)
dst = sqlite3.connect(snapshot)
src.backup(dst)
dst.close()
src.close()
conn = sqlite3.connect(f"file:{snapshot}?mode=ro", uri=True)
cur = conn.cursor()
result = {}
for table in ["Properties","PropertyAssessments","ComparableSales","EtlSyncJobs"]:
    cur.execute(f"SELECT COUNT(*) FROM {table}")
    result[table] = cur.fetchone()[0]
cur.execute("SELECT COUNT(DISTINCT ParcelId) FROM ComparableSales")
result["ComparableSalesDistinctParcels"] = cur.fetchone()[0]
cur.execute("SELECT ParcelId, SalePrice, SaleDate FROM ComparableSales ORDER BY ParcelId, SaleDate, SalePrice LIMIT 5")
result["ComparableSalesFingerprint"] = cur.fetchall()
conn.close()
with open(snapshot, "rb") as fh:
    result["snapshotSha256"] = hashlib.sha256(fh.read()).hexdigest()
result["snapshotSize"] = os.path.getsize(snapshot)
result["snapshotPath"] = snapshot
print(json.dumps(result))
`;

  const result = await runCommand("python", ["-c", script]);
  if (result.code !== 0) {
    throw new Error(`Local snapshot manifest failed: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout.trim());
}

async function getRemoteSnapshotManifests() {
  const remoteScript = `
import sqlite3, json, hashlib, os
paths = {
  "staging": "${STAGING_DB_PATH}",
  "production": "${PRODUCTION_DB_PATH}",
}
out = {}
for name, source in paths.items():
    conn = sqlite3.connect(f"file:{source}?mode=ro", uri=True)
    cur = conn.cursor()
    result = {}
    for table in ["Properties","PropertyAssessments","ComparableSales","EtlSyncJobs"]:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        result[table] = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT ParcelId) FROM ComparableSales")
    result["ComparableSalesDistinctParcels"] = cur.fetchone()[0]
    cur.execute("SELECT ParcelId, SalePrice, SaleDate FROM ComparableSales ORDER BY ParcelId, SaleDate, SalePrice LIMIT 5")
    result["ComparableSalesFingerprint"] = cur.fetchall()
    conn.close()
    with open(source, "rb") as fh:
        result["snapshotSha256"] = hashlib.sha256(fh.read()).hexdigest()
    result["snapshotSize"] = os.path.getsize(source)
    result["snapshotPath"] = source
    out[name] = result
print(json.dumps(out))
`;

  const result = await runCommand("ssh", [
    "terrafusion-hostinger",
    `python3 - <<'PY'\n${remoteScript}\nPY`,
  ]);

  if (result.code !== 0) {
    throw new Error(`Remote snapshot manifest failed: ${result.stderr || result.stdout}`);
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

  const phase12 = await runCommand(commandFor("pnpm"), ["run", "proof:phase12"]);
  record(
    "phase12.runtime_track",
    phase12.code === 0,
    `exit=${phase12.code}`,
    { stdout: phase12.stdout, stderr: phase12.stderr },
    phase12.code === 0 ? null : "Phase 12 runtime-track proof failed"
  );

  const localManifest = await getLocalSnapshotManifest();
  const remoteManifests = await getRemoteSnapshotManifests();

  record(
    "snapshot.local.canonical_manifest",
    localManifest.Properties > 0 &&
      localManifest.PropertyAssessments > 0 &&
      localManifest.ComparableSales > 0 &&
      localManifest.ComparableSalesDistinctParcels > 0,
    `properties=${localManifest.Properties}, assessments=${localManifest.PropertyAssessments}, comps=${localManifest.ComparableSales}, compParcels=${localManifest.ComparableSalesDistinctParcels}`,
    localManifest,
    localManifest.Properties > 0 &&
      localManifest.PropertyAssessments > 0 &&
      localManifest.ComparableSales > 0 &&
      localManifest.ComparableSalesDistinctParcels > 0
      ? null
      : "Local promoted Benton snapshot manifest is incomplete"
  );

  const stagingStableMatch =
    normalizeFingerprint(remoteManifests.staging) === normalizeFingerprint(localManifest);
  const productionStableMatch =
    normalizeFingerprint(remoteManifests.production) === normalizeFingerprint(localManifest);

  record(
    "snapshot.staging.logical_parity",
    stagingStableMatch,
    stagingStableMatch
      ? "staging stable Benton snapshot fingerprint matches local canonical source"
      : "staging stable Benton snapshot fingerprint differs from local canonical source",
    {
      local: localManifest,
      staging: remoteManifests.staging,
    },
    stagingStableMatch
      ? null
      : "Staging snapshot does not match the local canonical Benton snapshot contract"
  );

  record(
    "snapshot.production.logical_parity",
    productionStableMatch,
    productionStableMatch
      ? "production stable Benton snapshot fingerprint matches local canonical source"
      : "production stable Benton snapshot fingerprint differs from local canonical source",
    {
      local: localManifest,
      production: remoteManifests.production,
    },
    productionStableMatch
      ? null
      : "Production snapshot does not match the local canonical Benton snapshot contract"
  );

  const stagingProductionStableMatch =
    normalizeFingerprint(remoteManifests.staging) === normalizeFingerprint(remoteManifests.production);
  record(
    "snapshot.deployed.logical_parity",
    stagingProductionStableMatch,
    stagingProductionStableMatch
      ? "staging and production serve the same stable Benton snapshot contract"
      : "staging and production stable Benton snapshot contract differs",
    remoteManifests,
    stagingProductionStableMatch
      ? null
      : "Staging and production do not serve the same Benton snapshot contract"
  );

  record(
    "snapshot.file_hash.informational",
    true,
    `local=${localManifest.snapshotSha256}, staging=${remoteManifests.staging.snapshotSha256}, production=${remoteManifests.production.snapshotSha256}`,
    {
      localSha256: localManifest.snapshotSha256,
      stagingSha256: remoteManifests.staging.snapshotSha256,
      productionSha256: remoteManifests.production.snapshotSha256,
      note: "Raw SQLite file hashes are informational only because mutable runtime metadata tables like EtlSyncJobs can diverge after startup.",
    },
    null
  );

  const hostingerCanon = await readText(
    "os-platform/core/pilot/ops/hostinger-control-plane.md"
  );
  const phase13Doc = await readText(
    "os-platform/core/pilot/ops/phase13-snapshot-promotion-spine.md"
  );

  const missingHostingerCanon = includesAll(hostingerCanon, [
    "The promoted Benton artifact is a logical operational snapshot contract, not raw live PACS state.",
    "Staging and production should match the promoted Benton snapshot contract even if SQLite file hashes diverge after runtime activity.",
  ]);
  record(
    "hostinger.phase13_snapshot_canon",
    missingHostingerCanon.length === 0,
    missingHostingerCanon.length === 0
      ? "Hostinger control-plane canon records the snapshot promotion contract"
      : `missing lines: ${missingHostingerCanon.join(", ")}`,
    { missingHostingerCanon },
    missingHostingerCanon.length === 0
      ? null
      : "Hostinger control-plane canon is missing Phase 13 snapshot contract truth"
  );

  const missingPhase13Doc = includesAll(phase13Doc, [
    "Promoted Benton artifact",
    "Stable parity fields",
    "Mutable runtime fields excluded from promotion identity",
    "Phase 13 is complete only when staging and production match the local stable snapshot contract.",
  ]);
  record(
    "phase13.doc.promotion_spine",
    missingPhase13Doc.length === 0,
    missingPhase13Doc.length === 0
      ? "Phase 13 doc records the snapshot promotion spine and comparison rules"
      : `missing lines: ${missingPhase13Doc.join(", ")}`,
    { missingPhase13Doc },
    missingPhase13Doc.length === 0
      ? null
      : "Phase 13 snapshot promotion doc is incomplete"
  );

  const loginEmail = process.env.TF_PHASE13_EMAIL || process.env.TF_PHASE8_EMAIL || "admin@terrafusionmarket.com";
  const loginPassword =
    process.env.TF_PHASE13_PASSWORD || process.env.TF_PHASE8_PASSWORD || "TerraFusion2026!";

  for (const env of [
    { name: "staging", baseUrl: "https://staging.terrafusionmarket.com" },
    { name: "production", baseUrl: "https://terrafusionmarket.com" },
  ]) {
    const auth = await login(env.baseUrl, loginEmail, loginPassword);
    record(
      `${env.name}.operator.login`,
      auth.ok,
      auth.ok ? "login succeeded" : `status=${auth.status}`,
      auth.payload,
      auth.ok ? null : `${env.name} operator login failed for snapshot proof`
    );

    if (!auth.ok) continue;

    const comps = await fetchJson(
      `${env.baseUrl}/api/costforge/comps/100984010001008`,
      auth.token
    );
    const compCount = Array.isArray(comps.json?.comparables)
      ? comps.json.comparables.length
      : Array.isArray(comps.json?.comps)
        ? comps.json.comps.length
        : 0;

    record(
      `${env.name}.operator.snapshot_surface`,
      comps.status === 200 && compCount > 0,
      `status=${comps.status}, comps=${compCount}`,
      comps.json ?? comps.body,
      comps.status === 200 && compCount > 0
        ? null
        : `${env.name} operator surface is not serving promoted Benton comps`
    );
  }

  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 13 snapshot promotion spine packet",
    decision: blockers.length === 0 ? "GO" : "NO_GO",
    checks,
    summary: {
      ok: blockers.length === 0,
      failures: checks.filter((check) => !check.ok).length,
      blockers,
      promotionContract:
        "The promoted Benton artifact is a logical operational snapshot contract sourced from the PACS-connected runtime and served by Hostinger snapshot runtimes.",
    },
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");

  if (blockers.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  const outPath = parseArgs(process.argv).outPath;
  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 13 snapshot promotion spine packet",
    decision: "NO_GO",
    checks: [
      {
        name: "phase13.packet",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        payload: { stack: error instanceof Error ? error.stack : null },
        blocker: "Phase 13 snapshot promotion packet failed to execute",
      },
    ],
    summary: {
      ok: false,
      failures: 1,
      blockers: ["Phase 13 snapshot promotion packet failed to execute"],
      promotionContract:
        "The promoted Benton artifact is a logical operational snapshot contract sourced from the PACS-connected runtime and served by Hostinger snapshot runtimes.",
    },
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  process.exitCode = 1;
});
