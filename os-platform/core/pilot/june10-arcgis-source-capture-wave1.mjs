#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_VALIDATION = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-candidate-field-validation.latest.json"
);
const DEFAULT_OUT_ROOT = path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-arcgis-source-capture-wave1");
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-source-capture-wave1.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-source-capture-wave1.latest.md"
);

const DEFAULT_WAVE = ["Garfield", "Columbia", "Wahkiakum", "Ferry", "Pend Oreille"];

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

function sha256Bytes(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
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

export function shortFips(fips) {
  return String(fips ?? "").trim().slice(-3).padStart(3, "0");
}

function normalizeId(value) {
  return String(value ?? "").trim();
}

export function stripSeedPrefix(value) {
  return normalizeId(value).replace(/^\d{3}-/, "");
}

function samples(values, limit = 10) {
  return [...values].sort((a, b) => a.localeCompare(b)).slice(0, limit);
}

function setDifference(left, right) {
  return [...left].filter((value) => !right.has(value));
}

function countIntersection(left, right) {
  let count = 0;
  for (const value of left) if (right.has(value)) count += 1;
  return count;
}

export function selectWaveCounties(rows, requested = DEFAULT_WAVE) {
  const requestedSet = new Set(requested);
  return (rows ?? []).filter(
    (row) => requestedSet.has(row.county) && row.validationStatus === "candidate_layer_receipt_ready"
  );
}

export function extractSourceIdentity(features) {
  const sourceNativeIds = new Set();
  const prefixedIds = new Set();
  let nullOrBlankSourceNative = 0;
  const sourceNativeOccurrences = new Map();

  for (const feature of features ?? []) {
    const attrs = feature.attributes ?? feature;
    const sourceNative = normalizeId(attrs.ORIG_PARCEL_ID);
    const prefixed = normalizeId(attrs.PARCEL_ID_NR);
    if (sourceNative) {
      sourceNativeIds.add(sourceNative);
      sourceNativeOccurrences.set(sourceNative, (sourceNativeOccurrences.get(sourceNative) ?? 0) + 1);
    } else {
      nullOrBlankSourceNative += 1;
    }
    if (prefixed) prefixedIds.add(prefixed);
  }

  return {
    rowCount: (features ?? []).length,
    sourceNativeIds,
    prefixedIds,
    nullOrBlankSourceNative,
    duplicateSourceNativeIds: [...sourceNativeOccurrences.values()].filter((count) => count > 1).length
  };
}

export function compareIdentitySets({ sourceNativeIds, sourcePrefixedIds, canonicalIds }) {
  const canonicalPrefixStripped = new Set([...canonicalIds].map(stripSeedPrefix));
  return {
    sourceNativeDistinctCount: sourceNativeIds.size,
    sourcePrefixedDistinctCount: sourcePrefixedIds.size,
    canonicalDistinctCount: canonicalIds.size,
    exactSourceNativeOverlapCount: countIntersection(sourceNativeIds, canonicalIds),
    prefixedSourceOverlapCount: countIntersection(sourcePrefixedIds, canonicalIds),
    prefixStrippedCanonicalOverlapCount: countIntersection(sourceNativeIds, canonicalPrefixStripped),
    sourceNativeOnlyCount: setDifference(sourceNativeIds, canonicalPrefixStripped).length,
    canonicalOnlyAfterPrefixStripCount: setDifference(canonicalPrefixStripped, sourceNativeIds).length,
    sourceNativeOnlySamples: samples(setDifference(sourceNativeIds, canonicalPrefixStripped)),
    canonicalOnlyAfterPrefixStripSamples: samples(setDifference(canonicalPrefixStripped, sourceNativeIds)),
    sourceNativeSamples: samples(sourceNativeIds),
    canonicalSamples: samples(canonicalIds)
  };
}

function classifyCapture({ source, comparison }) {
  if (source.rowCount === 0 || source.sourceNativeIds.size === 0) return "blocked_source_capture";
  if (
    comparison.sourceNativeOnlyCount === 0 &&
    comparison.canonicalOnlyAfterPrefixStripCount === 0 &&
    comparison.exactSourceNativeOverlapCount === comparison.sourceNativeDistinctCount
  ) {
    return "receipt_backed_full_identity_candidate";
  }
  if (
    comparison.sourceNativeOnlyCount === 0 &&
    comparison.canonicalOnlyAfterPrefixStripCount === 0 &&
    comparison.prefixStrippedCanonicalOverlapCount === comparison.sourceNativeDistinctCount &&
    comparison.prefixedSourceOverlapCount === comparison.sourcePrefixedDistinctCount
  ) {
    return "prefixed_repair_candidate";
  }
  if (comparison.prefixStrippedCanonicalOverlapCount > 0 || comparison.prefixedSourceOverlapCount > 0) {
    return "bounded_delta_candidate";
  }
  return "blocked_source_semantics";
}

export function buildCountyCaptureResult({ county, source, canonicalIds, sourceArtifact }) {
  const comparison = compareIdentitySets({
    sourceNativeIds: source.sourceNativeIds,
    sourcePrefixedIds: source.prefixedIds,
    canonicalIds
  });
  const classification = classifyCapture({ source, comparison });
  const blockers = [];
  if (source.nullOrBlankSourceNative > 0) blockers.push(`${source.nullOrBlankSourceNative} source rows have blank ORIG_PARCEL_ID.`);
  if (source.duplicateSourceNativeIds > 0) blockers.push(`${source.duplicateSourceNativeIds} duplicate source-native parcel ID groups.`);
  if (classification === "blocked_source_semantics") {
    blockers.push("Source-native IDs do not overlap canonical ParcelNumber under exact or prefix-stripped comparison.");
  }
  if (classification === "bounded_delta_candidate") {
    blockers.push("Source/canonical identity delta requires county-specific adjudication before receipt conversion.");
  }
  if (classification === "prefixed_repair_candidate") {
    blockers.push("Canonical ParcelNumber appears to preserve statewide prefixed IDs; source-native repair remains required before certification.");
  }

  return {
    county: county.county,
    fips: county.fips,
    shortFips: shortFips(county.fips),
    source: {
      serviceUrl: county.normalizedServiceUrl ?? null,
      accessMethod: "arcgis_rest_county_filtered_query",
      termsPosture: "public_arcgis_rest_terms_review_required",
      sourceNativeParcelIdField: "ORIG_PARCEL_ID",
      statewidePrefixedParcelIdField: "PARCEL_ID_NR",
      rowCount: source.rowCount,
      distinctSourceNativeIds: source.sourceNativeIds.size,
      distinctPrefixedIds: source.prefixedIds.size,
      nullOrBlankSourceNative: source.nullOrBlankSourceNative,
      duplicateSourceNativeIds: source.duplicateSourceNativeIds
    },
    canonical: {
      activeDistinctParcelNumbers: canonicalIds.size
    },
    sourceArtifact,
    identityComparison: comparison,
    classification,
    receiptCandidate: {
      receiptVersion: "arcgis_source_capture_v1",
      valid: source.rowCount > 0 && source.sourceNativeIds.size > 0,
      county: county.county,
      fips: county.fips,
      sourceUrl: county.normalizedServiceUrl ?? null,
      accessMethod: "arcgis_rest_county_filtered_query",
      sourceNativeParcelIdField: "ORIG_PARCEL_ID",
      statewidePrefixedParcelIdField: "PARCEL_ID_NR",
      sourceArtifact,
      identityComparison: comparison
    },
    blockers,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    certificationAllowed: false
  };
}

function artifact(filePath) {
  return {
    path: repoRelative(filePath),
    sizeBytes: fs.statSync(filePath).size,
    sha256: sha256File(filePath),
    lastWriteTime: fs.statSync(filePath).mtime.toISOString()
  };
}

function fixtureFeatures(fips) {
  const s = shortFips(fips);
  return [
    { attributes: { FIPS_NR: s, COUNTY_NM: s, PARCEL_ID_NR: `${s}-100`, ORIG_PARCEL_ID: "100" } },
    { attributes: { FIPS_NR: s, COUNTY_NM: s, PARCEL_ID_NR: `${s}-200`, ORIG_PARCEL_ID: "200" } }
  ];
}

function fixtureCanonical(fips) {
  const s = shortFips(fips);
  return new Set([`${s}-100`, `${s}-200`]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJsonWithRetry(
  url,
  { timeoutMs = 90000, retries = 2, retryDelayMs = 750, fetchImpl = fetch } = {}
) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { signal: controller.signal });
      const text = await response.text();
      if (!response.ok) throw new Error(`${response.status} ${text.slice(0, 160)}`);
      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await sleep(retryDelayMs * (attempt + 1));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

async function fetchJson(url, timeoutMs = 90000) {
  return fetchJsonWithRetry(url, { timeoutMs });
}

async function fetchCountyFeatures(county) {
  const features = [];
  const serviceUrl = county.normalizedServiceUrl.replace(/\/$/, "");
  let offset = 0;
  const pageSize = 2000;
  while (true) {
    const url = new URL(`${serviceUrl}/0/query`);
    url.searchParams.set("f", "json");
    url.searchParams.set("where", `FIPS_NR='${shortFips(county.fips)}'`);
    url.searchParams.set("outFields", "FIPS_NR,COUNTY_NM,PARCEL_ID_NR,ORIG_PARCEL_ID,SITUS_ADDRESS,VALUE_LAND,VALUE_BLDG");
    url.searchParams.set("returnGeometry", "false");
    url.searchParams.set("orderByFields", "PARCEL_ID_NR");
    url.searchParams.set("resultOffset", String(offset));
    url.searchParams.set("resultRecordCount", String(pageSize));
    const payload = await fetchJson(url.toString());
    const page = payload.features ?? [];
    features.push(...page);
    if (page.length < pageSize || payload.exceededTransferLimit !== true) break;
    offset += pageSize;
  }
  return features;
}

function runPsql(sql, { container = "terrafusion-postgres-dev", database = "terrafusion", user = "postgres" } = {}) {
  return execFileSync("docker", ["exec", "-i", container, "psql", "-U", user, "-d", database, "-At", "-c", sql], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64
  });
}

function readCanonicalParcelNumbers(county) {
  const prefix = shortFips(county.fips);
  const countyIdSql = `select "CountyId" from canonical_tf.tf_parcel where "ParcelStatus"='ACTIVE' and "ParcelNumber" like '${prefix}-%' group by "CountyId" order by count(*) desc limit 1;`;
  const countyId = runPsql(countyIdSql).trim();
  if (!countyId) return new Set();
  const sql = `select "ParcelNumber" from canonical_tf.tf_parcel where "CountyId"='${countyId}'::uuid and "ParcelStatus"='ACTIVE' and nullif("ParcelNumber",'') is not null order by "ParcelNumber";`;
  return new Set(runPsql(sql).split(/\r?\n/).map(normalizeId).filter(Boolean));
}

function writeSourceArtifact({ county, features, outRoot }) {
  const countyDir = path.join(outRoot, `${county.fips}-${county.county.toLowerCase().replaceAll(" ", "-")}`);
  fs.mkdirSync(countyDir, { recursive: true });
  const rawPath = path.join(countyDir, "source-native-parcel-ids.jsonl");
  const lines = features.map((feature) => JSON.stringify(feature.attributes ?? feature)).join("\n");
  fs.writeFileSync(rawPath, `${lines}\n`);
  return artifact(rawPath);
}

function renderMarkdown(report) {
  const rows = report.rows
    .map(
      (row) =>
        `| ${row.county} | ${row.fips} | ${row.source.rowCount} | ${row.source.distinctSourceNativeIds} | ${row.canonical.activeDistinctParcelNumbers} | ${row.identityComparison.prefixStrippedCanonicalOverlapCount} | ${row.identityComparison.sourceNativeOnlyCount} | ${row.identityComparison.canonicalOnlyAfterPrefixStripCount} | ${row.classification} |`
    )
    .join("\n");
  return `# ArcGIS Source Capture ${report.waveLabel}

Generated: ${report.generatedAt}

## Summary

- Counties checked: ${report.summary.countiesChecked}
- Source rows captured: ${report.summary.sourceRowsCaptured}
- Receipt-backed full identity candidates: ${report.summary.byClassification.receipt_backed_full_identity_candidate ?? 0}
- Prefixed repair candidates: ${report.summary.byClassification.prefixed_repair_candidate ?? 0}
- Bounded delta candidates: ${report.summary.byClassification.bounded_delta_candidate ?? 0}
- Blocked source semantics: ${report.summary.byClassification.blocked_source_semantics ?? 0}
- Database mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${report.certificationAllowed ? "yes" : "no"}

## Matrix

| County | FIPS | Source rows | Source-native IDs | Canonical IDs | Prefix-stripped overlap | Source-only | Canonical-only | Classification |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${rows}
`;
}

function summarize(rows) {
  return rows.reduce(
    (acc, row) => {
      acc.sourceRowsCaptured += row.source.rowCount;
      acc.byClassification[row.classification] = (acc.byClassification[row.classification] ?? 0) + 1;
      return acc;
    },
    { countiesChecked: rows.length, sourceRowsCaptured: 0, byClassification: {} }
  );
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    validation: args.get("validation") ?? DEFAULT_VALIDATION,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD,
    waveLabel: args.get("wave-label") ?? "Wave 1",
    fixture: args.has("fixture")
  };
  const requested = (args.get("counties") ?? DEFAULT_WAVE.join(","))
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const validation = readJson(paths.validation);
  const counties = selectWaveCounties(validation.rows ?? [], requested);
  const rows = [];

  for (const county of counties) {
    console.log(`Capturing ${county.county} ${county.fips} from ${county.normalizedServiceUrl}`);
    const features = paths.fixture ? fixtureFeatures(county.fips) : await fetchCountyFeatures(county);
    const source = extractSourceIdentity(features);
    const canonicalIds = paths.fixture ? fixtureCanonical(county.fips) : readCanonicalParcelNumbers(county);
    const sourceArtifact = writeSourceArtifact({ county, features, outRoot: paths.outRoot });
    rows.push(buildCountyCaptureResult({ county, source, canonicalIds, sourceArtifact }));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    scope: `ArcGIS ${paths.waveLabel} county-filtered source-native parcel ID capture.`,
    waveLabel: paths.waveLabel,
    waveCounties: counties.map((county) => ({ county: county.county, fips: county.fips })),
    summary: summarize(rows),
    rows,
    sourceArtifactRoot: repoRelative(paths.outRoot),
    sourceArtifactHash: sha256Bytes(rows.map((row) => row.sourceArtifact.sha256).join("\n")),
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    certificationAllowed: false
  };

  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`ArcGIS source capture ${paths.waveLabel} written: ${repoRelative(paths.outJson)}`);
  console.log(`Counties captured: ${report.summary.countiesChecked}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
