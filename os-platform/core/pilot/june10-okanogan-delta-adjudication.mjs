#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const OKANOGAN = {
  county: "Okanogan",
  fips: "53047",
  countyId: "2ca5f53a-275d-d1b7-3266-80383d5e2387"
};

const DEFAULT_ACQUISITION = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave2-source-acquisition.latest.json"
);
const DEFAULT_REPAIR_DRY_RUN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave2-prefixed-identity-repair-dry-run.latest.json"
);
const DEFAULT_SOURCE_IDS = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave2-source-acquisition",
  "okanogan",
  "source-native-parcel-ids.jsonl"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-okanogan-delta-adjudication"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-okanogan-delta-adjudication.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-okanogan-delta-adjudication.latest.md"
);

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

function writeLines(filePath, values) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${values.join("\n")}${values.length ? "\n" : ""}`);
}

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
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

function normalizeId(value) {
  return String(value ?? "").trim();
}

function stripSeedPrefix(value) {
  return normalizeId(value).replace(/^\d{3}-/, "");
}

function uniqueSorted(values) {
  return [...new Set(values.map(normalizeId).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function setDifference(left, right) {
  const rightSet = new Set(right);
  return uniqueSorted(left).filter((value) => !rightSet.has(value));
}

function setIntersection(left, right) {
  const rightSet = new Set(right);
  return uniqueSorted(left).filter((value) => rightSet.has(value));
}

function sample(values, limit = 50) {
  return values.slice(0, limit);
}

function runPsql(sql) {
  return execFileSync(
    "docker",
    ["exec", "-i", "terrafusion-postgres-dev", "psql", "-U", "postgres", "-d", "terrafusion", "-At", "-c", sql],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 }
  );
}

function fetchOkanoganCanonicalIdsAfterPrefixRepair() {
  const sql = `select regexp_replace("ParcelNumber", '^047-', '')
from canonical_tf.tf_parcel
where "CountyId"='${OKANOGAN.countyId}'::uuid
  and "ParcelStatus"='ACTIVE'
  and nullif("ParcelNumber",'') is not null
order by 1;`;
  return runPsql(sql).split(/\r?\n/).map(normalizeId).filter(Boolean);
}

function parseSourceIdsJsonl(filePath) {
  const ids = [];
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line);
    ids.push(normalizeId(parsed.sourceNativeParcelId));
  }
  return ids.filter(Boolean);
}

function parseCanonicalIdsText(filePath) {
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).map((line) => stripSeedPrefix(line)).filter(Boolean);
}

export function summarizeSourceParsers(parserSummaries) {
  return (parserSummaries ?? []).reduce(
    (summary, parser) => ({
      rowCount: summary.rowCount + Number(parser.rowCount ?? 0),
      idsExtracted: summary.idsExtracted + Number(parser.idsExtracted ?? 0),
      duplicateRows: summary.duplicateRows + Number(parser.duplicates ?? 0),
      nullOrBlankRows: summary.nullOrBlankRows + Number(parser.nullOrBlank ?? 0)
    }),
    { rowCount: 0, idsExtracted: 0, duplicateRows: 0, nullOrBlankRows: 0 }
  );
}

export function classifyOkanoganDecision({
  sourceOnlyCount,
  canonicalOnlyCount,
  sourceCoverageRatio,
  sourceArtifactKind,
  duplicateRiskAfterRepair = 0
}) {
  if (duplicateRiskAfterRepair > 0) return "bounded_correction_plan_required";
  if (sourceOnlyCount === 0 && canonicalOnlyCount === 0 && sourceCoverageRatio === 1) {
    return "receipt_backed_full_identity";
  }
  if (sourceArtifactKind === "parcel_inventory" && sourceCoverageRatio >= 0.9) {
    return "shell_present_candidate";
  }
  if (sourceOnlyCount > 0 || canonicalOnlyCount > 0) return "blocked_source_semantics";
  return "blocked_source_semantics";
}

function decideProbe(acquisitionCounty) {
  const sourceText = [
    acquisitionCounty?.sourceParcelIdField,
    ...(acquisitionCounty?.receiptCandidate?.artifacts ?? []).map((artifact) => artifact.path)
  ].join(" ");
  const sourceArtifactKind = /comparable|sales|sale/i.test(sourceText) ? "comparable_sales_workbook" : "unknown_partial_payload";
  return {
    attempted: false,
    sourceArtifactKind,
    reason:
      sourceArtifactKind === "comparable_sales_workbook"
        ? "Okanogan evidence is a static comparable-sales workbook, not a governed full parcel inventory or current parcel query endpoint."
        : "No governed current-source parcel lookup/query endpoint is recorded for Okanogan in this slice."
  };
}

export function adjudicateOkanoganDelta({ sourceIds, canonicalIds, acquisitionCounty, repairCounty }) {
  const sourceDistinct = uniqueSorted(sourceIds);
  const canonicalDistinct = uniqueSorted(canonicalIds.map(stripSeedPrefix));
  const sourceOnly = setDifference(sourceDistinct, canonicalDistinct);
  const canonicalOnly = setDifference(canonicalDistinct, sourceDistinct);
  const overlap = setIntersection(sourceDistinct, canonicalDistinct);
  const parserSummary = summarizeSourceParsers(acquisitionCounty?.parserSummaries ?? []);
  const sourceProbe = decideProbe(acquisitionCounty);
  const sourceCoverageRatio = canonicalDistinct.length === 0 ? 0 : overlap.length / canonicalDistinct.length;
  const duplicateRiskAfterRepair = Number(repairCounty?.validation?.duplicateCountyIdParcelNumberAfter ?? 0);
  const decision = classifyOkanoganDecision({
    sourceOnlyCount: sourceOnly.length,
    canonicalOnlyCount: canonicalOnly.length,
    sourceCoverageRatio,
    sourceArtifactKind: sourceProbe.sourceArtifactKind,
    duplicateRiskAfterRepair
  });
  const blockers = [];
  if (decision === "blocked_source_semantics") {
    blockers.push("Okanogan source artifact is not a governed full parcel inventory, so canonical-only rows cannot be adjudicated.");
  }
  if (sourceOnly.length > 0) blockers.push(`${sourceOnly.length} source-only parcel IDs require current source semantics before correction.`);
  if (canonicalOnly.length > 0) blockers.push(`${canonicalOnly.length} canonical-only parcel IDs require full source inventory or current-source probe before closure.`);
  if (duplicateRiskAfterRepair > 0) blockers.push("Prefix repair dry-run reports duplicate target risk.");

  return {
    generatedAt: new Date().toISOString(),
    countyName: "Okanogan County",
    fips: "53047",
    decision,
    summary: {
      sourceRows: parserSummary.rowCount,
      sourceDistinctParcelIds: sourceDistinct.length,
      canonicalDistinctParcelIdsAfterPrefixRepair: canonicalDistinct.length,
      overlapCount: overlap.length,
      sourceOnlyCount: sourceOnly.length,
      canonicalOnlyCount: canonicalOnly.length,
      sourceCoverageRatio: Number(sourceCoverageRatio.toFixed(6)),
      duplicateSourceRows: parserSummary.duplicateRows,
      nullOrBlankSourceRows: parserSummary.nullOrBlankRows,
      duplicateCountyIdParcelNumberAfterPrefixRepair: duplicateRiskAfterRepair
    },
    sourceOnly: {
      count: sourceOnly.length,
      sample: sample(sourceOnly)
    },
    canonicalOnly: {
      count: canonicalOnly.length,
      sample: sample(canonicalOnly)
    },
    duplicateNullSummary: parserSummary,
    currentSourceProbe: sourceProbe,
    sourceReceiptCandidate: acquisitionCounty?.receiptCandidate ?? null,
    repairReceiptCandidate: repairCounty?.receiptCandidate ?? null,
    blockers,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: decision === "receipt_backed_full_identity",
    runtimeClaimAllowed: false,
    _deltaLists: { sourceOnly, canonicalOnly, overlap }
  };
}

function renderMarkdown(report) {
  const blockers = report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  return `# Okanogan Delta Adjudication

Generated: ${report.generatedAt}

## Decision

${report.decision}

## Summary

- Source rows: ${report.summary.sourceRows}
- Source distinct IDs: ${report.summary.sourceDistinctParcelIds}
- Canonical distinct IDs after prefix repair: ${report.summary.canonicalDistinctParcelIdsAfterPrefixRepair}
- Overlap: ${report.summary.overlapCount}
- Source-only IDs: ${report.summary.sourceOnlyCount}
- Canonical-only IDs: ${report.summary.canonicalOnlyCount}
- Source coverage ratio: ${report.summary.sourceCoverageRatio}
- Duplicate source rows: ${report.summary.duplicateSourceRows}
- Null/blank source rows: ${report.summary.nullOrBlankSourceRows}
- Prefix-repair duplicate groups: ${report.summary.duplicateCountyIdParcelNumberAfterPrefixRepair}
- DB mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}

## Current Source Probe

- Attempted: ${report.currentSourceProbe.attempted ? "yes" : "no"}
- Reason: ${report.currentSourceProbe.reason}

## Blockers

${blockers}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    acquisition: args.get("acquisition") ?? DEFAULT_ACQUISITION,
    repairDryRun: args.get("repair-dry-run") ?? DEFAULT_REPAIR_DRY_RUN,
    sourceIds: args.get("source-ids") ?? DEFAULT_SOURCE_IDS,
    canonicalIds: args.get("canonical-ids") ?? null,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const acquisition = readJson(paths.acquisition);
  const repair = readJson(paths.repairDryRun);
  const acquisitionCounty = acquisition.counties.find((county) => county.county === "Okanogan");
  const repairCounty = repair.counties.find((county) => county.county === "Okanogan");
  const report = adjudicateOkanoganDelta({
    sourceIds: parseSourceIdsJsonl(paths.sourceIds),
    canonicalIds: paths.canonicalIds ? parseCanonicalIdsText(paths.canonicalIds) : fetchOkanoganCanonicalIdsAfterPrefixRepair(),
    acquisitionCounty,
    repairCounty
  });

  writeLines(path.join(paths.outRoot, "okanogan-source-only-parcels.txt"), report._deltaLists.sourceOnly);
  writeLines(path.join(paths.outRoot, "okanogan-canonical-only-parcels.txt"), report._deltaLists.canonicalOnly);
  writeLines(path.join(paths.outRoot, "okanogan-overlap-parcels.txt"), report._deltaLists.overlap);
  delete report._deltaLists;
  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`Okanogan delta adjudication written: ${repoRelative(paths.outJson)}`);
  console.log(`Decision: ${report.decision}`);
  console.log(`Database mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
