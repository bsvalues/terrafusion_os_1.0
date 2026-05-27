#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const SKAGIT_COUNTY_ID = "a1c87e81-4825-f488-040b-2faa433b9905";
const DEFAULT_SOURCE_IDS = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-authoritative-recapture-wave1",
  "skagit",
  "source-native-parcel-ids.jsonl"
);
const DEFAULT_RECEIPT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-authoritative-recapture-wave1",
  "skagit",
  "source-receipt-candidate.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-skagit-identity-transform-adjudication.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-skagit-identity-transform-adjudication.latest.md"
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

function normalize(value) {
  return String(value ?? "").trim();
}

function stripSeedPrefix(value) {
  return normalize(value).replace(/^\d{3}-/, "");
}

function firstValues(values, limit = 25) {
  return [...values].sort((a, b) => a.localeCompare(b)).slice(0, limit);
}

function readJsonlValues(filePath, fieldNames) {
  const ids = new Set();
  let rowCount = 0;
  let duplicateRows = 0;
  let nullOrBlankRows = 0;
  if (!fs.existsSync(filePath)) {
    return { ids, rowCount, duplicateRows, nullOrBlankRows };
  }
  const text = fs.readFileSync(filePath, "utf8").trim();
  if (!text) return { ids, rowCount, duplicateRows, nullOrBlankRows };
  for (const line of text.split(/\r?\n/)) {
    rowCount += 1;
    const parsed = JSON.parse(line);
    const id = normalize(fieldNames.map((field) => parsed[field]).find((value) => normalize(value)));
    if (!id) {
      nullOrBlankRows += 1;
      continue;
    }
    if (ids.has(id)) duplicateRows += 1;
    ids.add(id);
  }
  return { ids, rowCount, duplicateRows, nullOrBlankRows };
}

export function parseSourceIds(filePath) {
  const parsed = readJsonlValues(filePath, ["sourceNativeParcelId", "parcelId", "PARCELID"]);
  return {
    ...parsed,
    distinctCount: parsed.ids.size
  };
}

function parseCanonicalIds(filePath) {
  const parsed = readJsonlValues(filePath, ["parcelNumber", "ParcelNumber", "canonicalParcelNumber"]);
  return {
    ...parsed,
    distinctCount: parsed.ids.size
  };
}

function runPsql(sql) {
  return execFileSync(
    "docker",
    ["exec", "-i", "terrafusion-postgres-dev", "psql", "-U", "postgres", "-d", "terrafusion", "-At", "-c", sql],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 128 }
  );
}

function fetchCanonicalIdsFromDb() {
  const sql = `select "ParcelNumber" from canonical_tf.tf_parcel where "CountyId"='${SKAGIT_COUNTY_ID}'::uuid and "ParcelStatus"='ACTIVE' and nullif("ParcelNumber",'') is not null order by "ParcelNumber";`;
  const output = runPsql(sql);
  return {
    ids: new Set(output.split(/\r?\n/).map(normalize).filter(Boolean)),
    rowCount: output.trim() ? output.trim().split(/\r?\n/).length : 0,
    duplicateRows: 0,
    nullOrBlankRows: 0
  };
}

export function compareSkagitIdentitySets({ sourceIds, canonicalIds }) {
  const canonicalStripped = new Map();
  for (const canonicalId of canonicalIds) {
    const stripped = stripSeedPrefix(canonicalId);
    if (!canonicalStripped.has(stripped)) canonicalStripped.set(stripped, []);
    canonicalStripped.get(stripped).push(canonicalId);
  }

  let exactOverlapCount = 0;
  let prefixStrippedOverlapCount = 0;
  const sourceOnlyAfterPrefixStrip = [];
  for (const sourceId of sourceIds) {
    if (canonicalIds.has(sourceId)) exactOverlapCount += 1;
    if (canonicalStripped.has(sourceId)) {
      prefixStrippedOverlapCount += 1;
    } else {
      sourceOnlyAfterPrefixStrip.push(sourceId);
    }
  }

  const canonicalOnlyAfterPrefixStrip = [];
  for (const canonicalId of canonicalIds) {
    if (!sourceIds.has(stripSeedPrefix(canonicalId))) canonicalOnlyAfterPrefixStrip.push(canonicalId);
  }

  return {
    sourceDistinctCount: sourceIds.size,
    canonicalDistinctCount: canonicalIds.size,
    exactOverlapCount,
    prefixStrippedOverlapCount,
    sourceOnlyAfterPrefixStrip,
    canonicalOnlyAfterPrefixStrip,
    sourceOnlyAfterPrefixStripCount: sourceOnlyAfterPrefixStrip.length,
    canonicalOnlyAfterPrefixStripCount: canonicalOnlyAfterPrefixStrip.length,
    sourceSamples: firstValues(sourceIds),
    canonicalSamples: firstValues(canonicalIds),
    sourceOnlySamples: firstValues(sourceOnlyAfterPrefixStrip),
    canonicalOnlySamples: firstValues(canonicalOnlyAfterPrefixStrip)
  };
}

export function classifySkagitIdentity({
  exactOverlapCount,
  prefixStrippedOverlapCount,
  sourceDistinctCount,
  sourceOnlyAfterPrefixStripCount,
  canonicalOnlyAfterPrefixStripCount
}) {
  if (sourceDistinctCount === 0) return "blocked_by_source_semantics";
  if (
    exactOverlapCount === sourceDistinctCount &&
    sourceOnlyAfterPrefixStripCount === 0 &&
    canonicalOnlyAfterPrefixStripCount === 0
  ) {
    return "receipt_backed_candidate_after_source_review";
  }
  if (exactOverlapCount === 0 && prefixStrippedOverlapCount > 0) {
    if (sourceOnlyAfterPrefixStripCount > 0 || canonicalOnlyAfterPrefixStripCount > 0) {
      return "prefixed_repair_candidate_with_bounded_delta";
    }
    return "prefixed_repair_candidate";
  }
  if (exactOverlapCount > 0) return "bounded_correction_candidate";
  return "blocked_by_source_semantics";
}

export function adjudicateSkagitIdentity({ sourceReceipt, sourceStats, canonicalIds }) {
  const comparison = compareSkagitIdentitySets({ sourceIds: sourceStats.ids, canonicalIds });
  const classification = classifySkagitIdentity(comparison);
  const blockers = [];
  if (sourceReceipt.sourceParcelIdField !== "PARCELID") {
    blockers.push(`Expected Skagit source-native field PARCELID, found ${sourceReceipt.sourceParcelIdField ?? "null"}.`);
  }
  if (sourceStats.duplicateRows > 0) {
    blockers.push(`${sourceStats.duplicateRows} duplicate source PARCELID rows require adjudication.`);
  }
  if (sourceStats.nullOrBlankRows > 0) {
    blockers.push(`${sourceStats.nullOrBlankRows} null/blank source PARCELID rows require adjudication.`);
  }
  if (classification.includes("prefixed_repair")) {
    blockers.push("Canonical ParcelNumber appears prefixed; Skagit cannot certify until source-native identity repair is executed and audited.");
  }
  if (comparison.sourceOnlyAfterPrefixStripCount > 0 || comparison.canonicalOnlyAfterPrefixStripCount > 0) {
    blockers.push(
      `Post-prefix delta remains: ${comparison.sourceOnlyAfterPrefixStripCount} source-only and ${comparison.canonicalOnlyAfterPrefixStripCount} canonical-only parcel IDs.`
    );
  }
  blockers.push("Source terms posture requires operator/legal review before certification.");

  return {
    generatedAt: new Date().toISOString(),
    county: "Skagit",
    fips: "53057",
    sourceNativeField: sourceReceipt.sourceParcelIdField ?? null,
    sourceUrl: sourceReceipt.sourceUrl ?? null,
    termsPosture: sourceReceipt.termsPosture ?? null,
    sourceStats: {
      rowCount: sourceStats.rowCount,
      distinctCount: sourceStats.distinctCount ?? sourceStats.ids.size,
      duplicateRows: sourceStats.duplicateRows,
      nullOrBlankRows: sourceStats.nullOrBlankRows
    },
    identityComparison: comparison,
    classification,
    recommendedNextAction: nextActionFor(classification),
    blockers,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    certificationAllowed: false
  };
}

function nextActionFor(classification) {
  if (classification === "prefixed_repair_candidate") {
    return "prepare_read_only_repair_dry_run_for_skagit_prefix_removal";
  }
  if (classification === "prefixed_repair_candidate_with_bounded_delta") {
    return "prepare_skagit_prefix_repair_dry_run_then_adjudicate_source_canonical_delta";
  }
  if (classification === "bounded_correction_candidate") {
    return "prepare_bounded_correction_dry_run";
  }
  if (classification === "receipt_backed_candidate_after_source_review") {
    return "convert_receipt_after_terms_review_and_no_mutation_audit";
  }
  return "resolve_source_semantics_before_repair";
}

function renderMarkdown(report) {
  return `# Skagit Identity Transform Adjudication

Generated: ${report.generatedAt}

## Verdict

- Classification: ${report.classification}
- Source-native field: ${report.sourceNativeField}
- Database mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${report.certificationAllowed ? "yes" : "no"}

## Counts

- Source rows: ${report.sourceStats.rowCount}
- Source distinct PARCELID: ${report.sourceStats.distinctCount}
- Source duplicate rows: ${report.sourceStats.duplicateRows}
- Source null/blank rows: ${report.sourceStats.nullOrBlankRows}
- Canonical distinct ParcelNumber: ${report.identityComparison.canonicalDistinctCount}
- Exact overlap: ${report.identityComparison.exactOverlapCount}
- Prefix-stripped overlap: ${report.identityComparison.prefixStrippedOverlapCount}
- Source-only after prefix strip: ${report.identityComparison.sourceOnlyAfterPrefixStripCount}
- Canonical-only after prefix strip: ${report.identityComparison.canonicalOnlyAfterPrefixStripCount}

## Samples

- Source-only after prefix strip: ${report.identityComparison.sourceOnlySamples.join(", ") || "-"}
- Canonical-only after prefix strip: ${report.identityComparison.canonicalOnlySamples.join(", ") || "-"}

## Next Action

${report.recommendedNextAction}

## Blockers

${report.blockers.map((blocker) => `- ${blocker}`).join("\n")}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    sourceIds: args.get("source-ids") ?? DEFAULT_SOURCE_IDS,
    receipt: args.get("receipt") ?? DEFAULT_RECEIPT,
    canonicalIds: args.get("canonical-ids") ?? null,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const sourceStats = parseSourceIds(paths.sourceIds);
  const canonicalStats = paths.canonicalIds ? parseCanonicalIds(paths.canonicalIds) : fetchCanonicalIdsFromDb();
  const report = adjudicateSkagitIdentity({
    sourceReceipt: readJson(paths.receipt),
    sourceStats,
    canonicalIds: canonicalStats.ids
  });
  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`Skagit identity transform adjudication written: ${path.relative(repoRoot, paths.outJson).replaceAll(path.sep, "/")}`);
  console.log(`Classification: ${report.classification}`);
  console.log(`Database mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
