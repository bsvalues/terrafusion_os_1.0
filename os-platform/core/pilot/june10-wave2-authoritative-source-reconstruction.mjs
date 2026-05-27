#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_CROSSWALK = path.join(repoRoot, "generated", "truth", "washington-39-county-data-crosswalk.json");
const DEFAULT_EVIDENCE_ROOT = path.join(repoRoot, "os-platform", "core", "pilot", "evidence");
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave2-authoritative-source-reconstruction.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave2-authoritative-source-reconstruction.latest.md"
);

const WAVE2 = ["Kitsap", "Pierce", "Klickitat", "Okanogan", "San Juan"];
const FIPS_BY_COUNTY = {
  Kitsap: "53035",
  Pierce: "53053",
  Klickitat: "53039",
  Okanogan: "53047",
  "San Juan": "53055"
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index]?.startsWith("--")) continue;
    const key = argv[index].slice(2);
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

function collectFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const current = path.join(root, entry.name);
    return entry.isDirectory() ? collectFiles(current) : [current];
  });
}

function countyNeedle(county) {
  return county.toLowerCase().replace(/\s+/g, "[-_ ]?");
}

function countyFileRegex(county) {
  return new RegExp(countyNeedle(county), "i");
}

export function sourceArtifactClass(filePath) {
  const text = String(filePath ?? "").toLowerCase();
  if (/frontend\/|frontend\\|washingtonlaunchapi|api_or_ui|ui/.test(text)) return "api_ui_reference";
  if (
    /source-snapshot-receipt|parcel.*inventory|inventory.*parcel|parcel.*source.*receipt|source.*parcel.*receipt|parcel.*snapshot/.test(
      text
    ) &&
    !/sale|sales|comparable|delta|adjudication/.test(text)
  ) {
    return "authoritative_parcel_receipt";
  }
  if (/sale|sales|comparable|transfer|history|atip/.test(text)) return "secondary_sales_or_comparable";
  if (/county-intelligence|intelligence|analysis|valuation|extraction|local/.test(text)) return "local_intelligence_only";
  return "unknown";
}

export function sourceSignalSummary(row) {
  const text = [
    row.acquisitionFamily,
    row.primarySalesSource,
    row.fallbackSource,
    row.gisMapSurface,
    row.officialAssessorBaseUrl,
    ...(row.evidenceFiles ?? []),
    ...(row.payloadFiles ?? []),
    ...(row.localDataFiles ?? [])
  ]
    .filter(Boolean)
    .join(" ");
  const lower = text.toLowerCase();
  const signals = [];
  const parcelPatterns = [
    "parcel search",
    "parcel/property",
    "property records",
    "taxsifter",
    "gis",
    "map",
    "open data",
    "data export",
    "downloadable assessor",
    "txt data"
  ];
  for (const pattern of parcelPatterns) {
    if (lower.includes(pattern)) signals.push(pattern);
  }
  const salesPatterns = ["sale", "sales", "comparable", "transfer history", "atip"];
  const salesSignals = salesPatterns.filter((pattern) => lower.includes(pattern));
  return {
    hasParcelInventorySignal: signals.length > 0,
    hasSalesOnlySignal: salesSignals.length > 0,
    signals,
    salesSignals
  };
}

export function classifyAuthoritativeSourcePosture({
  authoritativeReceiptCount,
  hasParcelInventorySignal,
  secondaryEvidenceCount,
  localIntelligenceCount
}) {
  if (authoritativeReceiptCount > 0) return "authoritative_source_receipt_found";
  if (hasParcelInventorySignal) return "authoritative_source_recapture_possible";
  if (secondaryEvidenceCount > 0) return "secondary_evidence_only";
  if (localIntelligenceCount > 0) return "blocked_source_access";
  return "blocked_source_access";
}

function artifactSummary(filePath) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
  return {
    path: path.isAbsolute(filePath) ? repoRelative(filePath) : filePath.replaceAll(path.sep, "/"),
    exists: fs.existsSync(absolute),
    sizeBytes: fs.existsSync(absolute) ? fs.statSync(absolute).size : null,
    sha256: fs.existsSync(absolute) ? sha256File(absolute) : null,
    artifactClass: sourceArtifactClass(filePath)
  };
}

function contextualArtifactSummary(filePath, county) {
  const summary = artifactSummary(filePath);
  if (
    summary.artifactClass === "unknown" &&
    (county.payloadFiles ?? []).includes(filePath) &&
    sourceSignalSummary(county).hasSalesOnlySignal
  ) {
    return { ...summary, artifactClass: "secondary_sales_or_comparable" };
  }
  return summary;
}

function blockersFor(posture, counts) {
  const blockers = [];
  if (posture !== "authoritative_source_receipt_found") {
    blockers.push("No authoritative parcel inventory receipt/source manifest is present for this county.");
  }
  if (posture === "secondary_evidence_only") {
    blockers.push("Available artifacts are secondary sales/comparable evidence and cannot certify canonical parcel inventory lineage.");
  }
  if (posture === "blocked_source_access") {
    blockers.push("No governed receipt-grade parcel inventory source or recapture path is proven in repo evidence.");
  }
  if (counts.secondaryEvidenceCount > 0) {
    blockers.push("Secondary artifacts may support identity comparison only; they do not prove canonical tf_parcel load lineage.");
  }
  return blockers;
}

export function buildCountyReconstruction({ county, discoveredFiles }) {
  const fileRefs = [
    ...(county.payloadFiles ?? []),
    ...(county.localDataFiles ?? []),
    ...(county.evidenceFiles ?? []),
    ...discoveredFiles
  ];
  const artifacts = [...new Set(fileRefs)].map((filePath) => contextualArtifactSummary(filePath, county));
  const authoritativeReceipts = artifacts.filter((artifact) => artifact.artifactClass === "authoritative_parcel_receipt");
  const secondaryEvidence = artifacts.filter((artifact) => artifact.artifactClass === "secondary_sales_or_comparable");
  const localIntelligence = artifacts.filter((artifact) => artifact.artifactClass === "local_intelligence_only");
  const signals = sourceSignalSummary(county);
  const posture = classifyAuthoritativeSourcePosture({
    authoritativeReceiptCount: authoritativeReceipts.length,
    hasParcelInventorySignal: signals.hasParcelInventorySignal,
    secondaryEvidenceCount: secondaryEvidence.length,
    localIntelligenceCount: localIntelligence.length
  });
  const counts = {
    authoritativeReceiptCount: authoritativeReceipts.length,
    secondaryEvidenceCount: secondaryEvidence.length,
    localIntelligenceCount: localIntelligence.length,
    totalArtifactRefs: artifacts.length
  };

  return {
    county: county.county,
    fips: county.fips ?? FIPS_BY_COUNTY[county.county] ?? null,
    posture,
    intendedSourceModel: "authoritative parcel inventory / GIS parcel layer / assessor parcel export, not sales workbook lineage",
    officialAssessorBaseUrl: county.officialAssessorBaseUrl ?? null,
    primarySalesSource: county.primarySalesSource ?? null,
    acquisitionFamily: county.acquisitionFamily ?? null,
    sourceSignals: signals,
    counts,
    authoritativeReceipts,
    secondaryEvidence,
    localIntelligence,
    artifacts,
    blockers: blockersFor(posture, counts),
    certificationAllowed: posture === "authoritative_source_receipt_found",
    productionBindingAllowed: false,
    databaseMutationAttempted: false,
    runtimeClaimAllowed: false
  };
}

function discoveredFilesForCounty({ county, evidenceRoot }) {
  const regex = countyFileRegex(county);
  return collectFiles(evidenceRoot)
    .filter((file) => regex.test(file))
    .map(repoRelative)
    .filter((file) => !/delta-adjudication|prefixed-identity-repair|source-acquisition/.test(file));
}

function renderMarkdown(report) {
  const rows = report.rows
    .map(
      (row) =>
        `| ${row.county} | ${row.fips ?? "-"} | ${row.posture} | ${row.counts.authoritativeReceiptCount} | ${row.counts.secondaryEvidenceCount} | ${row.sourceSignals.signals.join(", ") || "-"} |`
    )
    .join("\n");
  const blockers = report.blockers.map((blocker) => `- ${blocker}`).join("\n");
  return `# Wave 2 Authoritative Parcel Source Reconstruction

Generated: ${report.generatedAt}

## Doctrine

- Canonical parcel rows are expected to come from authoritative parcel inventory/GIS/assessor parcel sources.
- Sales/comparable/search artifacts are secondary identity evidence only.
- Missing source receipts block receipt-backed identity and production binding.

## Summary

- Counties checked: ${report.summary.countiesChecked}
- Authoritative receipts found: ${report.summary.authoritativeReceiptsFound}
- Recapture possible: ${report.summary.recapturePossible}
- Secondary evidence only: ${report.summary.secondaryEvidenceOnly}
- Blocked source access: ${report.summary.blockedSourceAccess}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}

## Matrix

| County | FIPS | Posture | Authoritative receipts | Secondary artifacts | Parcel-source signals |
| --- | --- | --- | ---: | ---: | --- |
${rows}

## Blockers

${blockers}
`;
}

export function buildWave2AuthoritativeSourceReconstruction({ crosswalk, evidenceRoot }) {
  const rowsByCounty = new Map(crosswalk.rows.map((row) => [row.county, row]));
  const rows = WAVE2.map((countyName) =>
    buildCountyReconstruction({
      county: rowsByCounty.get(countyName) ?? { county: countyName },
      discoveredFiles: discoveredFilesForCounty({ county: countyName, evidenceRoot })
    })
  );
  const summary = {
    countiesChecked: rows.length,
    authoritativeReceiptsFound: rows.filter((row) => row.posture === "authoritative_source_receipt_found").length,
    recapturePossible: rows.filter((row) => row.posture === "authoritative_source_recapture_possible").length,
    secondaryEvidenceOnly: rows.filter((row) => row.posture === "secondary_evidence_only").length,
    blockedSourceAccess: rows.filter((row) => row.posture === "blocked_source_access").length,
    byPosture: rows.reduce((acc, row) => {
      acc[row.posture] = (acc[row.posture] ?? 0) + 1;
      return acc;
    }, {})
  };

  return {
    generatedAt: new Date().toISOString(),
    scope: "Wave 2 authoritative parcel-source reconstruction for Kitsap, Pierce, Klickitat, Okanogan, and San Juan.",
    summary,
    rows,
    blockers:
      summary.authoritativeReceiptsFound < rows.length
        ? [`${rows.length - summary.authoritativeReceiptsFound} Wave 2 counties still lack authoritative parcel inventory receipts.`]
        : [],
    productionBindingAllowed: false,
    databaseMutationAttempted: false,
    runtimeClaimAllowed: false
  };
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    crosswalk: args.get("crosswalk") ?? DEFAULT_CROSSWALK,
    evidenceRoot: args.get("evidence-root") ?? DEFAULT_EVIDENCE_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const report = buildWave2AuthoritativeSourceReconstruction({
    crosswalk: readJson(paths.crosswalk),
    evidenceRoot: paths.evidenceRoot
  });
  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`Wave 2 authoritative source reconstruction written: ${repoRelative(paths.outJson)}`);
  console.log(`Postures: ${JSON.stringify(report.summary.byPosture)}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
