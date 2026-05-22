#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const ALLOWED_COUNTY_TOKENS = ["cowlitz", "yakima"];
const DEFAULT_ADAPTER_REPORT_PATHS = ALLOWED_COUNTY_TOKENS.map((countyToken) =>
  path.join(repoRoot, "os-platform", "core", "pilot", "evidence", `june10-${countyToken}-readonly-adapter.latest.json`)
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-conditional-load-path-design.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-conditional-load-path-design.latest.md"
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

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : stableJson(value)).digest("hex");
}

function normalizeCountyToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sourceFieldsFor(field) {
  if (!field) return [];
  if (Array.isArray(field.sourceFields)) return field.sourceFields;
  if (field.sourceField) return [field.sourceField];
  return [];
}

function fieldMappingFor(report) {
  const fields = report.stagingShape?.fields ?? {};
  return {
    parcelId: {
      sourceFields: sourceFieldsFor(fields.parcelId),
      required: true,
      targetField: "source_parcel_id"
    },
    ownerName: {
      sourceFields: sourceFieldsFor(fields.ownerName),
      required: false,
      targetField: "owner_name"
    },
    situsAddress: {
      sourceFields: sourceFieldsFor(fields.situsAddress),
      required: false,
      targetField: "situs_address"
    },
    assessedValue: {
      sourceFields: sourceFieldsFor(fields.assessedValue),
      required: false,
      targetField: "assessed_value_components"
    },
    geometryReference: {
      sourceFields: sourceFieldsFor(fields.geometryReference),
      required: false,
      targetField: "geometry_reference"
    },
    optionalFields: {
      landArea: {
        sourceFields: sourceFieldsFor(fields.landArea),
        targetField: "land_area"
      },
      propertyUse: {
        sourceFields: sourceFieldsFor(fields.propertyUse),
        targetField: "property_use"
      }
    }
  };
}

function buildStagingTable() {
  return {
    schemaName: "staging_county_seed",
    tableName: "conditional_parcel_source_dry_run",
    mode: "design_only_not_created_by_this_guard",
    requiredFields: ["county_token", "source_parcel_id", "source_lineage_receipt_id"],
    nullableFields: [
      "owner_name",
      "situs_address",
      "assessed_value_components",
      "land_area",
      "property_use",
      "geometry_reference",
      "source_payload_hash",
      "source_updated_at"
    ],
    generatedFields: ["dry_run_receipt_id", "normalized_payload_hash", "captured_at_utc"],
    uniqueness: ["county_token", "source_parcel_id", "source_lineage_receipt_id"],
    indexes: ["county_token", "source_parcel_id", "source_lineage_receipt_id"],
    productionTable: null
  };
}

function buildMissingFieldPolicy() {
  return {
    requiredFields: ["county_token", "source_parcel_id", "source_lineage_receipt_id"],
    optionalNullableFields: [
      "owner_name",
      "situs_address",
      "assessed_value_components",
      "land_area",
      "property_use",
      "geometry_reference",
      "source_updated_at"
    ],
    rejectRowWhenMissing: ["county_token", "source_parcel_id", "source_lineage_receipt_id"],
    doNotInfer: ["owner_name", "situs_address", "assessed_value_components"],
    policy: "Required identity and lineage fields reject the row. Optional descriptive, valuation, land, use, and geometry fields remain nullable and must not be inferred."
  };
}

function buildLineageReceiptFormat(report) {
  return {
    receiptVersion: "june10-conditional-load-dry-run-v1",
    sourceAdapterReceiptVersion: report.lineageReceipt?.receiptVersion ?? null,
    county: report.county,
    countyToken: report.countyToken,
    adapterId: report.adapterId,
    requiredHashes: ["source_adapter_receipt_sha256", "normalized_payload_sha256", "staging_contract_sha256"],
    requiredCounts: [
      "source_rows_examined",
      "source_rows_rejected",
      "source_rows_dry_run_normalized",
      "production_rows_written"
    ],
    fixedCounts: {
      production_rows_written: 0
    },
    requiredBooleans: {
      dry_run_only: true,
      runtime_claim_allowed: false,
      db_mutation_allowed: false
    },
    sourceAdapterReceiptSha256: sha256(report.lineageReceipt ?? {}),
    normalizedContractSha256: report.lineageReceipt?.normalizedArtifact?.sha256 ?? sha256(report.stagingShape ?? {})
  };
}

function buildValidationChecks() {
  return {
    beforeAnyDbWrite: [
      "terms_access_review_approved",
      "adapter_receipt_status_verified",
      "adapter_receipt_has_zero_production_rows",
      "source_parcel_id_present_and_unique_in_batch",
      "county_token_present_and_allowed",
      "normalized_payload_matches_staging_schema",
      "dry_run_receipt_hash_matches_normalized_payload",
      "operator_explicitly_disables_no_op_mode_in_a_later_authorized_slice"
    ],
    beforeProjection: [
      "county_token_maps_to_registered_terrafusion_county",
      "projection_receipt_target_is_non_production_or_explicitly_authorized",
      "parcel_identity_confidence_is_high",
      "required_identity_and_lineage_fields_are_non_null",
      "duplicate_source_parcel_ids_are_rejected_or_versioned_by_policy",
      "valuation_fields_are_marked_nullable_if_missing"
    ],
    prohibitedInThisSlice: [
      "create_table",
      "insert",
      "update",
      "delete",
      "merge",
      "upsert",
      "runtime_registration",
      "production_projection"
    ]
  };
}

function buildProjectionEligibility(report) {
  return {
    currentStatus: "blocked_until_terms_and_row_validation",
    dryRunEligible: true,
    productionWriteEligible: false,
    runtimeRegistrationEligible: false,
    requiredBeforeWrite: [
      "terms_access_review_approved",
      "sample_or_snapshot_payload_captured_under_allowed_source_behavior",
      "row_level_validation_report_passes",
      "lineage_receipt_written_for_dry_run",
      "operator_approval_in_separate_write_authorized_slice"
    ],
    reason: `${report.county} has sufficient identity and field metadata for conditional dry-run design, not production load.`
  };
}

function buildDryRunGuard() {
  return {
    enabled: true,
    mode: "no_op",
    wouldWriteProductionDb: false,
    wouldRegisterRuntimeCounty: false,
    rollbackMode: "no_op_no_transaction_opened",
    rollbackSteps: [
      "No production transaction is opened.",
      "No staging table is created by this guard.",
      "No production rows are inserted, updated, deleted, merged, or upserted.",
      "Generated evidence can be deleted or regenerated without database rollback."
    ]
  };
}

function buildCountyDesign(report) {
  return {
    county: report.county,
    countyToken: report.countyToken,
    adapterId: report.adapterId,
    sourceType: report.sourceType,
    accessMethod: report.accessMethod,
    expectedExportFormat: report.expectedExportFormat,
    stagingTable: buildStagingTable(),
    fieldMapping: fieldMappingFor(report),
    missingFieldPolicy: buildMissingFieldPolicy(),
    lineageReceiptFormat: buildLineageReceiptFormat(report),
    projectionEligibility: buildProjectionEligibility(report),
    validationChecks: buildValidationChecks(),
    dryRunGuard: buildDryRunGuard(),
    sourceWarnings: asArray(report.warnings),
    sourceAdapterReceipt: {
      status: report.adapterStatus,
      productionRowsWritten: Number(report.productionRowsWritten ?? 0),
      runtimeClaimAllowed: report.runtimeClaimAllowed === true,
      dbMutationAllowed: report.dbMutationAllowed === true
    }
  };
}

export function buildConditionalLoadPathDesign({ adapterReports, generatedAtUtc = new Date().toISOString() }) {
  const reports = asArray(adapterReports);
  const tokens = reports.map((report) => normalizeCountyToken(report.countyToken ?? report.county));
  const blockers = [];

  const unexpected = tokens.filter((token) => !ALLOWED_COUNTY_TOKENS.includes(token));
  if (unexpected.length > 0) {
    blockers.push(`Only Cowlitz and Yakima are allowed in this conditional load-path design. Unexpected: ${unexpected.join(", ")}.`);
  }

  const missing = ALLOWED_COUNTY_TOKENS.filter((token) => !tokens.includes(token));
  if (missing.length > 0) {
    blockers.push(`Missing required conditional candidate adapter reports: ${missing.join(", ")}.`);
  }

  for (const report of reports) {
    if (report.adapterStatus !== "verified") blockers.push(`${report.county}: adapter is not verified.`);
    if (Number(report.productionRowsWritten ?? 0) !== 0) blockers.push(`${report.county}: adapter already wrote production rows.`);
    if (report.runtimeClaimAllowed !== false) blockers.push(`${report.county}: adapter permits runtime claim.`);
    if (report.dbMutationAllowed !== false) blockers.push(`${report.county}: adapter permits DB mutation.`);
    if (report.parcelIdentity?.proven !== true) blockers.push(`${report.county}: parcel identity is not proven.`);
  }

  const counties = reports
    .filter((report) => ALLOWED_COUNTY_TOKENS.includes(normalizeCountyToken(report.countyToken ?? report.county)))
    .sort((a, b) => a.county.localeCompare(b.county))
    .map(buildCountyDesign);

  return {
    generatedAtUtc,
    slice: "Conditional Load-Path Design for Cowlitz and Yakima",
    summary: {
      countiesDesigned: counties.length,
      counties: counties.map((county) => county.county),
      productionDbMutationAllowed: false,
      runtimeClaimAllowed: false,
      dryRunOnly: true,
      rollbackMode: "no_op_no_transaction_opened",
      stagingTable: "staging_county_seed.conditional_parcel_source_dry_run",
      receiptVersion: "june10-conditional-load-dry-run-v1"
    },
    doctrine: [
      "This slice defines a conditional load path only.",
      "No production DB mutation.",
      "No runtime claim.",
      "No source scraping beyond already verified adapter behavior.",
      "Any later write path requires separate authorization and passing pre-write validations."
    ],
    counties,
    blockers,
    passed: blockers.length === 0 && counties.length === 2
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Conditional Load-Path Design",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    "## Summary",
    "",
    `- Counties designed: ${report.summary.countiesDesigned}`,
    `- Counties: ${report.summary.counties.join(", ")}`,
    `- No production DB mutation: ${!report.summary.productionDbMutationAllowed}`,
    `- Runtime claim allowed: ${report.summary.runtimeClaimAllowed}`,
    `- Dry-run only: ${report.summary.dryRunOnly}`,
    `- Rollback mode: ${report.summary.rollbackMode}`,
    `- Receipt version: ${report.summary.receiptVersion}`,
    `- Passed: ${report.passed}`,
    "",
    "## Staging Table Shape",
    "",
    `- Table: ${report.summary.stagingTable}`,
    "- Required fields: county_token, source_parcel_id, source_lineage_receipt_id",
    "- Nullable fields: owner_name, situs_address, assessed_value_components, land_area, property_use, geometry_reference, source_payload_hash, source_updated_at",
    "- Uniqueness: county_token + source_parcel_id + source_lineage_receipt_id",
    "",
    "## County Designs",
    "",
    "| County | Parcel field | Owner | Address | Value | Projection status | DB write |",
    "|---|---|---|---|---|---|---:|",
    ...report.counties.map((county) =>
      [
        county.county,
        county.fieldMapping.parcelId.sourceFields.join(", "),
        county.fieldMapping.ownerName.sourceFields.join(", ") || "nullable",
        county.fieldMapping.situsAddress.sourceFields.join(", ") || "nullable",
        county.fieldMapping.assessedValue.sourceFields.join(", ") || "nullable",
        county.projectionEligibility.currentStatus,
        String(county.dryRunGuard.wouldWriteProductionDb)
      ].join(" | ")
    ),
    "",
    "## Validation Before Any DB Write",
    "",
    ...buildValidationChecks().beforeAnyDbWrite.map((check) => `- ${check}`),
    "",
    "## Projection Eligibility Rules",
    "",
    "- Current status is blocked_until_terms_and_row_validation for both counties.",
    "- Dry-run evidence can be generated.",
    "- Production writes require a later authorized slice, terms/access approval, row-level validation, and explicit operator approval.",
    "",
    "## Rollback / No-Op Mode",
    "",
    "- No production transaction is opened.",
    "- No staging table is created by this guard.",
    "- No production rows are inserted, updated, deleted, merged, or upserted.",
    "- Generated evidence can be regenerated without database rollback.",
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

export function runConditionalLoadPathDesign({
  adapterReportPaths = DEFAULT_ADAPTER_REPORT_PATHS,
  outJson = DEFAULT_OUT_JSON,
  outMd = DEFAULT_OUT_MD,
  generatedAtUtc = new Date().toISOString()
} = {}) {
  const adapterReports = adapterReportPaths.map(readJson);
  const report = buildConditionalLoadPathDesign({ adapterReports, generatedAtUtc });
  writeJson(outJson, report);
  writeText(outMd, renderMarkdown(report));
  return report;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = runConditionalLoadPathDesign(options);
  console.log(
    JSON.stringify(
      {
        countiesDesigned: report.summary.countiesDesigned,
        dryRunOnly: report.summary.dryRunOnly,
        productionDbMutationAllowed: report.summary.productionDbMutationAllowed,
        runtimeClaimAllowed: report.summary.runtimeClaimAllowed,
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
