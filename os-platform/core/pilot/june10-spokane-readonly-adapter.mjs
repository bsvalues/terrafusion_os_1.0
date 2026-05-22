#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_SOURCE_LOCK = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-acquisition-source-lock.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-spokane-readonly-adapter.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-spokane-readonly-adapter.latest.md"
);
const DEFAULT_ARTIFACT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-adapters",
  "spokane"
);

const SPOKANE_SERVICE_URL = "https://gismo.spokanecounty.org/arcgis/rest/services/SCOUT/Queries/MapServer";
const SPOKANE_LAYERS_URL = `${SPOKANE_SERVICE_URL}/layers`;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(value) {
  const text = typeof value === "string" ? value : stableJson(value);
  return crypto.createHash("sha256").update(text).digest("hex");
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function decodeHtml(value) {
  return String(value ?? "")
    .replaceAll("&quot;", '"')
    .replaceAll("&#34;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function stripTags(value) {
  return decodeHtml(String(value ?? "").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromHtml(html) {
  const match = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]) : null;
}

function labelValue(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(html).match(new RegExp(`<b>\\s*${escaped}\\s*:?\\s*<\\/b>\\s*([\\s\\S]*?)<br\\s*\\/?>`, "i"));
  return match ? stripTags(match[1]) : null;
}

function parseFieldDetails(details) {
  const type = details.match(/type:\s*([^,\n)]+)/i)?.[1]?.trim() ?? null;
  const alias = details.match(/alias:\s*([^,\n)]+)/i)?.[1]?.trim() ?? null;
  const lengthText = details.match(/length:\s*(\d+)/i)?.[1] ?? null;
  return {
    type,
    alias,
    length: lengthText ? Number.parseInt(lengthText, 10) : null
  };
}

function parseFields(layerBlock) {
  return [...String(layerBlock).matchAll(/<li>\s*([^<]+?)\s*<i>\s*\(([\s\S]*?)\)\s*<\/i>\s*<\/li>/gi)].map(
    (match) => ({
      name: stripTags(match[1]),
      ...parseFieldDetails(stripTags(match[2]))
    })
  );
}

function findLayerBlock(layersHtml, layerName) {
  const layerMatches = [...String(layersHtml).matchAll(/<h3>\s*Layer:\s*<a[^>]*>([\s\S]*?)<\/a>\s*\((\d+)\)\s*<\/h3>/gi)];
  const target = layerMatches.find((match) => stripTags(match[1]).toLowerCase() === layerName.toLowerCase());
  if (!target) return null;

  const start = target.index ?? 0;
  const laterLayer = layerMatches.find((match) => (match.index ?? 0) > start);
  const end = laterLayer?.index ?? String(layersHtml).indexOf("</div>", start);
  return {
    id: Number.parseInt(target[2], 10),
    name: stripTags(target[1]),
    html: String(layersHtml).slice(start, end > start ? end : undefined)
  };
}

function parseParcelLayer(layersHtml) {
  const layer = findLayerBlock(layersHtml, "Parcels");
  if (!layer) return null;
  return {
    id: layer.id,
    name: layer.name,
    displayField: labelValue(layer.html, "Display Field"),
    type: labelValue(layer.html, "Type"),
    geometryType: labelValue(layer.html, "Geometry Type"),
    maxRecordCount: Number.parseInt(labelValue(layer.html, "MaxRecordCount") ?? "0", 10) || null,
    supportedQueryFormats: labelValue(layer.html, "Supported Query Formats"),
    fields: parseFields(layer.html)
  };
}

function findSpokaneSourceLock(sourceLockPack) {
  return asArray(sourceLockPack?.sourceLocks).find((lock) => lock.countyToken === "spokane" || lock.county === "Spokane");
}

function fieldNames(layer) {
  return asArray(layer?.fields).map((field) => String(field.name ?? ""));
}

function fieldExists(layer, fieldName) {
  return fieldNames(layer).some((name) => name.toUpperCase() === fieldName.toUpperCase());
}

function fieldNameOrNull(layer, candidates) {
  const names = fieldNames(layer);
  return candidates.find((candidate) => names.some((name) => name.toUpperCase() === candidate.toUpperCase())) ?? null;
}

function fieldNamesPresent(layer, candidates) {
  const upperToActual = new Map(fieldNames(layer).map((name) => [name.toUpperCase(), name]));
  return candidates.map((candidate) => upperToActual.get(candidate.toUpperCase())).filter(Boolean);
}

export function extractSpokaneRawSourcePack({ serviceHtml, layersHtml }) {
  const parcelLayer = parseParcelLayer(layersHtml);
  return {
    pageMetadata: {
      title: titleFromHtml(serviceHtml),
      layersTitle: titleFromHtml(layersHtml),
      serviceUrl: SPOKANE_SERVICE_URL,
      layersUrl: SPOKANE_LAYERS_URL,
      sourceHost: new URL(SPOKANE_SERVICE_URL).hostname,
      portal: "Spokane County SCOUT"
    },
    serviceMetadata: {
      serviceName: titleFromHtml(serviceHtml)?.replace(/\s*\(MapServer\)\s*$/i, "") ?? null,
      serviceDescription: labelValue(serviceHtml, "Service Description"),
      mapName: labelValue(serviceHtml, "Map Name"),
      capabilities: labelValue(serviceHtml, "Capabilities")
    },
    parcelLayer
  };
}

function buildFetchPlan() {
  return [
    {
      id: "spokane_scout_service_directory",
      url: SPOKANE_SERVICE_URL,
      method: "GET",
      readOnly: true,
      purpose: "Fetch public ArcGIS REST service directory metadata only."
    },
    {
      id: "spokane_scout_layers_directory",
      url: SPOKANE_LAYERS_URL,
      method: "GET",
      readOnly: true,
      purpose: "Fetch public ArcGIS REST layer schema metadata only; no feature query."
    }
  ];
}

function buildParcelIdentity(rawSourcePack) {
  const layer = rawSourcePack.parcelLayer;
  const hasPidNum = fieldExists(layer, "PID_NUM");
  const pidField = asArray(layer?.fields).find((field) => String(field.name ?? "").toUpperCase() === "PID_NUM");
  const aliasIsParcelNumber = /Parcel Number/i.test(pidField?.alias ?? "");
  const layerIsParcel = layer?.name === "Parcels" && /Feature Layer/i.test(layer?.type ?? "");

  return {
    proven: hasPidNum && aliasIsParcelNumber && layerIsParcel,
    sourceField: hasPidNum && aliasIsParcelNumber && layerIsParcel ? "PID_NUM" : null,
    proof: {
      serviceName: rawSourcePack.serviceMetadata?.serviceName ?? null,
      sourceHost: rawSourcePack.pageMetadata?.sourceHost ?? null,
      parcelLayerName: layer?.name ?? null,
      parcelLayerId: layer?.id ?? null,
      pidField: pidField ?? null,
      fieldNames: fieldNames(layer)
    },
    semantics: hasPidNum && aliasIsParcelNumber && layerIsParcel
      ? "Spokane SCOUT Queries Parcels layer exposes PID_NUM with alias Parcel Number in public ArcGIS REST schema metadata."
      : "Spokane SCOUT PID_NUM parcel identifier semantics were not proven from the public Parcels layer metadata."
  };
}

function buildStagingShape(rawSourcePack) {
  const layer = rawSourcePack.parcelLayer ?? {};
  return {
    schema: "terrafusion-staging-parcel-source-v1",
    mode: "contract_only_no_rows_loaded",
    fields: {
      county: { value: "Spokane" },
      countyToken: { value: "spokane" },
      parcelId: { sourceField: "PID_NUM", required: true },
      ownerName: { sourceField: fieldNameOrNull(layer, ["owner_name", "OWNER_NAME", "OWNER"]), required: false },
      situsAddress: {
        sourceFields: fieldNamesPresent(layer, ["site_address", "site_state", "site_zip"]),
        required: false
      },
      assessedValue: {
        sourceFields: fieldNamesPresent(layer, ["assessed_value", "current_assessed_value", "TOTAL_VALUE"]),
        required: false
      },
      taxYear: { sourceField: fieldNameOrNull(layer, ["tax_year"]), required: false },
      assessmentYear: { sourceField: fieldNameOrNull(layer, ["asmt_year"]), required: false },
      status: { sourceField: fieldNameOrNull(layer, ["seg_status"]), required: false },
      geometryReference: { source: "ArcGIS feature layer geometry if later capture is authorized", required: false }
    },
    rows: []
  };
}

function rawArtifact(id, sourceUrl, payload) {
  return {
    id,
    sourceUrl,
    capturedAtUtc: null,
    sha256: sha256(stableJson(payload)),
    readOnly: true
  };
}

function buildLineageReceipt({ rawSourcePack, stagingShape, generatedAtUtc, artifactPaths = {} }) {
  return {
    receiptVersion: "june10-adapter-verification-v1",
    status: "VERIFIED",
    capturedAtUtc: generatedAtUtc,
    county: "Spokane",
    countyToken: "spokane",
    adapterId: "spokane-readonly-scout-arcgis-schema-v1",
    noSecretValuesRecorded: true,
    rawArtifacts: [
      {
        ...rawArtifact("service_metadata", SPOKANE_SERVICE_URL, {
          pageMetadata: rawSourcePack.pageMetadata,
          serviceMetadata: rawSourcePack.serviceMetadata
        }),
        path: artifactPaths.serviceMetadata ?? null,
        capturedAtUtc: generatedAtUtc
      },
      {
        ...rawArtifact("parcel_layer_metadata", SPOKANE_LAYERS_URL, rawSourcePack.parcelLayer),
        path: artifactPaths.parcelLayer ?? null,
        capturedAtUtc: generatedAtUtc
      }
    ],
    normalizedArtifact: {
      path: artifactPaths.normalized ?? null,
      schema: stagingShape.schema,
      sha256: sha256(stableJson(stagingShape)),
      rowCount: 0
    },
    counts: {
      parcelRowsFetched: 0,
      parcelRowsNormalized: 0,
      productionRowsWritten: 0
    },
    runtimeClaimAllowed: false,
    dbMutationAllowed: false
  };
}

function evaluate({ sourceLock, rawSourcePack, parcelIdentity, stagingShape }) {
  const blockers = [];
  const warnings = [];

  if (!sourceLock) blockers.push("Spokane source lock is missing.");
  if (!["source_locked", "source_candidate_locked"].includes(sourceLock?.sourceDecisionStatus)) {
    blockers.push("Spokane source must be source_locked or source_candidate_locked.");
  }
  if (rawSourcePack.pageMetadata?.sourceHost !== "gismo.spokanecounty.org") {
    blockers.push("Spokane county identity was not proven from the official SCOUT source host.");
  }
  if (!/SCOUT\/Queries/i.test(rawSourcePack.pageMetadata?.title ?? "")) {
    blockers.push("Spokane SCOUT Queries service title was not proven.");
  }
  if (!parcelIdentity.proven) blockers.push("PID_NUM parcel identifier semantics were not proven.");
  if (!stagingShape.fields.parcelId.sourceField) blockers.push("Staging parcelId source field is missing.");
  if (stagingShape.fields.assessedValue.sourceFields.length === 0) {
    warnings.push("Public SCOUT Parcels schema did not expose an assessed value field in metadata.");
  }

  return { blockers, warnings };
}

export function buildSpokaneReadonlyAdapterVerification({
  sourceLockPack,
  rawSourcePack,
  generatedAtUtc = new Date().toISOString(),
  artifactPaths = {}
}) {
  const sourceLock = findSpokaneSourceLock(sourceLockPack);
  const stagingShape = buildStagingShape(rawSourcePack);
  const parcelIdentity = buildParcelIdentity(rawSourcePack);
  const { blockers, warnings } = evaluate({ sourceLock, rawSourcePack, parcelIdentity, stagingShape });

  return {
    generatedAtUtc,
    county: "Spokane",
    countyToken: "spokane",
    adapterId: "spokane-readonly-scout-arcgis-schema-v1",
    adapterStatus: blockers.length === 0 ? "verified" : "candidate",
    sourceType: "county_property_portal_plus_gis",
    accessMethod: "read_only_public_arcgis_rest_directory_metadata_fetch",
    expectedExportFormat: "arcgis_rest_service_html_layer_schema_metadata",
    fetchPlan: buildFetchPlan(),
    parcelIdentity,
    serviceMetadata: rawSourcePack.serviceMetadata,
    parcelLayer: rawSourcePack.parcelLayer,
    stagingShape,
    lineageReceipt: buildLineageReceipt({ rawSourcePack, stagingShape, generatedAtUtc, artifactPaths }),
    productionRowsWritten: 0,
    runtimeClaimAllowed: false,
    dbMutationAllowed: false,
    blockers,
    warnings,
    rules: [
      "This adapter verifies public Spokane SCOUT schema metadata and staging contract only.",
      "It does not call ArcGIS query endpoints, fetch feature rows, or perform bulk extraction.",
      "It writes no TerraFusion production DB rows.",
      "Runtime claims remain blocked until separate load, API, and UI proof exist."
    ]
  };
}

async function fetchText(url, fetcher = globalThis.fetch) {
  const response = await fetcher(url, {
    method: "GET",
    headers: {
      accept: "text/html,application/json",
      "user-agent": "TerraFusion-June10-ReadOnlySchemaVerifier/1.0"
    }
  });

  if (!response.ok) throw new Error(`GET ${url} returned ${response.status}`);
  return response.text();
}

export async function fetchSpokaneRawSourcePack(fetcher = globalThis.fetch) {
  const serviceHtml = await fetchText(SPOKANE_SERVICE_URL, fetcher);
  const layersHtml = await fetchText(SPOKANE_LAYERS_URL, fetcher);
  return extractSpokaneRawSourcePack({ serviceHtml, layersHtml });
}

function writeArtifacts({ rawSourcePack, stagingShape, artifactRoot }) {
  const rawDir = path.join(artifactRoot, "raw");
  const normalizedDir = path.join(artifactRoot, "normalized");
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(normalizedDir, { recursive: true });

  const paths = {
    serviceMetadata: path.join(rawDir, "spokane-scout-service-metadata.json"),
    parcelLayer: path.join(rawDir, "spokane-scout-parcel-layer-metadata.json"),
    normalized: path.join(normalizedDir, "spokane-staging-source-contract.json")
  };

  fs.writeFileSync(
    paths.serviceMetadata,
    stableJson({
      pageMetadata: rawSourcePack.pageMetadata,
      serviceMetadata: rawSourcePack.serviceMetadata
    })
  );
  fs.writeFileSync(paths.parcelLayer, stableJson(rawSourcePack.parcelLayer));
  fs.writeFileSync(paths.normalized, stableJson(stagingShape));

  return Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, rel(value)]));
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Spokane Read-Only Adapter Verification",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    "## Summary",
    "",
    `- County: ${report.county}`,
    `- Adapter ID: \`${report.adapterId}\``,
    `- Adapter status: ${report.adapterStatus}`,
    `- Runtime claim allowed: ${report.runtimeClaimAllowed}`,
    `- DB mutation allowed: ${report.dbMutationAllowed}`,
    `- Production rows written: ${report.productionRowsWritten}`,
    "",
    "## Parcel Identity",
    "",
    `- Proven: ${report.parcelIdentity.proven}`,
    `- Source field: ${report.parcelIdentity.sourceField ?? "not proven"}`,
    `- Semantics: ${report.parcelIdentity.semantics}`,
    "",
    "## Fetch Plan",
    "",
    "| Step | Method | Read-only | URL | Purpose |",
    "|---|---|---:|---|---|"
  ];

  for (const step of report.fetchPlan) {
    lines.push([step.id, step.method, String(step.readOnly), step.url, step.purpose].join(" | "));
  }

  lines.push("", "## Staging Shape", "");
  lines.push(`- Schema: \`${report.stagingShape.schema}\``);
  lines.push(`- Mode: ${report.stagingShape.mode}`);
  lines.push(`- Parcel ID field: ${report.stagingShape.fields.parcelId.sourceField}`);
  lines.push(`- Owner field: ${report.stagingShape.fields.ownerName.sourceField ?? "not available"}`);
  lines.push(`- Address fields: ${report.stagingShape.fields.situsAddress.sourceFields.join(", ") || "not available"}`);
  lines.push(`- Value fields: ${report.stagingShape.fields.assessedValue.sourceFields.join(", ") || "not available"}`);
  lines.push(`- Tax year field: ${report.stagingShape.fields.taxYear.sourceField ?? "not available"}`);
  lines.push(`- Status field: ${report.stagingShape.fields.status.sourceField ?? "not available"}`);

  lines.push("", "## Lineage Receipt", "");
  lines.push(`- Receipt version: ${report.lineageReceipt.receiptVersion}`);
  lines.push(`- Normalized artifact: \`${report.lineageReceipt.normalizedArtifact.path ?? "not written"}\``);
  lines.push(`- Normalized rows: ${report.lineageReceipt.normalizedArtifact.rowCount}`);
  for (const artifact of report.lineageReceipt.rawArtifacts) {
    lines.push(`- Raw ${artifact.id}: \`${artifact.path ?? "not written"}\` (${artifact.sha256})`);
  }

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) lines.push("- None");
  else report.blockers.forEach((blocker) => lines.push(`- ${blocker}`));

  lines.push("", "## Warnings", "");
  if (report.warnings.length === 0) lines.push("- None");
  else report.warnings.forEach((warning) => lines.push(`- ${warning}`));

  lines.push("", "## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    sourceLockPath: DEFAULT_SOURCE_LOCK,
    rawSourcePath: null,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    artifactRoot: DEFAULT_ARTIFACT_ROOT,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source-lock") args.sourceLockPath = path.resolve(argv[++i]);
    else if (arg === "--raw-source") args.rawSourcePath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--artifact-root") args.artifactRoot = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function runSpokaneReadonlyAdapterVerification(options = {}) {
  const args = {
    sourceLockPath: DEFAULT_SOURCE_LOCK,
    rawSourcePath: null,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    artifactRoot: DEFAULT_ARTIFACT_ROOT,
    write: true,
    ...options
  };

  if (!args.rawSourcePath) {
    throw new Error("runSpokaneReadonlyAdapterVerification requires rawSourcePath. Use main() for live read-only fetch.");
  }

  const sourceLockPack = readJson(args.sourceLockPath);
  const rawSourcePack = readJson(args.rawSourcePath);
  const stagingShape = buildStagingShape(rawSourcePack);
  const artifactPaths = args.write
    ? writeArtifacts({ rawSourcePack, stagingShape, artifactRoot: args.artifactRoot })
    : {};
  const report = buildSpokaneReadonlyAdapterVerification({ sourceLockPack, rawSourcePack, artifactPaths });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, stableJson(report));
    fs.mkdirSync(path.dirname(args.outMd), { recursive: true });
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  return report;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const sourceLockPack = readJson(args.sourceLockPath);
  const rawSourcePack = args.rawSourcePath ? readJson(args.rawSourcePath) : await fetchSpokaneRawSourcePack();
  const stagingShape = buildStagingShape(rawSourcePack);
  const artifactPaths = args.write
    ? writeArtifacts({ rawSourcePack, stagingShape, artifactRoot: args.artifactRoot })
    : {};
  const report = buildSpokaneReadonlyAdapterVerification({ sourceLockPack, rawSourcePack, artifactPaths });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, stableJson(report));
    fs.mkdirSync(path.dirname(args.outMd), { recursive: true });
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(JSON.stringify({ adapterStatus: report.adapterStatus, blockers: report.blockers }, null, 2));
  if (report.blockers.length > 0) process.exitCode = 1;
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
