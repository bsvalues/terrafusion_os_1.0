#!/usr/bin/env node

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
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-statewide-arcgis-source-discovery.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-statewide-arcgis-source-discovery.latest.md"
);
const DEFAULT_TOKEN_FILE = path.join(repoRoot, ".env.arcgis.local");

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

function readTokenFile(tokenFile) {
  if (!tokenFile || !fs.existsSync(tokenFile)) return null;
  const content = fs.readFileSync(tokenFile, "utf8").trim();
  if (!content) return null;
  const envMatch = content.match(/^ARCGIS_TOKEN\s*=\s*(.+)$/m);
  return (envMatch?.[1] ?? content).trim().replace(/^["']|["']$/g, "");
}

export function resolveArcgisAuth({ env = process.env, tokenFile = DEFAULT_TOKEN_FILE } = {}) {
  const envToken = env.ARCGIS_TOKEN?.trim();
  if (envToken) {
    return {
      accessMode: "authenticated",
      tokenPresent: true,
      tokenSource: "env:ARCGIS_TOKEN",
      token: envToken
    };
  }

  const explicitTokenFile = env.ARCGIS_TOKEN_FILE?.trim() || tokenFile;
  const fileToken = readTokenFile(explicitTokenFile);
  if (fileToken) {
    return {
      accessMode: "authenticated",
      tokenPresent: true,
      tokenSource: `file:${path.relative(repoRoot, explicitTokenFile).replaceAll(path.sep, "/")}`,
      token: fileToken
    };
  }

  return {
    accessMode: "anonymous",
    tokenPresent: false,
    tokenSource: null,
    token: null
  };
}

function sanitizeAuth(auth) {
  return {
    accessMode: auth.accessMode,
    tokenPresent: auth.tokenPresent,
    tokenSource: auth.tokenSource
  };
}

export function buildCountySearchQueries({ county }) {
  return [
    `${county} County parcels`,
    `${county} County tax parcels`,
    `${county} County assessor parcels`,
    `${county} County parcel inventory`,
    `${county} County GIS parcels`
  ];
}

export function classifyArcgisItem(item, countyContext = null) {
  const text = [item.title, item.type, item.url, item.snippet, item.description, item.tags?.join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const isService = /feature service|map service|featureserver|mapserver/.test(text);
  const isParcel = /parcel|tax parcel|cadastre|cadastral|assessor/.test(text);
  const isBad = /florida|california|texas|sale|sales|comparable|permit|zoning|address point|election|district/.test(text);
  const county = countyContext?.county?.toLowerCase();
  const countyRelevant = county ? text.includes(county) : false;
  const washingtonStatewide = /wageoservices|washington|wa[_ -]?parcels|current parcels|previous parcels/.test(text);
  if (isService && isParcel && !isBad && countyRelevant) return "county_parcel_feature_service_candidate";
  if (isService && isParcel && !isBad && washingtonStatewide) {
    return "washington_statewide_parcel_feature_service_candidate";
  }
  if (isService && isParcel && !isBad) return "parcel_feature_service_candidate";
  if (isParcel && !isBad && (countyRelevant || washingtonStatewide)) return "parcel_source_lead";
  return "secondary_or_irrelevant";
}

export function summarizeDiscoveryItem(item, countyContext = null) {
  return {
    id: item.id ?? null,
    title: item.title ?? null,
    type: item.type ?? null,
    owner: item.owner ?? null,
    url: item.url ?? null,
    itemPage: item.id ? `https://www.arcgis.com/home/item.html?id=${item.id}` : null,
    modified: item.modified ?? null,
    classification: classifyArcgisItem(item, countyContext)
  };
}

function statusFor(items) {
  if (items.some((item) => item.classification === "county_parcel_feature_service_candidate")) {
    return "county_arcgis_candidate_found";
  }
  if (items.some((item) => item.classification === "washington_statewide_parcel_feature_service_candidate")) {
    return "statewide_arcgis_candidate_found";
  }
  if (items.some((item) => item.classification === "parcel_feature_service_candidate")) return "arcgis_candidate_found";
  if (items.some((item) => item.classification === "parcel_source_lead")) return "parcel_source_lead_found";
  return "no_arcgis_candidate_found";
}

function emptyAuthComparison() {
  return {
    anonymousCandidateCount: null,
    authenticatedCandidateCount: null,
    changed: false
  };
}

function candidateCountFor(items, countyRow) {
  return items
    .map((item) => summarizeDiscoveryItem(item, countyRow))
    .filter((item) => item.classification !== "secondary_or_irrelevant").length;
}

export function buildDiscoveryReport({
  matrix,
  discoveries,
  accessMode = "anonymous",
  authComparison = new Map(),
  authSummary = null
}) {
  const rows = (matrix.rows ?? [])
    .filter((row) => row.certifiable !== true)
    .map((countyRow) => {
      const items = (discoveries.get(countyRow.county) ?? []).map((item) => summarizeDiscoveryItem(item, countyRow));
      const candidates = items.filter((item) => item.classification !== "secondary_or_irrelevant").slice(0, 5);
      const countyAuthComparison = authComparison.get(countyRow.county) ?? emptyAuthComparison();
      return {
        county: countyRow.county,
        fips: countyRow.fips,
        priorInventoryAccess: countyRow.inventoryAccess ?? null,
        accessMode,
        status: statusFor(items),
        candidateCount: candidates.length,
        candidates,
        searchedQueries: buildCountySearchQueries(countyRow),
        authComparison: countyAuthComparison,
        authChangedCandidateVisibility: Boolean(countyAuthComparison.changed),
        authImprovementSignals: {
          metadataVisibility:
            countyAuthComparison.changed === true ? "candidate_visibility_changed" : "no_candidate_visibility_change",
          exportAvailability: "not_evaluated_in_discovery",
          querySuccess: "portal_search_only",
          fieldVisibility: "not_evaluated_in_discovery",
          rowCount: "not_evaluated_in_discovery"
        },
        nextAction:
          candidates.length > 0
            ? "validate_candidate_layer_fields_and_capture_source_native_ids"
            : "manual_official_assessor_gis_source_research_required",
        databaseMutationAttempted: false,
        productionBindingAllowed: false,
        certificationAllowed: false
      };
    });

  const summary = rows.reduce(
    (acc, row) => {
      acc.byStatus[row.status] = (acc.byStatus[row.status] ?? 0) + 1;
      if (row.candidateCount > 0) acc.countiesWithCandidates += 1;
      return acc;
    },
    { countiesChecked: rows.length, countiesWithCandidates: 0, byStatus: {} }
  );

  return {
    generatedAt: new Date().toISOString(),
    scope: "Statewide ArcGIS/open-data source discovery for non-certifiable Washington counties.",
    accessMode,
    authSummary,
    summary,
    rows,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    certificationAllowed: false
  };
}

async function arcgisSearch(query, auth) {
  const url = new URL("https://www.arcgis.com/sharing/rest/search");
  url.searchParams.set("f", "json");
  url.searchParams.set("num", "8");
  url.searchParams.set("sortField", "numViews");
  url.searchParams.set("sortOrder", "desc");
  url.searchParams.set("q", `${query} Washington type:"Feature Service" OR type:"Map Service"`);
  if (auth?.token) url.searchParams.set("token", auth.token);
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) throw new Error(`ArcGIS search failed for ${query}: ${response.status} ${text.slice(0, 120)}`);
  return JSON.parse(text).results ?? [];
}

async function discoverCounty(countyRow, { fixture = false, auth = null } = {}) {
  if (fixture) {
    return [
      {
        id: `${countyRow.fips}-fixture`,
        title: `${countyRow.county} County Tax Parcels`,
        type: "Feature Service",
        owner: "fixture",
        url: `https://example.test/${countyRow.fips}/FeatureServer`
      }
    ];
  }

  const seen = new Set();
  const items = [];
  for (const query of buildCountySearchQueries(countyRow).slice(0, 3)) {
    const results = await arcgisSearch(query, auth);
    for (const item of results) {
      const key = item.id ?? item.url ?? item.title;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
  }
  return items;
}

async function discoverAll(matrix, { fixture = false, auth = null } = {}) {
  const rows = (matrix.rows ?? []).filter((row) => row.certifiable !== true);
  const discoveries = new Map();
  for (const row of rows) {
    try {
      discoveries.set(row.county, await discoverCounty(row, { fixture, auth }));
    } catch (error) {
      discoveries.set(row.county, [
        {
          title: `Discovery error: ${error.message}`,
          type: "error",
          url: null
        }
      ]);
    }
  }
  return discoveries;
}

function buildAuthComparison({ matrix, anonymousDiscoveries, authenticatedDiscoveries }) {
  const comparison = new Map();
  for (const countyRow of (matrix.rows ?? []).filter((row) => row.certifiable !== true)) {
    const anonymousCandidateCount = candidateCountFor(anonymousDiscoveries.get(countyRow.county) ?? [], countyRow);
    const authenticatedCandidateCount = candidateCountFor(authenticatedDiscoveries.get(countyRow.county) ?? [], countyRow);
    comparison.set(countyRow.county, {
      anonymousCandidateCount,
      authenticatedCandidateCount,
      changed: anonymousCandidateCount !== authenticatedCandidateCount
    });
  }
  return comparison;
}

function renderMarkdown(report) {
  const rows = report.rows
    .map(
      (row) =>
        `| ${row.county} | ${row.fips} | ${row.priorInventoryAccess ?? "-"} | ${row.status} | ${row.candidateCount} | ${row.candidates[0]?.title ?? "-"} | ${row.candidates[0]?.url ?? row.candidates[0]?.itemPage ?? "-"} |`
    )
    .join("\n");
  return `# Statewide ArcGIS Source Discovery

Generated: ${report.generatedAt}
Access mode: ${report.accessMode}

## Summary

- Counties checked: ${report.summary.countiesChecked}
- Counties with candidates: ${report.summary.countiesWithCandidates}
- Auth changed candidate visibility: ${report.rows.filter((row) => row.authChangedCandidateVisibility).length}
- Database mutation attempted: ${report.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${report.certificationAllowed ? "yes" : "no"}

## Matrix

| County | FIPS | Prior access | Discovery status | Candidates | Top candidate | URL |
| --- | --- | --- | --- | ---: | --- | --- |
${rows}

## Auth Posture

- Anonymous access remains the default.
- Authenticated access is optional and only used when a local token is provided.
- Token value recorded in evidence: no.
- Authenticated discovery can improve source discovery, but it does not authorize certification, production binding, or DB mutation.
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    matrix: args.get("matrix") ?? DEFAULT_MATRIX,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD,
    fixture: args.has("fixture"),
    tokenFile: args.has("token-file") ? path.resolve(args.get("token-file")) : DEFAULT_TOKEN_FILE
  };
  const matrix = readJson(paths.matrix);
  const auth = resolveArcgisAuth({ tokenFile: paths.tokenFile });
  const discoveries = await discoverAll(matrix, { fixture: paths.fixture, auth });
  let authComparison = new Map();
  if (auth.accessMode === "authenticated") {
    const anonymousAuth = resolveArcgisAuth({ env: {}, tokenFile: null });
    const anonymousDiscoveries = await discoverAll(matrix, { fixture: paths.fixture, auth: anonymousAuth });
    authComparison = buildAuthComparison({
      matrix,
      anonymousDiscoveries,
      authenticatedDiscoveries: discoveries
    });
  }
  const report = buildDiscoveryReport({
    matrix,
    discoveries,
    accessMode: auth.accessMode,
    authComparison,
    authSummary: sanitizeAuth(auth)
  });
  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`Statewide ArcGIS source discovery written: ${path.relative(repoRoot, paths.outJson).replaceAll(path.sep, "/")}`);
  console.log(`ArcGIS access mode: ${report.accessMode}`);
  console.log(`Counties with candidates: ${report.summary.countiesWithCandidates}/${report.summary.countiesChecked}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
