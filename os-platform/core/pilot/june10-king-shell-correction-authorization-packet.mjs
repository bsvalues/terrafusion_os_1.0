#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_TRANSACTION_DRY_RUN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-correction-transaction-dry-run.latest.json"
);
const DEFAULT_SHELL_POLICY = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-load-policy.latest.json"
);
const DEFAULT_SOURCE_COMPLETENESS = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-source-completeness-capture.latest.json"
);
const DEFAULT_ROLLBACK_SQL = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-correction-transaction-dry-run",
  "rollback.sql"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-shell-correction-authorization-packet"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-shell-correction-authorization-packet.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-shell-correction-authorization-packet.latest.md"
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

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function sha256FileIfPresent(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function resolveArtifactPath(value) {
  if (!value) return null;
  return path.isAbsolute(value) ? value : path.join(repoRoot, value);
}

function buildPreconditions({ transactionDryRun, shellPolicy, sourceCompleteness, rollbackSqlExists, transactionDryRunHash, sourceArtifactHash }) {
  return [
    {
      id: "dry_run_receipt_hash_recorded",
      required: true,
      passed: Boolean(transactionDryRunHash),
      evidence: transactionDryRunHash,
      statement: "Latest King transaction dry-run receipt hash is recorded before authorization."
    },
    {
      id: "source_artifact_hash_matches",
      required: true,
      passed:
        Boolean(sourceCompleteness.artifacts?.rawArtifactSha256) &&
        sourceCompleteness.artifacts.rawArtifactSha256 === sourceArtifactHash,
      evidence: sourceCompleteness.artifacts?.rawArtifactSha256 ?? null,
      statement: "King source artifact hash matches the source-completeness receipt."
    },
    {
      id: "rollback_sql_exists",
      required: true,
      passed: rollbackSqlExists,
      evidence: "os-platform/core/pilot/evidence/june10-king-parcel-shell-correction-transaction-dry-run/rollback.sql",
      statement: "Rollback SQL exists before any execution authorization."
    },
    {
      id: "bounded_king_only_unit",
      required: true,
      passed: transactionDryRun.fips === "53033" && transactionDryRun.countyName === "King County",
      evidence: `${transactionDryRun.countyName} ${transactionDryRun.fips}`,
      statement: "Execution scope is King County only."
    },
    {
      id: "duplicate_targets_zero",
      required: true,
      passed: transactionDryRun.postTransactionParityProof?.countyIdParcelNumberDuplicatesAfter === 0,
      evidence: transactionDryRun.postTransactionParityProof?.countyIdParcelNumberDuplicatesAfter,
      statement: "Dry-run proves post-mutation duplicate target groups remain zero."
    },
    {
      id: "shell_policy_blocks_certification",
      required: true,
      passed:
        shellPolicy.policy?.shellRowsAreWorkflowComplete === false &&
        shellPolicy.loadabilityMatrix?.certificationRows === 0 &&
        transactionDryRun.certificationAllowed === false,
      evidence: shellPolicy.trustLabel,
      statement: "Shell rows stay non-certified and workflow-complete claims remain blocked."
    }
  ];
}

function buildHumanChecklist() {
  return [
    {
      id: "approve_scope",
      required: true,
      text: "I approve King County only: 12 case corrections, 451 supersedes, 1,137 KING_PUBLIC_PARCEL_SHELL inserts, and 24 placeholder rows excluded."
    },
    {
      id: "acknowledge_not_certification",
      required: true,
      text: "I acknowledge this authorization is not approval for King workflow certification or production certification."
    },
    {
      id: "acknowledge_shell_limit",
      required: true,
      text: "I acknowledge shell rows are identity/context-only and lack owner/address/value fields."
    },
    {
      id: "confirm_rollback",
      required: true,
      text: "I confirm rollback SQL and rollback verification are available before execution."
    },
    {
      id: "authorize_execution_phrase",
      required: true,
      text: "Required phrase for a future mutation slice: I explicitly authorize the King shell identity correction transaction only."
    }
  ];
}

function buildPostExecutionProofRequirements() {
  return [
    "accepted correction receipt emitted after commit",
    "identity parity proof rerun after mutation",
    "CountyId + ParcelNumber duplicate proof equals 0",
    "451 stale rows marked superseded/inactive, not deleted",
    "1,137 shell rows inserted with KING_PUBLIC_PARCEL_SHELL trust label",
    "24 placeholder rows remain excluded/review-held",
    "workflow-complete and certification blockers remain true",
    "rollback verification command available and documented"
  ];
}

function buildExecutionPlan() {
  return [
    "BEGIN transaction.",
    "Apply 12 source-exact case corrections.",
    "Supersede 451 stale King canonical rows; mark inactive/superseded, do not delete.",
    "Insert 1,137 King shell rows with KING_PUBLIC_PARCEL_SHELL trust label.",
    "Keep 24 placeholder/tract rows excluded in review queue.",
    "Validate CountyId + ParcelNumber duplicate groups = 0.",
    "Validate policy-approved identity parity.",
    "Validate shell rows remain blocked from workflow-complete claims.",
    "COMMIT only if all checks pass; otherwise ROLLBACK."
  ];
}

export function buildKingShellCorrectionAuthorizationPacket({
  transactionDryRun,
  shellPolicy,
  sourceCompleteness,
  rollbackSqlExists = false,
  transactionDryRunHash = "provided-by-cli-or-test",
  sourceArtifactHash = sourceCompleteness.artifacts?.rawArtifactSha256 ?? null
}) {
  const preconditions = buildPreconditions({
    transactionDryRun,
    shellPolicy,
    sourceCompleteness,
    rollbackSqlExists,
    transactionDryRunHash,
    sourceArtifactHash
  });
  const preconditionsPassed = preconditions.every((item) => item.passed === true);
  const authorizationStatus = preconditionsPassed ? "READY_FOR_HUMAN_DECISION" : "BLOCKED_PRECONDITION";

  return {
    generatedAt: new Date().toISOString(),
    packetType: "king_shell_correction_authorization_packet",
    countyName: "King County",
    fips: "53033",
    authorizationStatus,
    databaseMutationAllowed: false,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false,
    noBsLine: "Approved for shell identity correction is not approved for King certification.",
    executiveSummary: {
      supersedes: transactionDryRun.summary?.supersedeCandidates ?? 0,
      shellInserts: transactionDryRun.summary?.shellInsertCandidates ?? 0,
      caseCorrections: transactionDryRun.summary?.sourceExactCaseCorrections ?? 0,
      placeholderRowsExcluded: transactionDryRun.summary?.placeholderReviewHeld ?? 0,
      duplicateTargetGroupsAfter: transactionDryRun.postTransactionParityProof?.countyIdParcelNumberDuplicatesAfter ?? null,
      identityParityScope: "policy_approved_shell_identity_scope_only",
      identityParityAchievedOnlyUnderPolicyApprovedScope:
        transactionDryRun.postTransactionParityProof?.policyApprovedIdentityParityWouldBeAchieved === true
    },
    riskStatement: [
      "Shell rows are not owner/address/value complete.",
      "Shell rows are not workflow-certified.",
      "King remains blocked for full certification.",
      "Placeholder/tract rows remain unresolved and excluded.",
      "This packet does not authorize production binding or statewide readiness claims."
    ],
    preconditions,
    executionPlan: buildExecutionPlan(),
    rollbackPlan: {
      rollbackSql: "os-platform/core/pilot/evidence/june10-king-parcel-shell-correction-transaction-dry-run/rollback.sql",
      requiredVerification: [
        "superseded rows restored to ACTIVE if rollback is executed",
        "inserted KING_PUBLIC_PARCEL_SHELL rows removed if rollback is executed",
        "case-corrected rows restored from snapshot/backup if rollback is executed",
        "duplicate target groups remain 0 after rollback"
      ]
    },
    postExecutionProofRequirements: buildPostExecutionProofRequirements(),
    humanApprovalChecklist: buildHumanChecklist(),
    executability: {
      executionCommandEnabled: false,
      disabledExecutionCommand:
        "DISABLED: node os-platform/core/pilot/june10-king-shell-correction-execute.mjs --requires-explicit-human-authorization",
      enablementRule:
        "A separate mutation slice must receive the exact human authorization phrase and must rerun preconditions immediately before execution."
    }
  };
}

function renderMarkdown(packet) {
  const risks = packet.riskStatement.map((line) => `- ${line}`).join("\n");
  const preconditions = packet.preconditions
    .map((item) => `| ${item.id} | ${item.passed ? "pass" : "fail"} | ${item.statement} |`)
    .join("\n");
  const execution = packet.executionPlan.map((line, index) => `${index + 1}. ${line}`).join("\n");
  const checklist = packet.humanApprovalChecklist.map((item) => `- [ ] ${item.text}`).join("\n");
  const proof = packet.postExecutionProofRequirements.map((line) => `- ${line}`).join("\n");

  return `# King Shell Correction Authorization Packet

Generated: ${packet.generatedAt}

## Executive Summary

- Authorization status: ${packet.authorizationStatus}
- Supersedes: ${packet.executiveSummary.supersedes}
- Shell inserts: ${packet.executiveSummary.shellInserts}
- Case corrections: ${packet.executiveSummary.caseCorrections}
- Placeholder rows excluded: ${packet.executiveSummary.placeholderRowsExcluded}
- Duplicate target groups after proposed transaction: ${packet.executiveSummary.duplicateTargetGroupsAfter}
- Identity parity scope: ${packet.executiveSummary.identityParityScope}
- Database mutation attempted: ${packet.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${packet.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${packet.certificationAllowed ? "yes" : "no"}

**No-BS line:** ${packet.noBsLine}

## Risk Statement

${risks}

## Preconditions

| ID | Status | Statement |
| --- | --- | --- |
${preconditions}

## Execution Plan

${execution}

## Rollback Plan

- SQL reference: ${packet.rollbackPlan.rollbackSql}
- Verification:
${packet.rollbackPlan.requiredVerification.map((line) => `  - ${line}`).join("\n")}

## Post-Execution Proof

${proof}

## Human Approval Checklist

${checklist}

## Disabled Execution Command

\`${packet.executability.disabledExecutionCommand}\`
`;
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--") continue;
    if (!argv[index]?.startsWith("--")) continue;
    args.set(argv[index].slice(2), argv[index + 1]);
    index += 1;
  }
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    transactionDryRun: args.get("transaction-dry-run") ?? DEFAULT_TRANSACTION_DRY_RUN,
    shellPolicy: args.get("shell-policy") ?? DEFAULT_SHELL_POLICY,
    sourceCompleteness: args.get("source-completeness") ?? DEFAULT_SOURCE_COMPLETENESS,
    rollbackSql: args.get("rollback-sql") ?? DEFAULT_ROLLBACK_SQL,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const sourceCompleteness = readJson(paths.sourceCompleteness);
  const sourceArtifactPath = resolveArtifactPath(sourceCompleteness.artifacts?.rawArtifactPath);
  const packet = buildKingShellCorrectionAuthorizationPacket({
    transactionDryRun: readJson(paths.transactionDryRun),
    shellPolicy: readJson(paths.shellPolicy),
    sourceCompleteness,
    rollbackSqlExists: fs.existsSync(paths.rollbackSql),
    transactionDryRunHash: sha256FileIfPresent(paths.transactionDryRun),
    sourceArtifactHash: sha256FileIfPresent(sourceArtifactPath)
  });

  writeJson(paths.outJson, packet);
  writeText(paths.outMd, renderMarkdown(packet));
  writeJson(path.join(paths.outRoot, "human-approval-checklist.json"), packet.humanApprovalChecklist);
  writeJson(path.join(paths.outRoot, "post-execution-proof-requirements.json"), packet.postExecutionProofRequirements);
  writeJson(path.join(paths.outRoot, "preconditions.json"), packet.preconditions);
  writeText(path.join(paths.outRoot, "execution-command.disabled.txt"), `${packet.executability.disabledExecutionCommand}\n`);

  console.log(`King shell correction authorization packet written: ${repoRelative(paths.outJson)}`);
  console.log(`Authorization status: ${packet.authorizationStatus}`);
  console.log(`Execution command enabled: ${packet.executability.executionCommandEnabled ? "yes" : "no"}`);
  console.log(`Certification allowed: ${packet.certificationAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
