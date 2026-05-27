#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_DISCOVERY = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-statewide-arcgis-source-discovery.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-candidate-field-validation.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-arcgis-candidate-field-validation.latest.md"
);

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

export function normalizeArcgisServiceUrl(rawUrl) {
  if (!rawUrl || !/\/(FeatureServer|MapServer)(\/|\?|$)/i.test(rawUrl)) return null;
  const parsed = new URL(rawUrl);
  const match = parsed.pathname.match(/^(.*\/(?:FeatureServer|MapServer))(?:\/\d+)?\/?$/i);
  if (!match) return null;
  parsed.pathname = match[1];
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

function fieldNames(layer) {
  return (layer?.fields ?? []).map((field) => field.name).filter(Boolean);
}

function matchingFields(names, patterns) {
  return names.filter((name) => patterns.some((pattern) => pattern.test(name)));
}

export function evaluateArcgisLayerMetadata({ service, layer, serviceUrl = null }) {
  const fields = fieldNames(layer);
  const serviceCapabilities = String(service?.capabilities ?? "");
  const layerCapabilities = String(layer?.capabilities ?? "");
  const combinedCapabilities = `${serviceCapabilities},${layerCapabilities}`;
  const supportedExportFormats = String(service?.supportedExportFormats ?? "");

  const parcelIdFields = matchingFields(fields, [
    /^PARCEL(?:_?ID|ID)?(?:_?NR)?$/i,
    /^ORIG_?PARCEL_?ID$/i,
    /^PARC(?:EL)?NO$/i,
    /^PIN$/i,
    /^APN$/i,
    /^TAX_?PARCEL/i
  ]);
  const countyScopeFields = matchingFields(fields, [/^FIPS/i, /^COUNTY/i, /^COUNTY_?NM$/i, /^CNTY/i]);
  const addressFields = matchingFields(fields, [/SITUS/i, /ADDRESS/i, /^ADDR/i]);
  const valueFields = matchingFields(fields, [/VALUE/i, /VAL_?/i, /ASSES/i]);
  const querySupported = /Query/i.test(combinedCapabilities);
  const extractSupported = /Extract|Sync/i.test(combinedCapabilities) || supportedExportFormats.length > 0;
  const sourceScope = /statewide|washington statewide|wa statewide/i.test(
    [service?.serviceDescription, service?.description, service?.name, layer?.name].filter(Boolean).join(" ")
  )
    ? "statewide"
    : "county_or_local";

  let validationStatus = "candidate_layer_metadata_only";
  if (parcelIdFields.length > 0 && querySupported && countyScopeFields.length > 0 && extractSupported) {
    validationStatus = "candidate_layer_receipt_ready";
  } else if (parcelIdFields.length > 0 && querySupported) {
    validationStatus = "candidate_layer_identity_ready";
  }

  return {
    serviceUrl,
    reachable: true,
    selectedLayerId: layer?.id ?? 0,
    selectedLayerName: layer?.name ?? null,
    sourceScope,
    validationStatus,
    geometryType: layer?.geometryType ?? null,
    capabilities: {
      service: serviceCapabilities || null,
      layer: layerCapabilities || null
    },
    supportedExportFormats: supportedExportFormats || null,
    querySupported,
    extractSupported,
    parcelIdFields,
    countyScopeFields,
    addressFields,
    valueFields,
    fieldCount: fields.length,
    fields,
    rowCountEvaluation: "not_evaluated_in_metadata_validation",
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false
  };
}

function validationFailure(serviceUrl, message) {
  return {
    serviceUrl,
    reachable: false,
    validationStatus: "candidate_layer_unreachable",
    error: message,
    parcelIdFields: [],
    countyScopeFields: [],
    addressFields: [],
    valueFields: [],
    querySupported: false,
    extractSupported: false,
    rowCountEvaluation: "not_evaluated_service_unreachable",
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false
  };
}

function fixtureValidation(serviceUrl) {
  return evaluateArcgisLayerMetadata({
    serviceUrl,
    service: {
      serviceDescription: "Washington statewide tax parcel data.",
      capabilities: "Query,Extract,Sync",
      supportedExportFormats: "csv,filegdb,geojson",
      layers: [{ id: 0, name: "Parcels_2026" }]
    },
    layer: {
      id: 0,
      name: "Parcels_2026",
      capabilities: "Query,Extract",
      geometryType: "esriGeometryPolygon",
      fields: [
        { name: "OBJECTID" },
        { name: "FIPS_NR" },
        { name: "COUNTY_NM" },
        { name: "PARCEL_ID_NR" },
        { name: "ORIG_PARCEL_ID" },
        { name: "SITUS_ADDRESS" },
        { name: "VALUE_LAND" },
        { name: "VALUE_BLDG" }
      ]
    }
  });
}

async function fetchJson(url, timeoutMs = 90000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    if (!response.ok) throw new Error(`${response.status} ${text.slice(0, 160)}`);
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

async function validateService(serviceUrl, fixture) {
  if (fixture) return fixtureValidation(serviceUrl);
  try {
    const serviceUrlWithJson = new URL(serviceUrl);
    serviceUrlWithJson.searchParams.set("f", "json");
    const service = await fetchJson(serviceUrlWithJson.toString());
    const firstLayerId = service.layers?.[0]?.id ?? 0;
    const layerUrl = new URL(`${serviceUrl.replace(/\/$/, "")}/${firstLayerId}`);
    layerUrl.searchParams.set("f", "json");
    const layer = await fetchJson(layerUrl.toString());
    return evaluateArcgisLayerMetadata({ service, layer, serviceUrl });
  } catch (error) {
    return validationFailure(serviceUrl, error.message);
  }
}

function countyTopService(row) {
  const topCandidate = row.candidates?.[0] ?? null;
  const serviceUrl = normalizeArcgisServiceUrl(topCandidate?.url ?? null);
  return { topCandidate, serviceUrl };
}

export function buildCandidateValidationReport({ discovery, validations }) {
  const rows = (discovery.rows ?? []).map((row) => {
    const { topCandidate, serviceUrl } = countyTopService(row);
    const validation = serviceUrl ? validations.get(serviceUrl) : null;
    const validationStatus = validation?.validationStatus ?? "candidate_layer_not_arcgis_service";
    const nextAction =
      validationStatus === "candidate_layer_receipt_ready"
        ? "capture_county_slice_from_validated_arcgis_layer"
        : validationStatus === "candidate_layer_identity_ready"
          ? "capture_identity_only_then_adjudicate_export_or_county_scope"
          : "manual_official_assessor_gis_source_research_required";

    return {
      county: row.county,
      fips: row.fips,
      sourceDiscoveryAccessMode: discovery.accessMode ?? "unknown",
      topCandidateTitle: topCandidate?.title ?? null,
      topCandidateOwner: topCandidate?.owner ?? null,
      topCandidateUrl: topCandidate?.url ?? null,
      normalizedServiceUrl: serviceUrl,
      validationStatus,
      sourceScope: validation?.sourceScope ?? null,
      parcelIdFields: validation?.parcelIdFields ?? [],
      countyScopeFields: validation?.countyScopeFields ?? [],
      addressFields: validation?.addressFields ?? [],
      valueFields: validation?.valueFields ?? [],
      querySupported: validation?.querySupported ?? false,
      extractSupported: validation?.extractSupported ?? false,
      rowCountEvaluation: validation?.rowCountEvaluation ?? "not_evaluated",
      nextAction,
      databaseMutationAttempted: false,
      productionBindingAllowed: false,
      certificationAllowed: false
    };
  });

  const summary = rows.reduce(
    (acc, row) => {
      acc.byValidationStatus[row.validationStatus] = (acc.byValidationStatus[row.validationStatus] ?? 0) + 1;
      if (row.validationStatus === "candidate_layer_receipt_ready") acc.countiesReceiptReadyCandidates += 1;
      if (row.validationStatus === "candidate_layer_identity_ready") acc.countiesIdentityReadyCandidates += 1;
      return acc;
    },
    {
      countiesChecked: rows.length,
      uniqueCandidateServicesChecked: validations.size,
      countiesReceiptReadyCandidates: 0,
      countiesIdentityReadyCandidates: 0,
      byValidationStatus: {}
    }
  );

  return {
    generatedAt: new Date().toISOString(),
    scope: "Read-only ArcGIS candidate field validation for county source-native parcel capture.",
    sourceDiscoveryGeneratedAt: discovery.generatedAt ?? null,
    sourceDiscoveryAccessMode: discovery.accessMode ?? "unknown",
    summary,
    serviceValidations: [...validations.values()],
    rows,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    certificationAllowed: false
  };
}

function renderMarkdown(report) {
  const rows = report.rows
    .map(
      (row) =>
        `| ${row.county} | ${row.fips} | ${row.validationStatus} | ${row.sourceScope ?? "-"} | ${row.parcelIdFields.join(", ") || "-"} | ${row.countyScopeFields.join(", ") || "-"} | ${row.querySupported ? "yes" : "no"} | ${row.extractSupported ? "yes" : "no"} | ${row.nextAction} |`
    )
    .join("\n");

  return `# ArcGIS Candidate Field Validation

Generated: ${report.generatedAt}
Source discovery access mode: ${report.sourceDiscoveryAccessMode}

## Summary

- Counties checked: ${report.summary.countiesChecked}
- Unique candidate services checked: ${report.summary.uniqueCandidateServicesChecked}
- Receipt-ready candidates: ${report.summary.countiesReceiptReadyCandidates}
- Identity-ready candidates: ${report.summary.countiesIdentityReadyCandidates}
- Database mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${report.certificationAllowed ? "yes" : "no"}

## Matrix

| County | FIPS | Validation status | Scope | Parcel ID fields | County fields | Query | Extract | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    discovery: args.get("discovery") ?? DEFAULT_DISCOVERY,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD,
    fixture: args.has("fixture")
  };
  const discovery = readJson(paths.discovery);
  const serviceUrls = [
    ...new Set(
      (discovery.rows ?? [])
        .map((row) => countyTopService(row).serviceUrl)
        .filter(Boolean)
    )
  ];
  const validations = new Map();
  for (const serviceUrl of serviceUrls) {
    console.log(`Validating ArcGIS candidate: ${serviceUrl}`);
    validations.set(serviceUrl, await validateService(serviceUrl, paths.fixture));
  }
  const report = buildCandidateValidationReport({ discovery, validations });
  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`ArcGIS candidate field validation written: ${path.relative(repoRoot, paths.outJson).replaceAll(path.sep, "/")}`);
  console.log(
    `Receipt-ready candidates: ${report.summary.countiesReceiptReadyCandidates}/${report.summary.countiesChecked}`
  );
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
