#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_ADAPTER_REPORT_PATHS = [
  path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-cowlitz-readonly-adapter.latest.json"),
  path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-yakima-readonly-adapter.latest.json"),
  path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-spokane-readonly-adapter.latest.json"),
  path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-clark-readonly-adapter.latest.json"),
  path.join(repoRoot, "os-platform", "core", "pilot", "evidence", "june10-king-readonly-adapter.latest.json")
];
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave-a-adapter-quality-review.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-wave-a-adapter-quality-review.latest.md"
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

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function lower(value) {
  return String(value ?? "").toLowerCase();
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function hasOwnerField(stagingShape) {
  return hasValue(stagingShape?.fields?.ownerName?.sourceField);
}

function hasAddressField(stagingShape) {
  const address = stagingShape?.fields?.situsAddress;
  return hasValue(address?.sourceField) || hasValue(address?.sourceFields);
}

function hasValueField(stagingShape) {
  const value = stagingShape?.fields?.assessedValue;
  return hasValue(value?.sourceField) || hasValue(value?.sourceFields);
}

function missingFieldsFor(report) {
  const missing = [];
  if (!hasOwnerField(report.stagingShape)) missing.push("ownerName");
  if (!hasAddressField(report.stagingShape)) missing.push("situsAddress");
  if (!hasValueField(report.stagingShape)) missing.push("assessedValue");
  return missing;
}

function geometryLimitationsFor(report) {
  return asArray(report.warnings).filter((warning) => {
    const text = lower(warning);
    return text.includes("geometry") || text.includes("polygon") || text.includes("boundary") || text.includes("survey");
  });
}

function termsAccessRiskFor(report) {
  const warnings = asArray(report.warnings);
  const matched = warnings.filter((warning) => {
    const text = lower(warning);
    return (
      text.includes("license") ||
      text.includes("terms") ||
      text.includes("data share") ||
      text.includes("export") ||
      text.includes("permission")
    );
  });

  if (matched.length === 0) {
    return {
      level: "low_public_metadata_risk",
      reasons: []
    };
  }

  return {
    level: "terms_or_access_review_required",
    reasons: matched
  };
}

function stagingContractFor(report) {
  const fields = report.stagingShape?.fields ?? {};
  const requiredFields = ["county", "countyToken", "parcelId", "ownerName", "situsAddress", "assessedValue"];
  const missingContractFields = requiredFields.filter((field) => !(field in fields));
  const consistent =
    report.stagingShape?.schema === "terrafusion-staging-parcel-source-v1" &&
    report.stagingShape?.mode === "contract_only_no_rows_loaded" &&
    hasValue(fields.parcelId?.sourceField) &&
    asArray(report.stagingShape?.rows).length === 0 &&
    missingContractFields.length === 0;

  return {
    consistent,
    schema: report.stagingShape?.schema ?? null,
    mode: report.stagingShape?.mode ?? null,
    missingContractFields
  };
}

function lineageReceiptFor(report) {
  const receipt = report.lineageReceipt ?? {};
  const rawArtifacts = asArray(receipt.rawArtifacts);
  const consistent =
    receipt.receiptVersion === "june10-adapter-verification-v1" &&
    receipt.status === "VERIFIED" &&
    receipt.countyToken === report.countyToken &&
    receipt.dbMutationAllowed === false &&
    receipt.runtimeClaimAllowed === false &&
    Number(receipt.productionRowsWritten ?? 0) === 0 &&
    rawArtifacts.length > 0;

  return {
    consistent,
    receiptVersion: receipt.receiptVersion ?? null,
    status: receipt.status ?? null,
    rawArtifactCount: rawArtifacts.length,
    normalizedArtifact: receipt.normalizedArtifact?.path ?? null
  };
}

function parcelIdentityFor(report) {
  const proven = report.parcelIdentity?.proven === true && hasValue(report.parcelIdentity?.sourceField);
  return {
    proven,
    sourceField: report.parcelIdentity?.sourceField ?? null,
    componentFields: asArray(report.parcelIdentity?.componentFields),
    confidenceLevel: proven ? "high" : "unproven",
    semantics: report.parcelIdentity?.semantics ?? null
  };
}

function loadPathClassificationFor({ missingFields, termsAccessRisk, geometryLimitations }) {
  if (missingFields.length === 0 && termsAccessRisk.level === "low_public_metadata_risk" && geometryLimitations.length === 0) {
    return "load_path_ready";
  }

  if (missingFields.length === 0) {
    return "conditional_load_path_candidate";
  }

  return "identity_ready_only";
}

function buildRow(report) {
  const stagingContract = stagingContractFor(report);
  const lineageReceipt = lineageReceiptFor(report);
  const parcelIdentity = parcelIdentityFor(report);
  const missingFields = missingFieldsFor(report);
  const geometryLimitations = geometryLimitationsFor(report);
  const termsAccessRisk = termsAccessRiskFor(report);
  const loadPathClassification = loadPathClassificationFor({ missingFields, termsAccessRisk, geometryLimitations });

  const blockers = [];
  if (report.adapterStatus !== "verified") blockers.push("Adapter is not verified.");
  if (Number(report.productionRowsWritten ?? 0) !== 0) blockers.push("Adapter wrote production rows.");
  if (report.runtimeClaimAllowed !== false) blockers.push("Adapter verification permits a runtime claim.");
  if (report.dbMutationAllowed !== false) blockers.push("Adapter verification permits DB mutation.");
  if (!stagingContract.consistent) {
    if (stagingContract.schema !== "terrafusion-staging-parcel-source-v1") {
      blockers.push("Staging schema is not terrafusion-staging-parcel-source-v1.");
    }
    if (stagingContract.mode !== "contract_only_no_rows_loaded") {
      blockers.push("Staging mode is not contract_only_no_rows_loaded.");
    }
    for (const field of stagingContract.missingContractFields) {
      blockers.push(`Staging contract is missing ${field}.`);
    }
  }
  if (!lineageReceipt.consistent) blockers.push("Lineage receipt shape is inconsistent.");
  if (!parcelIdentity.proven) blockers.push("Parcel ID semantics are not proven.");

  return {
    county: report.county,
    countyToken: report.countyToken,
    adapterId: report.adapterId,
    adapterStatus: report.adapterStatus,
    sourceType: report.sourceType ?? null,
    accessMethod: report.accessMethod ?? null,
    expectedExportFormat: report.expectedExportFormat ?? null,
    productionRowsWritten: Number(report.productionRowsWritten ?? 0),
    runtimeClaimAllowed: report.runtimeClaimAllowed === true,
    dbMutationAllowed: report.dbMutationAllowed === true,
    stagingContract,
    lineageReceipt,
    parcelIdentity,
    missingFields,
    termsAccessRisk,
    geometryLimitations,
    loadPathClassification,
    warnings: asArray(report.warnings),
    blockers
  };
}

function sortRows(rows) {
  return [...rows].sort((a, b) => a.county.localeCompare(b.county));
}

export function buildWaveAAdapterQualityReview({ adapterReports, generatedAtUtc = new Date().toISOString() }) {
  const rows = sortRows(asArray(adapterReports).map(buildRow));
  const runtimeClaimAllowed = rows.some((row) => row.runtimeClaimAllowed);
  const dbMutationAllowed = rows.some((row) => row.dbMutationAllowed);
  const stagingContractConsistent = rows.every((row) => row.stagingContract.consistent);
  const lineageReceiptConsistent = rows.every((row) => row.lineageReceipt.consistent);
  const blockers = rows.flatMap((row) => row.blockers.map((blocker) => `${row.county}: ${blocker}`));

  return {
    generatedAtUtc,
    slice: "Wave A 5-Adapter Quality Review",
    summary: {
      reviewedAdapters: rows.length,
      countiesReviewed: rows.map((row) => row.county),
      verifiedAdapters: rows.filter((row) => row.adapterStatus === "verified").length,
      runtimeClaimAllowed,
      dbMutationAllowed,
      stagingContractConsistent,
      lineageReceiptConsistent,
      highConfidenceParcelIdentity: rows.filter((row) => row.parcelIdentity.confidenceLevel === "high").length,
      missingOwnerFields: rows.filter((row) => row.missingFields.includes("ownerName")).length,
      missingAddressFields: rows.filter((row) => row.missingFields.includes("situsAddress")).length,
      missingValueFields: rows.filter((row) => row.missingFields.includes("assessedValue")).length,
      termsOrAccessReviewRequired: rows.filter((row) => row.termsAccessRisk.level === "terms_or_access_review_required").length,
      geometryLimitations: rows.filter((row) => row.geometryLimitations.length > 0).length,
      loadPathReady: rows.filter((row) => row.loadPathClassification === "load_path_ready").length,
      conditionalLoadPathCandidates: rows.filter((row) => row.loadPathClassification === "conditional_load_path_candidate").length,
      identityReadyOnly: rows.filter((row) => row.loadPathClassification === "identity_ready_only").length
    },
    rules: [
      "No new county expansion in this slice.",
      "No production DB mutation.",
      "No runtime claim.",
      "Verified means read-only metadata/schema adapter verification only.",
      "Load-path classification does not authorize data capture or product runtime registration."
    ],
    rows,
    blockers,
    passed: blockers.length === 0 && rows.length === 5
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Wave A 5-Adapter Quality Review",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    "## Summary",
    "",
    `- Reviewed adapters: ${report.summary.reviewedAdapters}`,
    `- Verified adapters: ${report.summary.verifiedAdapters}`,
    `- Runtime claim allowed: ${report.summary.runtimeClaimAllowed}`,
    `- DB mutation allowed: ${report.summary.dbMutationAllowed}`,
    `- Staging contract consistent: ${report.summary.stagingContractConsistent}`,
    `- Lineage receipt consistent: ${report.summary.lineageReceiptConsistent}`,
    `- High-confidence parcel identity: ${report.summary.highConfidenceParcelIdentity}`,
    `- Conditional load-path candidates: ${report.summary.conditionalLoadPathCandidates}`,
    `- Identity-ready only: ${report.summary.identityReadyOnly}`,
    `- Passed: ${report.passed}`,
    "",
    "## County Review",
    "",
    "| County | Parcel ID | Confidence | Missing fields | Terms/access risk | Geometry limitations | Classification |",
    "|---|---|---:|---|---|---:|---|",
    ...report.rows.map((row) =>
      [
        row.county,
        row.parcelIdentity.sourceField ?? "unproven",
        row.parcelIdentity.confidenceLevel,
        row.missingFields.length ? row.missingFields.join(", ") : "none",
        row.termsAccessRisk.level,
        String(row.geometryLimitations.length),
        row.loadPathClassification
      ].join(" | ")
    ),
    "",
    "## Limitations",
    "",
    ...report.rows.flatMap((row) => [
      `### ${row.county}`,
      "",
      `- Parcel semantics: ${row.parcelIdentity.semantics ?? "unproven"}`,
      `- Missing fields: ${row.missingFields.length ? row.missingFields.join(", ") : "none"}`,
      `- Terms/access: ${row.termsAccessRisk.reasons.length ? row.termsAccessRisk.reasons.join(" ") : row.termsAccessRisk.level}`,
      `- Geometry: ${row.geometryLimitations.length ? row.geometryLimitations.join(" ") : "No geometry limitation captured in verification receipt."}`,
      `- Classification: ${row.loadPathClassification}`,
      ""
    ]),
    "## Rules",
    "",
    ...report.rules.map((rule) => `- ${rule}`),
    "",
    "## Blockers",
    "",
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ["- none"])
  ];

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const options = {
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    adapterReportPaths: DEFAULT_ADAPTER_REPORT_PATHS
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out-json") {
      options.outJson = path.resolve(argv[++i]);
    } else if (arg === "--out-md") {
      options.outMd = path.resolve(argv[++i]);
    } else if (arg === "--adapter-report") {
      options.adapterReportPaths.push(path.resolve(argv[++i]));
    }
  }

  return options;
}

export function runWaveAAdapterQualityReview({
  adapterReportPaths = DEFAULT_ADAPTER_REPORT_PATHS,
  outJson = DEFAULT_OUT_JSON,
  outMd = DEFAULT_OUT_MD,
  generatedAtUtc = new Date().toISOString()
} = {}) {
  const adapterReports = adapterReportPaths.map(readJson);
  const report = buildWaveAAdapterQualityReview({ adapterReports, generatedAtUtc });
  writeJson(outJson, report);
  writeText(outMd, renderMarkdown(report));
  return report;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = runWaveAAdapterQualityReview(options);
  console.log(
    JSON.stringify(
      {
        reviewedAdapters: report.summary.reviewedAdapters,
        conditionalLoadPathCandidates: report.summary.conditionalLoadPathCandidates,
        identityReadyOnly: report.summary.identityReadyOnly,
        passed: report.passed
      },
      null,
      2
    )
  );

  if (!report.passed) {
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
