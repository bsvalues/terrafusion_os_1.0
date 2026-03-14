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
  "os-platform/core/pilot/evidence/phase15-data-quality.latest.json"
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
        : process.env.PHASE15_PROOF_OUT || DEFAULT_OUT_PATH,
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

function metricFingerprint(payload) {
  return JSON.stringify({
    properties: payload.properties,
    assessments: payload.assessments,
    comparables: payload.comparables,
    compDistinctParcels: payload.compDistinctParcels,
    compPlaceholderPacs: payload.compPlaceholderPacs,
    compPlaceholderUndetermined: payload.compPlaceholderUndetermined,
    compNullNeighborhood: payload.compNullNeighborhood,
    compNullPropertyType: payload.compNullPropertyType,
    compNullSaleDate: payload.compNullSaleDate,
    compZeroPrice: payload.compZeroPrice,
    compUnverified: payload.compUnverified,
    compQualified: payload.compQualified,
    compNonArmsLength: payload.compNonArmsLength,
    compUnknownQualification: payload.compUnknownQualification,
    camaCharacteristics: payload.camaCharacteristics,
    costMatrices: payload.costMatrices,
  });
}

async function getLocalMetrics() {
  const script = `
import sqlite3, json, os, tempfile
source = r"${path.resolve(process.cwd(), LOCAL_DB_PATH).replace(/\\/g, "\\\\")}"
tmp_dir = tempfile.gettempdir()
snapshot = os.path.join(tmp_dir, "phase15-local-quality-snapshot.db")
src = sqlite3.connect(f"file:{source}?mode=ro", uri=True)
dst = sqlite3.connect(snapshot)
src.backup(dst)
dst.close()
src.close()
conn = sqlite3.connect(f"file:{snapshot}?mode=ro", uri=True)
cur = conn.cursor()
result = {}
queries = {
    "properties": "select count(*) from Properties",
    "assessments": "select count(*) from PropertyAssessments",
    "comparables": "select count(*) from ComparableSales",
    "compDistinctParcels": "select count(distinct ParcelId) from ComparableSales",
    "compPlaceholderPacs": "select count(*) from ComparableSales where Address like 'PACS %'",
    "compPlaceholderUndetermined": "select count(*) from ComparableSales where upper(Address) like '%UNDETERMINED%'",
    "compNullNeighborhood": "select count(*) from ComparableSales where Neighborhood is null or trim(Neighborhood)=''",
    "compNullPropertyType": "select count(*) from ComparableSales where PropertyType is null or trim(PropertyType)=''",
    "compNullSaleDate": "select count(*) from ComparableSales where SaleDate is null or trim(SaleDate)=''",
    "compZeroPrice": "select count(*) from ComparableSales where cast(SalePrice as real) <= 0",
    "compUnverified": "select count(*) from ComparableSales where ifnull(IsVerified,0)=0",
    "compQualified": "select count(*) from ComparableSales where lower(ifnull(SaleQualification,''))='qualified'",
    "compNonArmsLength": "select count(*) from ComparableSales where lower(ifnull(SaleQualification,''))='non-arms-length'",
    "compUnknownQualification": "select count(*) from ComparableSales where lower(ifnull(SaleQualification,'')) not in ('qualified','non-arms-length')",
    "compNullGrossLivingArea": "select count(*) from ComparableSales where GrossLivingArea is null or trim(GrossLivingArea)=''",
    "compNullLotSizeSqft": "select count(*) from ComparableSales where LotSizeSqft is null or trim(LotSizeSqft)=''",
    "compNullYearBuilt": "select count(*) from ComparableSales where YearBuilt is null",
    "compNullBedrooms": "select count(*) from ComparableSales where Bedrooms is null",
    "compNullBathrooms": "select count(*) from ComparableSales where Bathrooms is null",
    "camaCharacteristics": "select count(*) from CamaCharacteristics",
    "costMatrices": "select count(*) from CostMatrices",
    "etlSyncJobs": "select count(*) from EtlSyncJobs",
}
for key, sql in queries.items():
    cur.execute(sql)
    result[key] = cur.fetchone()[0]
cur.execute("select ifnull(Neighborhood,'<NULL>') as n, count(*) as c from ComparableSales group by ifnull(Neighborhood,'<NULL>') order by c desc limit 10")
result["topNeighborhoods"] = cur.fetchall()
cur.execute("select ifnull(SaleQualification,'<NULL>') as q, count(*) as c from ComparableSales group by ifnull(SaleQualification,'<NULL>') order by c desc")
result["saleQualifications"] = cur.fetchall()
cur.execute("select Address, ParcelId, SalePrice, SaleDate from ComparableSales where Address like 'PACS %' order by ParcelId limit 10")
result["samplePlaceholderAddresses"] = cur.fetchall()
conn.close()
print(json.dumps(result))
`;

  const result = await runCommand("python", ["-c", script]);
  if (result.code !== 0) {
    throw new Error(`Local quality metrics failed: ${result.stderr || result.stdout}`);
  }

  return JSON.parse(result.stdout.trim());
}

async function getRemoteMetrics() {
  const remoteScript = `
import sqlite3, json
from pathlib import Path
paths = {
    "staging": Path("${STAGING_DB_PATH}"),
    "production": Path("${PRODUCTION_DB_PATH}"),
}
queries = {
    "properties": "select count(*) from Properties",
    "assessments": "select count(*) from PropertyAssessments",
    "comparables": "select count(*) from ComparableSales",
    "compDistinctParcels": "select count(distinct ParcelId) from ComparableSales",
    "compPlaceholderPacs": "select count(*) from ComparableSales where Address like 'PACS %'",
    "compPlaceholderUndetermined": "select count(*) from ComparableSales where upper(Address) like '%UNDETERMINED%'",
    "compNullNeighborhood": "select count(*) from ComparableSales where Neighborhood is null or trim(Neighborhood)=''",
    "compNullPropertyType": "select count(*) from ComparableSales where PropertyType is null or trim(PropertyType)=''",
    "compNullSaleDate": "select count(*) from ComparableSales where SaleDate is null or trim(SaleDate)=''",
    "compZeroPrice": "select count(*) from ComparableSales where cast(SalePrice as real) <= 0",
    "compUnverified": "select count(*) from ComparableSales where ifnull(IsVerified,0)=0",
    "compQualified": "select count(*) from ComparableSales where lower(ifnull(SaleQualification,''))='qualified'",
    "compNonArmsLength": "select count(*) from ComparableSales where lower(ifnull(SaleQualification,''))='non-arms-length'",
    "compUnknownQualification": "select count(*) from ComparableSales where lower(ifnull(SaleQualification,'')) not in ('qualified','non-arms-length')",
    "compNullGrossLivingArea": "select count(*) from ComparableSales where GrossLivingArea is null or trim(GrossLivingArea)=''",
    "compNullLotSizeSqft": "select count(*) from ComparableSales where LotSizeSqft is null or trim(LotSizeSqft)=''",
    "compNullYearBuilt": "select count(*) from ComparableSales where YearBuilt is null",
    "compNullBedrooms": "select count(*) from ComparableSales where Bedrooms is null",
    "compNullBathrooms": "select count(*) from ComparableSales where Bathrooms is null",
    "camaCharacteristics": "select count(*) from CamaCharacteristics",
    "costMatrices": "select count(*) from CostMatrices",
    "etlSyncJobs": "select count(*) from EtlSyncJobs",
}
out = {}
for name, source in paths.items():
    conn = sqlite3.connect(f"file:{source}?mode=ro", uri=True)
    cur = conn.cursor()
    result = {}
    for key, sql in queries.items():
        cur.execute(sql)
        result[key] = cur.fetchone()[0]
    cur.execute("select ifnull(Neighborhood,'<NULL>') as n, count(*) as c from ComparableSales group by ifnull(Neighborhood,'<NULL>') order by c desc limit 10")
    result["topNeighborhoods"] = cur.fetchall()
    cur.execute("select ifnull(SaleQualification,'<NULL>') as q, count(*) as c from ComparableSales group by ifnull(SaleQualification,'<NULL>') order by c desc")
    result["saleQualifications"] = cur.fetchall()
    out[name] = result
    conn.close()
print(json.dumps(out))
`;

  const result = await runCommand("ssh", [
    "terrafusion-hostinger",
    `python3 - <<'PY'\n${remoteScript}\nPY`,
  ]);

  if (result.code !== 0) {
    throw new Error(`Remote quality metrics failed: ${result.stderr || result.stdout}`);
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

  const phase14 = await runCommand(commandFor("pnpm"), ["run", "proof:phase14"]);
  record(
    "phase14.operator_workflow",
    phase14.code === 0,
    `exit=${phase14.code}`,
    { stdout: phase14.stdout, stderr: phase14.stderr },
    phase14.code === 0 ? null : "Phase 14 operator workflow proof failed"
  );

  const localMetrics = await getLocalMetrics();
  const remoteMetrics = await getRemoteMetrics();

  const comparableStructuralOk =
    localMetrics.comparables > 0 &&
    localMetrics.compNullPropertyType === 0 &&
    localMetrics.compNullSaleDate === 0 &&
    localMetrics.compZeroPrice === 0 &&
    localMetrics.compUnverified === 0 &&
    localMetrics.compUnknownQualification === 0;

  record(
    "quality.local.comparable_sales_structural_integrity",
    comparableStructuralOk,
    comparableStructuralOk
      ? "Comparable sales have price/date/type/verification integrity and explicit qualification labels"
      : "Comparable sales are missing structural integrity fields or qualification labels",
    localMetrics,
    comparableStructuralOk
      ? null
      : "ComparableSales still contains structurally incomplete rows"
  );

  const placeholderRatio = localMetrics.comparables
    ? localMetrics.compPlaceholderPacs / localMetrics.comparables
    : 1;
  const placeholderSurfaceOk =
    placeholderRatio <= 0.02 && localMetrics.compPlaceholderUndetermined <= 5;

  record(
    "quality.local.placeholder_surface",
    placeholderSurfaceOk,
    `pacsPlaceholder=${localMetrics.compPlaceholderPacs} (${(placeholderRatio * 100).toFixed(2)}%), undetermined=${localMetrics.compPlaceholderUndetermined}`,
    {
      pacsPlaceholder: localMetrics.compPlaceholderPacs,
      placeholderRatio,
      undetermined: localMetrics.compPlaceholderUndetermined,
      samplePlaceholderAddresses: localMetrics.samplePlaceholderAddresses,
    },
    placeholderSurfaceOk
      ? null
      : "ComparableSales still leaks too many placeholder addresses into the Benton operator surface"
  );

  const enrichmentCoverageOk =
    localMetrics.compNullGrossLivingArea < localMetrics.comparables &&
    localMetrics.compNullLotSizeSqft < localMetrics.comparables &&
    localMetrics.compNullYearBuilt < localMetrics.comparables &&
    localMetrics.compNullBedrooms < localMetrics.comparables &&
    localMetrics.compNullBathrooms < localMetrics.comparables;

  record(
    "quality.local.comparable_sales_enrichment",
    enrichmentCoverageOk,
    `nullGLA=${localMetrics.compNullGrossLivingArea}, nullLot=${localMetrics.compNullLotSizeSqft}, nullYearBuilt=${localMetrics.compNullYearBuilt}, nullBedrooms=${localMetrics.compNullBedrooms}, nullBathrooms=${localMetrics.compNullBathrooms}`,
    localMetrics,
    enrichmentCoverageOk
      ? null
      : "ComparableSales is still missing the enrichment fields needed for subject-aware valuation quality"
  );

  const operationalTablesOk =
    localMetrics.camaCharacteristics > 0 && localMetrics.costMatrices > 0;

  record(
    "quality.local.valuation_operational_completeness",
    operationalTablesOk,
    `camaCharacteristics=${localMetrics.camaCharacteristics}, costMatrices=${localMetrics.costMatrices}`,
    localMetrics,
    operationalTablesOk
      ? null
      : "Valuation-side operational tables remain empty on the canonical Benton runtime"
  );

  const stagingParityOk =
    metricFingerprint(remoteMetrics.staging) === metricFingerprint(localMetrics);
  const productionParityOk =
    metricFingerprint(remoteMetrics.production) === metricFingerprint(localMetrics);

  record(
    "quality.staging.parity",
    stagingParityOk,
    stagingParityOk
      ? "Staging quality fingerprint matches the canonical Benton runtime"
      : "Staging quality fingerprint differs from the canonical Benton runtime",
    {
      local: localMetrics,
      staging: remoteMetrics.staging,
    },
    stagingParityOk
      ? null
      : "Staging runtime quality metrics drift from the canonical Benton runtime"
  );

  record(
    "quality.production.parity",
    productionParityOk,
    productionParityOk
      ? "Production quality fingerprint matches the canonical Benton runtime"
      : "Production quality fingerprint differs from the canonical Benton runtime",
    {
      local: localMetrics,
      production: remoteMetrics.production,
    },
    productionParityOk
      ? null
      : "Production runtime quality metrics drift from the canonical Benton runtime"
  );

  const hostingerCanon = await readText(
    "os-platform/core/pilot/ops/hostinger-control-plane.md"
  );
  const phase15Doc = await readText(
    "os-platform/core/pilot/ops/phase15-data-quality-and-completeness.md"
  );

  const missingHostingerCanon = includesAll(hostingerCanon, [
    "## Phase 15 Data Quality and Operational Completeness (2026-03-13)",
    "The Benton snapshot runtimes currently carry the same data-quality profile as the canonical local Benton runtime.",
    "Phase 15 reached `GO` after the canonical Benton snapshot carried non-empty `CamaCharacteristics` and `CostMatrices`, and comparable sales retained subject-aware enrichment coverage.",
  ]);
  record(
    "governance.hostinger_control_plane.phase15_truth",
    missingHostingerCanon.length === 0,
    missingHostingerCanon.length === 0
      ? "Hostinger control plane records the Phase 15 quality truth"
      : `Missing hostinger Phase 15 canon lines: ${missingHostingerCanon.join("; ")}`,
    { missingHostingerCanon },
    missingHostingerCanon.length === 0
      ? null
      : "Hostinger control plane does not record the Phase 15 data-quality truth"
  );

  const missingPhase15Doc = includesAll(phase15Doc, [
    "# Phase 15 Data Quality and Operational Completeness",
    "PACS improvement-level matrices must be converted into TerraFusion `CostMatrices`; this phase does not accept Marshall & Swift substitution or PACS-direct shortcuts.",
    "`ComparableSales` is structurally valid and now carries enough Benton enrichment coverage for subject-aware valuation quality to clear the Phase 15 gate.",
    "`CamaCharacteristics` and `CostMatrices` are populated on the canonical Benton runtime from PACS improvement/profile truth.",
    "Phase 15 reaches GO only when the Benton data-quality packet passes without enrichment or completeness blockers.",
  ]);
  record(
    "governance.phase15_doc",
    missingPhase15Doc.length === 0,
    missingPhase15Doc.length === 0
      ? "Phase 15 data-quality doc records the canonical boundary and completion rule"
      : `Missing Phase 15 doc lines: ${missingPhase15Doc.join("; ")}`,
    { missingPhase15Doc },
    missingPhase15Doc.length === 0
      ? null
      : "Phase 15 data-quality doc is out of sync with the proof packet"
  );

  const decision = blockers.length === 0 ? "GO" : "NO_GO";
  const summary = {
    generatedAt: new Date().toISOString(),
    decision,
    blockers,
    metrics: {
      local: localMetrics,
      staging: remoteMetrics.staging,
      production: remoteMetrics.production,
    },
    checks,
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(`\n[phase15] wrote proof packet to ${outPath}`);
  console.log(`[phase15] decision=${decision}`);

  if (decision !== "GO") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[phase15] fatal", error);
  process.exitCode = 1;
});
