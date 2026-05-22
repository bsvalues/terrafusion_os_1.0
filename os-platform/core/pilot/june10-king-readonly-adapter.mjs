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
  "june10-king-readonly-adapter.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-readonly-adapter.latest.md"
);
const DEFAULT_ARTIFACT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-adapters",
  "king"
);

const KING_SERVICE_URL = "https://gisdata.kingcounty.gov/arcgis/rest/services/OpenDataPortal/property__parcel_area/MapServer";
const KING_PARCEL_LAYER_URL = `${KING_SERVICE_URL}/439`;

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

function findKingSourceLock(sourceLockPack) {
  return asArray(sourceLockPack?.sourceLocks).find((lock) => lock.countyToken === "king" || lock.county === "King");
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
      id: "king_parcel_area_service_metadata",
      url: KING_SERVICE_URL,
      method: "GET",
      readOnly: true,
      purpose: "Fetch public King County OpenDataPortal parcel service metadata only."
    },
    {
      id: "king_parcel_area_layer_metadata",
      url: KING_PARCEL_LAYER_URL,
      method: "GET",
      readOnly: true,
      purpose: "Fetch public King County parcel_area layer schema metadata only; no feature query."
    }
  ];
}

function buildParcelIdentity(rawSourcePack) {
  const layer = rawSourcePack.parcelLayer;
  const hasPin = fieldExists(layer, "PIN");
  const hasMajor = fieldExists(layer, "MAJOR");
  const hasMinor = fieldExists(layer, "MINOR");
  const pinField = asArray(layer?.fields).find((field) => String(field.name ?? "").toUpperCase() === "PIN");
  const descriptionMentionsParcelNumbers = /parcel numbers.*PIN, Major or Minor|PIN, Major or Minor/i.test(
    [rawSourcePack.serviceMetadata?.serviceDescription, layer?.description].join(" ")
  );
  const layerIsParcelArea = layer?.name === "parcel_area" && /Feature Layer/i.test(layer?.type ?? "");

  return {
    proven: hasPin && hasMajor && hasMinor && descriptionMentionsParcelNumbers && layerIsParcelArea,
    sourceField: hasPin && hasMajor && hasMinor && descriptionMentionsParcelNumbers && layerIsParcelArea ? "PIN" : null,
    componentFields: hasMajor && hasMinor ? ["MAJOR", "MINOR"] : [],
    proof: {
      serviceTitle: rawSourcePack.serviceMetadata?.documentInfo?.Title ?? null,
      serviceKeywords: rawSourcePack.serviceMetadata?.documentInfo?.Keywords ?? null,
      parcelLayerName: layer?.name ?? null,
      parcelLayerId: layer?.id ?? null,
      pinField: pinField ?? null,
      fieldNames: fieldNames(layer)
    },
    semantics: hasPin && hasMajor && hasMinor && descriptionMentionsParcelNumbers && layerIsParcelArea
      ? "King County parcel_area metadata states parcel numbers may include leading zeros in PIN, Major, or Minor and exposes PIN plus MAJOR/MINOR fields."
      : "King County PIN parcel identifier semantics were not proven from parcel_area metadata."
  };
}

function buildStagingShape(rawSourcePack) {
  const layer = rawSourcePack.parcelLayer ?? {};
  return {
    schema: "terrafusion-staging-parcel-source-v1",
    mode: "contract_only_no_rows_loaded",
    fields: {
      county: { value: "King" },
      countyToken: { value: "king" },
      parcelId: {
        sourceField: "PIN",
        componentFields: fieldNamesPresent(layer, ["MAJOR", "MINOR"]),
        required: true
      },
      ownerName: { sourceField: fieldNameOrNull(layer, ["owner_name", "OWNER", "Owner"]), required: false },
      situsAddress: { sourceField: fieldNameOrNull(layer, ["situs_address", "SITE_ADDRESS", "address"]), required: false },
      assessedValue: {
        sourceFields: fieldNamesPresent(layer, ["assessed_value", "current_assessed_value", "TOTAL_VALUE", "MARKET_VALUE"]),
        required: false
      },
      major: { sourceField: fieldNameOrNull(layer, ["MAJOR"]), required: false },
      minor: { sourceField: fieldNameOrNull(layer, ["MINOR"]), required: false },
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
    county: "King",
    countyToken: "king",
    adapterId: "king-readonly-parcel-area-arcgis-schema-v1",
    noSecretValuesRecorded: true,
    rawArtifacts: [
      {
        ...rawArtifact("service_metadata", KING_SERVICE_URL, rawSourcePack.serviceMetadata),
        path: artifactPaths.serviceMetadata ?? null,
        capturedAtUtc: generatedAtUtc
      },
      {
        ...rawArtifact("parcel_layer_metadata", KING_PARCEL_LAYER_URL, rawSourcePack.parcelLayer),
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

  if (!sourceLock) blockers.push("King source lock is missing.");
  if (!["source_locked", "source_candidate_locked"].includes(sourceLock?.sourceDecisionStatus)) {
    blockers.push("King source must be source_locked or source_candidate_locked.");
  }
  if (rawSourcePack.serviceMetadata?.copyrightText !== "King County") {
    blockers.push("King County source identity was not proven from service metadata.");
  }
  if (!parcelIdentity.proven) blockers.push("PIN parcel identifier semantics were not proven.");
  if (!stagingShape.fields.parcelId.sourceField) blockers.push("Staging parcelId source field is missing.");
  if (!stagingShape.fields.ownerName.sourceField) {
    warnings.push("Public King parcel_area schema did not expose owner fields in metadata.");
  }
  if (!stagingShape.fields.situsAddress.sourceField) {
    warnings.push("Public King parcel_area schema did not expose situs address fields in metadata.");
  }
  if (stagingShape.fields.assessedValue.sourceFields.length === 0) {
    warnings.push("Public King parcel_area schema did not expose an assessed value field in metadata.");
  }
  if (/stacked polygon|place-holder polygons/i.test(rawSourcePack.parcelLayer?.description ?? "")) {
    warnings.push("King parcel_area metadata notes placeholder/stacked polygon geometry; parcel counts require later semantic filtering.");
  }
  if (/Do not use for survey purposes/i.test(rawSourcePack.parcelLayer?.description ?? "")) {
    warnings.push("King parcel_area metadata says boundaries are general location only and not for survey purposes.");
  }

  return { blockers, warnings };
}

export function buildKingReadonlyAdapterVerification({
  sourceLockPack,
  rawSourcePack,
  generatedAtUtc = new Date().toISOString(),
  artifactPaths = {}
}) {
  const sourceLock = findKingSourceLock(sourceLockPack);
  const stagingShape = buildStagingShape(rawSourcePack);
  const parcelIdentity = buildParcelIdentity(rawSourcePack);
  const { blockers, warnings } = evaluate({ sourceLock, rawSourcePack, parcelIdentity, stagingShape });

  return {
    generatedAtUtc,
    county: "King",
    countyToken: "king",
    adapterId: "king-readonly-parcel-area-arcgis-schema-v1",
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
      "This adapter verifies public King County parcel_area schema metadata and staging contract only.",
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

export async function fetchKingRawSourcePack(fetcher = globalThis.fetch) {
  const serviceMetadata = await fetchJson(KING_SERVICE_URL, fetcher);
  const parcelLayer = await fetchJson(KING_PARCEL_LAYER_URL, fetcher);
  return { serviceMetadata, parcelLayer };
}

function writeArtifacts({ rawSourcePack, stagingShape, artifactRoot }) {
  const rawDir = path.join(artifactRoot, "raw");
  const normalizedDir = path.join(artifactRoot, "normalized");
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(normalizedDir, { recursive: true });

  const paths = {
    serviceMetadata: path.join(rawDir, "king-parcel-area-service-metadata.json"),
    parcelLayer: path.join(rawDir, "king-parcel-area-layer-metadata.json"),
    normalized: path.join(normalizedDir, "king-staging-source-contract.json")
  };

  fs.writeFileSync(paths.serviceMetadata, stableJson(rawSourcePack.serviceMetadata));
  fs.writeFileSync(paths.parcelLayer, stableJson(rawSourcePack.parcelLayer));
  fs.writeFileSync(paths.normalized, stableJson(stagingShape));

  return Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, rel(value)]));
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 King Read-Only Adapter Verification",
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
    `- Component fields: ${report.parcelIdentity.componentFields.join(", ") || "not available"}`,
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
  lines.push(`- Parcel ID component fields: ${report.stagingShape.fields.parcelId.componentFields.join(", ") || "not available"}`);
  lines.push(`- Owner field: ${report.stagingShape.fields.ownerName.sourceField ?? "not available"}`);
  lines.push(`- Address field: ${report.stagingShape.fields.situsAddress.sourceField ?? "not available"}`);
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

export function runKingReadonlyAdapterVerification(options = {}) {
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
    throw new Error("runKingReadonlyAdapterVerification requires rawSourcePath. Use main() for live read-only fetch.");
  }

  const sourceLockPack = readJson(args.sourceLockPath);
  const rawSourcePack = readJson(args.rawSourcePath);
  const stagingShape = buildStagingShape(rawSourcePack);
  const artifactPaths = args.write
    ? writeArtifacts({ rawSourcePack, stagingShape, artifactRoot: args.artifactRoot })
    : {};
  const report = buildKingReadonlyAdapterVerification({ sourceLockPack, rawSourcePack, artifactPaths });

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
  const rawSourcePack = args.rawSourcePath ? readJson(args.rawSourcePath) : await fetchKingRawSourcePack();
  const stagingShape = buildStagingShape(rawSourcePack);
  const artifactPaths = args.write
    ? writeArtifacts({ rawSourcePack, stagingShape, artifactRoot: args.artifactRoot })
    : {};
  const report = buildKingReadonlyAdapterVerification({ sourceLockPack, rawSourcePack, artifactPaths });

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
