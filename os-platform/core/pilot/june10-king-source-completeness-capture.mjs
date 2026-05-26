#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const KING_SERVICE_URL =
  "https://gisdata.kingcounty.gov/arcgis/rest/services/OpenDataPortal/property__parcel_area/MapServer/439";
const REQUIRED_RUNTIME_SHELL_FIELDS = Object.freeze([
  "PIN",
  "MAJOR",
  "MINOR",
  "Shape_Length",
  "Shape_Area"
]);
const OUT_FIELDS = Object.freeze(["OBJECTID", ...REQUIRED_RUNTIME_SHELL_FIELDS]);
const DEFAULT_DRY_RUN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-correction-dry-run.latest.json"
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
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-source-completeness-capture"
);
const DEFAULT_RAW_ARTIFACT = path.join(DEFAULT_OUT_ROOT, "king-source-only-runtime-fields-raw.jsonl");
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-source-completeness-capture.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-source-completeness-capture.latest.md"
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

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function sqlStringLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function unique(values) {
  return [...new Set(values.map(normalizeId).filter(Boolean))];
}

function buildRuntimeFieldQueryUrl(parcelNumbers) {
  const url = new URL(`${KING_SERVICE_URL}/query`);
  url.searchParams.set("f", "json");
  url.searchParams.set("where", `PIN in (${parcelNumbers.map(sqlStringLiteral).join(",")})`);
  url.searchParams.set("outFields", OUT_FIELDS.join(","));
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("resultRecordCount", String(Math.max(parcelNumbers.length * 4, 10)));
  return url;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "TerraFusion-June10-King-Source-Completeness/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  const json = await response.json();
  if (json.error) {
    throw new Error(`ArcGIS error for ${url}: ${JSON.stringify(json.error)}`);
  }
  return json;
}

function parseArcGisJsonl(filePath) {
  const features = [];
  if (!fs.existsSync(filePath)) return features;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line);
    features.push(...(parsed.features ?? []));
  }
  return features;
}

async function captureRuntimeFields({ requestedPins, rawArtifactPath, batchSize = 25 }) {
  fs.mkdirSync(path.dirname(rawArtifactPath), { recursive: true });
  const stream = fs.createWriteStream(rawArtifactPath, { encoding: "utf8" });
  let pageCount = 0;
  let capturedFeatureRows = 0;

  for (const batch of chunk(requestedPins, batchSize)) {
    const url = buildRuntimeFieldQueryUrl(batch);
    const page = await fetchJson(url);
    const features = page.features ?? [];
    stream.write(`${JSON.stringify({ queryUrl: String(url), requestedPins: batch, features })}\n`);
    pageCount += 1;
    capturedFeatureRows += features.length;
  }

  await new Promise((resolve, reject) => {
    stream.end(resolve);
    stream.on("error", reject);
  });

  return { pageCount, capturedFeatureRows };
}

function hasRuntimeShellFields(attributes) {
  return REQUIRED_RUNTIME_SHELL_FIELDS.every((field) => normalizeId(attributes?.[field]) !== "");
}

function isPlaceholderPin(pin) {
  return /TR|TRACT|PUBL|PVRD|UNKN/i.test(pin);
}

export function normalizeKingSourceRows({ requestedPins, features }) {
  const requestedSet = new Set(unique(requestedPins));
  const byPin = new Map();
  const rejectedRows = [];
  let duplicateGeometryRows = 0;

  for (const feature of features ?? []) {
    const attributes = feature.attributes ?? {};
    const pin = normalizeId(attributes.PIN);
    if (!pin) {
      rejectedRows.push({
        reason: "Missing PIN.",
        rawAttributes: attributes
      });
      continue;
    }
    if (!requestedSet.has(pin)) continue;
    if (byPin.has(pin)) {
      duplicateGeometryRows += 1;
      continue;
    }
    byPin.set(pin, {
      parcelNumber: pin,
      sourceParcelIdField: "PIN",
      major: normalizeId(attributes.MAJOR),
      minor: normalizeId(attributes.MINOR),
      objectId: attributes.OBJECTID ?? null,
      shapeLength: Number(attributes.Shape_Length ?? 0),
      shapeArea: Number(attributes.Shape_Area ?? 0),
      proposedTerraFusionParcelKey: `53033:${pin}`,
      loadableAsRuntimeParcelShell: hasRuntimeShellFields(attributes),
      ownerAddressValueWorkflowComplete: false,
      missingWorkflowFields: ["owner name", "situs address", "assessed value"],
      placeholderReviewRequired: isPlaceholderPin(pin)
    });
  }

  const normalizedRows = [...byPin.values()].sort((left, right) => left.parcelNumber.localeCompare(right.parcelNumber));
  const missingPins = [...requestedSet].filter((pin) => !byPin.has(pin)).sort();
  return {
    normalizedRows,
    rejectedRows,
    missingPins,
    duplicateGeometryRows
  };
}

function termsFacts(serviceMetadata) {
  const description = serviceMetadata?.description ?? "";
  return {
    termsPosture: "public_arcgis_query_runtime_fields_only",
    termsNote:
      "King County public parcel_area service is queried read-only with returnGeometry=false and only OBJECTID/PIN/MAJOR/MINOR/Shape_Length/Shape_Area fields.",
    documentsPlaceholderPolygons: /place-holder polygons|placeholder/i.test(description),
    documentsStackedGeometry: /stacked polygon|undivided interest|vertical parcels/i.test(description),
    pinIndexUnique: (serviceMetadata?.indexes ?? []).find((index) => index.fields === "PIN")?.isUnique ?? null
  };
}

export function summarizeKingSourceCompleteness({
  generatedAt = new Date().toISOString(),
  requestedPins,
  normalized,
  serviceMetadata,
  rawArtifactPath,
  rawArtifactSha256,
  captureReceiptPath
}) {
  const loadableRows = normalized.normalizedRows.filter((row) => row.loadableAsRuntimeParcelShell);
  const placeholderRows = normalized.normalizedRows.filter((row) => row.placeholderReviewRequired);
  const blockers = [];

  if (normalized.missingPins.length > 0) {
    blockers.push(`${normalized.missingPins.length} King source-only PINs were not returned by the richer source capture.`);
  }
  if (loadableRows.length !== requestedPins.length) {
    blockers.push(`${requestedPins.length - loadableRows.length} King source-only PINs are not loadable as runtime parcel shell rows.`);
  }
  blockers.push(
    "King parcel_area source does not expose owner/address/value fields; parcel shell loadability does not prove full workflow completeness."
  );
  if (placeholderRows.length > 0) {
    blockers.push(`${placeholderRows.length} source-only PINs look like tract/placeholder identifiers and require explicit load policy.`);
  }

  return {
    generatedAt,
    countyName: "King County",
    fips: "53033",
    scope: "King source completeness capture",
    sourceUrl: KING_SERVICE_URL,
    accessMethod: "ArcGIS REST exact PIN query, returnGeometry=false, runtime shell fields only",
    fieldsCaptured: OUT_FIELDS,
    geometryCaptured: false,
    databaseMutationAllowed: false,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false,
    summary: {
      requestedSourceOnlyPins: requestedPins.length,
      presentInRicherSourceArtifact: normalized.normalizedRows.length,
      loadableAsRuntimeParcelShell: loadableRows.length,
      missingFromRicherSourceArtifact: normalized.missingPins.length,
      rejectedRows: normalized.rejectedRows.length,
      duplicateGeometryRows: normalized.duplicateGeometryRows,
      placeholderReviewRows: placeholderRows.length
    },
    validation: {
      allSourceOnlyPinsAccountedFor: normalized.missingPins.length === 0,
      runtimeShellFieldsComplete: loadableRows.length === requestedPins.length,
      ownerAddressValueWorkflowComplete: false,
      noDatabaseWrites: true
    },
    terms: termsFacts(serviceMetadata),
    artifacts: {
      rawArtifactPath: rawArtifactPath ? repoRelative(rawArtifactPath) : null,
      rawArtifactSha256,
      captureReceiptPath: captureReceiptPath ? repoRelative(captureReceiptPath) : null
    },
    blockers
  };
}

function buildCaptureReceipt({ generatedAt, report, rawArtifactPath, rawArtifactSha256 }) {
  return {
    receiptType: "king_source_completeness_capture",
    receiptVersion: "june10-king-source-completeness-v1",
    capturedAtUtc: generatedAt,
    countyName: "King County",
    fips: "53033",
    sourceClass: "WA_INITIAL_SEED_SOURCE_COMPLETENESS_CAPTURE",
    sourceUrl: KING_SERVICE_URL,
    accessMethod: report.accessMethod,
    fieldsCaptured: OUT_FIELDS,
    rawArtifacts: [
      {
        path: repoRelative(rawArtifactPath),
        sha256: rawArtifactSha256,
        capturedAtUtc: generatedAt
      }
    ],
    counts: report.summary,
    databaseWritesAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false
  };
}

function renderMarkdown(report) {
  const blockers = report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  return `# King Source Completeness Capture

Generated: ${report.generatedAt}

## Verdict

- Requested source-only PINs: ${report.summary.requestedSourceOnlyPins}
- Present in richer source artifact: ${report.summary.presentInRicherSourceArtifact}
- Loadable as runtime parcel shell: ${report.summary.loadableAsRuntimeParcelShell}
- Owner/address/value workflow complete: ${report.validation.ownerAddressValueWorkflowComplete ? "yes" : "no"}
- Duplicate geometry rows: ${report.summary.duplicateGeometryRows}
- Placeholder review rows: ${report.summary.placeholderReviewRows}
- Database writes attempted: ${report.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${report.certificationAllowed ? "yes" : "no"}

## Source

- URL: ${report.sourceUrl}
- Access: ${report.accessMethod}
- Fields captured: ${report.fieldsCaptured.join(", ")}
- Geometry captured: ${report.geometryCaptured ? "yes" : "no"}
- Terms posture: ${report.terms.termsPosture}
- Placeholder polygons documented: ${report.terms.documentsPlaceholderPolygons ? "yes" : "no"}
- Stacked geometry documented: ${report.terms.documentsStackedGeometry ? "yes" : "no"}
- PIN index unique: ${report.terms.pinIndexUnique === null ? "unknown" : report.terms.pinIndexUnique ? "yes" : "no"}

## Artifacts

- Raw artifact: ${report.artifacts.rawArtifactPath}
- Raw SHA256: ${report.artifacts.rawArtifactSha256}
- Capture receipt: ${report.artifacts.captureReceiptPath}

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

function requestedPinsFromDryRun(dryRun) {
  return unique((dryRun.proposedStageRows ?? []).map((row) => row.parcelNumber));
}

export async function buildKingSourceCompletenessCapture({
  generatedAt = new Date().toISOString(),
  dryRun,
  serviceMetadata,
  rawArtifactPath,
  captureIfMissing = true
}) {
  const requestedPins = requestedPinsFromDryRun(dryRun);
  if (!fs.existsSync(rawArtifactPath)) {
    if (!captureIfMissing) {
      throw new Error(`Raw artifact not found: ${rawArtifactPath}`);
    }
    await captureRuntimeFields({ requestedPins, rawArtifactPath });
  }
  const rawArtifactSha256 = sha256File(rawArtifactPath);
  const normalized = normalizeKingSourceRows({
    requestedPins,
    features: parseArcGisJsonl(rawArtifactPath)
  });
  const captureReceiptPath = path.join(path.dirname(rawArtifactPath), "king-source-completeness-capture-receipt.json");
  const report = summarizeKingSourceCompleteness({
    generatedAt,
    requestedPins,
    normalized,
    serviceMetadata,
    rawArtifactPath,
    rawArtifactSha256,
    captureReceiptPath
  });
  const captureReceipt = buildCaptureReceipt({ generatedAt, report, rawArtifactPath, rawArtifactSha256 });

  return {
    report,
    captureReceipt,
    normalizedRows: normalized.normalizedRows,
    rejectedRows: normalized.rejectedRows,
    missingPins: normalized.missingPins
  };
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    dryRun: args.get("dry-run") ?? DEFAULT_DRY_RUN,
    serviceMetadata: args.get("service-metadata") ?? DEFAULT_SERVICE_METADATA,
    rawArtifact: args.get("raw-artifact") ?? DEFAULT_RAW_ARTIFACT,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const generatedAt = new Date().toISOString();
  const dryRun = readJson(paths.dryRun);
  const serviceMetadata = readJsonIfPresent(paths.serviceMetadata) ?? {};
  const result = await buildKingSourceCompletenessCapture({
    generatedAt,
    dryRun,
    serviceMetadata,
    rawArtifactPath: paths.rawArtifact
  });

  writeJson(paths.outJson, result.report);
  writeText(paths.outMd, renderMarkdown(result.report));
  writeJson(path.join(paths.outRoot, "king-source-completeness-capture-receipt.json"), result.captureReceipt);
  writeJson(path.join(paths.outRoot, "king-source-only-runtime-shell-stage-list.json"), result.normalizedRows);
  writeJson(path.join(paths.outRoot, "king-source-completeness-rejected-rows.json"), result.rejectedRows);
  writeJson(path.join(paths.outRoot, "king-source-completeness-missing-pins.json"), result.missingPins);

  console.log(`King source completeness capture written: ${repoRelative(paths.outJson)}`);
  console.log(`Requested source-only PINs: ${result.report.summary.requestedSourceOnlyPins}`);
  console.log(`Loadable as runtime parcel shell: ${result.report.summary.loadableAsRuntimeParcelShell}`);
  console.log(`Production binding allowed: ${result.report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
