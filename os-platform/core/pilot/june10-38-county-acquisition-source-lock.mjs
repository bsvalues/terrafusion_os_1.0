#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_COVERAGE = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "washington-39-county-coverage.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-acquisition-source-lock.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-38-county-acquisition-source-lock.latest.md"
);

const DEFAULT_WAVE_A_COUNTIES = [
  "Clark",
  "King",
  "Spokane",
  "Yakima",
  "Snohomish",
  "Cowlitz",
  "Grant",
  "Whatcom",
  "Pierce",
  "Kitsap"
];

const CURATED_SOURCE_URLS = {
  Cowlitz: [
    "https://cowlitzinfo.net/cowlitzpropertyapp/cowlitzpropertyapp/zoner/index",
    "https://gis.cowlitzwa.gov/ccportal/apps/webappviewer/index.html?id=848eadafa8ba4566a6a6370a4294c5e2",
    "https://gis.cowlitzwa.gov/ccportal/apps/webappviewer/index.html?id=3b7b5f787ccc46e9bd8c144d998991ae"
  ],
  Yakima: ["https://property.spatialest.com/wa/yakima#/"]
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function countyLookup(coverage) {
  const map = new Map();
  for (const row of asArray(coverage?.counties)) {
    map.set(row.county, row);
  }
  return map;
}

function dedupe(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim()))];
}

function sourceUrlsFor(row) {
  return dedupe([
    ...(CURATED_SOURCE_URLS[row.county] ?? []),
    row.officialAssessorBaseUrl,
    row.primarySalesSource && /^https?:\/\//i.test(row.primarySalesSource) ? row.primarySalesSource : null,
    row.fallbackSource && /^https?:\/\//i.test(row.fallbackSource) ? row.fallbackSource : null,
    row.gisMapSurface && /^https?:\/\//i.test(row.gisMapSurface) ? row.gisMapSurface : null
  ]);
}

function sourceDecisionStatusFor(row, urls) {
  if ((CURATED_SOURCE_URLS[row.county] ?? []).length > 0) return "source_locked";
  if (urls.length > 0 && row.status === "adapter-ready") return "source_candidate_locked";
  return "source_decision_required";
}

function buildSourceLock(row) {
  const sourceUrls = sourceUrlsFor(row);
  const sourceDecisionStatus = sourceDecisionStatusFor(row, sourceUrls);

  return {
    county: row.county,
    countyToken: normalize(row.county),
    state: "WA",
    priority: row.priority ?? "P2",
    registryStatus: row.status ?? "unknown",
    acquisitionFamily: row.acquisitionFamily ?? "Unknown",
    sourceDecisionStatus,
    sourceUrls,
    sourceLabels: {
      officialAssessorBaseUrl: row.officialAssessorBaseUrl ?? null,
      primarySalesSource: row.primarySalesSource ?? null,
      fallbackSource: row.fallbackSource ?? null,
      gisMapSurface: row.gisMapSurface ?? null
    },
    requiredRawArtifacts: [
      "parcel_or_property_export",
      "sales_or_transfer_export_if_available",
      "gis_or_parcel_identity_crosswalk_if_available"
    ],
    receiptTarget: `evidence/june10-38-county-seed/${normalize(row.county)}/source-snapshot-receipt.json`,
    nextAction: "capture_source_snapshot",
    runtimeClaimAllowed: false,
    stopConditions: [
      "source content is sample, demo, or synthetic",
      "county identity cannot be proven from source content",
      "raw artifact hash or capturedAtUtc timestamp is missing",
      "source requires storing a secret, cookie, bearer token, or password",
      "normalized artifact is not TerraFusion-owned"
    ]
  };
}

export function buildAcquisitionSourceLockPack({
  coverage,
  waveACounties = DEFAULT_WAVE_A_COUNTIES,
  generatedAtUtc = new Date().toISOString()
}) {
  const lookup = countyLookup(coverage);
  const sourceLocks = waveACounties
    .filter((county) => county !== "Benton")
    .map((county) => lookup.get(county))
    .filter(Boolean)
    .map(buildSourceLock)
    .sort((a, b) => a.county.localeCompare(b.county));

  const missingCounties = waveACounties.filter((county) => county !== "Benton" && !lookup.has(county));

  return {
    generatedAtUtc,
    sourceCoverageGeneratedAtUtc: coverage?.generatedAtUtc ?? null,
    slice: "38-County Acquisition Source Lock",
    summary: {
      requestedWaveACounties: waveACounties.length,
      countiesLocked: sourceLocks.length,
      sourceLocked: sourceLocks.filter((lock) => lock.sourceDecisionStatus === "source_locked").length,
      sourceCandidateLocked: sourceLocks.filter((lock) => lock.sourceDecisionStatus === "source_candidate_locked").length,
      sourceDecisionRequired: sourceLocks.filter((lock) => lock.sourceDecisionStatus === "source_decision_required").length,
      missingCounties: missingCounties.length,
      bentonExcluded: true,
      runtimeClaimAllowed: false
    },
    claimRules: {
      runtimeClaimAllowed: false,
      allowedClaims: ["source lock ready for snapshot capture", "acquisition work in progress"],
      forbiddenClaims: [
        "runtime-ready",
        "full county data loaded",
        "official county-certified valuation",
        "CostForge official calibration",
        "statewide production data ready"
      ]
    },
    sourceLocks,
    missingCounties,
    rules: [
      "This source lock is not a receipt.",
      "This source lock does not certify runtime readiness.",
      "Each county still needs raw artifact capture, SHA-256 hash, normalized TerraFusion artifact, DB load proof, API proof, and UI smoke before runtime promotion.",
      "Benton remains on the certification track; this pack advances parallel acquisition only."
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 38-County Acquisition Source Lock",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    "## Summary",
    "",
    `- Requested Wave A counties: ${report.summary.requestedWaveACounties}`,
    `- Counties locked: ${report.summary.countiesLocked}`,
    `- Source locked: ${report.summary.sourceLocked}`,
    `- Source candidates locked: ${report.summary.sourceCandidateLocked}`,
    `- Source decision required: ${report.summary.sourceDecisionRequired}`,
    `- Missing counties: ${report.summary.missingCounties}`,
    `- Benton excluded: ${report.summary.bentonExcluded}`,
    `- Runtime claim allowed: ${report.summary.runtimeClaimAllowed}`,
    "",
    "## Source Locks",
    "",
    "| County | Status | Family | Source URLs | Next action | Receipt target |",
    "|---|---|---|---|---|---|"
  ];

  for (const lock of report.sourceLocks) {
    lines.push(
      [
        lock.county,
        lock.sourceDecisionStatus,
        lock.acquisitionFamily,
        lock.sourceUrls.map((url) => `<${url}>`).join("<br>") || "-",
        lock.nextAction,
        `\`${lock.receiptTarget}\``
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

  if (report.missingCounties.length > 0) {
    lines.push("", "## Missing Counties", "");
    report.missingCounties.forEach((county) => lines.push(`- ${county}`));
  }

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    coveragePath: DEFAULT_COVERAGE,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--coverage") args.coveragePath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function runAcquisitionSourceLockPack(options = {}) {
  const args = {
    coveragePath: DEFAULT_COVERAGE,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true,
    ...options
  };
  const report = buildAcquisitionSourceLockPack({
    coverage: readJson(args.coveragePath)
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
  const report = runAcquisitionSourceLockPack(args);
  console.log(JSON.stringify(report.summary, null, 2));
}
