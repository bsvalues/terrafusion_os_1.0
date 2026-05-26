#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_CROSSWALK = path.join(repoRoot, "generated", "truth", "washington-39-county-data-crosswalk.json");
const DEFAULT_SANITY = path.join(repoRoot, "generated", "truth", "benton-parcel-count-sanity.json");
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave2-source-acquisition"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave2-source-acquisition.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave2-source-acquisition.latest.md"
);

const WAVE2 = [
  { county: "Kitsap", fips: "53035", sourceParcelIdField: "parcel/account number from Kitsap sales workbooks" },
  { county: "Pierce", fips: "53053", sourceParcelIdField: "sale.txt field 3 parcel/account number" },
  { county: "Klickitat", fips: "53039", sourceParcelIdField: "parcel/account number from Klickitat sales reports" },
  { county: "Okanogan", fips: "53047", sourceParcelIdField: "parcel/account number from Okanogan comparable sales workbook" },
  { county: "San Juan", fips: "53055", sourceParcelIdField: "source-native parcel identifier from governed source artifact" }
];

const COUNTY_ID_FALLBACK = {
  "53035": "500ef839-e1cf-9c95-60b5-3b1b12f5851d",
  "53039": "9d619518-23ca-f6e9-03c9-6219db494501",
  "53047": "2ca5f53a-275d-d1b7-3266-80383d5e2387",
  "53053": "d4f5c5a1-8c6d-d91e-932e-de7f6b4f83e8",
  "53055": "58dfca57-004e-db24-2f9a-7ef637237347"
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

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function relativePath(filePath) {
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

function decodeXml(value) {
  return String(value ?? "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

export function normalizeParcelId(value) {
  return String(value ?? "").trim();
}

export function stripSeedPrefix(value) {
  return normalizeParcelId(value).replace(/^\d{3}-/, "");
}

function artifact(filePath) {
  return {
    path: relativePath(filePath),
    sizeBytes: fs.statSync(filePath).size,
    sha256: sha256File(filePath),
    lastWriteTime: fs.statSync(filePath).mtime.toISOString()
  };
}

function splitDelimitedLine(line, delimiter) {
  if (delimiter !== ",") return line.split(delimiter);
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function detectDelimiter(line) {
  const candidates = ["|", "\t", ","];
  return candidates
    .map((delimiter) => ({ delimiter, count: splitDelimitedLine(line, delimiter).length }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter ?? ",";
}

export function detectParcelIdColumn(headers) {
  const normalized = headers.map((header) => String(header ?? "").trim().toLowerCase());
  const patterns = [
    /^parcel$/,
    /^parcel\s*(number|no|id)$/i,
    /^parcel_?(number|no|id)$/i,
    /^parc(no|el)?$/i,
    /^pin$/i,
    /^tax\s*account(\s*number)?$/i,
    /^account\s*(number|no)$/i,
    /^property\s*(id|number|no)$/i
  ];
  for (let index = 0; index < normalized.length; index += 1) {
    if (patterns.some((pattern) => pattern.test(normalized[index]))) return index;
  }
  for (let index = 0; index < normalized.length; index += 1) {
    if (/(parcel|parcno|pin|tax account|property id|account number)/i.test(normalized[index])) return index;
  }
  return -1;
}

function looksLikeHeader(values) {
  return values.some((value) => /parcel|parc|pin|account|property/i.test(String(value ?? "")));
}

export function extractIdsFromDelimitedText(text, { fixedColumnIndex = null, sourceParcelIdField = null } = {}) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) {
    return { ids: new Set(), idField: sourceParcelIdField, rowCount: 0, nullOrBlank: 0, duplicates: 0 };
  }

  const delimiter = detectDelimiter(lines[0]);
  const first = splitDelimitedLine(lines[0], delimiter).map((value) => value.trim());
  const header = fixedColumnIndex === null && looksLikeHeader(first) ? first : null;
  const idColumn = fixedColumnIndex ?? (header ? detectParcelIdColumn(header) : -1);
  const start = header ? 1 : 0;
  const ids = new Set();
  let rowCount = 0;
  let nullOrBlank = 0;
  let duplicates = 0;

  if (idColumn < 0) {
    return {
      ids,
      idField: sourceParcelIdField ?? null,
      rowCount: Math.max(0, lines.length - start),
      nullOrBlank: lines.length - start,
      duplicates,
      reason: "source_native_id_column_not_detected"
    };
  }

  for (const line of lines.slice(start)) {
    const values = splitDelimitedLine(line, delimiter);
    rowCount += 1;
    const id = normalizeParcelId(values[idColumn]);
    if (!id) {
      nullOrBlank += 1;
      continue;
    }
    if (ids.has(id)) duplicates += 1;
    ids.add(id);
  }

  return {
    ids,
    idField: sourceParcelIdField ?? header?.[idColumn] ?? `column_${idColumn + 1}`,
    rowCount,
    nullOrBlank,
    duplicates,
    delimiter
  };
}

function collectFiles(root) {
  if (!fs.existsSync(root)) return [];
  const entries = fs.readdirSync(root, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const current = path.join(root, entry.name);
    return entry.isDirectory() ? collectFiles(current) : [current];
  });
}

function extractArchiveToTemp(filePath) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tf-wave2-"));
  execFileSync("tar", ["-xf", filePath, "-C", tempDir], { stdio: "ignore" });
  return tempDir;
}

function parseSharedStrings(sharedStringsPath) {
  if (!fs.existsSync(sharedStringsPath)) return [];
  const xml = fs.readFileSync(sharedStringsPath, "utf8");
  const strings = [];
  for (const match of xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
    const parts = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((part) => decodeXml(part[1]));
    strings.push(parts.join(""));
  }
  return strings;
}

function cellColumn(cellRef) {
  return String(cellRef ?? "")
    .replace(/[0-9]/g, "")
    .split("")
    .reduce((total, char) => total * 26 + char.toUpperCase().charCodeAt(0) - 64, 0) - 1;
}

function parseSheetRows(sheetPath, sharedStrings) {
  const xml = fs.readFileSync(sheetPath, "utf8");
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const values = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = attrs.match(/\br="([^"]+)"/)?.[1];
      const type = attrs.match(/\bt="([^"]+)"/)?.[1];
      const index = cellColumn(ref);
      const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? body.match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? "";
      const value = type === "s" ? sharedStrings[Number(rawValue)] ?? "" : decodeXml(rawValue);
      values[index < 0 ? values.length : index] = normalizeParcelId(value);
    }
    rows.push(values);
  }
  return rows;
}

function extractIdsFromRows(rows, sourceParcelIdField) {
  const ids = new Set();
  let idField = null;
  let idColumn = -1;
  let headerIndex = -1;
  for (let index = 0; index < Math.min(rows.length, 30); index += 1) {
    const detected = detectParcelIdColumn(rows[index] ?? []);
    if (detected >= 0) {
      idColumn = detected;
      idField = rows[index][detected];
      headerIndex = index;
      break;
    }
  }
  if (idColumn < 0) {
    return { ids, idField: sourceParcelIdField, rowCount: Math.max(0, rows.length), nullOrBlank: rows.length, duplicates: 0 };
  }
  let rowCount = 0;
  let nullOrBlank = 0;
  let duplicates = 0;
  for (const row of rows.slice(headerIndex + 1)) {
    if (!row?.some((value) => normalizeParcelId(value))) continue;
    rowCount += 1;
    const id = normalizeParcelId(row[idColumn]);
    if (!id) {
      nullOrBlank += 1;
      continue;
    }
    if (ids.has(id)) duplicates += 1;
    ids.add(id);
  }
  return {
    ids,
    idField: sourceParcelIdField ?? idField,
    rowCount,
    nullOrBlank,
    duplicates
  };
}

function parseXlsx(filePath, sourceParcelIdField) {
  const tempDir = extractArchiveToTemp(filePath);
  try {
    const sharedStrings = parseSharedStrings(path.join(tempDir, "xl", "sharedStrings.xml"));
    const worksheetRoot = path.join(tempDir, "xl", "worksheets");
    const sheets = fs.existsSync(worksheetRoot)
      ? fs.readdirSync(worksheetRoot).filter((name) => /^sheet\d+\.xml$/i.test(name))
      : [];
    const ids = new Set();
    const sheetSummaries = [];
    for (const sheet of sheets) {
      const parsed = extractIdsFromRows(parseSheetRows(path.join(worksheetRoot, sheet), sharedStrings), sourceParcelIdField);
      for (const id of parsed.ids) ids.add(id);
      sheetSummaries.push({
        sheet,
        idField: parsed.idField,
        idsExtracted: parsed.ids.size,
        rowCount: parsed.rowCount,
        nullOrBlank: parsed.nullOrBlank,
        duplicates: parsed.duplicates
      });
    }
    return {
      ids,
      idField: sheetSummaries.find((summary) => summary.idsExtracted > 0)?.idField ?? sourceParcelIdField,
      rowCount: sheetSummaries.reduce((total, summary) => total + summary.rowCount, 0),
      nullOrBlank: sheetSummaries.reduce((total, summary) => total + summary.nullOrBlank, 0),
      duplicates: sheetSummaries.reduce((total, summary) => total + summary.duplicates, 0),
      sheetSummaries
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function parseZip(filePath, county) {
  const tempDir = extractArchiveToTemp(filePath);
  try {
    const files = collectFiles(tempDir).filter((file) => /\.(txt|csv|tsv|xlsx)$/i.test(file));
    const ids = new Set();
    const nestedSummaries = [];
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const parsed =
        ext === ".xlsx"
          ? parseXlsx(file, county.sourceParcelIdField)
          : extractIdsFromDelimitedText(fs.readFileSync(file, "utf8"), {
              fixedColumnIndex: county.fips === "53053" && path.basename(file).toLowerCase() === "sale.txt" ? 2 : null,
              sourceParcelIdField:
                county.fips === "53053" && path.basename(file).toLowerCase() === "sale.txt"
                  ? "Pierce sale.txt field 3 parcel/account number"
                  : county.sourceParcelIdField
            });
      for (const id of parsed.ids) ids.add(id);
      nestedSummaries.push({
        path: path.relative(tempDir, file).replaceAll(path.sep, "/"),
        idField: parsed.idField,
        idsExtracted: parsed.ids.size,
        rowCount: parsed.rowCount,
        nullOrBlank: parsed.nullOrBlank,
        duplicates: parsed.duplicates
      });
    }
    return {
      ids,
      idField: nestedSummaries.find((summary) => summary.idsExtracted > 0)?.idField ?? county.sourceParcelIdField,
      rowCount: nestedSummaries.reduce((total, summary) => total + summary.rowCount, 0),
      nullOrBlank: nestedSummaries.reduce((total, summary) => total + summary.nullOrBlank, 0),
      duplicates: nestedSummaries.reduce((total, summary) => total + summary.duplicates, 0),
      nestedSummaries
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function parseSourceArtifact(filePath, county) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".xlsx") return parseXlsx(filePath, county.sourceParcelIdField);
  if (ext === ".zip") return parseZip(filePath, county);
  if ([".txt", ".csv", ".tsv"].includes(ext)) {
    return extractIdsFromDelimitedText(fs.readFileSync(filePath, "utf8"), {
      sourceParcelIdField: county.sourceParcelIdField
    });
  }
  return { ids: new Set(), idField: county.sourceParcelIdField, rowCount: 0, nullOrBlank: 0, duplicates: 0 };
}

function resolveCountyRows(crosswalk) {
  return new Map(crosswalk.rows.map((row) => [row.county, row]));
}

function buildCountyIdMap(sanity) {
  const map = new Map();
  for (const row of sanity.rowsByCounty ?? []) {
    const match = row.countyName?.match(/^(.+?) County$/);
    if (match) map.set(match[1], row.countyId);
  }
  return map;
}

function runPsql(sql) {
  return execFileSync(
    "docker",
    ["exec", "-i", "terrafusion-postgres-dev", "psql", "-U", "postgres", "-d", "terrafusion", "-At", "-c", sql],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 }
  );
}

function fetchCanonicalIds(countyId) {
  if (!countyId) return new Set();
  const sql = `select "ParcelNumber" from canonical_tf.tf_parcel where "CountyId"='${countyId}'::uuid and "ParcelStatus"='ACTIVE' and nullif("ParcelNumber",'') is not null order by "ParcelNumber";`;
  const output = runPsql(sql);
  return new Set(output.split(/\r?\n/).map(normalizeParcelId).filter(Boolean));
}

function setIntersectionCount(left, right) {
  let count = 0;
  for (const value of left) {
    if (right.has(value)) count += 1;
  }
  return count;
}

function samplesFromSet(values, limit = 8) {
  return [...values].sort((a, b) => a.localeCompare(b)).slice(0, limit);
}

export function classifyAcquisition({
  sourceDistinctCount,
  canonicalDistinctCount,
  exactOverlapCount,
  transformedOverlapCount,
  receiptGradeSource
}) {
  if (!receiptGradeSource || sourceDistinctCount === 0) return "blocked_source_access";
  if (canonicalDistinctCount > 0 && exactOverlapCount === sourceDistinctCount && sourceDistinctCount === canonicalDistinctCount) {
    return "full_identity_candidate";
  }
  if (exactOverlapCount > 0) return "shell_present_candidate";
  if (transformedOverlapCount > exactOverlapCount) return "blocked_transform";
  return "blocked_source_access";
}

function blockersFor(classification, { sourceDistinctCount, exactOverlapCount, transformedOverlapCount, canonicalDistinctCount }) {
  if (classification === "full_identity_candidate") return [];
  if (classification === "shell_present_candidate") {
    return [
      `Source artifact proves ${sourceDistinctCount} source-native IDs with ${exactOverlapCount} canonical overlaps, but it is not full canonical parity against ${canonicalDistinctCount} active canonical IDs.`
    ];
  }
  if (classification === "blocked_transform") {
    return [
      `Exact source-native overlap is 0, but overlap after stripping known three-digit WA_INITIAL_SEED prefix is ${transformedOverlapCount}; source-native ParcelNumber contract is not met.`
    ];
  }
  return ["No governed receipt-grade source-native parcel ID artifact was parsed for this county."];
}

export function buildCountyAcquisition({
  county,
  sourceIds,
  canonicalIds,
  artifacts,
  parserSummaries,
  accessPath,
  sourceReceiptGrade
}) {
  const canonicalStripped = new Set([...canonicalIds].map(stripSeedPrefix));
  const exactOverlapCount = setIntersectionCount(sourceIds, canonicalIds);
  const transformedOverlapCount = setIntersectionCount(sourceIds, canonicalStripped);
  const sourceDistinctCount = sourceIds.size;
  const canonicalDistinctCount = canonicalIds.size;
  const classification = classifyAcquisition({
    sourceDistinctCount,
    canonicalDistinctCount,
    exactOverlapCount,
    transformedOverlapCount,
    receiptGradeSource: sourceReceiptGrade
  });
  const blockers = blockersFor(classification, {
    sourceDistinctCount,
    exactOverlapCount,
    transformedOverlapCount,
    canonicalDistinctCount
  });

  return {
    county: county.county,
    fips: county.fips,
    accessPath,
    sourceParcelIdField: county.sourceParcelIdField,
    classification,
    receiptCandidate: {
      receiptVersion: "wa_initial_seed_source_identity_candidate_v1",
      countyName: `${county.county} County`,
      fips: county.fips,
      sourceClass: "WA_INITIAL_SEED",
      sourceParcelIdField: county.sourceParcelIdField,
      artifacts,
      counts: {
        sourceDistinctParcelIds: sourceDistinctCount,
        canonicalActiveDistinctParcelNumbers: canonicalDistinctCount,
        exactSourceCanonicalOverlap: exactOverlapCount,
        transformedSourceCanonicalOverlap: transformedOverlapCount
      },
      classification,
      certificationAllowed: false,
      productionBindingAllowed: false
    },
    parserSummaries,
    identityComparison: {
      sourceDistinctCount,
      canonicalDistinctCount,
      exactOverlapCount,
      transformedOverlapCount,
      sourceSamples: samplesFromSet(sourceIds),
      canonicalSamples: samplesFromSet(canonicalIds),
      canonicalStrippedSamples: samplesFromSet(canonicalStripped)
    },
    blockers,
    doctrine: {
      databaseMutationAttempted: false,
      productionBindingAllowed: false,
      runtimeClaimAllowed: false,
      certificationAllowed: false
    }
  };
}

function writeSourceIdArtifact({ outRoot, county, sourceIds }) {
  const countySlug = county.county.toLowerCase().replaceAll(" ", "-");
  const outDir = path.join(outRoot, countySlug);
  fs.mkdirSync(outDir, { recursive: true });
  const artifactPath = path.join(outDir, "source-native-parcel-ids.jsonl");
  const lines = [...sourceIds]
    .sort((a, b) => a.localeCompare(b))
    .map((parcelId) => JSON.stringify({ fips: county.fips, county: county.county, sourceNativeParcelId: parcelId }))
    .join("\n");
  fs.writeFileSync(artifactPath, lines ? `${lines}\n` : "");
  return artifactPath;
}

async function buildWave2Report({ crosswalk, sanity, outRoot }) {
  const rowsByCounty = resolveCountyRows(crosswalk);
  const countyIdByName = buildCountyIdMap(sanity);
  const counties = [];

  for (const waveCounty of WAVE2) {
    const crosswalkRow = rowsByCounty.get(waveCounty.county) ?? {};
    const county = {
      ...waveCounty,
      payloadFiles: crosswalkRow.payloadFiles ?? [],
      localDataFiles: crosswalkRow.localDataFiles ?? [],
      officialAssessorBaseUrl: crosswalkRow.officialAssessorBaseUrl ?? null,
      primarySalesSource: crosswalkRow.primarySalesSource ?? null
    };
    const payloadFiles = (county.payloadFiles ?? []).map((file) => path.resolve(repoRoot, file)).filter((file) => fs.existsSync(file));
    const sourceReceiptGrade = payloadFiles.length > 0;
    const artifacts = payloadFiles.map(artifact);
    const parserSummaries = [];
    const sourceIds = new Set();

    for (const filePath of payloadFiles) {
      const parsed = parseSourceArtifact(filePath, county);
      for (const id of parsed.ids) sourceIds.add(id);
      parserSummaries.push({
        path: relativePath(filePath),
        idField: parsed.idField,
        idsExtracted: parsed.ids.size,
        rowCount: parsed.rowCount,
        nullOrBlank: parsed.nullOrBlank,
        duplicates: parsed.duplicates,
        sheetSummaries: parsed.sheetSummaries,
        nestedSummaries: parsed.nestedSummaries,
        reason: parsed.reason
      });
    }

    const canonicalIds = fetchCanonicalIds(countyIdByName.get(county.county) ?? COUNTY_ID_FALLBACK[county.fips]);
    const sourceIdArtifactPath = writeSourceIdArtifact({ outRoot, county, sourceIds });
    const countyReport = buildCountyAcquisition({
      county,
      sourceIds,
      canonicalIds,
      artifacts: [
        ...artifacts,
        {
          path: relativePath(sourceIdArtifactPath),
          sizeBytes: fs.statSync(sourceIdArtifactPath).size,
          sha256: sha256File(sourceIdArtifactPath),
          generatedArtifact: true
        }
      ],
      parserSummaries,
      accessPath: sourceReceiptGrade ? "existing_governed_payload_file" : "blocked_no_receipt_grade_payload",
      sourceReceiptGrade
    });
    writeJson(path.join(outRoot, county.county.toLowerCase().replaceAll(" ", "-"), "source-receipt-candidate.json"), countyReport.receiptCandidate);
    counties.push(countyReport);
  }

  const summary = counties.reduce(
    (acc, county) => {
      acc.byClassification[county.classification] = (acc.byClassification[county.classification] ?? 0) + 1;
      if (county.classification !== "blocked_source_access") acc.sourceArtifactsCaptured += 1;
      return acc;
    },
    {
      countiesChecked: counties.length,
      sourceArtifactsCaptured: 0,
      byClassification: {}
    }
  );

  return {
    generatedAt: new Date().toISOString(),
    scope: "Wave 2 source-native parcel ID acquisition for Kitsap, Pierce, Klickitat, Okanogan, and San Juan.",
    summary,
    counties,
    doctrine: {
      databaseMutationAttempted: false,
      productionBindingAllowed: false,
      runtimeClaimAllowed: false,
      certificationAllowed: false
    },
    blockers: [
      "This slice captures source-native parcel ID evidence only; it does not load or mutate canonical data.",
      "Production binding remains blocked until the remaining WA_INITIAL_SEED receipt posture is reconciled."
    ]
  };
}

function renderMarkdown(report) {
  const rows = report.counties
    .map(
      (county) =>
        `| ${county.county} | ${county.fips} | ${county.accessPath} | ${county.identityComparison.sourceDistinctCount} | ${county.identityComparison.canonicalDistinctCount} | ${county.identityComparison.exactOverlapCount} | ${county.identityComparison.transformedOverlapCount} | ${county.classification} |`
    )
    .join("\n");
  const blockers = report.blockers.map((blocker) => `- ${blocker}`).join("\n");
  return `# June 10 Wave 2 Source Acquisition

Generated: ${report.generatedAt}

## Summary

- Counties checked: ${report.summary.countiesChecked}
- Source artifacts captured: ${report.summary.sourceArtifactsCaptured}
- Database mutation attempted: ${report.doctrine.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.doctrine.productionBindingAllowed ? "yes" : "no"}

## County Results

| County | FIPS | Access path | Source IDs | Canonical IDs | Exact overlap | Prefix-stripped overlap | Classification |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
${rows}

## Blockers

${blockers}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    crosswalk: args.get("crosswalk") ?? DEFAULT_CROSSWALK,
    sanity: args.get("sanity") ?? DEFAULT_SANITY,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const report = await buildWave2Report({
    crosswalk: readJson(paths.crosswalk),
    sanity: readJson(paths.sanity),
    outRoot: paths.outRoot
  });
  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`Wave 2 source acquisition written: ${relativePath(paths.outJson)}`);
  console.log(`Classifications: ${JSON.stringify(report.summary.byClassification)}`);
  console.log(`Production binding allowed: ${report.doctrine.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
