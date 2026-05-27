#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_CROSSWALK = path.join(repoRoot, "generated", "truth", "washington-39-county-data-crosswalk.json");
const DEFAULT_EVIDENCE_ROOT = path.join(repoRoot, "os-platform", "core", "pilot", "evidence");
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-authoritative-parcel-inventory-reconstruction.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-authoritative-parcel-inventory-reconstruction.latest.md"
);

const WASHINGTON_COUNTIES = [
  ["Adams", "53001"],
  ["Asotin", "53003"],
  ["Benton", "53005"],
  ["Chelan", "53007"],
  ["Clallam", "53009"],
  ["Clark", "53011"],
  ["Columbia", "53013"],
  ["Cowlitz", "53015"],
  ["Douglas", "53017"],
  ["Ferry", "53019"],
  ["Franklin", "53021"],
  ["Garfield", "53023"],
  ["Grant", "53025"],
  ["Grays Harbor", "53027"],
  ["Island", "53029"],
  ["Jefferson", "53031"],
  ["King", "53033"],
  ["Kitsap", "53035"],
  ["Kittitas", "53037"],
  ["Klickitat", "53039"],
  ["Lewis", "53041"],
  ["Lincoln", "53043"],
  ["Mason", "53045"],
  ["Okanogan", "53047"],
  ["Pacific", "53049"],
  ["Pend Oreille", "53051"],
  ["Pierce", "53053"],
  ["San Juan", "53055"],
  ["Skagit", "53057"],
  ["Skamania", "53059"],
  ["Snohomish", "53061"],
  ["Spokane", "53063"],
  ["Stevens", "53065"],
  ["Thurston", "53067"],
  ["Wahkiakum", "53069"],
  ["Walla Walla", "53071"],
  ["Whatcom", "53073"],
  ["Whitman", "53075"],
  ["Yakima", "53077"]
];

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

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
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

function collectFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const current = path.join(root, entry.name);
    return entry.isDirectory() ? collectFiles(current) : [current];
  });
}

function countyFileRegex(county) {
  return new RegExp(county.toLowerCase().replace(/\s+/g, "[-_ ]?"), "i");
}

export function officialWashingtonCountyRows() {
  return WASHINGTON_COUNTIES.map(([county, fips]) => ({ county, fips }));
}

function textBlob(row) {
  return [
    row?.acquisitionFamily,
    row?.primarySalesSource,
    row?.fallbackSource,
    row?.gisMapSurface,
    row?.officialAssessorBaseUrl,
    ...(row?.payloadFiles ?? []),
    ...(row?.localDataFiles ?? []),
    ...(row?.adapterEvidenceFiles ?? []),
    ...(row?.evidenceFiles ?? [])
  ]
    .filter(Boolean)
    .join(" ");
}

export function detectInventorySignals(row) {
  const lower = textBlob(row).toLowerCase();
  const gisLayer = /\bgis\b|parcel map|mapsifter|imap|publicgis|mapserver|featureserver|arcgis|parcel layer/.test(lower);
  const arcgisRest = /arcgis\/rest|services\.arcgis|mapserver|featureserver/.test(lower);
  const hasDownloadSignal = /open data|data export|download|downloadable|bulk|zip|csv|jsonl|geojson|shapefile|txt data/.test(
    lower
  );
  const hasInventoryDownloadContext =
    /parcel inventory|assessor parcel|property inventory|parcel layer|\bgis\b|arcgis|open data|data export|txt data/.test(
      lower
    );
  const downloadableExport = hasDownloadSignal && hasInventoryDownloadContext;
  const searchSignal = /taxsifter|parcel search|property search|property records|search api|assessor search/.test(lower);
  const secondarySalesEvidence = /sale|sales|comparable|transfer history|atip|workbook/.test(lower);
  const officialParcelInventory =
    /parcel inventory|assessor parcel|property inventory|parcel\/property|parcel records|property records/.test(lower) ||
    gisLayer ||
    downloadableExport ||
    searchSignal;

  return {
    officialParcelInventory,
    gisLayer,
    arcgisRest,
    downloadableExport,
    searchOnly: searchSignal && !gisLayer && !arcgisRest && !downloadableExport,
    secondarySalesEvidence
  };
}

function artifactClass(filePath) {
  const lower = String(filePath ?? "").toLowerCase().replaceAll("\\", "/");
  if (/frontend\/|api_or_ui|washingtonlaunchapi|ui/.test(lower)) return "api_ui_reference";
  if (/rollback|backup|supersede|correction|repair|delta|adjudication/.test(lower)) {
    return "reconstruction_or_adjudication_evidence";
  }
  if (
    /authoritative.*parcel.*inventory|parcel.*inventory.*source.*receipt|source.*snapshot.*receipt|parcel.*source.*receipt|parcel.*snapshot/.test(
      lower
    ) &&
    !/sale|sales|comparable|shell/.test(lower)
  ) {
    return "authoritative_parcel_inventory_receipt";
  }
  if (/sale|sales|comparable|transfer|atip|workbook/.test(lower)) return "secondary_sales_or_comparable";
  if (/source-acquisition|source-completeness|source-recapture|identity|repair|closure|delta|adjudication/.test(lower)) {
    return "reconstruction_or_adjudication_evidence";
  }
  if (/county-intelligence|intelligence|analysis|local/.test(lower)) return "local_intelligence_only";
  return "unknown";
}

function artifactSummary(filePath) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
  const exists = fs.existsSync(absolute);
  const sizeBytes = exists ? fs.statSync(absolute).size : null;
  const hashable = exists && sizeBytes <= 2_000_000_000;
  return {
    path: path.isAbsolute(filePath) ? repoRelative(filePath) : filePath.replaceAll(path.sep, "/"),
    exists,
    sizeBytes,
    sha256: hashable ? sha256File(absolute) : null,
    hashStatus: exists ? (hashable ? "sha256_recorded" : "skipped_large_artifact") : "missing",
    artifactClass: artifactClass(filePath)
  };
}

export function classifyInventoryAccess({
  authoritativeParcelReceiptFound,
  gisLayer,
  arcgisRest,
  downloadableExport,
  searchOnly,
  secondarySalesEvidence
}) {
  if (authoritativeParcelReceiptFound) return "authoritative_inventory_receipt_found";
  if (gisLayer || arcgisRest || downloadableExport) return "authoritative_inventory_recapture_candidate";
  if (searchOnly) return "search_only_requires_export_policy";
  if (secondarySalesEvidence) return "secondary_evidence_only";
  return "source_access_unknown";
}

function discoveredFilesForCounty({ county, evidenceRoot }) {
  const regex = countyFileRegex(county);
  return collectFiles(evidenceRoot)
    .filter((file) => regex.test(file))
    .map(repoRelative);
}

function buildCountyRow({ canonicalCounty, crosswalkRow, discoveredFiles }) {
  const row = crosswalkRow ?? {};
  const refs = [
    ...(row.payloadFiles ?? []),
    ...(row.localDataFiles ?? []),
    ...(row.adapterEvidenceFiles ?? []),
    ...(row.evidenceFiles ?? []),
    ...discoveredFiles
  ];
  const artifacts = [...new Set(refs)].map(artifactSummary);
  const signals = detectInventorySignals(row);
  const authoritativeParcelReceiptFound = artifacts.some(
    (artifact) => artifact.artifactClass === "authoritative_parcel_inventory_receipt"
  );
  const inventoryAccess = classifyInventoryAccess({
    authoritativeParcelReceiptFound,
    ...signals
  });
  const certifiable = inventoryAccess === "authoritative_inventory_receipt_found";
  const blockers = [];
  if (!certifiable) {
    blockers.push("No receipt-grade authoritative parcel inventory source proves this county's canonical parcel lineage.");
  }
  if (inventoryAccess === "secondary_evidence_only") {
    blockers.push("Available evidence is sales/comparable-oriented and cannot certify parcel inventory lineage.");
  }
  if (inventoryAccess === "search_only_requires_export_policy") {
    blockers.push("Parcel search surface exists, but governed bulk/export authority is not proven.");
  }
  if (inventoryAccess === "source_access_unknown") {
    blockers.push("No official parcel inventory, GIS layer, ArcGIS REST, export, or search-only path is proven in repo evidence.");
  }

  return {
    county: canonicalCounty.county,
    fips: canonicalCounty.fips,
    officialAssessorBaseUrl: row.officialAssessorBaseUrl ?? null,
    officialParcelInventory: signals.officialParcelInventory || authoritativeParcelReceiptFound,
    gisLayer: signals.gisLayer,
    arcgisRest: signals.arcgisRest,
    downloadableExport: signals.downloadableExport,
    searchOnly: signals.searchOnly,
    certifiable,
    inventoryAccess,
    sourceEvidenceRole: certifiable
      ? "authoritative_parcel_inventory_receipt"
      : "reconstruction_required_before_certification",
    artifacts,
    blockers,
    nextAction: nextActionFor(inventoryAccess),
    certificationAllowed: certifiable,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    databaseMutationAttempted: false
  };
}

function nextActionFor(inventoryAccess) {
  if (inventoryAccess === "authoritative_inventory_receipt_found") {
    return "reconcile_receipt_counts_and_prepare_certification_gate";
  }
  if (inventoryAccess === "authoritative_inventory_recapture_candidate") {
    return "recapture_authoritative_parcel_inventory_source_and_emit_receipt";
  }
  if (inventoryAccess === "search_only_requires_export_policy") {
    return "confirm_export_or_bulk_query_terms_before_capture";
  }
  if (inventoryAccess === "secondary_evidence_only") {
    return "replace_secondary_evidence_with_official_parcel_inventory_source";
  }
  return "research_official_assessor_gis_or_open_data_parcel_inventory_source";
}

export function buildAuthoritativeParcelInventoryReconstruction({ crosswalk, evidenceRoot }) {
  const byCounty = new Map((crosswalk.rows ?? []).map((row) => [row.county, row]));
  const rows = officialWashingtonCountyRows().map((canonicalCounty) =>
    buildCountyRow({
      canonicalCounty,
      crosswalkRow: byCounty.get(canonicalCounty.county),
      discoveredFiles: discoveredFilesForCounty({ county: canonicalCounty.county, evidenceRoot })
    })
  );
  const summary = {
    countiesChecked: rows.length,
    officialParcelInventorySignals: rows.filter((row) => row.officialParcelInventory).length,
    gisLayerSignals: rows.filter((row) => row.gisLayer).length,
    arcgisRestSignals: rows.filter((row) => row.arcgisRest).length,
    downloadableExportSignals: rows.filter((row) => row.downloadableExport).length,
    searchOnlySignals: rows.filter((row) => row.searchOnly).length,
    certifiableCount: rows.filter((row) => row.certifiable).length,
    byInventoryAccess: rows.reduce((acc, row) => {
      acc[row.inventoryAccess] = (acc[row.inventoryAccess] ?? 0) + 1;
      return acc;
    }, {})
  };

  return {
    generatedAt: new Date().toISOString(),
    scope: "Washington 39-county authoritative parcel inventory reconstruction from repository evidence.",
    doctrine: {
      parcelRuntimeSource:
        "Canonical parcels must be backed by official assessor/GIS/open-data parcel inventory sources, not sales/comparable artifacts.",
      productionCertification: "Rows without receipt-grade parcel inventory evidence remain real but not production-certifiable.",
      databaseMutation: "This gate is read-only and performs no database mutation."
    },
    summary,
    rows,
    blockers:
      summary.certifiableCount < rows.length
        ? [`${rows.length - summary.certifiableCount} counties lack receipt-grade authoritative parcel inventory proof.`]
        : [],
    certificationAllowed: summary.certifiableCount === rows.length,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    databaseMutationAttempted: false
  };
}

function renderMarkdown(report) {
  const matrixRows = report.rows
    .map(
      (row) =>
        `| ${row.county} | ${row.fips} | ${row.officialParcelInventory ? "yes" : "no"} | ${row.gisLayer ? "yes" : "no"} | ${row.arcgisRest ? "yes" : "no"} | ${row.downloadableExport ? "yes" : "no"} | ${row.searchOnly ? "yes" : "no"} | ${row.certifiable ? "yes" : "no"} | ${row.inventoryAccess} | ${row.nextAction} |`
    )
    .join("\n");
  const blockers = report.blockers.map((blocker) => `- ${blocker}`).join("\n");

  return `# Washington Authoritative Parcel Inventory Reconstruction

Generated: ${report.generatedAt}

## Doctrine

- Authoritative parcel runtime lineage must come from official assessor/GIS/open-data parcel inventory sources.
- Sales, comparable, and transfer artifacts are secondary evidence only.
- Existing canonical rows may be real, but rows without receipt-grade source evidence are not production-certifiable.
- This gate is read-only. It performs no database mutation and does not allow production binding.

## Summary

- Counties checked: ${report.summary.countiesChecked}
- Official parcel inventory signals: ${report.summary.officialParcelInventorySignals}
- GIS layer signals: ${report.summary.gisLayerSignals}
- ArcGIS REST signals: ${report.summary.arcgisRestSignals}
- Downloadable export signals: ${report.summary.downloadableExportSignals}
- Search-only signals: ${report.summary.searchOnlySignals}
- Certifiable counties: ${report.summary.certifiableCount}
- Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}

## Matrix

| County | FIPS | Official parcel inventory | GIS layer | ArcGIS REST | Downloadable export | Search only | Certifiable | Access posture | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${matrixRows}

## Blockers

${blockers}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    crosswalk: args.get("crosswalk") ?? DEFAULT_CROSSWALK,
    evidenceRoot: args.get("evidence-root") ?? DEFAULT_EVIDENCE_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const report = buildAuthoritativeParcelInventoryReconstruction({
    crosswalk: readJson(paths.crosswalk),
    evidenceRoot: paths.evidenceRoot
  });
  writeJson(paths.outJson, report);
  writeText(paths.outMd, renderMarkdown(report));
  console.log(`Authoritative parcel inventory reconstruction written: ${repoRelative(paths.outJson)}`);
  console.log(`Inventory access: ${JSON.stringify(report.summary.byInventoryAccess)}`);
  console.log(`Certifiable counties: ${report.summary.certifiableCount}/${report.summary.countiesChecked}`);
  console.log(`Production binding allowed: ${report.productionBindingAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
