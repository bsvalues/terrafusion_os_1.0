#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateCountyAuthorization } from "./june10-production-ingestion-authorization-policy.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_ADAPTER_REPORT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-yakima-readonly-adapter.latest.json"
);
const DEFAULT_AUTHORIZATION_POLICY = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-production-ingestion-authorization-policy.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-yakima-dry-run-row-validation.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-yakima-dry-run-row-validation.latest.md"
);
const DEFAULT_REJECTED_ROWS_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-yakima-rejected-row-report.latest.json"
);
const DEFAULT_LINEAGE_RECEIPT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-yakima-dry-run-lineage-receipt.latest.json"
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

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : stableJson(value)).digest("hex");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function roundPercent(value) {
  return Number(value.toFixed(4));
}

function yakimaPolicyFrom(authorizationPolicy) {
  return asArray(authorizationPolicy?.counties).find((county) => county.countyToken === "yakima") ?? null;
}

function metadataFieldNames(adapterReport) {
  return asArray(adapterReport?.parcelIdentity?.proof?.fieldIds).filter((field) => String(field).trim() !== "");
}

function sourceFieldsFrom(stagingField) {
  if (!stagingField) return [];
  if (Array.isArray(stagingField.sourceFields)) return stagingField.sourceFields;
  if (stagingField.sourceField) return [stagingField.sourceField];
  return [];
}

function validateSchema(adapterReport) {
  const fields = adapterReport?.stagingShape?.fields ?? {};
  const available = new Set(metadataFieldNames(adapterReport).map((field) => String(field).toUpperCase()));
  const requiredSourceFields = [
    ...sourceFieldsFrom(fields.parcelId),
    ...sourceFieldsFrom(fields.ownerName),
    ...sourceFieldsFrom(fields.situsAddress),
    ...sourceFieldsFrom(fields.assessedValue),
    ...sourceFieldsFrom(fields.landArea),
    ...sourceFieldsFrom(fields.propertyUse)
  ];
  const missingSourceFields = requiredSourceFields.filter((field) => !available.has(String(field).toUpperCase()));

  return {
    schema: adapterReport?.stagingShape?.schema ?? null,
    schemaValid:
      adapterReport?.stagingShape?.schema === "terrafusion-staging-parcel-source-v1" &&
      adapterReport?.stagingShape?.mode === "contract_only_no_rows_loaded" &&
      missingSourceFields.length === 0,
    requiredSourceFields,
    missingSourceFields
  };
}

export function validateYakimaRows({ rows = [], parcelIdField = "parcel_number" } = {}) {
  const seen = new Set();
  const rejectedRows = [];
  let rowsAccepted = 0;
  let presentParcelIds = 0;
  let duplicateParcelIds = 0;

  rows.forEach((row, index) => {
    const value = String(row?.[parcelIdField] ?? "").trim();
    if (!value) {
      rejectedRows.push({
        rowIndex: index,
        reasonCode: "MISSING_SOURCE_PARCEL_ID",
        message: `${parcelIdField} is required for Yakima dry-run validation.`
      });
      return;
    }

    presentParcelIds += 1;
    if (seen.has(value)) {
      duplicateParcelIds += 1;
      rejectedRows.push({
        rowIndex: index,
        reasonCode: "DUPLICATE_SOURCE_PARCEL_ID",
        sourceParcelId: value,
        message: `${parcelIdField} must be unique within the dry-run batch.`
      });
      return;
    }

    seen.add(value);
    rowsAccepted += 1;
  });

  const rowsExamined = rows.length;
  return {
    rowsExamined,
    rowsAccepted,
    rowsRejected: rejectedRows.length,
    parcelIdPresencePercent: rowsExamined === 0 ? null : roundPercent((presentParcelIds / rowsExamined) * 100),
    duplicateParcelIds,
    rejectedRows
  };
}

function buildRejectedRowReport({ generatedAtUtc, rowValidation, extractionBlockedByTerms }) {
  return {
    reportVersion: "june10-yakima-rejected-row-report-v1",
    county: "Yakima",
    countyToken: "yakima",
    generatedAtUtc,
    summary: {
      rowsExamined: rowValidation.rowsExamined,
      rowsAccepted: rowValidation.rowsAccepted,
      rowsRejected: rowValidation.rowsRejected,
      duplicateParcelIds: rowValidation.duplicateParcelIds
    },
    batchRejections: extractionBlockedByTerms
      ? [
          {
            reasonCode: "TERMS_LICENSE_NOT_APPROVED",
            message: "Spatialest row extraction is blocked until Yakima terms/licensing approval is explicit."
          }
        ]
      : [],
    rejectedRows: rowValidation.rejectedRows
  };
}

function buildDryRunLineageReceipt({ generatedAtUtc, adapterReport, schemaValidation, rowValidation, rejectedRowReport }) {
  return {
    receiptVersion: "june10-yakima-dry-run-lineage-v1",
    status: "DRY_RUN_BLOCKED_PENDING_TERMS",
    county: "Yakima",
    countyToken: "yakima",
    generatedAtUtc,
    sourceAdapterReceiptSha256: sha256(adapterReport?.lineageReceipt ?? {}),
    schemaValidationSha256: sha256(schemaValidation),
    rejectedRowReportSha256: sha256(rejectedRowReport),
    counts: {
      sourceRowsExamined: rowValidation.rowsExamined,
      sourceRowsAccepted: rowValidation.rowsAccepted,
      sourceRowsRejected: rowValidation.rowsRejected,
      duplicateParcelIds: rowValidation.duplicateParcelIds,
      productionRowsWritten: 0
    },
    runtimeClaimAllowed: false,
    dbMutationAllowed: false,
    featureQueryAttempted: false,
    sourceBehavior: "metadata_config_only_no_feature_query"
  };
}

export function buildYakimaDryRunRowValidation({
  adapterReport,
  authorizationPolicy,
  generatedAtUtc = new Date().toISOString(),
  rows = []
}) {
  const blockers = [];
  const policy = yakimaPolicyFrom(authorizationPolicy);
  const termsState = policy?.termsLicensingApproval?.state ?? "unknown";
  const extractionBlockedByTerms = termsState !== "approved";
  const schemaValidation = validateSchema(adapterReport);
  const rowValidation = validateYakimaRows({
    rows: extractionBlockedByTerms ? [] : rows,
    parcelIdField: adapterReport?.parcelIdentity?.sourceField ?? "parcel_number"
  });
  const rejectedRowReport = buildRejectedRowReport({ generatedAtUtc, rowValidation, extractionBlockedByTerms });
  const dryRunLineageReceipt = buildDryRunLineageReceipt({
    generatedAtUtc,
    adapterReport,
    schemaValidation,
    rowValidation,
    rejectedRowReport
  });

  if (adapterReport?.countyToken !== "yakima") blockers.push("Adapter report is not for Yakima.");
  if (adapterReport?.adapterStatus !== "verified") blockers.push("Yakima adapter is not verified.");
  if (adapterReport?.runtimeClaimAllowed !== false) blockers.push("Yakima adapter permits runtime claim.");
  if (adapterReport?.dbMutationAllowed !== false) blockers.push("Yakima adapter permits DB mutation.");
  if (!schemaValidation.schemaValid) blockers.push("Yakima staging schema or source fields are not valid.");

  const authorization = evaluateCountyAuthorization({
    termsLicensingApproved: termsState === "approved",
    evidence: {
      verifiedReadOnlyAdapterReceipt: adapterReport?.adapterStatus === "verified",
      conditionalLoadPathDesignReceipt: true,
      rowValidationReceipt: true,
      rollbackPlanReceipt: false,
      projectionApprovalReceipt: false,
      runtimeRegistrationApprovalReceipt: false
    },
    validationMetrics: {
      sourceParcelIdPresentPercent: rowValidation.parcelIdPresencePercent,
      duplicateParcelIdPercent: rowValidation.duplicateParcelIds,
      rejectedRowsPercent:
        rowValidation.rowsExamined === 0 ? Number.POSITIVE_INFINITY : (rowValidation.rowsRejected / rowValidation.rowsExamined) * 100,
      lineageReceiptCoveragePercent: rowValidation.rowsExamined === 0 ? null : 100,
      dryRunProductionRowsWritten: 0
    }
  });

  return {
    generatedAtUtc,
    slice: "Yakima Dry-Run Row Validation",
    county: "Yakima",
    countyToken: "yakima",
    termsLicensing: {
      state: termsState,
      source: "june10-production-ingestion-authorization-policy",
      featureExtractionAllowed: termsState === "approved"
    },
    extraction: {
      mode: extractionBlockedByTerms ? "metadata_config_only_no_feature_query" : "provided_rows_dry_run_only",
      allowedSourceBehavior: "Use existing verified Spatialest config metadata and local/provided rows only; do not query parcel features or download exports.",
      featureQueryAttempted: false,
      rowsFetched: extractionBlockedByTerms ? 0 : rows.length,
      productionRowsWritten: 0
    },
    validation: {
      ...schemaValidation,
      rowsExamined: rowValidation.rowsExamined,
      rowsAccepted: rowValidation.rowsAccepted,
      rowsRejected: rowValidation.rowsRejected,
      parcelIdField: adapterReport?.parcelIdentity?.sourceField ?? "parcel_number",
      parcelIdPresencePercent: rowValidation.parcelIdPresencePercent,
      duplicateParcelIds: rowValidation.duplicateParcelIds,
      productionRowsWritten: 0
    },
    rejectedRowReport,
    dryRunLineageReceipt,
    authorization,
    blockers,
    rules: [
      "No production DB write.",
      "No runtime promotion.",
      "No feature query or export download while terms/licensing state is not approved.",
      "Load authorization remains blocked unless every required receipt exists."
    ],
    passed: blockers.length === 0
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Yakima Dry-Run Row Validation",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    "## Summary",
    "",
    `- Terms/licensing state: ${report.termsLicensing.state}`,
    `- Feature query attempted: ${report.extraction.featureQueryAttempted}`,
    `- Extraction mode: ${report.extraction.mode}`,
    `- Rows fetched: ${report.extraction.rowsFetched}`,
    `- Rows examined: ${report.validation.rowsExamined}`,
    `- Parcel ID field: ${report.validation.parcelIdField}`,
    `- Parcel ID presence: ${report.validation.parcelIdPresencePercent}`,
    `- Duplicate parcel IDs: ${report.validation.duplicateParcelIds}`,
    `- Production rows written: ${report.validation.productionRowsWritten}`,
    `- Authorized for production load: ${report.authorization.authorizedForProductionLoad}`,
    `- Authorized for projection: ${report.authorization.authorizedForProjection}`,
    `- Authorized for runtime registration: ${report.authorization.authorizedForRuntimeRegistration}`,
    `- Passed: ${report.passed}`,
    "",
    "## Rejected Row Report",
    "",
    `- Version: ${report.rejectedRowReport.reportVersion}`,
    `- Rows rejected: ${report.rejectedRowReport.summary.rowsRejected}`,
    `- Batch rejections: ${report.rejectedRowReport.batchRejections.length}`,
    ...report.rejectedRowReport.batchRejections.map((rejection) => `- ${rejection.reasonCode}: ${rejection.message}`),
    "",
    "## Dry-Run Lineage Receipt",
    "",
    `- Version: ${report.dryRunLineageReceipt.receiptVersion}`,
    `- Status: ${report.dryRunLineageReceipt.status}`,
    `- Runtime claim allowed: ${report.dryRunLineageReceipt.runtimeClaimAllowed}`,
    `- DB mutation allowed: ${report.dryRunLineageReceipt.dbMutationAllowed}`,
    "",
    "## Authorization Blockers",
    "",
    ...(report.authorization.blockers.length ? report.authorization.blockers.map((blocker) => `- ${blocker}`) : ["- none"]),
    "",
    "## Rules",
    "",
    ...report.rules.map((rule) => `- ${rule}`),
    "",
    "## Gate Blockers",
    "",
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ["- none"])
  ];

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const options = {
    adapterReportPath: DEFAULT_ADAPTER_REPORT,
    authorizationPolicyPath: DEFAULT_AUTHORIZATION_POLICY,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    rejectedRowsJson: DEFAULT_REJECTED_ROWS_JSON,
    lineageReceiptJson: DEFAULT_LINEAGE_RECEIPT_JSON
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--adapter-report") {
      options.adapterReportPath = path.resolve(argv[++i]);
    } else if (arg === "--authorization-policy") {
      options.authorizationPolicyPath = path.resolve(argv[++i]);
    } else if (arg === "--out-json") {
      options.outJson = path.resolve(argv[++i]);
    } else if (arg === "--out-md") {
      options.outMd = path.resolve(argv[++i]);
    } else if (arg === "--rejected-rows-json") {
      options.rejectedRowsJson = path.resolve(argv[++i]);
    } else if (arg === "--lineage-receipt-json") {
      options.lineageReceiptJson = path.resolve(argv[++i]);
    }
  }

  return options;
}

export function runYakimaDryRunRowValidation({
  adapterReportPath = DEFAULT_ADAPTER_REPORT,
  authorizationPolicyPath = DEFAULT_AUTHORIZATION_POLICY,
  outJson = DEFAULT_OUT_JSON,
  outMd = DEFAULT_OUT_MD,
  rejectedRowsJson = DEFAULT_REJECTED_ROWS_JSON,
  lineageReceiptJson = DEFAULT_LINEAGE_RECEIPT_JSON,
  generatedAtUtc = new Date().toISOString()
} = {}) {
  const adapterReport = readJson(adapterReportPath);
  const authorizationPolicy = readJson(authorizationPolicyPath);
  const report = buildYakimaDryRunRowValidation({ adapterReport, authorizationPolicy, generatedAtUtc });
  writeJson(outJson, report);
  writeText(outMd, renderMarkdown(report));
  writeJson(rejectedRowsJson, report.rejectedRowReport);
  writeJson(lineageReceiptJson, report.dryRunLineageReceipt);
  return report;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = runYakimaDryRunRowValidation(options);
  console.log(
    JSON.stringify(
      {
        county: report.county,
        termsState: report.termsLicensing.state,
        extractionMode: report.extraction.mode,
        rowsExamined: report.validation.rowsExamined,
        duplicateParcelIds: report.validation.duplicateParcelIds,
        authorizedForProductionLoad: report.authorization.authorizedForProductionLoad,
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
