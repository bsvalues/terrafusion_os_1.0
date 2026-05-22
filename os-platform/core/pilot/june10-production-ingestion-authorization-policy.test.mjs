#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  buildGovernedIngestionAuthorizationPolicy,
  evaluateCountyAuthorization,
  runGovernedIngestionAuthorizationPolicy
} from "./june10-production-ingestion-authorization-policy.mjs";

function readConditionalDesign() {
  return JSON.parse(
    fs.readFileSync(
      path.join("os-platform", "core", "pilot", "evidence", "june10-conditional-load-path-design.latest.json"),
      "utf8"
    )
  );
}

test("authorization policy defines roles and keeps production writes disabled", () => {
  const policy = buildGovernedIngestionAuthorizationPolicy({
    conditionalLoadDesign: readConditionalDesign(),
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(policy.summary.countiesCovered, 2);
  assert.deepEqual(policy.summary.counties, ["Cowlitz", "Yakima"]);
  assert.equal(policy.summary.productionDbMutationAllowed, false);
  assert.equal(policy.summary.runtimePromotionAllowed, false);
  assert.equal(policy.summary.authorizationState, "blocked_pending_evidence");
  assert.equal(policy.passed, true);

  assert.deepEqual(policy.roles.countyLoadAuthorizers, ["data_governance_lead", "county_data_steward"]);
  assert.deepEqual(policy.roles.projectionApprovers, ["data_governance_lead", "platform_release_manager"]);
  assert.deepEqual(policy.roles.runtimeRegistrationApprovers, [
    "platform_release_manager",
    "security_officer",
    "data_governance_lead"
  ]);
  assert.deepEqual(policy.roles.rollbackAuthorities, ["platform_release_manager", "database_operator"]);
});

test("authorization policy requires evidence, terms approval, validation thresholds, and receipts", () => {
  const policy = buildGovernedIngestionAuthorizationPolicy({
    conditionalLoadDesign: readConditionalDesign(),
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  for (const county of policy.counties) {
    assert.equal(county.authorizationDecision.authorizedForProductionLoad, false);
    assert.equal(county.authorizationDecision.authorizedForProjection, false);
    assert.equal(county.authorizationDecision.authorizedForRuntimeRegistration, false);
    assert.equal(county.termsLicensingApproval.state, "not_approved");
    assert.ok(county.requiredEvidenceBeforeAuthorization.includes("verified_read_only_adapter_receipt"));
    assert.ok(county.requiredEvidenceBeforeAuthorization.includes("conditional_load_path_design_receipt"));
    assert.ok(county.requiredEvidenceBeforeAuthorization.includes("terms_license_review_receipt"));
    assert.ok(county.validationThresholds.required.sourceParcelIdPresentPercent === 100);
    assert.ok(county.validationThresholds.required.duplicateParcelIdPercent <= 0);
    assert.ok(county.auditReceiptRequirements.requiredReceipts.includes("governed_ingestion_authorization_receipt"));
  }
});

test("county authorization evaluator blocks when evidence or approvals are missing", () => {
  const decision = evaluateCountyAuthorization({
    termsLicensingApproved: false,
    evidence: {
      verifiedReadOnlyAdapterReceipt: true,
      conditionalLoadPathDesignReceipt: true,
      rowValidationReceipt: false,
      rollbackPlanReceipt: true
    },
    validationMetrics: {
      sourceParcelIdPresentPercent: 100,
      duplicateParcelIdPercent: 0,
      rejectedRowsPercent: 0.5,
      lineageReceiptCoveragePercent: 100,
      dryRunProductionRowsWritten: 0
    }
  });

  assert.equal(decision.authorizedForProductionLoad, false);
  assert.ok(decision.blockers.includes("Terms/licensing approval is not complete."));
  assert.ok(decision.blockers.includes("Missing row validation receipt."));
});

test("county authorization evaluator can pass only for a future fully-evidenced non-runtime write decision", () => {
  const decision = evaluateCountyAuthorization({
    termsLicensingApproved: true,
    evidence: {
      verifiedReadOnlyAdapterReceipt: true,
      conditionalLoadPathDesignReceipt: true,
      rowValidationReceipt: true,
      rollbackPlanReceipt: true,
      projectionApprovalReceipt: false,
      runtimeRegistrationApprovalReceipt: false
    },
    validationMetrics: {
      sourceParcelIdPresentPercent: 100,
      duplicateParcelIdPercent: 0,
      rejectedRowsPercent: 0.25,
      lineageReceiptCoveragePercent: 100,
      dryRunProductionRowsWritten: 0
    }
  });

  assert.equal(decision.authorizedForProductionLoad, true);
  assert.equal(decision.authorizedForProjection, false);
  assert.equal(decision.authorizedForRuntimeRegistration, false);
  assert.deepEqual(decision.blockers, []);
});

test("authorization policy fails closed if conditional design allows DB mutation", () => {
  const design = readConditionalDesign();
  design.summary.productionDbMutationAllowed = true;

  const policy = buildGovernedIngestionAuthorizationPolicy({
    conditionalLoadDesign: design,
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(policy.passed, false);
  assert.ok(policy.blockers.includes("Conditional load design permits production DB mutation."));
});

test("authorization policy CLI writes JSON and Markdown evidence", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-ingestion-auth-policy-"));
  const outJson = path.join(temp, "policy.json");
  const outMd = path.join(temp, "policy.md");

  execFileSync(
    "node",
    ["os-platform/core/pilot/june10-production-ingestion-authorization-policy.mjs", "--out-json", outJson, "--out-md", outMd],
    {
      cwd: process.cwd(),
      stdio: "pipe"
    }
  );

  const policy = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");

  assert.equal(policy.summary.countiesCovered, 2);
  assert.match(markdown, /Governed Ingestion Authorization Model/);
  assert.match(markdown, /No production writes/);
  assert.match(markdown, /blocked_pending_evidence/);
});

test("authorization policy run helper writes evidence", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-ingestion-auth-policy-helper-"));
  const outJson = path.join(temp, "policy.json");
  const outMd = path.join(temp, "policy.md");

  const policy = runGovernedIngestionAuthorizationPolicy({
    outJson,
    outMd,
    generatedAtUtc: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(policy.summary.countiesCovered, 2);
  assert.equal(fs.existsSync(outJson), true);
  assert.equal(fs.existsSync(outMd), true);
});
