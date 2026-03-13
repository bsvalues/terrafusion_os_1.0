#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const LOCAL_DB_PATH = "backend/src/TerraFusion.API/terrafusion-dev.db";
const STAGING_DB_PATH = "/opt/terrafusion/staging/data/terrafusion.db";
const PRODUCTION_DB_PATH = "/opt/terrafusion/production/data/terrafusion.db";
const REMOTE_PROMOTION_ROOT = "/opt/terrafusion/promotion-artifacts";
const STAGING_RECEIPT_PATH = "/opt/terrafusion/staging/current-benton-snapshot-promotion.json";
const PRODUCTION_RECEIPT_PATH = "/opt/terrafusion/production/current-benton-snapshot-promotion.json";
const EVIDENCE_DIR = path.resolve(process.cwd(), "os-platform/core/pilot/evidence");
const DEFAULT_OUT_PATH = path.resolve(
  EVIDENCE_DIR,
  "phase19-snapshot-promotion-automation.latest.json"
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
        : process.env.PHASE19_PROOF_OUT || DEFAULT_OUT_PATH,
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

function utcStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function normalizeStableFingerprint(payload) {
  return JSON.stringify({
    Properties: payload.Properties,
    PropertyAssessments: payload.PropertyAssessments,
    ComparableSales: payload.ComparableSales,
    ComparableSalesDistinctParcels: payload.ComparableSalesDistinctParcels,
    ComparableSalesFingerprint: payload.ComparableSalesFingerprint,
  });
}

async function buildLocalArtifact() {
  const artifactId = `benton-snapshot-${utcStamp()}`;
  const artifactDir = await fs.mkdtemp(path.join(os.tmpdir(), "phase19-snapshot-"));
  const snapshotPath = path.join(artifactDir, `${artifactId}.db`);

  const script = `
import sqlite3, json, hashlib, os
source = r"${path.resolve(process.cwd(), LOCAL_DB_PATH).replace(/\\/g, "\\\\")}"
snapshot = r"${snapshotPath.replace(/\\/g, "\\\\")}"
src = sqlite3.connect(f"file:{source}?mode=ro", uri=True)
dst = sqlite3.connect(snapshot)
src.backup(dst)
dst.close()
src.close()
conn = sqlite3.connect(f"file:{snapshot}?mode=ro", uri=True)
cur = conn.cursor()
result = {}
for table in ["Properties","PropertyAssessments","ComparableSales","EtlSyncJobs","CamaCharacteristics","CostMatrices"]:
    cur.execute(f"SELECT COUNT(*) FROM {table}")
    result[table] = cur.fetchone()[0]
cur.execute("SELECT COUNT(DISTINCT ParcelId) FROM ComparableSales")
result["ComparableSalesDistinctParcels"] = cur.fetchone()[0]
cur.execute("SELECT ParcelId, SalePrice, SaleDate FROM ComparableSales ORDER BY ParcelId, SaleDate, SalePrice LIMIT 5")
result["ComparableSalesFingerprint"] = cur.fetchall()
cur.execute("""
    SELECT CountyId, SourceSystem, EntityType, Status, CompletedAt
    FROM EtlSyncJobs
    ORDER BY COALESCE(CompletedAt, StartedAt) DESC, Id DESC
    LIMIT 1
""")
last_sync = cur.fetchone()
result["LatestBentonSync"] = {
    "CountyId": last_sync[0] if last_sync else None,
    "SourceSystem": last_sync[1] if last_sync else None,
    "EntityType": last_sync[2] if last_sync else None,
    "Status": last_sync[3] if last_sync else None,
    "CompletedAt": last_sync[4] if last_sync else None,
}
conn.close()
with open(snapshot, "rb") as fh:
    result["SnapshotSha256"] = hashlib.sha256(fh.read()).hexdigest()
result["SnapshotSize"] = os.path.getsize(snapshot)
print(json.dumps(result))
`;

  const result = await runCommand("python", ["-c", script]);
  if (result.code !== 0) {
    throw new Error(`Local artifact build failed: ${result.stderr || result.stdout}`);
  }

  const stats = JSON.parse(result.stdout.trim());
  const manifest = {
    artifactId,
    generatedAt: new Date().toISOString(),
    artifactKind: "benton-operational-snapshot",
    runtimeRole: "canonical_pacs_connected_benton_runtime",
    promotionMode: "parity_confirmed_no_replace_if_already_serving_same_stable_contract",
    sourceDb: path.resolve(process.cwd(), LOCAL_DB_PATH),
    snapshotFileName: path.basename(snapshotPath),
    snapshotSha256: stats.SnapshotSha256,
    snapshotSize: stats.SnapshotSize,
    stableContract: {
      Properties: stats.Properties,
      PropertyAssessments: stats.PropertyAssessments,
      ComparableSales: stats.ComparableSales,
      ComparableSalesDistinctParcels: stats.ComparableSalesDistinctParcels,
      ComparableSalesFingerprint: stats.ComparableSalesFingerprint,
      CamaCharacteristics: stats.CamaCharacteristics,
      CostMatrices: stats.CostMatrices,
    },
    latestBentonSync: stats.LatestBentonSync,
    notes: [
      "Hostinger runtimes are snapshot-only.",
      "This artifact is the promoted Benton logical operational snapshot contract.",
      "Phase 19 uses a local promotion-attestation signature. Authority hardening is deferred to Phase 22.",
    ],
  };

  return { artifactId, artifactDir, snapshotPath, manifest };
}

function createSignatureEnvelope(manifestText) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const signature = crypto.sign(null, Buffer.from(manifestText, "utf8"), privateKey);
  const verified = crypto.verify(null, Buffer.from(manifestText, "utf8"), publicKey, signature);

  return {
    envelope: {
      algorithm: "ed25519",
      scope: "phase19_local_promotion_attestation",
      generatedAt: new Date().toISOString(),
      publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
      signatureBase64: signature.toString("base64"),
      verified,
      note: "This is a local automation attestation signature, not a hardened promotion authority credential.",
    },
    verified,
  };
}

async function writeLocalArtifacts({ manifest, snapshotPath }) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const manifestPath = path.join(EVIDENCE_DIR, "phase19-promotion-manifest.latest.json");
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  await fs.writeFile(manifestPath, manifestText, "utf8");

  const manifestSha256 = sha256Buffer(Buffer.from(manifestText, "utf8"));
  const manifestShaPath = path.join(EVIDENCE_DIR, "phase19-promotion-manifest.latest.sha256");
  await fs.writeFile(manifestShaPath, `${manifestSha256}  ${path.basename(manifestPath)}\n`, "utf8");

  const snapshotBuffer = await fs.readFile(snapshotPath);
  const snapshotSha256 = sha256Buffer(snapshotBuffer);
  const snapshotShaPath = path.join(EVIDENCE_DIR, "phase19-promotion-snapshot.latest.sha256");
  await fs.writeFile(snapshotShaPath, `${snapshotSha256}  ${path.basename(snapshotPath)}\n`, "utf8");

  const { envelope, verified } = createSignatureEnvelope(manifestText);
  if (!verified) {
    throw new Error("Promotion signature verification failed during artifact creation");
  }

  const signaturePath = path.join(EVIDENCE_DIR, "phase19-promotion-signature.latest.json");
  await fs.writeFile(signaturePath, `${JSON.stringify(envelope, null, 2)}\n`, "utf8");

  return {
    manifestPath,
    manifestShaPath,
    snapshotShaPath,
    signaturePath,
    manifestSha256,
    snapshotSha256,
    signatureEnvelope: envelope,
  };
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
    for table in ["Properties","PropertyAssessments","ComparableSales","EtlSyncJobs","CamaCharacteristics","CostMatrices"]:
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

async function publishRemoteArtifact({ artifactId, snapshotPath, manifestPath, manifestShaPath, snapshotShaPath, signaturePath }) {
  const remoteDir = `${REMOTE_PROMOTION_ROOT}/${artifactId}`;
  const mkdirResult = await runCommand("ssh", [
    "terrafusion-hostinger",
    `mkdir -p ${REMOTE_PROMOTION_ROOT} ${remoteDir}`,
  ]);
  if (mkdirResult.code !== 0) {
    throw new Error(`Failed to create remote promotion catalog: ${mkdirResult.stderr || mkdirResult.stdout}`);
  }

  const copyResult = await runCommand("scp", [
    snapshotPath,
    manifestPath,
    manifestShaPath,
    snapshotShaPath,
    signaturePath,
    `terrafusion-hostinger:${remoteDir}/`,
  ]);
  if (copyResult.code !== 0) {
    throw new Error(`Failed to upload promotion artifact: ${copyResult.stderr || copyResult.stdout}`);
  }

  const verifyResult = await runCommand("ssh", [
    "terrafusion-hostinger",
    `test -f ${remoteDir}/${path.basename(snapshotPath)} && test -f ${remoteDir}/${path.basename(manifestPath)} && test -f ${remoteDir}/${path.basename(signaturePath)} && echo ok`,
  ]);
  if (verifyResult.code !== 0 || !verifyResult.stdout.includes("ok")) {
    throw new Error(`Remote promotion catalog verification failed: ${verifyResult.stderr || verifyResult.stdout}`);
  }

  return {
    remoteDir,
    snapshotPath: `${remoteDir}/${path.basename(snapshotPath)}`,
    manifestPath: `${remoteDir}/${path.basename(manifestPath)}`,
    manifestShaPath: `${remoteDir}/${path.basename(manifestShaPath)}`,
    snapshotShaPath: `${remoteDir}/${path.basename(snapshotShaPath)}`,
    signaturePath: `${remoteDir}/${path.basename(signaturePath)}`,
  };
}

async function writeRemoteReceipts({ artifactId, manifest, remoteArtifactPaths }) {
  const baseReceipt = {
    artifactId,
    artifactKind: manifest.artifactKind,
    promotionMode: "parity_confirmed_no_replace",
    promotedAt: new Date().toISOString(),
    snapshotSha256: manifest.snapshotSha256,
    manifestStableContract: manifest.stableContract,
    remoteCatalog: remoteArtifactPaths.remoteDir,
    manifestPath: remoteArtifactPaths.manifestPath,
    signaturePath: remoteArtifactPaths.signaturePath,
    note: "Live Benton runtimes already matched the promoted stable snapshot contract, so Phase 19 recorded a no-replace promotion receipt.",
  };

  const stagingReceipt = {
    ...baseReceipt,
    targetEnvironment: "staging",
    targetReceiptPath: STAGING_RECEIPT_PATH,
  };
  const productionReceipt = {
    ...baseReceipt,
    targetEnvironment: "production",
    targetReceiptPath: PRODUCTION_RECEIPT_PATH,
  };

  const stagingReceiptPath = path.join(EVIDENCE_DIR, "phase19-staging-promotion-receipt.latest.json");
  const productionReceiptPath = path.join(EVIDENCE_DIR, "phase19-production-promotion-receipt.latest.json");
  await fs.writeFile(stagingReceiptPath, `${JSON.stringify(stagingReceipt, null, 2)}\n`, "utf8");
  await fs.writeFile(productionReceiptPath, `${JSON.stringify(productionReceipt, null, 2)}\n`, "utf8");

  const copyResult = await runCommand("scp", [
    stagingReceiptPath,
    productionReceiptPath,
    `terrafusion-hostinger:/tmp/`,
  ]);
  if (copyResult.code !== 0) {
    throw new Error(`Failed to stage promotion receipts on hostinger: ${copyResult.stderr || copyResult.stdout}`);
  }

  const publishResult = await runCommand("ssh", [
    "terrafusion-hostinger",
    `install -m 644 /tmp/${path.basename(stagingReceiptPath)} ${STAGING_RECEIPT_PATH} && install -m 644 /tmp/${path.basename(productionReceiptPath)} ${PRODUCTION_RECEIPT_PATH} && echo ok`,
  ]);
  if (publishResult.code !== 0 || !publishResult.stdout.includes("ok")) {
    throw new Error(`Failed to publish promotion receipts on hostinger: ${publishResult.stderr || publishResult.stdout}`);
  }

  return {
    stagingReceipt,
    productionReceipt,
    stagingReceiptPath,
    productionReceiptPath,
  };
}

async function verifyRemoteReceipts() {
  const result = await runCommand("ssh", [
    "terrafusion-hostinger",
    `python3 - <<'PY'
import json
paths = {
  "staging": "${STAGING_RECEIPT_PATH}",
  "production": "${PRODUCTION_RECEIPT_PATH}",
}
out = {}
for name, receipt_path in paths.items():
    with open(receipt_path, "r", encoding="utf-8") as fh:
        out[name] = json.load(fh)
print(json.dumps(out))
PY`,
  ]);
  if (result.code !== 0) {
    throw new Error(`Failed to verify remote promotion receipts: ${result.stderr || result.stdout}`);
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

  const phase18 = await runCommand(commandFor("pnpm"), ["run", "proof:phase18"]);
  record(
    "phase18.runtime_productization",
    phase18.code === 0,
    `exit=${phase18.code}`,
    { stdout: phase18.stdout, stderr: phase18.stderr },
    phase18.code === 0 ? null : "Phase 18 proof failed"
  );

  const localArtifact = await buildLocalArtifact();
  const localFiles = await writeLocalArtifacts(localArtifact);
  record(
    "phase19.local.artifact_generated",
    true,
    `artifactId=${localArtifact.artifactId}`,
    {
      artifactId: localArtifact.artifactId,
      snapshotPath: localArtifact.snapshotPath,
      manifestPath: localFiles.manifestPath,
      manifestShaPath: localFiles.manifestShaPath,
      snapshotShaPath: localFiles.snapshotShaPath,
      signaturePath: localFiles.signaturePath,
      stableContract: localArtifact.manifest.stableContract,
      latestBentonSync: localArtifact.manifest.latestBentonSync,
    },
    null
  );

  record(
    "phase19.local.signature_attestation",
    localFiles.signatureEnvelope.verified === true,
    `verified=${localFiles.signatureEnvelope.verified}`,
    {
      algorithm: localFiles.signatureEnvelope.algorithm,
      scope: localFiles.signatureEnvelope.scope,
      note: localFiles.signatureEnvelope.note,
      publicKeyPem: localFiles.signatureEnvelope.publicKeyPem,
      signatureBase64: localFiles.signatureEnvelope.signatureBase64,
    },
    localFiles.signatureEnvelope.verified
      ? null
      : "Local promotion attestation signature did not verify"
  );

  const remoteArtifactPaths = await publishRemoteArtifact({
    artifactId: localArtifact.artifactId,
    snapshotPath: localArtifact.snapshotPath,
    manifestPath: localFiles.manifestPath,
    manifestShaPath: localFiles.manifestShaPath,
    snapshotShaPath: localFiles.snapshotShaPath,
    signaturePath: localFiles.signaturePath,
  });
  record(
    "phase19.remote.catalog_publish",
    true,
    `remoteDir=${remoteArtifactPaths.remoteDir}`,
    remoteArtifactPaths,
    null
  );

  const remoteManifests = await getRemoteSnapshotManifests();
  const stagingStableMatch =
    normalizeStableFingerprint(remoteManifests.staging) ===
    normalizeStableFingerprint(localArtifact.manifest.stableContract);
  const productionStableMatch =
    normalizeStableFingerprint(remoteManifests.production) ===
    normalizeStableFingerprint(localArtifact.manifest.stableContract);

  record(
    "phase19.remote.staging_parity",
    stagingStableMatch,
    stagingStableMatch
      ? "staging already serves the promoted Benton stable snapshot contract"
      : "staging stable snapshot contract differs from the promoted artifact",
    { local: localArtifact.manifest.stableContract, staging: remoteManifests.staging },
    stagingStableMatch
      ? null
      : "Staging is not serving the promoted Benton stable snapshot contract"
  );

  record(
    "phase19.remote.production_parity",
    productionStableMatch,
    productionStableMatch
      ? "production already serves the promoted Benton stable snapshot contract"
      : "production stable snapshot contract differs from the promoted artifact",
    { local: localArtifact.manifest.stableContract, production: remoteManifests.production },
    productionStableMatch
      ? null
      : "Production is not serving the promoted Benton stable snapshot contract"
  );

  if (stagingStableMatch && productionStableMatch) {
    const receipts = await writeRemoteReceipts({
      artifactId: localArtifact.artifactId,
      manifest: localArtifact.manifest,
      remoteArtifactPaths,
    });
    const remoteReceipts = await verifyRemoteReceipts();

    const receiptOk =
      remoteReceipts.staging?.artifactId === localArtifact.artifactId &&
      remoteReceipts.production?.artifactId === localArtifact.artifactId;
    record(
      "phase19.remote.promotion_receipts",
      receiptOk,
      receiptOk
        ? "staging and production promotion receipts reference the new artifact"
        : "promotion receipts do not reference the new artifact",
      {
        localReceipts: {
          staging: receipts.stagingReceipt,
          production: receipts.productionReceipt,
        },
        remoteReceipts,
      },
      receiptOk
        ? null
        : "Promotion receipts were not published correctly on Hostinger"
    );
  }

  const phase19Doc = await readText(
    "os-platform/core/pilot/ops/phase19-snapshot-promotion-automation.md"
  );
  const hostingerCanon = await readText(
    "os-platform/core/pilot/ops/hostinger-control-plane.md"
  );
  const checklist = await readText(
    "os-platform/core/pilot/ops/post-go-live-phase-execution-checklist.md"
  );

  const missingPhase19Doc = includesAll(phase19Doc, [
    "# Phase 19 Snapshot Promotion Automation",
    "Phase 19 generates a Benton promotion artifact bundle from the canonical PACS-connected runtime.",
    "Current automation mode is parity-confirmed promotion with no live DB replacement when staging and production already match the promoted stable contract.",
    "Phase 22 will harden signer authority and promotion credentials; Phase 19 only requires truthful local attestation and repeatable promotion receipts.",
  ]);
  record(
    "governance.phase19_doc",
    missingPhase19Doc.length === 0,
    missingPhase19Doc.length === 0
      ? "Phase 19 runbook records the snapshot promotion automation contract"
      : `missing lines: ${missingPhase19Doc.join("; ")}`,
    { missingPhase19Doc },
    missingPhase19Doc.length === 0
      ? null
      : "Phase 19 runbook is incomplete"
  );

  const missingHostingerCanon = includesAll(hostingerCanon, [
    "## Phase 19 Snapshot Promotion Automation (2026-03-13)",
    "The Benton promotion artifact is published to `/opt/terrafusion/promotion-artifacts/<artifactId>/` on the Hostinger VPS.",
    "Current automation mode is parity-confirmed no-replace promotion when staging and production already serve the promoted stable contract.",
    "Promotion receipts are written to `/opt/terrafusion/staging/current-benton-snapshot-promotion.json` and `/opt/terrafusion/production/current-benton-snapshot-promotion.json`.",
  ]);
  record(
    "governance.hostinger.phase19_canon",
    missingHostingerCanon.length === 0,
    missingHostingerCanon.length === 0
      ? "Hostinger control plane records the Phase 19 automation truth"
      : `missing lines: ${missingHostingerCanon.join("; ")}`,
    { missingHostingerCanon },
    missingHostingerCanon.length === 0
      ? null
      : "Hostinger control plane is missing Phase 19 automation truth"
  );

  const missingChecklistLines = includesAll(checklist, [
    "## Phase 19 -- Snapshot Promotion Automation",
    "Status: COMPLETE (`GO`)",
    "Proof:",
    "phase19-snapshot-promotion-automation.latest.json",
    "## Phase 20 -- Benton Acceptance / UAT Packet",
  ]);
  record(
    "governance.post_go_live_checklist",
    missingChecklistLines.length === 0,
    missingChecklistLines.length === 0
      ? "Post-go-live checklist tracks Phase 19 completion and Phase 20 handoff"
      : `missing lines: ${missingChecklistLines.join("; ")}`,
    { missingChecklistLines },
    missingChecklistLines.length === 0
      ? null
      : "Post-go-live checklist does not reflect Phase 19 completion"
  );

  const decision = blockers.length === 0 ? "GO" : "NO_GO";
  const packet = {
    generatedAt: new Date().toISOString(),
    scope: "Phase 19 snapshot promotion automation packet",
    decision,
    checks,
    summary: {
      ok: blockers.length === 0,
      failures: checks.filter((check) => !check.ok).length,
      blockers,
      automationTruth:
        "Phase 19 GO means the Benton promotion artifact is generated, checksummed, locally attested, published to the Hostinger promotion catalog, and tied to staging/production receipts through one repeatable automation path.",
      promotionMode:
        "Current automation mode is parity-confirmed no-replace promotion because the deployed Hostinger runtimes already match the promoted stable Benton contract.",
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
    scope: "Phase 19 snapshot promotion automation packet",
    decision: "NO_GO",
    checks: [
      {
        name: "phase19.packet",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        payload: { stack: error instanceof Error ? error.stack : null },
        blocker: "Phase 19 automation packet crashed",
      },
    ],
    summary: {
      ok: false,
      failures: 1,
      blockers: ["Phase 19 automation packet crashed"],
      automationTruth:
        "Phase 19 GO means the Benton promotion artifact is generated, checksummed, locally attested, published to the Hostinger promotion catalog, and tied to staging/production receipts through one repeatable automation path.",
      promotionMode:
        "Current automation mode is parity-confirmed no-replace promotion because the deployed Hostinger runtimes already match the promoted stable Benton contract.",
    },
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  console.error(error);
  process.exitCode = 1;
});
