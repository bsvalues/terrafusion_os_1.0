#!/usr/bin/env node

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
  "june10-38-county-adapter-contract-matrix.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-adapter-contract-matrix.latest.md"
);
const DEFAULT_ADAPTER_VERIFICATION_PATHS = [
  path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-cowlitz-readonly-adapter.latest.json"),
  path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-yakima-readonly-adapter.latest.json"),
  path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-spokane-readonly-adapter.latest.json"),
  path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-clark-readonly-adapter.latest.json"),
  path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-king-readonly-adapter.latest.json")
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function includesAny(value, needles) {
  const text = String(value ?? "").toLowerCase();
  return needles.some((needle) => text.includes(needle));
}

function joinedLabels(lock) {
  return [
    lock.acquisitionFamily,
    lock.sourceLabels?.primarySalesSource,
    lock.sourceLabels?.fallbackSource,
    lock.sourceLabels?.gisMapSurface,
    ...asArray(lock.sourceUrls)
  ].join(" ");
}

function sourceTypeFor(lock) {
  const text = joinedLabels(lock);
  if (includesAny(text, ["spatialest"])) return "spatialest_property_portal";
  if (includesAny(text, ["open data", "downloadable", "weekly downloadable", "txt data"])) {
    return "downloadable_assessor_export_plus_parcel_history";
  }
  if (includesAny(text, ["gis", "webappviewer", "mapsonline", "publicgis", "scopi", "map"])) {
    return "county_property_portal_plus_gis";
  }
  if (includesAny(text, ["monthly"])) return "published_monthly_report";
  return "county_property_portal";
}

function accessMethodFor(sourceType) {
  switch (sourceType) {
    case "downloadable_assessor_export_plus_parcel_history":
    case "published_monthly_report":
      return "download_snapshot";
    case "spatialest_property_portal":
    case "county_property_portal_plus_gis":
    case "county_property_portal":
    default:
      return "manual_snapshot_or_playwright_capture";
  }
}

function expectedFormatFor(sourceType) {
  switch (sourceType) {
    case "downloadable_assessor_export_plus_parcel_history":
      return "txt_csv_or_fixed_width_download";
    case "published_monthly_report":
      return "pdf_xlsx_csv_or_html_report";
    case "county_property_portal_plus_gis":
      return "html_or_json_network_capture_plus_optional_gis_layer";
    case "spatialest_property_portal":
    case "county_property_portal":
    default:
      return "html_or_json_network_capture";
  }
}

function parcelIdentifierFieldFor(sourceType) {
  if (sourceType === "downloadable_assessor_export_plus_parcel_history") {
    return "parcel_number_or_tax_account_id";
  }
  return "parcel_id_or_account_number";
}

function ownerAddressValueFieldsFor(lock) {
  const text = joinedLabels(lock);
  const fields = ["owner_name_if_available", "situs_address_if_available", "assessed_value_if_available"];
  if (includesAny(text, ["sales", "sale", "transfer", "conveyance"])) {
    fields.push("sale_date_if_available", "sale_price_if_available");
  }
  if (includesAny(text, ["gis", "map", "spatialest"])) {
    fields.push("geometry_or_map_reference_if_available");
  }
  return fields;
}

function updateCadenceFor(lock) {
  const text = joinedLabels(lock);
  if (includesAny(text, ["weekly"])) return "weekly_if_download_available";
  if (includesAny(text, ["monthly"])) return "monthly_if_report_available";
  if (includesAny(text, ["current sales", "sales search", "search"])) return "on_demand_snapshot";
  return "unknown_until_receipt";
}

function licenseTermsRiskFor(lock, sourceType) {
  if (lock.sourceDecisionStatus !== "source_locked") return "medium_terms_review_required";
  if (sourceType === "downloadable_assessor_export_plus_parcel_history") return "medium_terms_review_required";
  return "low_public_portal_terms_review_required";
}

function normalizeCountyToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validVerificationFor(lock, verification) {
  if (!verification) return false;
  const verificationToken = verification.countyToken ?? normalizeCountyToken(verification.county);
  return (
    verificationToken === lock.countyToken &&
    verification.adapterStatus === "verified" &&
    verification.runtimeClaimAllowed === false &&
    verification.dbMutationAllowed === false &&
    Number(verification.productionRowsWritten ?? 0) === 0 &&
    verification.parcelIdentity?.proven === true &&
    asArray(verification.blockers).length === 0
  );
}

function adapterStatusFor(lock, verification) {
  if (validVerificationFor(lock, verification)) return "verified";
  if (lock.sourceDecisionStatus === "source_locked" || lock.sourceDecisionStatus === "source_candidate_locked") {
    return "candidate";
  }
  return "none";
}

function buildRow(lock, verification) {
  const sourceType = sourceTypeFor(lock);
  const verified = validVerificationFor(lock, verification);
  return {
    county: lock.county,
    countyToken: lock.countyToken,
    sourceDecisionStatus: lock.sourceDecisionStatus,
    sourceType,
    accessMethod: accessMethodFor(sourceType),
    expectedExportFormat: expectedFormatFor(sourceType),
    parcelIdentifierField: verified ? verification.parcelIdentity.sourceField : parcelIdentifierFieldFor(sourceType),
    ownerAddressValueFields: ownerAddressValueFieldsFor(lock),
    updateCadence: updateCadenceFor(lock),
    licenseTermsRisk: licenseTermsRiskFor(lock, sourceType),
    adapterStatus: adapterStatusFor(lock, verification),
    verification: verified
      ? {
          adapterId: verification.adapterId,
          generatedAtUtc: verification.generatedAtUtc ?? null,
          parcelIdentifierField: verification.parcelIdentity?.sourceField ?? null,
          lineageReceiptVersion: verification.lineageReceipt?.receiptVersion ?? null
        }
      : null,
    sourceUrls: asArray(lock.sourceUrls),
    receiptTarget: lock.receiptTarget,
    runtimeClaimAllowed: false,
    dbMutationAllowed: false
  };
}

export function buildAdapterContractMatrix({
  sourceLockPack,
  adapterVerificationReports = [],
  generatedAtUtc = new Date().toISOString()
}) {
  const verificationByCounty = new Map(
    asArray(adapterVerificationReports).map((report) => [
      report.countyToken ?? normalizeCountyToken(report.county),
      report
    ])
  );
  const rows = asArray(sourceLockPack?.sourceLocks).map((lock) => buildRow(lock, verificationByCounty.get(lock.countyToken)));

  return {
    generatedAtUtc,
    sourceLockGeneratedAtUtc: sourceLockPack?.generatedAtUtc ?? null,
    slice: "38-County Adapter Contract Matrix",
    summary: {
      counties: rows.length,
      candidateAdapters: rows.filter((row) => row.adapterStatus === "candidate").length,
      implementedAdapters: rows.filter((row) => row.adapterStatus === "implemented").length,
      verifiedAdapters: rows.filter((row) => row.adapterStatus === "verified").length,
      runtimeClaimAllowed: false,
      dbMutationAllowed: false
    },
    claimRules: {
      runtimeClaimAllowed: false,
      dbMutationAllowed: false,
      allowedClaims: [
        "adapter contract candidate defined",
        "adapter verified when verification receipt is present",
        "source snapshot can be captured under receipt rules"
      ],
      forbiddenClaims: [
        "runtime-ready",
        "full county data loaded",
        "official county-certified valuation",
        "adapter verified without verification receipt",
        "database loaded"
      ]
    },
    rows,
    rules: [
      "No runtime claims.",
      "No DB mutation.",
      "No scraping beyond allowed source behavior.",
      "Adapter status remains candidate until a receipt proves raw capture, normalized artifact, and contract verification.",
      "License and terms risk must be resolved before automated capture or load."
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 38-County Adapter Contract Matrix",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    "## Summary",
    "",
    `- Counties: ${report.summary.counties}`,
    `- Candidate adapters: ${report.summary.candidateAdapters}`,
    `- Implemented adapters: ${report.summary.implementedAdapters}`,
    `- Verified adapters: ${report.summary.verifiedAdapters}`,
    `- Runtime claim allowed: ${report.summary.runtimeClaimAllowed}`,
    `- DB mutation allowed: ${report.summary.dbMutationAllowed}`,
    "",
    "## Matrix",
    "",
    "| County | Source type | Access method | Expected format | Parcel ID | Owner/address/value fields | Cadence | Terms risk | Adapter status |",
    "|---|---|---|---|---|---|---|---|---|"
  ];

  for (const row of report.rows) {
    lines.push(
      [
        row.county,
        row.sourceType,
        row.accessMethod,
        row.expectedExportFormat,
        row.parcelIdentifierField,
        row.ownerAddressValueFields.join("<br>"),
        row.updateCadence,
        row.licenseTermsRisk,
        row.adapterStatus
      ].join(" | ")
    );
  }

  lines.push("", "## Claim Rules", "");
  lines.push("Allowed:");
  report.claimRules.allowedClaims.forEach((claim) => lines.push(`- ${claim}`));
  lines.push("", "Forbidden:");
  report.claimRules.forbiddenClaims.forEach((claim) => lines.push(`- ${claim}`));

  lines.push("", "## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    sourceLockPath: DEFAULT_SOURCE_LOCK,
    adapterVerificationPaths: DEFAULT_ADAPTER_VERIFICATION_PATHS,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source-lock") args.sourceLockPath = path.resolve(argv[++i]);
    else if (arg === "--adapter-verification") args.adapterVerificationPaths = [path.resolve(argv[++i])];
    else if (arg === "--no-adapter-verification") args.adapterVerificationPaths = [];
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

function readAdapterVerificationReports(paths) {
  return asArray(paths)
    .filter((filePath) => fs.existsSync(filePath))
    .map((filePath) => readJson(filePath));
}

export function runAdapterContractMatrix(options = {}) {
  const args = {
    sourceLockPath: DEFAULT_SOURCE_LOCK,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    adapterVerificationPaths: DEFAULT_ADAPTER_VERIFICATION_PATHS,
    write: true,
    ...options
  };

  const report = buildAdapterContractMatrix({
    sourceLockPack: readJson(args.sourceLockPath),
    adapterVerificationReports:
      args.adapterVerificationReports ?? readAdapterVerificationReports(args.adapterVerificationPaths)
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.mkdirSync(path.dirname(args.outMd), { recursive: true });
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const args = parseArgs(process.argv.slice(2));
  const report = runAdapterContractMatrix(args);
  console.log(JSON.stringify(report.summary, null, 2));
}
