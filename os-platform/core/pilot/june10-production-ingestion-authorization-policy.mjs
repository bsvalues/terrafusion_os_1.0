#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_CONDITIONAL_LOAD_DESIGN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-conditional-load-path-design.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-production-ingestion-authorization-policy.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-production-ingestion-authorization-policy.latest.md"
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

function buildRoles() {
  return {
    countyLoadAuthorizers: ["data_governance_lead", "county_data_steward"],
    termsLicensingApprovers: ["legal_terms_reviewer", "data_governance_lead"],
    validationApprovers: ["data_quality_lead", "database_operator"],
    projectionApprovers: ["data_governance_lead", "platform_release_manager"],
    runtimeRegistrationApprovers: ["platform_release_manager", "security_officer", "data_governance_lead"],
    rollbackAuthorities: ["platform_release_manager", "database_operator"],
    emergencyStopAuthorities: ["platform_release_manager", "security_officer"]
  };
}

function requiredEvidenceBeforeAuthorization() {
  return [
    "verified_read_only_adapter_receipt",
    "conditional_load_path_design_receipt",
    "terms_license_review_receipt",
    "row_validation_receipt",
    "rollback_plan_receipt",
    "dry_run_lineage_receipt"
  ];
}

function buildValidationThresholds() {
  return {
    required: {
      sourceParcelIdPresentPercent: 100,
      duplicateParcelIdPercent: 0,
      lineageReceiptCoveragePercent: 100,
      dryRunProductionRowsWritten: 0,
      maxRejectedRowsPercent: 1
    },
    projectionRequired: {
      countyTokenRegistered: true,
      normalizedPayloadHashVerified: true,
      projectionReceiptApproved: true
    },
    runtimeRegistrationRequired: {
      projectionRowsWrittenGreaterThanZero: true,
      endpointContractSmokePassed: true,
      noCrossCountyFallback: true,
      runtimeRegistrationApprovalReceipt: true
    }
  };
}

function buildAuditReceiptRequirements() {
  return {
    requiredReceipts: [
      "governed_ingestion_authorization_receipt",
      "terms_license_review_receipt",
      "row_validation_receipt",
      "dry_run_lineage_receipt",
      "rollback_plan_receipt"
    ],
    projectionReceipts: ["projection_approval_receipt", "projection_execution_receipt", "projection_validation_receipt"],
    runtimeReceipts: [
      "runtime_registration_approval_receipt",
      "endpoint_contract_smoke_receipt",
      "county_no_fallback_receipt"
    ],
    receiptFields: [
      "receipt_id",
      "county_token",
      "authorized_by",
      "authorized_role",
      "source_receipt_sha256",
      "validation_receipt_sha256",
      "decision",
      "created_at_utc"
    ]
  };
}

export function evaluateCountyAuthorization({
  termsLicensingApproved = false,
  evidence = {},
  validationMetrics = {},
  projectionApprovalReceipt = evidence.projectionApprovalReceipt === true,
  runtimeRegistrationApprovalReceipt = evidence.runtimeRegistrationApprovalReceipt === true
} = {}) {
  const blockers = [];
  const thresholds = buildValidationThresholds().required;

  if (!termsLicensingApproved) blockers.push("Terms/licensing approval is not complete.");
  if (evidence.verifiedReadOnlyAdapterReceipt !== true) blockers.push("Missing verified read-only adapter receipt.");
  if (evidence.conditionalLoadPathDesignReceipt !== true) blockers.push("Missing conditional load-path design receipt.");
  if (evidence.rowValidationReceipt !== true) blockers.push("Missing row validation receipt.");
  if (evidence.rollbackPlanReceipt !== true) blockers.push("Missing rollback plan receipt.");

  if (validationMetrics.sourceParcelIdPresentPercent !== thresholds.sourceParcelIdPresentPercent) {
    blockers.push("Source parcel ID presence does not meet 100% threshold.");
  }
  if ((validationMetrics.duplicateParcelIdPercent ?? Number.POSITIVE_INFINITY) > thresholds.duplicateParcelIdPercent) {
    blockers.push("Duplicate parcel ID rate is above zero.");
  }
  if ((validationMetrics.rejectedRowsPercent ?? Number.POSITIVE_INFINITY) > thresholds.maxRejectedRowsPercent) {
    blockers.push("Rejected row rate exceeds allowed threshold.");
  }
  if (validationMetrics.lineageReceiptCoveragePercent !== thresholds.lineageReceiptCoveragePercent) {
    blockers.push("Lineage receipt coverage does not meet 100% threshold.");
  }
  if (validationMetrics.dryRunProductionRowsWritten !== thresholds.dryRunProductionRowsWritten) {
    blockers.push("Dry-run wrote production rows.");
  }

  const authorizedForProductionLoad = blockers.length === 0;
  const authorizedForProjection = authorizedForProductionLoad && projectionApprovalReceipt === true;
  const authorizedForRuntimeRegistration = authorizedForProjection && runtimeRegistrationApprovalReceipt === true;

  return {
    authorizedForProductionLoad,
    authorizedForProjection,
    authorizedForRuntimeRegistration,
    blockers
  };
}

function buildCountyPolicy(countyDesign) {
  const decision = evaluateCountyAuthorization({
    termsLicensingApproved: false,
    evidence: {
      verifiedReadOnlyAdapterReceipt: true,
      conditionalLoadPathDesignReceipt: true,
      rowValidationReceipt: false,
      rollbackPlanReceipt: false,
      projectionApprovalReceipt: false,
      runtimeRegistrationApprovalReceipt: false
    },
    validationMetrics: {
      sourceParcelIdPresentPercent: null,
      duplicateParcelIdPercent: null,
      rejectedRowsPercent: null,
      lineageReceiptCoveragePercent: null,
      dryRunProductionRowsWritten: 0
    }
  });

  return {
    county: countyDesign.county,
    countyToken: countyDesign.countyToken,
    adapterId: countyDesign.adapterId,
    termsLicensingApproval: {
      state: "not_approved",
      requiredApprovers: buildRoles().termsLicensingApprovers,
      requiredEvidence: ["terms_or_license_review_url_or_file", "allowed_use_scope", "bulk_capture_permission_state"],
      blocker: "Terms/licensing approval must be explicit before any county load authorization."
    },
    requiredEvidenceBeforeAuthorization: requiredEvidenceBeforeAuthorization(),
    validationThresholds: buildValidationThresholds(),
    rollbackAuthority: {
      roles: buildRoles().rollbackAuthorities,
      requiredReceipt: "rollback_plan_receipt",
      rollbackModeBeforeWrite: "no_op_no_transaction_opened",
      rollbackModeAfterFutureWrite: "restore_from_pre_write_snapshot_and_revoke_runtime_registration"
    },
    projectionApprovalWorkflow: {
      state: "not_requested",
      approvers: buildRoles().projectionApprovers,
      requiredBeforeApproval: [
        "production_load_authorization_receipt",
        "row_validation_receipt",
        "pre_projection_snapshot_receipt",
        "projection_plan_receipt"
      ],
      currentAction: "blocked"
    },
    runtimeRegistrationApprovalWorkflow: {
      state: "not_requested",
      approvers: buildRoles().runtimeRegistrationApprovers,
      requiredBeforeApproval: [
        "projection_execution_receipt",
        "endpoint_contract_smoke_receipt",
        "no_cross_county_fallback_receipt",
        "county_trust_label_receipt"
      ],
      currentAction: "blocked"
    },
    auditReceiptRequirements: buildAuditReceiptRequirements(),
    authorizationDecision: decision
  };
}

export function buildGovernedIngestionAuthorizationPolicy({
  conditionalLoadDesign,
  generatedAtUtc = new Date().toISOString()
}) {
  const blockers = [];
  if (conditionalLoadDesign?.summary?.productionDbMutationAllowed !== false) {
    blockers.push("Conditional load design permits production DB mutation.");
  }
  if (conditionalLoadDesign?.summary?.runtimeClaimAllowed !== false) {
    blockers.push("Conditional load design permits runtime claim.");
  }
  if (conditionalLoadDesign?.summary?.dryRunOnly !== true) {
    blockers.push("Conditional load design is not dry-run only.");
  }

  const counties = asArray(conditionalLoadDesign?.counties).map(buildCountyPolicy);
  if (counties.length === 0) blockers.push("No conditional county designs were supplied.");

  return {
    generatedAtUtc,
    slice: "Governed Ingestion Authorization Model",
    sourceDesignReceiptSha256: sha256(conditionalLoadDesign ?? {}),
    summary: {
      countiesCovered: counties.length,
      counties: counties.map((county) => county.county),
      authorizationState: "blocked_pending_evidence",
      productionDbMutationAllowed: false,
      runtimePromotionAllowed: false,
      projectionPromotionAllowed: false
    },
    roles: buildRoles(),
    globalPolicy: {
      whoCanAuthorizeCountyLoad: buildRoles().countyLoadAuthorizers,
      requiredEvidenceBeforeAuthorization: requiredEvidenceBeforeAuthorization(),
      termsLicensingApprovalStateRequired: "approved",
      validationThresholds: buildValidationThresholds(),
      rollbackAuthority: buildRoles().rollbackAuthorities,
      projectionApprovalWorkflow: "separate approval after load authorization and row validation",
      runtimeRegistrationApprovalWorkflow: "separate approval after projection proof and endpoint smoke",
      auditReceiptRequirements: buildAuditReceiptRequirements()
    },
    hardStops: [
      "No production writes in this slice.",
      "No runtime promotion in this slice.",
      "No projection promotion in this slice.",
      "No county load authorization without terms/licensing approval.",
      "No county load authorization without row validation receipt.",
      "No county load authorization without rollback plan receipt."
    ],
    counties,
    blockers,
    passed: blockers.length === 0
  };
}

function renderMarkdown(policy) {
  const lines = [
    "# Governed Ingestion Authorization Model",
    "",
    `Generated: ${policy.generatedAtUtc}`,
    "",
    "## Summary",
    "",
    `- Counties covered: ${policy.summary.countiesCovered}`,
    `- Counties: ${policy.summary.counties.join(", ")}`,
    `- Authorization state: ${policy.summary.authorizationState}`,
    `- No production writes: ${!policy.summary.productionDbMutationAllowed}`,
    `- Runtime promotion allowed: ${policy.summary.runtimePromotionAllowed}`,
    `- Projection promotion allowed: ${policy.summary.projectionPromotionAllowed}`,
    `- Passed: ${policy.passed}`,
    "",
    "## Authorizers",
    "",
    `- County load authorizers: ${policy.roles.countyLoadAuthorizers.join(", ")}`,
    `- Terms/licensing approvers: ${policy.roles.termsLicensingApprovers.join(", ")}`,
    `- Validation approvers: ${policy.roles.validationApprovers.join(", ")}`,
    `- Projection approvers: ${policy.roles.projectionApprovers.join(", ")}`,
    `- Runtime registration approvers: ${policy.roles.runtimeRegistrationApprovers.join(", ")}`,
    `- Rollback authorities: ${policy.roles.rollbackAuthorities.join(", ")}`,
    "",
    "## Required Evidence",
    "",
    ...policy.globalPolicy.requiredEvidenceBeforeAuthorization.map((item) => `- ${item}`),
    "",
    "## Validation Thresholds",
    "",
    `- Source parcel ID present: ${policy.globalPolicy.validationThresholds.required.sourceParcelIdPresentPercent}%`,
    `- Duplicate parcel ID rate: ${policy.globalPolicy.validationThresholds.required.duplicateParcelIdPercent}%`,
    `- Lineage receipt coverage: ${policy.globalPolicy.validationThresholds.required.lineageReceiptCoveragePercent}%`,
    `- Dry-run production rows written: ${policy.globalPolicy.validationThresholds.required.dryRunProductionRowsWritten}`,
    `- Max rejected rows: ${policy.globalPolicy.validationThresholds.required.maxRejectedRowsPercent}%`,
    "",
    "## County Decisions",
    "",
    "| County | Terms | Load | Projection | Runtime | Blockers |",
    "|---|---|---:|---:|---:|---|",
    ...policy.counties.map((county) =>
      [
        county.county,
        county.termsLicensingApproval.state,
        String(county.authorizationDecision.authorizedForProductionLoad),
        String(county.authorizationDecision.authorizedForProjection),
        String(county.authorizationDecision.authorizedForRuntimeRegistration),
        county.authorizationDecision.blockers.join("<br>")
      ].join(" | ")
    ),
    "",
    "## Hard Stops",
    "",
    ...policy.hardStops.map((stop) => `- ${stop}`),
    "",
    "## Blockers",
    "",
    ...(policy.blockers.length ? policy.blockers.map((blocker) => `- ${blocker}`) : ["- none"])
  ];

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const options = {
    conditionalLoadDesignPath: DEFAULT_CONDITIONAL_LOAD_DESIGN,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--conditional-load-design") {
      options.conditionalLoadDesignPath = path.resolve(argv[++i]);
    } else if (arg === "--out-json") {
      options.outJson = path.resolve(argv[++i]);
    } else if (arg === "--out-md") {
      options.outMd = path.resolve(argv[++i]);
    }
  }

  return options;
}

export function runGovernedIngestionAuthorizationPolicy({
  conditionalLoadDesignPath = DEFAULT_CONDITIONAL_LOAD_DESIGN,
  outJson = DEFAULT_OUT_JSON,
  outMd = DEFAULT_OUT_MD,
  generatedAtUtc = new Date().toISOString()
} = {}) {
  const conditionalLoadDesign = readJson(conditionalLoadDesignPath);
  const policy = buildGovernedIngestionAuthorizationPolicy({ conditionalLoadDesign, generatedAtUtc });
  writeJson(outJson, policy);
  writeText(outMd, renderMarkdown(policy));
  return policy;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const policy = runGovernedIngestionAuthorizationPolicy(options);
  console.log(
    JSON.stringify(
      {
        countiesCovered: policy.summary.countiesCovered,
        authorizationState: policy.summary.authorizationState,
        productionDbMutationAllowed: policy.summary.productionDbMutationAllowed,
        runtimePromotionAllowed: policy.summary.runtimePromotionAllowed,
        passed: policy.passed
      },
      null,
      2
    )
  );

  if (!policy.passed) {
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
