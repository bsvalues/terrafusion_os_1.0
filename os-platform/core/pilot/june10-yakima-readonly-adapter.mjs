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
  "june10-yakima-readonly-adapter.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-yakima-readonly-adapter.latest.md"
);
const DEFAULT_ARTIFACT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-adapters",
  "yakima"
);

const YAKIMA_URL = "https://property.spatialest.com/wa/yakima";

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

function decodeHtmlAttribute(value) {
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
  return String(value ?? "").replace(/<[^>]*>/g, " ");
}

function titleFromHtml(html) {
  const match = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]).replace(/\s+/g, " ").trim() : null;
}

function findDataProps(html) {
  const match = String(html).match(/<div[^>]+id=["']rct-main-app["'][^>]+data-props='([\s\S]*?)'\s*>/i);
  if (!match) throw new Error("Yakima Spatialest data-props payload was not found.");
  return JSON.parse(decodeHtmlAttribute(match[1]));
}

function termsUrlFromConfig(config) {
  const disclaimer = config?.lang?.DISCLAIMER ?? config?.config?.lang?.DISCLAIMER ?? "";
  const match = String(disclaimer).match(/https:\/\/www\.schneidergis\.com\/legal-information\/software-terms/i);
  return match ? match[0] : null;
}

export function extractYakimaRawSourcePack(html, canonicalUrl = YAKIMA_URL) {
  const appConfig = findDataProps(html);
  return {
    pageMetadata: {
      title: titleFromHtml(html) ?? appConfig?.sitename ?? null,
      canonicalUrl,
      vendor: "Spatialest",
      dataTimestamp: appConfig?.settings?.dataTimestamp ?? null,
      termsUrl: termsUrlFromConfig(appConfig)
    },
    appConfig
  };
}

function findYakimaSourceLock(sourceLockPack) {
  return asArray(sourceLockPack?.sourceLocks).find((lock) => lock.countyToken === "yakima" || lock.county === "Yakima");
}

function collectFields(value, results = []) {
  if (!value || typeof value !== "object") return results;

  if (Array.isArray(value)) {
    value.forEach((item) => collectFields(item, results));
    return results;
  }

  if (typeof value.id === "string" && (value.schema || value.title !== undefined || value.format !== undefined)) {
    results.push({
      id: value.id,
      title: value.title ?? "",
      schema: value.schema ?? null,
      format: value.format ?? "",
      source: "spatialest_config"
    });
  }

  for (const child of Object.values(value)) {
    collectFields(child, results);
  }

  return results;
}

function uniqueFields(fields) {
  const byId = new Map();
  for (const field of fields) {
    if (!byId.has(field.id)) byId.set(field.id, field);
  }
  return [...byId.values()];
}

function mapLayers(config) {
  const map = config?.config?.map ?? config?.map;
  return asArray(map?.layers).flatMap((group) => asArray(group.layers));
}

function parcelLayer(config) {
  return mapLayers(config).find((layer) => {
    const text = [layer.title, layer.sourceparams, layer.url].join(" ");
    return /Parcel Layer|yakima-wa:Parcels/i.test(text);
  });
}

function fieldIds(rawSourcePack) {
  return uniqueFields([
    ...collectFields(rawSourcePack.appConfig?.config?.map?.results),
    ...collectFields(rawSourcePack.appConfig?.config?.prc),
    ...collectFields(rawSourcePack.appConfig?.searchresults?.export)
  ]).map((field) => field.id);
}

function fieldExists(rawSourcePack, id) {
  return fieldIds(rawSourcePack).some((fieldId) => fieldId === id);
}

function fieldOrNull(rawSourcePack, candidates) {
  const ids = fieldIds(rawSourcePack);
  return candidates.find((candidate) => ids.includes(candidate)) ?? null;
}

function buildSchemaMetadata(rawSourcePack) {
  const app = rawSourcePack.appConfig ?? {};
  const config = app.config ?? {};
  return {
    tenant: app.tenant ?? null,
    client: config.client ?? app.client ?? null,
    state: config.state ?? app.state ?? null,
    dataTimestamp: app.settings?.dataTimestamp ?? config.settings?.dataTimestamp ?? null,
    parcelLayer: parcelLayer(app) ?? null,
    mapIdentifiers: {
      plotLayerTitle: app.config?.map?.plotlayertitle ?? config.map?.plotlayertitle ?? null,
      loadedLayerIdentifier: app.config?.map?.loadedlayeridentifier ?? config.map?.loadedlayeridentifier ?? null,
      parcelDataIdentifier: app.config?.map?.parceldataidentifier ?? config.map?.parceldataidentifier ?? null
    },
    searchBy: asArray(app.searchby ?? config.searchby).map((item) => ({
      id: item.id,
      title: item.title ?? "",
      useAsFilter: item.useAsFilter ?? null,
      useAsSuggestion: item.useAsSuggestion ?? null
    })),
    fields: uniqueFields(collectFields(config)).filter((field) =>
      [
        "parcel_number",
        "line_1",
        "owner_name",
        "owners",
        "current_assessed_value",
        "total_acres",
        "property_use",
        "nbhd",
        "tca_number"
      ].includes(field.id)
    ),
    permissions: {
      canSearchFull: app.permissions?.canSearchFull ?? config.permissions?.canSearchFull ?? null,
      canExportExcel: app.permissions?.canExportExcel ?? config.permissions?.canExportExcel ?? null,
      isAuthenticated: app.settings?.isAuthenticated ?? config.settings?.isAuthenticated ?? null
    },
    termsUrl: rawSourcePack.pageMetadata?.termsUrl ?? termsUrlFromConfig(app)
  };
}

function buildFetchPlan() {
  return [
    {
      id: "yakima_spatialest_page",
      url: YAKIMA_URL,
      method: "GET",
      readOnly: true,
      purpose: "Fetch public Spatialest page HTML and extract data-props metadata only."
    }
  ];
}

function buildParcelIdentity(rawSourcePack) {
  const app = rawSourcePack.appConfig ?? {};
  const config = app.config ?? {};
  const searchBy = asArray(app.searchby ?? config.searchby);
  const searchByParcel = searchBy.some((item) => item.id === "parcel" && /Parcel/i.test(item.title ?? ""));
  const fieldHasParcelNumber = fieldExists(rawSourcePack, "parcel_number");
  const layer = parcelLayer(app);
  const layerIsParcel = /Parcel Layer|yakima-wa:Parcels/i.test([layer?.title, layer?.sourceparams].join(" "));

  return {
    proven: searchByParcel && fieldHasParcelNumber && layerIsParcel,
    sourceField: searchByParcel && fieldHasParcelNumber && layerIsParcel ? "parcel_number" : null,
    proof: {
      searchBy: searchBy.map((item) => ({ id: item.id, title: item.title ?? "" })),
      fieldIds: fieldIds(rawSourcePack),
      parcelLayerTitle: layer?.title ?? null,
      parcelLayerSourceParams: layer?.sourceparams ?? null,
      loadedLayerIdentifier: app.config?.map?.loadedlayeridentifier ?? config.map?.loadedlayeridentifier ?? null
    },
    semantics: searchByParcel && fieldHasParcelNumber && layerIsParcel
      ? "Spatialest search config exposes Parcel # search and public result/schema fields expose parcel_number on the Yakima parcel layer."
      : "Spatialest parcel_number semantics were not proven from search config, schema fields, and parcel layer metadata."
  };
}

function buildStagingShape(rawSourcePack) {
  return {
    schema: "terrafusion-staging-parcel-source-v1",
    mode: "contract_only_no_rows_loaded",
    fields: {
      county: { value: "Yakima" },
      countyToken: { value: "yakima" },
      parcelId: { sourceField: "parcel_number", required: true },
      ownerName: { sourceField: fieldOrNull(rawSourcePack, ["owner_name", "owners"]), required: false },
      situsAddress: { sourceField: fieldOrNull(rawSourcePack, ["line_1", "address"]), required: false },
      assessedValue: { sourceField: fieldOrNull(rawSourcePack, ["current_assessed_value", "assessed_value"]), required: false },
      landArea: { sourceField: fieldOrNull(rawSourcePack, ["total_acres", "total_sqft"]), required: false },
      propertyUse: { sourceField: fieldOrNull(rawSourcePack, ["property_use"]), required: false },
      geometryReference: { source: "Spatialest WMS parcel layer if later capture is authorized", required: false }
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

function buildLineageReceipt({ rawSourcePack, schemaMetadata, stagingShape, generatedAtUtc, artifactPaths = {} }) {
  return {
    receiptVersion: "june10-adapter-verification-v1",
    status: "VERIFIED",
    capturedAtUtc: generatedAtUtc,
    county: "Yakima",
    countyToken: "yakima",
    adapterId: "yakima-readonly-spatialest-config-v1",
    noSecretValuesRecorded: true,
    rawArtifacts: [
      {
        ...rawArtifact("page_metadata", YAKIMA_URL, rawSourcePack.pageMetadata),
        path: artifactPaths.pageMetadata ?? null,
        capturedAtUtc: generatedAtUtc
      },
      {
        ...rawArtifact("schema_metadata", YAKIMA_URL, schemaMetadata),
        path: artifactPaths.schemaMetadata ?? null,
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

function evaluate({ sourceLock, rawSourcePack, parcelIdentity, stagingShape, schemaMetadata }) {
  const blockers = [];
  const warnings = [];

  if (!sourceLock) blockers.push("Yakima source lock is missing.");
  if (sourceLock?.sourceDecisionStatus !== "source_locked") blockers.push("Yakima source must be source_locked.");
  if (!/Yakima/i.test([rawSourcePack.pageMetadata?.title, rawSourcePack.appConfig?.tenant, rawSourcePack.appConfig?.client].join(" "))) {
    blockers.push("Yakima county identity was not proven from Spatialest metadata.");
  }
  if (!parcelIdentity.proven) blockers.push("Spatialest parcel_number parcel identifier semantics were not proven.");
  if (!stagingShape.fields.parcelId.sourceField) blockers.push("Staging parcelId source field is missing.");
  if (!schemaMetadata.termsUrl) warnings.push("Spatialest terms URL was not extracted from public config.");
  if (schemaMetadata.permissions?.canExportExcel === true) {
    warnings.push("Public config exposes Excel export permission, but this adapter does not download exports until terms are reviewed.");
  }

  return { blockers, warnings };
}

export function buildYakimaReadonlyAdapterVerification({
  sourceLockPack,
  rawSourcePack,
  generatedAtUtc = new Date().toISOString(),
  artifactPaths = {}
}) {
  const sourceLock = findYakimaSourceLock(sourceLockPack);
  const schemaMetadata = buildSchemaMetadata(rawSourcePack);
  const stagingShape = buildStagingShape(rawSourcePack);
  const parcelIdentity = buildParcelIdentity(rawSourcePack);
  const { blockers, warnings } = evaluate({ sourceLock, rawSourcePack, parcelIdentity, stagingShape, schemaMetadata });

  return {
    generatedAtUtc,
    county: "Yakima",
    countyToken: "yakima",
    adapterId: "yakima-readonly-spatialest-config-v1",
    adapterStatus: blockers.length === 0 ? "verified" : "candidate",
    sourceType: "spatialest_property_portal",
    accessMethod: "read_only_public_spatialest_config_fetch",
    expectedExportFormat: "spatialest_html_data_props_json",
    fetchPlan: buildFetchPlan(),
    parcelIdentity,
    schemaMetadata,
    stagingShape,
    lineageReceipt: buildLineageReceipt({ rawSourcePack, schemaMetadata, stagingShape, generatedAtUtc, artifactPaths }),
    productionRowsWritten: 0,
    runtimeClaimAllowed: false,
    dbMutationAllowed: false,
    blockers,
    warnings,
    rules: [
      "This adapter verifies public Spatialest metadata and staging contract only.",
      "It does not call search, property-card, export, image, or sales APIs.",
      "It writes no TerraFusion production DB rows.",
      "Runtime claims remain blocked until separate load, API, and UI proof exist."
    ]
  };
}

async function fetchText(url, fetcher = globalThis.fetch) {
  const response = await fetcher(url, { method: "GET", headers: { accept: "text/html" } });
  if (!response.ok) throw new Error(`GET ${url} returned ${response.status}`);
  return response.text();
}

export async function fetchYakimaRawSourcePack(fetcher = globalThis.fetch) {
  const html = await fetchText(YAKIMA_URL, fetcher);
  return extractYakimaRawSourcePack(html, YAKIMA_URL);
}

function writeArtifacts({ rawSourcePack, schemaMetadata, stagingShape, artifactRoot }) {
  const rawDir = path.join(artifactRoot, "raw");
  const normalizedDir = path.join(artifactRoot, "normalized");
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(normalizedDir, { recursive: true });

  const paths = {
    pageMetadata: path.join(rawDir, "yakima-spatialest-page-metadata.json"),
    schemaMetadata: path.join(rawDir, "yakima-spatialest-schema-metadata.json"),
    normalized: path.join(normalizedDir, "yakima-staging-source-contract.json")
  };

  fs.writeFileSync(paths.pageMetadata, stableJson(rawSourcePack.pageMetadata));
  fs.writeFileSync(paths.schemaMetadata, stableJson(schemaMetadata));
  fs.writeFileSync(paths.normalized, stableJson(stagingShape));

  return Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, rel(value)]));
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Yakima Read-Only Adapter Verification",
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
  lines.push(`- Address field: ${report.stagingShape.fields.situsAddress.sourceField ?? "not available"}`);
  lines.push(`- Value field: ${report.stagingShape.fields.assessedValue.sourceField ?? "not available"}`);
  lines.push(`- Data timestamp: ${report.schemaMetadata.dataTimestamp ?? "not available"}`);
  lines.push(`- Terms URL: ${report.schemaMetadata.termsUrl ?? "not extracted"}`);

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

export function runYakimaReadonlyAdapterVerification(options = {}) {
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
    throw new Error("runYakimaReadonlyAdapterVerification requires rawSourcePath. Use main() for live read-only fetch.");
  }

  const sourceLockPack = readJson(args.sourceLockPath);
  const rawSourcePack = readJson(args.rawSourcePath);
  const schemaMetadata = buildSchemaMetadata(rawSourcePack);
  const stagingShape = buildStagingShape(rawSourcePack);
  const artifactPaths = args.write
    ? writeArtifacts({ rawSourcePack, schemaMetadata, stagingShape, artifactRoot: args.artifactRoot })
    : {};
  const report = buildYakimaReadonlyAdapterVerification({ sourceLockPack, rawSourcePack, artifactPaths });

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
  const rawSourcePack = args.rawSourcePath ? readJson(args.rawSourcePath) : await fetchYakimaRawSourcePack();
  const schemaMetadata = buildSchemaMetadata(rawSourcePack);
  const stagingShape = buildStagingShape(rawSourcePack);
  const artifactPaths = args.write
    ? writeArtifacts({ rawSourcePack, schemaMetadata, stagingShape, artifactRoot: args.artifactRoot })
    : {};
  const report = buildYakimaReadonlyAdapterVerification({ sourceLockPack, rawSourcePack, artifactPaths });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, stableJson(report));
    fs.mkdirSync(path.dirname(args.outMd), { recursive: true });
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        county: report.county,
        adapterStatus: report.adapterStatus,
        parcelIdentityProven: report.parcelIdentity.proven,
        runtimeClaimAllowed: report.runtimeClaimAllowed,
        dbMutationAllowed: report.dbMutationAllowed,
        productionRowsWritten: report.productionRowsWritten,
        blockers: report.blockers.length
      },
      null,
      2
    )
  );

  if (report.blockers.length > 0) process.exitCode = 2;
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
