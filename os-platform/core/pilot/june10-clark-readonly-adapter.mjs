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
  "june10-clark-readonly-adapter.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-clark-readonly-adapter.latest.md"
);
const DEFAULT_ARTIFACT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-adapters",
  "clark"
);

const CLARK_SERVICE_URL = "https://gis.clark.wa.gov/arcgisfed2/rest/services/MapsOnline/PropertyFinder/MapServer";
const CLARK_TAXLOTS_LAYER_URL = `${CLARK_SERVICE_URL}/1`;

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

function findClarkSourceLock(sourceLockPack) {
  return asArray(sourceLockPack?.sourceLocks).find((lock) => lock.countyToken === "clark" || lock.county === "Clark");
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

function buildFetchPlan() {
  return [
    {
      id: "clark_property_finder_service_metadata",
      url: CLARK_SERVICE_URL,
      method: "GET",
      readOnly: true,
      purpose: "Fetch public ArcGIS REST PropertyFinder service metadata only."
    },
    {
      id: "clark_taxlots_layer_metadata",
      url: CLARK_TAXLOTS_LAYER_URL,
      method: "GET",
      readOnly: true,
      purpose: "Fetch public ArcGIS REST Taxlots layer schema metadata only; no feature query."
    }
  ];
}

function buildParcelIdentity(rawSourcePack) {
  const layer = rawSourcePack.parcelLayer;
  const hasPropId = fieldExists(layer, "Prop_id");
  const propIdField = asArray(layer?.fields).find((field) => String(field.name ?? "").toUpperCase() === "PROP_ID");
  const aliasIsPropertyId = /Property ID/i.test(propIdField?.alias ?? "");
  const displayFieldMatches = String(layer?.displayField ?? "").toUpperCase() === "PROP_ID";
  const layerIsTaxlots = layer?.name === "Taxlots" && /Feature Layer/i.test(layer?.type ?? "");

  return {
    proven: hasPropId && aliasIsPropertyId && displayFieldMatches && layerIsTaxlots,
    sourceField: hasPropId && aliasIsPropertyId && displayFieldMatches && layerIsTaxlots ? "Prop_id" : null,
    proof: {
      serviceName: rawSourcePack.serviceMetadata?.mapName ?? null,
      serviceItemId: rawSourcePack.serviceMetadata?.serviceItemId ?? null,
      parcelLayerName: layer?.name ?? null,
      parcelLayerId: layer?.id ?? null,
      displayField: layer?.displayField ?? null,
      propIdField: propIdField ?? null,
      fieldNames: fieldNames(layer)
    },
    semantics: hasPropId && aliasIsPropertyId && displayFieldMatches && layerIsTaxlots
      ? "Clark MapsOnline PropertyFinder Taxlots layer exposes Prop_id as the Property ID display field in public ArcGIS REST metadata."
      : "Clark Prop_id parcel identifier semantics were not proven from public Taxlots layer metadata."
  };
}

function buildStagingShape(rawSourcePack) {
  const layer = rawSourcePack.parcelLayer ?? {};
  return {
    schema: "terrafusion-staging-parcel-source-v1",
    mode: "contract_only_no_rows_loaded",
    fields: {
      county: { value: "Clark" },
      countyToken: { value: "clark" },
      parcelId: { sourceField: "Prop_id", required: true },
      ownerName: { sourceField: fieldNameOrNull(layer, ["Owner", "owner_name", "OWNER_NAME"]), required: false },
      situsAddress: { sourceField: fieldNameOrNull(layer, ["SitusAddrsFull", "site_address", "SITUS_ADDRESS"]), required: false },
      assessedValue: {
        sourceFields: fieldNamesPresent(layer, ["assessed_value", "current_assessed_value", "TOTAL_VALUE", "MARKET_VALUE"]),
        required: false
      },
      mailingAddress: {
        sourceFields: fieldNamesPresent(layer, ["MailAddrs1", "MailAddrs2", "MailAddrs3"]),
        required: false
      },
      schoolDistrict: { sourceField: fieldNameOrNull(layer, ["SchoolDistrict"]), required: false },
      cityUrbanGrowthArea: { sourceField: fieldNameOrNull(layer, ["CityUGA"]), required: false },
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
    county: "Clark",
    countyToken: "clark",
    adapterId: "clark-readonly-propertyfinder-arcgis-schema-v1",
    noSecretValuesRecorded: true,
    rawArtifacts: [
      {
        ...rawArtifact("service_metadata", CLARK_SERVICE_URL, rawSourcePack.serviceMetadata),
        path: artifactPaths.serviceMetadata ?? null,
        capturedAtUtc: generatedAtUtc
      },
      {
        ...rawArtifact("taxlots_layer_metadata", CLARK_TAXLOTS_LAYER_URL, rawSourcePack.parcelLayer),
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

  if (!sourceLock) blockers.push("Clark source lock is missing.");
  if (!["source_locked", "source_candidate_locked"].includes(sourceLock?.sourceDecisionStatus)) {
    blockers.push("Clark source must be source_locked or source_candidate_locked.");
  }
  if (rawSourcePack.serviceMetadata?.mapName !== "PropertyFinder") {
    blockers.push("Clark PropertyFinder service identity was not proven.");
  }
  if (!parcelIdentity.proven) blockers.push("Prop_id parcel identifier semantics were not proven.");
  if (!stagingShape.fields.parcelId.sourceField) blockers.push("Staging parcelId source field is missing.");
  if (stagingShape.fields.assessedValue.sourceFields.length === 0) {
    warnings.push("Public Clark PropertyFinder Taxlots schema did not expose an assessed value field in metadata.");
  }
  if (/underdevelopment/i.test(rawSourcePack.parcelLayer?.description ?? "")) {
    warnings.push("Clark Taxlots layer description says the layer is under development and may change without notice.");
  }

  return { blockers, warnings };
}

export function buildClarkReadonlyAdapterVerification({
  sourceLockPack,
  rawSourcePack,
  generatedAtUtc = new Date().toISOString(),
  artifactPaths = {}
}) {
  const sourceLock = findClarkSourceLock(sourceLockPack);
  const stagingShape = buildStagingShape(rawSourcePack);
  const parcelIdentity = buildParcelIdentity(rawSourcePack);
  const { blockers, warnings } = evaluate({ sourceLock, rawSourcePack, parcelIdentity, stagingShape });

  return {
    generatedAtUtc,
    county: "Clark",
    countyToken: "clark",
    adapterId: "clark-readonly-propertyfinder-arcgis-schema-v1",
    adapterStatus: blockers.length === 0 ? "verified" : "candidate",
    sourceType: "county_property_portal_plus_gis",
    accessMethod: "read_only_public_arcgis_rest_metadata_fetch",
    expectedExportFormat: "arcgis_rest_service_json_layer_schema_metadata",
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
      "This adapter verifies public Clark MapsOnline PropertyFinder schema metadata and staging contract only.",
      "It does not call ArcGIS query endpoints, fetch feature rows, or perform bulk extraction.",
      "It writes no TerraFusion production DB rows.",
      "Runtime claims remain blocked until separate load, API, and UI proof exist."
    ]
  };
}

async function fetchJson(url, fetcher = globalThis.fetch) {
  const response = await fetcher(`${url}?f=pjson`, {
    method: "GET",
    headers: {
      accept: "application/json",
      "user-agent": "TerraFusion-June10-ReadOnlySchemaVerifier/1.0"
    }
  });

  if (!response.ok) throw new Error(`GET ${url}?f=pjson returned ${response.status}`);
  return response.json();
}

export async function fetchClarkRawSourcePack(fetcher = globalThis.fetch) {
  const serviceMetadata = await fetchJson(CLARK_SERVICE_URL, fetcher);
  const parcelLayer = await fetchJson(CLARK_TAXLOTS_LAYER_URL, fetcher);
  return { serviceMetadata, parcelLayer };
}

function writeArtifacts({ rawSourcePack, stagingShape, artifactRoot }) {
  const rawDir = path.join(artifactRoot, "raw");
  const normalizedDir = path.join(artifactRoot, "normalized");
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(normalizedDir, { recursive: true });

  const paths = {
    serviceMetadata: path.join(rawDir, "clark-propertyfinder-service-metadata.json"),
    parcelLayer: path.join(rawDir, "clark-taxlots-layer-metadata.json"),
    normalized: path.join(normalizedDir, "clark-staging-source-contract.json")
  };

  fs.writeFileSync(paths.serviceMetadata, stableJson(rawSourcePack.serviceMetadata));
  fs.writeFileSync(paths.parcelLayer, stableJson(rawSourcePack.parcelLayer));
  fs.writeFileSync(paths.normalized, stableJson(stagingShape));

  return Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, rel(value)]));
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Clark Read-Only Adapter Verification",
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
  lines.push(`- Value fields: ${report.stagingShape.fields.assessedValue.sourceFields.join(", ") || "not available"}`);
  lines.push(`- Mailing address fields: ${report.stagingShape.fields.mailingAddress.sourceFields.join(", ") || "not available"}`);
  lines.push(`- School district field: ${report.stagingShape.fields.schoolDistrict.sourceField ?? "not available"}`);

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

export function runClarkReadonlyAdapterVerification(options = {}) {
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
    throw new Error("runClarkReadonlyAdapterVerification requires rawSourcePath. Use main() for live read-only fetch.");
  }

  const sourceLockPack = readJson(args.sourceLockPath);
  const rawSourcePack = readJson(args.rawSourcePath);
  const stagingShape = buildStagingShape(rawSourcePack);
  const artifactPaths = args.write
    ? writeArtifacts({ rawSourcePack, stagingShape, artifactRoot: args.artifactRoot })
    : {};
  const report = buildClarkReadonlyAdapterVerification({ sourceLockPack, rawSourcePack, artifactPaths });

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
  const rawSourcePack = args.rawSourcePath ? readJson(args.rawSourcePath) : await fetchClarkRawSourcePack();
  const stagingShape = buildStagingShape(rawSourcePack);
  const artifactPaths = args.write
    ? writeArtifacts({ rawSourcePack, stagingShape, artifactRoot: args.artifactRoot })
    : {};
  const report = buildClarkReadonlyAdapterVerification({ sourceLockPack, rawSourcePack, artifactPaths });

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
