#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_MATRIX = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-authoritative-parcel-inventory-reconstruction.latest.json"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-authoritative-recapture-wave1"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-authoritative-recapture-wave1.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-authoritative-recapture-wave1.latest.md"
);

const COUNTY_ID_FALLBACK = {
  "53005": "19190019-1919-1919-1919-191919191919",
  "53035": "500ef839-e1cf-9c95-60b5-3b1b12f5851d",
  "53057": "a1c87e81-4825-f488-040b-2faa433b9905"
};

const SOURCE_REGISTRY = {
  Benton: {
    sourceUrl: "https://co.benton.wa.us",
    accessMethod: "official_site_research_required",
    termsPosture: "no_bulk_parcel_inventory_endpoint_proven",
    sourceParcelIdField: null
  },
  Kitsap: {
    sourceUrl:
      "https://services5.arcgis.com/0Q6HuHqqcg7Zo8zH/arcgis/rest/services/LU_BI_Parcels_07242024/FeatureServer/0",
    accessMethod: "arcgis_rest_query",
    termsPosture: "public_arcgis_rest_endpoint_terms_review_required",
    preferredParcelIdFields: ["APN", "PARCEL_ID_NR", "ORIG_PARCEL_ID", "ACCT_NO"]
  },
  Skagit: {
    sourceUrl: "https://gis.skagitcountywa.gov/arcgis/rest/services/OpenData/AssessorDataParcels/FeatureServer/0",
    accessMethod: "arcgis_rest_query",
    termsPosture: "public_arcgis_rest_endpoint_terms_review_required",
    preferredParcelIdFields: ["PARCELID", "PNumber"]
  }
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

function normalizeId(value) {
  return String(value ?? "").trim();
}

function stripSeedPrefix(value) {
  return normalizeId(value).replace(/^\d{3}-/, "");
}

function samples(values, limit = 8) {
  return [...values].sort((a, b) => a.localeCompare(b)).slice(0, limit);
}

export function selectWave1Candidates(matrix) {
  return (matrix.rows ?? []).filter((row) => row.inventoryAccess === "authoritative_inventory_recapture_candidate");
}

export function summarizeArcgisLayer(layer) {
  const fieldNames = (layer.fields ?? []).map((field) => field.name);
  const sourceParcelIdField =
    fieldNames.find((field) => /^parcel(id|number|no)?$/i.test(field)) ??
    fieldNames.find((field) => /^apn$/i.test(field)) ??
    fieldNames.find((field) => /^pnumber$/i.test(field)) ??
    fieldNames.find((field) => /^orig_parcel_id$/i.test(field)) ??
    fieldNames.find((field) => /^acct_no$/i.test(field)) ??
    fieldNames.find((field) => /parcel|parc|apn|pnumber/i.test(field)) ??
    null;
  return {
    layerName: layer.name ?? layer.displayField ?? null,
    objectIdField: layer.objectIdField ?? null,
    maxRecordCount: layer.maxRecordCount ?? null,
    sourceParcelIdField,
    hasUsableParcelIdField: Boolean(sourceParcelIdField),
    fields: fieldNames
  };
}

export function compareIdentitySets({ sourceIds, canonicalIds }) {
  const canonicalPrefixStripped = new Set([...canonicalIds].map(stripSeedPrefix));
  let exactOverlapCount = 0;
  let prefixStrippedOverlapCount = 0;
  for (const id of sourceIds) {
    if (canonicalIds.has(id)) exactOverlapCount += 1;
    if (canonicalPrefixStripped.has(id)) prefixStrippedOverlapCount += 1;
  }
  return {
    sourceDistinctCount: sourceIds.size,
    canonicalDistinctCount: canonicalIds.size,
    exactOverlapCount,
    prefixStrippedOverlapCount,
    sourceOnlyCount: [...sourceIds].filter((id) => !canonicalIds.has(id)).length,
    canonicalOnlyCount: [...canonicalIds].filter((id) => !sourceIds.has(id)).length,
    sourceSamples: samples(sourceIds),
    canonicalSamples: samples(canonicalIds)
  };
}

export function buildCountyRecaptureResult({ county, source, capture, identityComparison }) {
  const receiptValid = capture.status === "captured" && capture.distinctSourceIds > 0 && Boolean(capture.sourceIdArtifact);
  const blockers = [];
  if (!receiptValid) blockers.push("No receipt-grade source-native parcel ID artifact was captured.");
  if (source.termsPosture !== "terms_accepted") {
    blockers.push("Source terms posture still requires operator/legal review before certification.");
  }
  if (identityComparison.exactOverlapCount === 0 && identityComparison.prefixStrippedOverlapCount > 0) {
    blockers.push("Canonical ParcelNumber still appears transformed/prefixed relative to source-native IDs.");
  }
  return {
    county: county.county,
    fips: county.fips,
    source,
    capture,
    identityComparison,
    receiptCandidate: {
      receiptVersion: "authoritative_parcel_inventory_recapture_candidate_v1",
      valid: receiptValid,
      county: county.county,
      fips: county.fips,
      sourceUrl: source.sourceUrl,
      accessMethod: source.accessMethod,
      termsPosture: source.termsPosture,
      sourceParcelIdField: capture.sourceParcelIdField,
      rowCount: capture.rowCount,
      distinctSourceIds: capture.distinctSourceIds,
      metadataArtifact: capture.metadataArtifact ?? null,
      sourceIdArtifact: capture.sourceIdArtifact ?? null,
      identityComparison
    },
    classification: classifyResult({ capture, identityComparison, termsPosture: source.termsPosture }),
    blockers,
    certificationAllowed: false,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    databaseMutationAttempted: false
  };
}

function classifyResult({ capture, identityComparison, termsPosture }) {
  if (capture.status !== "captured" || capture.distinctSourceIds === 0) return "blocked_source_capture";
  if (termsPosture !== "terms_accepted") return "captured_terms_review_required";
  if (
    identityComparison.sourceDistinctCount === identityComparison.canonicalDistinctCount &&
    identityComparison.exactOverlapCount === identityComparison.sourceDistinctCount
  ) {
    return "receipt_candidate_identity_parity";
  }
  if (identityComparison.exactOverlapCount > 0) return "receipt_candidate_delta_adjudication_required";
  if (identityComparison.prefixStrippedOverlapCount > 0) return "receipt_candidate_identity_transform_blocked";
  return "receipt_candidate_no_canonical_overlap";
}

async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${text.slice(0, 120)}`);
  }
  return { json: JSON.parse(text), raw: text };
}

async function postArcgisQuery(base, params) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) body.set(key, value);
  const response = await fetch(`${base.replace(/\/$/, "")}/query`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`POST ${base}/query failed: ${response.status} ${text.slice(0, 120)}`);
  }
  return JSON.parse(text);
}

async function captureArcgisSource({ county, source, outDir, fixture }) {
  if (fixture) {
    const ids = new Set([`${county.fips}-fixture-1`, `${county.fips}-fixture-2`]);
    return writeCaptureArtifacts({
      outDir,
      sourceIds: ids,
      metadata: { name: `${county.county} fixture`, fields: [{ name: "PARCELID" }], maxRecordCount: 2000 },
      metadataRaw: JSON.stringify({ fixture: true, county: county.county }),
      sourceParcelIdField: "PARCELID",
      status: "captured"
    });
  }

  const metadataUrl = `${source.sourceUrl}?f=json`;
  const metadataResponse = await fetchJson(metadataUrl);
  const summary = summarizeArcgisLayer(metadataResponse.json);
  const sourceParcelIdField =
    source.preferredParcelIdFields?.find((field) => summary.fields.includes(field)) ?? summary.sourceParcelIdField;
  if (!sourceParcelIdField) {
    return writeCaptureArtifacts({
      outDir,
      sourceIds: new Set(),
      metadata: metadataResponse.json,
      metadataRaw: metadataResponse.raw,
      sourceParcelIdField: null,
      status: "blocked_no_source_native_id_field"
    });
  }

  const objectIdResponse = await postArcgisQuery(source.sourceUrl, {
    f: "json",
    where: "1=1",
    returnIdsOnly: "true"
  });
  const objectIds = objectIdResponse.objectIds ?? [];
  if (objectIds.length > 500_000) throw new Error(`${county.county} ArcGIS capture exceeded safety limit`);

  const ids = new Set();
  const chunks = [];
  for (let index = 0; index < objectIds.length; index += 500) {
    chunks.push(objectIds.slice(index, index + 500));
  }
  for (let index = 0; index < chunks.length; index += 8) {
    const pages = await Promise.all(
      chunks.slice(index, index + 8).map((chunk) =>
        postArcgisQuery(source.sourceUrl, {
          f: "json",
          where: "1=1",
          objectIds: chunk.join(","),
          outFields: sourceParcelIdField,
          returnGeometry: "false"
        })
      )
    );
    for (const page of pages) {
      for (const feature of page.features ?? []) {
        const id = normalizeId(feature.attributes?.[sourceParcelIdField]);
        if (id) ids.add(id);
      }
    }
  }

  if (ids.size === 0 && objectIds.length > 0) {
    const page = await postArcgisQuery(source.sourceUrl, {
      f: "json",
      where: "1=1",
      outFields: sourceParcelIdField,
      returnGeometry: "false",
      resultRecordCount: "2000"
    });
    for (const feature of page.features ?? []) {
      const id = normalizeId(feature.attributes?.[sourceParcelIdField]);
      if (id) ids.add(id);
    }
  }

  return writeCaptureArtifacts({
    outDir,
    sourceIds: ids,
    metadata: metadataResponse.json,
    metadataRaw: metadataResponse.raw,
    sourceParcelIdField,
    objectIdCount: objectIds.length,
    status: "captured"
  });
}

function writeCaptureArtifacts({ outDir, sourceIds, metadata, metadataRaw, sourceParcelIdField, objectIdCount = null, status }) {
  fs.mkdirSync(outDir, { recursive: true });
  const metadataPath = path.join(outDir, "source-metadata.json");
  const idsPath = path.join(outDir, "source-native-parcel-ids.jsonl");
  writeJson(metadataPath, metadata);
  fs.writeFileSync(
    idsPath,
    [...sourceIds]
      .sort((a, b) => a.localeCompare(b))
      .map((id) => JSON.stringify({ sourceNativeParcelId: id }))
      .join("\n") + (sourceIds.size > 0 ? "\n" : "")
  );
  return {
    status,
    sourceParcelIdField,
    rowCount: sourceIds.size,
    distinctSourceIds: sourceIds.size,
    sourceObjectIdCount: objectIdCount,
    nullOrBlankIds: 0,
    duplicateIds: 0,
    metadataArtifact: {
      path: repoRelative(metadataPath),
      sizeBytes: fs.statSync(metadataPath).size,
      sha256: sha256File(metadataPath),
      rawHttpSha256: sha256Bytes(metadataRaw)
    },
    sourceIdArtifact: {
      path: repoRelative(idsPath),
      sizeBytes: fs.statSync(idsPath).size,
      sha256: sha256File(idsPath)
    },
    sourceIds
  };
}

async function captureSource({ county, source, outDir, fixture }) {
  if (source.accessMethod === "arcgis_rest_query") {
    return captureArcgisSource({ county, source, outDir, fixture });
  }
  return {
    status: "blocked_no_governed_bulk_endpoint",
    sourceParcelIdField: source.sourceParcelIdField ?? null,
    rowCount: 0,
    distinctSourceIds: 0,
    nullOrBlankIds: 0,
    duplicateIds: 0,
    metadataArtifact: null,
    sourceIdArtifact: null,
    sourceIds: new Set()
  };
}

function runPsql(sql) {
  return execFileSync(
    "docker",
    ["exec", "-i", "terrafusion-postgres-dev", "psql", "-U", "postgres", "-d", "terrafusion", "-At", "-c", sql],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 128 }
  );
}

function fetchCanonicalIds({ county, fixture }) {
  if (fixture) return new Set([`${county.fips}-fixture-1`, `${county.fips}-fixture-2`]);
  const countyId = COUNTY_ID_FALLBACK[county.fips];
  if (!countyId) return new Set();
  const sql = `select "ParcelNumber" from canonical_tf.tf_parcel where "CountyId"='${countyId}'::uuid and "ParcelStatus"='ACTIVE' and nullif("ParcelNumber",'') is not null order by "ParcelNumber";`;
  const output = runPsql(sql);
  return new Set(output.split(/\r?\n/).map(normalizeId).filter(Boolean));
}

async function buildReport({ matrix, outRoot, fixture }) {
  fs.rmSync(outRoot, { recursive: true, force: true });
  const candidates = selectWave1Candidates(matrix);
  const results = [];

  for (const county of candidates) {
    const source = SOURCE_REGISTRY[county.county] ?? {
      sourceUrl: county.officialAssessorBaseUrl ?? null,
      accessMethod: "source_registry_missing",
      termsPosture: "source_registry_missing",
      sourceParcelIdField: null
    };
    const outDir = path.join(outRoot, county.county.toLowerCase().replaceAll(" ", "-"));
    const capture = await captureSource({ county, source, outDir, fixture });
    const sourceIds = capture.sourceIds;
    delete capture.sourceIds;
    const canonicalIds = fetchCanonicalIds({ county, fixture });
    const result = buildCountyRecaptureResult({
      county,
      source,
      capture,
      identityComparison: compareIdentitySets({ sourceIds, canonicalIds })
    });
    writeJson(path.join(outDir, "source-receipt-candidate.json"), result.receiptCandidate);
    results.push(result);
  }

  const summary = results.reduce(
    (acc, result) => {
      acc.byClassification[result.classification] = (acc.byClassification[result.classification] ?? 0) + 1;
      if (result.capture.status === "captured") acc.captured += 1;
      if (result.receiptCandidate.valid) acc.validReceiptCandidates += 1;
      return acc;
    },
    { countiesChecked: results.length, captured: 0, validReceiptCandidates: 0, byClassification: {} }
  );

  return {
    generatedAt: new Date().toISOString(),
    scope: "Authoritative recapture wave 1 for current authoritative_inventory_recapture_candidate counties.",
    candidates: candidates.map((candidate) => ({ county: candidate.county, fips: candidate.fips })),
    summary,
    results,
    blockers:
      summary.validReceiptCandidates < results.length
        ? [`${results.length - summary.validReceiptCandidates} wave 1 candidates did not produce valid receipt candidates.`]
        : [],
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    certificationAllowed: false
  };
}

function renderMarkdown(report) {
  const rows = report.results
    .map(
      (result) =>
        `| ${result.county} | ${result.fips} | ${result.capture.status} | ${result.capture.sourceParcelIdField ?? "-"} | ${result.capture.distinctSourceIds} | ${result.identityComparison.canonicalDistinctCount} | ${result.identityComparison.exactOverlapCount} | ${result.identityComparison.prefixStrippedOverlapCount} | ${result.classification} |`
    )
    .join("\n");
  const blockers = report.blockers.map((blocker) => `- ${blocker}`).join("\n");
  const countyBlockers = report.results
    .flatMap((result) => result.blockers.map((blocker) => `- ${result.county}: ${blocker}`))
    .join("\n");
  return `# Authoritative Recapture Wave 1

Generated: ${report.generatedAt}

## Summary

- Counties checked: ${report.summary.countiesChecked}
- Captured source artifacts: ${report.summary.captured}
- Valid receipt candidates: ${report.summary.validReceiptCandidates}
- Database mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}

## Results

| County | FIPS | Capture status | Source ID field | Source IDs | Canonical IDs | Exact overlap | Prefix-stripped overlap | Classification |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
${rows}

## Blockers

${blockers}

## County Blockers

${countyBlockers || "- None"}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    matrix: args.get("matrix") ?? DEFAULT_MATRIX,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD,
    fixture: args.has("fixture")
  };
  const report = await buildReport({
    matrix: readJson(paths.matrix),
    outRoot: paths.outRoot,
    fixture: paths.fixture
  });
  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`Authoritative recapture wave 1 written: ${repoRelative(paths.outJson)}`);
  console.log(`Classifications: ${JSON.stringify(report.summary.byClassification)}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
