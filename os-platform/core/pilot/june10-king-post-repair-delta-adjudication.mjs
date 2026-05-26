#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const KING_SERVICE_URL =
  "https://gisdata.kingcounty.gov/arcgis/rest/services/OpenDataPortal/property__parcel_area/MapServer/439";
const DEFAULT_CLOSURE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wa-initial-seed-post-repair-certification-closure.latest.json"
);
const DEFAULT_SOURCE_ARTIFACT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-source-captures",
  "king",
  "king-parcels-source-native-raw.jsonl"
);
const DEFAULT_SOURCE_METADATA = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-source-captures",
  "king",
  "king-parcel-identity-capture-metadata.json"
);
const DEFAULT_SERVICE_METADATA = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-source-captures",
  "king",
  "king-parcel-identity-service-metadata.json"
);
const DEFAULT_CANONICAL_EXPORT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-public-source-captures",
  "king",
  "king-canonical-parcelnumbers.csv"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-post-repair-delta-adjudication"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-post-repair-delta-adjudication.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-post-repair-delta-adjudication.latest.md"
);

function normalizeId(value) {
  return String(value ?? "").trim();
}

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfPresent(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return readJson(filePath);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeLines(filePath, values) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${values.join("\n")}${values.length ? "\n" : ""}`);
}

function parseCanonicalParcelIds(content) {
  const lines = String(content ?? "").split(/\r?\n/).filter(Boolean);
  return lines.slice(1).map((line) => normalizeId(line.replace(/^"|"$/g, ""))).filter(Boolean);
}

function parseArcGisParcelIdsFromField(content, fieldName) {
  const ids = [];
  for (const line of String(content ?? "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line);
    for (const feature of parsed.features ?? []) {
      ids.push(normalizeId(feature.attributes?.[fieldName]));
    }
  }
  return ids;
}

function frequencyMap(values) {
  const map = new Map();
  for (const value of values) {
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return map;
}

function setDifference(left, right) {
  const rightSet = new Set(right);
  return [...new Set(left)].filter((value) => value && !rightSet.has(value)).sort();
}

function sample(values, limit = 50) {
  return values.slice(0, limit);
}

function summarizeFrequencies(values) {
  const blankRows = values.filter((value) => !value).length;
  const nonBlank = values.filter(Boolean);
  const frequencies = frequencyMap(nonBlank);
  const duplicates = [...frequencies.entries()]
    .filter(([, count]) => count > 1)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  const duplicateExtraRows = duplicates.reduce((total, [, count]) => total + count - 1, 0);

  return {
    rowCount: values.length,
    blankRows,
    distinctNonBlank: frequencies.size,
    duplicateIdCount: duplicates.length,
    duplicateExtraRows,
    duplicateSample: duplicates.slice(0, 50).map(([parcelNumber, count]) => ({ parcelNumber, count }))
  };
}

function summarizeIdentifierPatterns(values) {
  const patterns = {
    allDigits: 0,
    containsLetters: 0,
    containsDash: 0,
    unknownSuffix: 0,
    tractOrPlaceholderHint: 0,
    leadingZero: 0
  };

  for (const value of values) {
    if (/^\d+$/.test(value)) patterns.allDigits += 1;
    if (/[A-Za-z]/.test(value)) patterns.containsLetters += 1;
    if (/-/.test(value)) patterns.containsDash += 1;
    if (/UNKN$/i.test(value)) patterns.unknownSuffix += 1;
    if (/TR|TRACT|PUBL|PVRD|UNKN/i.test(value)) patterns.tractOrPlaceholderHint += 1;
    if (/^0/.test(value)) patterns.leadingZero += 1;
  }

  return patterns;
}

function findCaseNormalizationEdges({ sourceOnly, canonicalOnly }) {
  const canonicalUpper = new Map();
  for (const value of canonicalOnly) {
    const key = value.toUpperCase();
    if (!canonicalUpper.has(key)) canonicalUpper.set(key, []);
    canonicalUpper.get(key).push(value);
  }
  const sourceUpper = new Map();
  for (const value of sourceOnly) {
    const key = value.toUpperCase();
    if (!sourceUpper.has(key)) sourceUpper.set(key, []);
    sourceUpper.get(key).push(value);
  }

  const edges = [];
  for (const sourceValue of sourceOnly) {
    const canonicalMatches = canonicalUpper.get(sourceValue.toUpperCase()) ?? [];
    for (const canonicalValue of canonicalMatches) {
      edges.push({ sourceValue, canonicalValue });
    }
  }

  return {
    count: edges.length,
    sourceOnlyCaseMatchCount: sourceOnly.filter((value) => canonicalUpper.has(value.toUpperCase())).length,
    canonicalOnlyCaseMatchCount: canonicalOnly.filter((value) => sourceUpper.has(value.toUpperCase())).length,
    sample: edges.slice(0, 50)
  };
}

function classifyKingDelta({ sourceOnly, canonicalOnly, sourceSummary, captureMetadata, serviceMetadata }) {
  const blockers = [];
  const classifications = [];
  const capturedComplete =
    Number(captureMetadata?.expectedSourceCount ?? -1) === Number(captureMetadata?.capturedFeatureRows ?? -2);
  const sourceHasDuplicateGeometryRows = sourceSummary.duplicateExtraRows > 0;
  const serviceDocumentsStackedGeometry =
    /stacked polygon|undivided interest|vertical parcels/i.test(serviceMetadata?.description ?? "");
  const serviceDocumentsPlaceholders = /place-holder polygons|placeholder/i.test(serviceMetadata?.description ?? "");
  const caseEdges = findCaseNormalizationEdges({ sourceOnly, canonicalOnly });

  if (sourceHasDuplicateGeometryRows && serviceDocumentsStackedGeometry) {
    classifications.push({
      class: "duplicate_source_geometry_semantics",
      count: sourceSummary.duplicateExtraRows,
      disposition:
        "Source raw row count includes duplicate PIN rows from documented stacked polygon / vertical parcel geometry; this explains raw-row surplus, not source/canonical identity drift."
    });
  }

  if (sourceOnly.length > 0 && capturedComplete) {
    classifications.push({
      class: "source_update_drift_or_canonical_import_gap",
      count: sourceOnly.length,
      disposition:
        "Current complete source artifact contains distinct PINs that are absent from canonical export; King cannot certify until these are loaded, intentionally filtered with evidence, or mapped by an approved crosswalk."
    });
    blockers.push(`${sourceOnly.length} current source PINs are missing from canonical ParcelNumber.`);
  }

  if (canonicalOnly.length > 0) {
    classifications.push({
      class: "canonical_stale_or_unproven_seed_rows",
      count: canonicalOnly.length,
      disposition:
        "Canonical ParcelNumber values are absent from the current complete source PIN artifact; they require DB-row detail and source recapture/probe before any supersede or rollback decision."
    });
    blockers.push(`${canonicalOnly.length} canonical ParcelNumber values are absent from the current source PIN artifact.`);
  }

  if (caseEdges.count > 0) {
    classifications.push({
      class: "identifier_case_normalization_edge_cases",
      count: caseEdges.count,
      disposition:
        "Some source-only and canonical-only values differ only by letter case. Source-native ParcelNumber policy must decide whether exact source case is preserved or whether uppercase normalization is an approved transform."
    });
    blockers.push(`${caseEdges.count} source/canonical identifier pairs differ only by case or casing style.`);
  }

  if (serviceDocumentsPlaceholders) {
    classifications.push({
      class: "placeholder_polygon_terms_risk",
      count: null,
      disposition:
        "King source explicitly includes placeholder polygons that do not represent tax parcels; load rules must decide whether those are excluded from runtime parcel identity."
    });
  }

  const decision =
    sourceOnly.length === 0 && canonicalOnly.length === 0
      ? "accept_identity_delta_closed"
      : "require_bounded_reimport_and_supersede_plan";

  return {
    decision,
    classifications,
    caseEdges,
    blockers,
    recommendedNextAction:
      decision === "accept_identity_delta_closed"
        ? "Convert King receipt only after source count semantics and receipt fields are verified."
        : "Do not certify King. Build a King-only correction plan: preserve the existing repaired rows, acquire the full allowed source payload if needed, load or account for the 1,173 source-only PINs, and separately adjudicate the 463 canonical-only rows before any mutation."
  };
}

function findKingClosure(closure) {
  return (closure.counties ?? []).find((county) => String(county.fips) === "53033");
}

export function adjudicateKingDelta({
  closure,
  sourceIds,
  canonicalIds,
  captureMetadata,
  serviceMetadata
}) {
  const king = findKingClosure(closure);
  if (!king) {
    throw new Error("King County closure row not found.");
  }

  const sourceSummary = summarizeFrequencies(sourceIds);
  const canonicalSummary = summarizeFrequencies(canonicalIds);
  const sourceDistinct = [...new Set(sourceIds.filter(Boolean))].sort();
  const canonicalDistinct = [...new Set(canonicalIds.filter(Boolean))].sort();
  const sourceOnly = setDifference(sourceDistinct, canonicalDistinct);
  const canonicalOnly = setDifference(canonicalDistinct, sourceDistinct);
  const exactOverlap = sourceDistinct.length - sourceOnly.length;
  const rootCause = classifyKingDelta({
    sourceOnly,
    canonicalOnly,
    sourceSummary,
    captureMetadata,
    serviceMetadata
  });

  return {
    generatedAt: new Date().toISOString(),
    countyName: "King County",
    fips: "53033",
    scope: "King only",
    sourceUrl: captureMetadata?.sourceUrl ?? KING_SERVICE_URL,
    sourceParcelIdField: captureMetadata?.parcelIdField ?? "PIN",
    databaseMutationAllowed: false,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    closureBaseline: {
      sourceOnlyCount: king.sourceOnlyCount,
      canonicalOnlyCount: king.canonicalOnlyCount,
      certificationStatus: king.certificationStatus
    },
    summary: {
      sourceRows: sourceSummary.rowCount,
      sourceDistinctParcelIds: sourceSummary.distinctNonBlank,
      sourceBlankRows: sourceSummary.blankRows,
      sourceDuplicateIdCount: sourceSummary.duplicateIdCount,
      sourceDuplicateExtraRows: sourceSummary.duplicateExtraRows,
      canonicalRows: canonicalSummary.rowCount,
      canonicalDistinctParcelIds: canonicalSummary.distinctNonBlank,
      canonicalBlankRows: canonicalSummary.blankRows,
      canonicalDuplicateIdCount: canonicalSummary.duplicateIdCount,
      canonicalDuplicateExtraRows: canonicalSummary.duplicateExtraRows,
      exactOverlap,
      sourceOnlyCount: sourceOnly.length,
      canonicalOnlyCount: canonicalOnly.length,
      capturedFeatureRows: captureMetadata?.capturedFeatureRows ?? null,
      expectedSourceCount: captureMetadata?.expectedSourceCount ?? null,
      sourceCaptureComplete:
        Number(captureMetadata?.expectedSourceCount ?? -1) === Number(captureMetadata?.capturedFeatureRows ?? -2)
    },
    sourceOnlySample: sample(sourceOnly),
    canonicalOnlySample: sample(canonicalOnly),
    caseNormalizationEdges: rootCause.caseEdges,
    sourceOnlyPatterns: summarizeIdentifierPatterns(sourceOnly),
    canonicalOnlyPatterns: summarizeIdentifierPatterns(canonicalOnly),
    duplicateSourceSample: sourceSummary.duplicateSample,
    serviceFacts: {
      documentsPlaceholderPolygons: /place-holder polygons|placeholder/i.test(serviceMetadata?.description ?? ""),
      documentsStackedGeometry: /stacked polygon|undivided interest|vertical parcels/i.test(serviceMetadata?.description ?? ""),
      pinIndexUnique: (serviceMetadata?.indexes ?? []).find((index) => index.fields === "PIN")?.isUnique ?? null,
      geometryCaptured: captureMetadata?.geometryCaptured ?? null,
      ownerFieldsCaptured: captureMetadata?.ownerFieldsCaptured ?? null,
      termsPosture: captureMetadata?.termsPosture ?? null
    },
    decision: rootCause.decision,
    classifications: rootCause.classifications,
    recommendedNextAction: rootCause.recommendedNextAction,
    blockers: rootCause.blockers
  };
}

function renderMarkdown(report) {
  const classifications = report.classifications
    .map((row) => `| ${row.class} | ${row.count ?? "-"} | ${row.disposition} |`)
    .join("\n");
  const blockers = report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  const sourceOnly = report.sourceOnlySample.map((value) => `- ${value}`).join("\n") || "- none";
  const canonicalOnly = report.canonicalOnlySample.map((value) => `- ${value}`).join("\n") || "- none";
  const caseEdges = report.caseNormalizationEdges.sample
    .map((edge) => `- ${edge.sourceValue} -> ${edge.canonicalValue}`)
    .join("\n") || "- none";

  return `# King Post-Repair Delta Adjudication

Generated: ${report.generatedAt}

## Verdict

- Decision: ${report.decision}
- Recommended next action: ${report.recommendedNextAction}
- Source-only PINs: ${report.summary.sourceOnlyCount}
- Canonical-only ParcelNumbers: ${report.summary.canonicalOnlyCount}
- Case-only source/canonical edges: ${report.caseNormalizationEdges.count}
- Exact source/canonical overlap: ${report.summary.exactOverlap}
- Source duplicate extra rows: ${report.summary.sourceDuplicateExtraRows}
- Source capture complete: ${report.summary.sourceCaptureComplete ? "yes" : "no"}
- Database mutation allowed: ${report.databaseMutationAllowed ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}

## Source Facts

- Source URL: ${report.sourceUrl}
- Parcel ID field: ${report.sourceParcelIdField}
- Terms posture: ${report.serviceFacts.termsPosture}
- Geometry captured: ${report.serviceFacts.geometryCaptured ? "yes" : "no"}
- Owner fields captured: ${report.serviceFacts.ownerFieldsCaptured ? "yes" : "no"}
- Placeholder polygons documented: ${report.serviceFacts.documentsPlaceholderPolygons ? "yes" : "no"}
- Stacked geometry documented: ${report.serviceFacts.documentsStackedGeometry ? "yes" : "no"}
- PIN index unique: ${report.serviceFacts.pinIndexUnique === null ? "unknown" : report.serviceFacts.pinIndexUnique ? "yes" : "no"}

## Classification

| Class | Count | Disposition |
| --- | ---: | --- |
${classifications}

## Samples

### Source-Only PINs

${sourceOnly}

### Canonical-Only ParcelNumbers

${canonicalOnly}

### Case-Only Edge Cases

${caseEdges}

## Blockers

${blockers}
`;
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--") continue;
    if (!argv[index]?.startsWith("--")) continue;
    args.set(argv[index].slice(2), argv[index + 1]);
    index += 1;
  }
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    closure: args.get("closure") ?? DEFAULT_CLOSURE,
    sourceArtifact: args.get("source-artifact") ?? DEFAULT_SOURCE_ARTIFACT,
    sourceMetadata: args.get("source-metadata") ?? DEFAULT_SOURCE_METADATA,
    serviceMetadata: args.get("service-metadata") ?? DEFAULT_SERVICE_METADATA,
    canonicalExport: args.get("canonical-export") ?? DEFAULT_CANONICAL_EXPORT,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };

  const captureMetadata = readJsonIfPresent(paths.sourceMetadata);
  const fieldName = captureMetadata?.parcelIdField ?? "PIN";
  const report = adjudicateKingDelta({
    closure: readJson(paths.closure),
    sourceIds: parseArcGisParcelIdsFromField(fs.readFileSync(paths.sourceArtifact, "utf8"), fieldName),
    canonicalIds: parseCanonicalParcelIds(fs.readFileSync(paths.canonicalExport, "utf8")),
    captureMetadata,
    serviceMetadata: readJsonIfPresent(paths.serviceMetadata) ?? {}
  });

  const sourceOnly = setDifference(
    [...new Set(parseArcGisParcelIdsFromField(fs.readFileSync(paths.sourceArtifact, "utf8"), fieldName).filter(Boolean))].sort(),
    parseCanonicalParcelIds(fs.readFileSync(paths.canonicalExport, "utf8"))
  );
  const canonicalOnly = setDifference(
    [...new Set(parseCanonicalParcelIds(fs.readFileSync(paths.canonicalExport, "utf8")).filter(Boolean))].sort(),
    parseArcGisParcelIdsFromField(fs.readFileSync(paths.sourceArtifact, "utf8"), fieldName)
  );

  writeJson(paths.outJson, report);
  fs.writeFileSync(paths.outMd, renderMarkdown(report));
  writeLines(path.join(paths.outRoot, "king-source-only-parcels.txt"), sourceOnly);
  writeLines(path.join(paths.outRoot, "king-canonical-only-parcels.txt"), canonicalOnly);
  writeJson(path.join(paths.outRoot, "king-duplicate-source-pin-report.json"), report.duplicateSourceSample);

  console.log(`King post-repair delta adjudication written: ${repoRelative(paths.outJson)}`);
  console.log(`Decision: ${report.decision}`);
  console.log(`Source-only PINs: ${report.summary.sourceOnlyCount}`);
  console.log(`Canonical-only ParcelNumbers: ${report.summary.canonicalOnlyCount}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
