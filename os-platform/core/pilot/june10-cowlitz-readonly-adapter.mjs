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
  "june10-cowlitz-readonly-adapter.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-cowlitz-readonly-adapter.latest.md"
);
const DEFAULT_ARTIFACT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-adapters",
  "cowlitz"
);

const COWLITZ_APP_ITEM_ID = "848eadafa8ba4566a6a6370a4294c5e2";
const COWLITZ_PORTAL = "https://gis.cowlitzwa.gov/ccportal";
const COWLITZ_ITEM_URL = `${COWLITZ_PORTAL}/sharing/rest/content/items/${COWLITZ_APP_ITEM_ID}?f=json`;
const COWLITZ_APP_DATA_URL = `${COWLITZ_PORTAL}/sharing/rest/content/items/${COWLITZ_APP_ITEM_ID}/data?f=json`;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return crypto.createHash("sha256").update(text).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function findCowlitzSourceLock(sourceLockPack) {
  return asArray(sourceLockPack?.sourceLocks).find((lock) => lock.countyToken === "cowlitz" || lock.county === "Cowlitz");
}

function findSearchWidget(appData) {
  return asArray(appData?.widgetOnScreen?.widgets).find((widget) => widget.name === "Search");
}

function findParcelSearchSource(appData) {
  const searchWidget = findSearchWidget(appData);
  return asArray(searchWidget?.config?.sources).find((source) => source.name === "Parcels" || /Parcels/i.test(source.url ?? ""));
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

function sourceUrlFor(rawSourcePack) {
  const parcelSource = findParcelSearchSource(rawSourcePack.appData);
  return parcelSource?.url ?? null;
}

function buildFetchPlan(rawSourcePack) {
  const layerUrl = sourceUrlFor(rawSourcePack);
  return [
    {
      id: "cowlitz_app_item",
      url: COWLITZ_ITEM_URL,
      method: "GET",
      readOnly: true,
      purpose: "Fetch public ArcGIS item metadata."
    },
    {
      id: "cowlitz_app_data",
      url: COWLITZ_APP_DATA_URL,
      method: "GET",
      readOnly: true,
      purpose: "Fetch public ArcGIS Web AppBuilder configuration."
    },
    {
      id: "cowlitz_parcel_layer_metadata",
      url: layerUrl ? `${layerUrl}?f=json` : null,
      method: "GET",
      readOnly: true,
      purpose: "Fetch parcel layer field metadata only; no feature query."
    }
  ];
}

function buildStagingShape(rawSourcePack) {
  const layer = rawSourcePack.parcelLayer ?? {};
  const ownerField = fieldNameOrNull(layer, ["DEED_HOLDER_NAME", "OWNER_NAME", "OWNER"]);
  const addressFields = fieldNamesPresent(layer, [
    "SITUS_ADDRESS",
    "SITE_ALL",
    "ADDRESS",
    "SITUS_STREET_NUMBER",
    "SITUS_STREET_DIRECTION",
    "SITUS_STREET_NAME",
    "SITUS_STREET_SUFFIX",
    "SITUS_STREET_UNIT",
    "SITUS_CITY",
    "SITUS_ZIP_CODE"
  ]);
  const valueFields = fieldNamesPresent(layer, [
    "TOTAL_VALUE",
    "ASSESSED_VALUE",
    "MARKET_VALUE",
    "LAND_ASSESSED_VALUE",
    "IMPR_ASSESSED_VALUE"
  ]);

  return {
    schema: "terrafusion-staging-parcel-source-v1",
    mode: "contract_only_no_rows_loaded",
    fields: {
      county: { value: "Cowlitz" },
      countyToken: { value: "cowlitz" },
      parcelId: { sourceField: "PARCNO", required: true },
      ownerName: { sourceField: ownerField, required: false },
      situsAddress: { sourceFields: addressFields, required: false },
      assessedValue: { sourceFields: valueFields, required: false },
      geometryReference: { source: "ArcGIS feature layer geometry if later capture is authorized", required: false }
    },
    rows: []
  };
}

function buildParcelIdentity(rawSourcePack) {
  const parcelSource = findParcelSearchSource(rawSourcePack.appData);
  const searchFields = asArray(parcelSource?.searchFields);
  const layerHasParcno = fieldExists(rawSourcePack.parcelLayer, "PARCNO");
  const searchUsesParcno = searchFields.some((field) => String(field).toUpperCase() === "PARCNO");

  return {
    proven: layerHasParcno && searchUsesParcno,
    sourceField: layerHasParcno && searchUsesParcno ? "PARCNO" : null,
    proof: {
      searchSourceName: parcelSource?.name ?? null,
      searchSourceUrl: parcelSource?.url ?? null,
      searchFields,
      layerFields: fieldNames(rawSourcePack.parcelLayer)
    },
    semantics: layerHasParcno && searchUsesParcno
      ? "PARCNO is the public ArcGIS parcel layer search field and exists in the parcel layer metadata."
      : "PARCNO was not proven in both search config and layer metadata."
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
  const normalizedText = stableJson(stagingShape);
  return {
    receiptVersion: "june10-adapter-verification-v1",
    status: "VERIFIED",
    capturedAtUtc: generatedAtUtc,
    county: "Cowlitz",
    countyToken: "cowlitz",
    adapterId: "cowlitz-readonly-arcgis-metadata-v1",
    noSecretValuesRecorded: true,
    rawArtifacts: [
      {
        ...rawArtifact("app_item", COWLITZ_ITEM_URL, rawSourcePack.appItem),
        path: artifactPaths.appItem ?? null,
        capturedAtUtc: generatedAtUtc
      },
      {
        ...rawArtifact("app_data", COWLITZ_APP_DATA_URL, rawSourcePack.appData),
        path: artifactPaths.appData ?? null,
        capturedAtUtc: generatedAtUtc
      },
      {
        ...rawArtifact("parcel_layer_metadata", `${sourceUrlFor(rawSourcePack)}?f=json`, rawSourcePack.parcelLayer),
        path: artifactPaths.parcelLayer ?? null,
        capturedAtUtc: generatedAtUtc
      }
    ],
    normalizedArtifact: {
      path: artifactPaths.normalized ?? null,
      schema: stagingShape.schema,
      sha256: sha256(normalizedText),
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

  if (!sourceLock) blockers.push("Cowlitz source lock is missing.");
  if (sourceLock?.sourceDecisionStatus !== "source_locked") blockers.push("Cowlitz source must be source_locked.");
  if (rawSourcePack.appItem?.access !== "public") blockers.push("Cowlitz ArcGIS item is not public.");
  if (!/Cowlitz/i.test([rawSourcePack.appItem?.title, ...(rawSourcePack.appItem?.tags ?? [])].join(" "))) {
    blockers.push("Cowlitz county identity was not proven from ArcGIS item metadata.");
  }
  if (!parcelIdentity.proven) blockers.push("PARCNO parcel identifier semantics were not proven.");
  if (!stagingShape.fields.parcelId.sourceField) blockers.push("Staging parcelId source field is missing.");

  const license = rawSourcePack.appItem?.licenseInfo ?? "";
  if (/En masse/i.test(license)) {
    warnings.push("License text warns against en masse owner/tax parcel dissemination without data share agreement.");
  }

  return { blockers, warnings };
}

export function buildCowlitzReadonlyAdapterVerification({
  sourceLockPack,
  rawSourcePack,
  generatedAtUtc = new Date().toISOString(),
  artifactPaths = {}
}) {
  const sourceLock = findCowlitzSourceLock(sourceLockPack);
  const stagingShape = buildStagingShape(rawSourcePack);
  const parcelIdentity = buildParcelIdentity(rawSourcePack);
  const { blockers, warnings } = evaluate({ sourceLock, rawSourcePack, parcelIdentity, stagingShape });
  const adapterStatus = blockers.length === 0 ? "verified" : "candidate";

  return {
    generatedAtUtc,
    county: "Cowlitz",
    countyToken: "cowlitz",
    adapterId: "cowlitz-readonly-arcgis-metadata-v1",
    adapterStatus,
    sourceType: "county_property_portal_plus_gis",
    accessMethod: "read_only_public_arcgis_metadata_fetch",
    expectedExportFormat: "arcgis_item_json_app_config_json_layer_metadata_json",
    fetchPlan: buildFetchPlan(rawSourcePack),
    parcelIdentity,
    stagingShape,
    lineageReceipt: buildLineageReceipt({ rawSourcePack, stagingShape, generatedAtUtc, artifactPaths }),
    productionRowsWritten: 0,
    runtimeClaimAllowed: false,
    dbMutationAllowed: false,
    blockers,
    warnings,
    rules: [
      "This adapter verifies source metadata and staging contract only.",
      "It does not query parcel features or perform bulk extraction.",
      "It writes no TerraFusion production DB rows.",
      "Runtime claims remain blocked until separate load, API, and UI proof exist."
    ]
  };
}

async function fetchJson(url, fetcher = globalThis.fetch) {
  const response = await fetcher(url, {
    method: "GET",
    headers: { accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`GET ${url} returned ${response.status}`);
  }

  return response.json();
}

export async function fetchCowlitzRawSourcePack(fetcher = globalThis.fetch) {
  const appItem = await fetchJson(COWLITZ_ITEM_URL, fetcher);
  const appData = await fetchJson(COWLITZ_APP_DATA_URL, fetcher);
  const parcelSource = findParcelSearchSource(appData);
  if (!parcelSource?.url) {
    throw new Error("Cowlitz parcel layer URL was not found in app data search config.");
  }
  const parcelLayer = await fetchJson(`${parcelSource.url}?f=json`, fetcher);
  return { appItem, appData, parcelLayer };
}

function writeArtifacts({ rawSourcePack, stagingShape, artifactRoot }) {
  const rawDir = path.join(artifactRoot, "raw");
  const normalizedDir = path.join(artifactRoot, "normalized");
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(normalizedDir, { recursive: true });

  const paths = {
    appItem: path.join(rawDir, "cowlitz-arcgis-app-item.json"),
    appData: path.join(rawDir, "cowlitz-arcgis-app-data.json"),
    parcelLayer: path.join(rawDir, "cowlitz-parcel-layer-metadata.json"),
    normalized: path.join(normalizedDir, "cowlitz-staging-source-contract.json")
  };

  fs.writeFileSync(paths.appItem, stableJson(rawSourcePack.appItem));
  fs.writeFileSync(paths.appData, stableJson(rawSourcePack.appData));
  fs.writeFileSync(paths.parcelLayer, stableJson(rawSourcePack.parcelLayer));
  fs.writeFileSync(paths.normalized, stableJson(stagingShape));

  return Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, rel(value)]));
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Cowlitz Read-Only Adapter Verification",
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
    lines.push([step.id, step.method, String(step.readOnly), step.url ?? "not found", step.purpose].join(" | "));
  }

  lines.push("", "## Staging Shape", "");
  lines.push(`- Schema: \`${report.stagingShape.schema}\``);
  lines.push(`- Mode: ${report.stagingShape.mode}`);
  lines.push(`- Parcel ID field: ${report.stagingShape.fields.parcelId.sourceField}`);
  lines.push(`- Owner field: ${report.stagingShape.fields.ownerName.sourceField ?? "not available"}`);
  lines.push(`- Address fields: ${report.stagingShape.fields.situsAddress.sourceFields.join(", ") || "not available"}`);
  lines.push(`- Value fields: ${report.stagingShape.fields.assessedValue.sourceFields.join(", ") || "not available"}`);

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

export function runCowlitzReadonlyAdapterVerification(options = {}) {
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
    throw new Error("runCowlitzReadonlyAdapterVerification requires rawSourcePath. Use main() for live read-only fetch.");
  }

  const sourceLockPack = readJson(args.sourceLockPath);
  const rawSourcePack = readJson(args.rawSourcePath);
  const initialStagingShape = buildStagingShape(rawSourcePack);
  const artifactPaths = args.write
    ? writeArtifacts({ rawSourcePack, stagingShape: initialStagingShape, artifactRoot: args.artifactRoot })
    : {};
  const report = buildCowlitzReadonlyAdapterVerification({ sourceLockPack, rawSourcePack, artifactPaths });

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
  const rawSourcePack = args.rawSourcePath ? readJson(args.rawSourcePath) : await fetchCowlitzRawSourcePack();
  const initialStagingShape = buildStagingShape(rawSourcePack);
  const artifactPaths = args.write
    ? writeArtifacts({ rawSourcePack, stagingShape: initialStagingShape, artifactRoot: args.artifactRoot })
    : {};
  const report = buildCowlitzReadonlyAdapterVerification({ sourceLockPack, rawSourcePack, artifactPaths });

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
