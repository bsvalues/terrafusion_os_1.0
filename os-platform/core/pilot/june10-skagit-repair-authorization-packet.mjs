#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_DRY_RUN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-skagit-prefix-repair-dry-run.latest.json"
);
const DEFAULT_SOURCE_RECEIPT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-authoritative-recapture-wave1",
  "skagit",
  "source-receipt-candidate.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-skagit-repair-authorization-packet.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-skagit-repair-authorization-packet.latest.md"
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

export function forbiddenClaims() {
  return [
    "no_skagit_certification",
    "no_production_binding",
    "no_workflow_complete_claims",
    "no_owner_address_value_claims_for_shell_rows",
    "no_runtime_promotion"
  ];
}

function requiredArtifacts(dryRun, sourceReceipt) {
  return {
    sourceMetadata: sourceReceipt.metadataArtifact ?? null,
    sourceIds: sourceReceipt.sourceIdArtifact ?? null,
    updateTargets: dryRun.artifacts?.updateTargets ?? null,
    supersedeTargets: dryRun.artifacts?.supersedeTargets ?? null,
    stageInsertTargets: dryRun.artifacts?.stageInsertTargets ?? null,
    repairReceipt: dryRun.artifacts?.repairReceipt ?? null,
    rollbackPlan: dryRun.artifacts?.rollbackPlan ?? null
  };
}

function allHashesPresent(artifacts) {
  return Object.values(artifacts).every((artifact) => artifact?.path && artifact?.sha256);
}

export function evaluateAuthorizationState({ dryRun, sourceReceipt, artifactHashesPresent }) {
  const blockers = [];
  if (dryRun.status !== "DRY_RUN_REPAIR_PARITY_PROJECTED") {
    blockers.push(`Dry-run status is ${dryRun.status}, expected DRY_RUN_REPAIR_PARITY_PROJECTED.`);
  }
  if (dryRun.databaseMutationAttempted !== false) {
    blockers.push("Dry-run evidence indicates database mutation.");
  }
  if (sourceReceipt.valid !== true) {
    blockers.push("Source receipt candidate is not valid.");
  }
  if (!sourceReceipt.sourceIdArtifact?.sha256) {
    blockers.push("Source ID artifact hash is missing.");
  }
  if (!artifactHashesPresent) {
    blockers.push("One or more required artifact hashes are missing.");
  }

  return {
    state: blockers.length === 0 ? "READY_FOR_HUMAN_DECISION" : "BLOCKED",
    executionEnabled: false,
    blockers
  };
}

export function buildSkagitAuthorizationPacket({ dryRun, sourceReceipt }) {
  const artifacts = requiredArtifacts(dryRun, sourceReceipt);
  const state = evaluateAuthorizationState({
    dryRun,
    sourceReceipt,
    artifactHashesPresent: allHashesPresent(artifacts)
  });

  return {
    generatedAt: new Date().toISOString(),
    county: "Skagit",
    fips: "53057",
    scope: "Skagit source-native ParcelNumber prefix repair authorization packet.",
    state: state.state,
    executionEnabled: false,
    approvalRequired: true,
    summary: {
      sourceUrl: sourceReceipt.sourceUrl ?? null,
      sourceParcelIdField: sourceReceipt.sourceParcelIdField ?? null,
      sourceArtifactHash: sourceReceipt.sourceIdArtifact?.sha256 ?? null,
      dryRunStatus: dryRun.status,
      updateTargets: dryRun.counts?.updateTargets ?? null,
      supersedeTargets: dryRun.counts?.supersedeTargets ?? null,
      stageInsertTargets: dryRun.counts?.stageInsertTargets ?? null,
      postRepairDuplicateGroups: dryRun.postRepairProjection?.duplicateGroups ?? null,
      postRepairSourceOnly: dryRun.postRepairProjection?.sourceOnlyCount ?? null,
      postRepairCanonicalOnly: dryRun.postRepairProjection?.canonicalOnlyCount ?? null
    },
    artifacts,
    forbiddenClaims: forbiddenClaims(),
    preconditions: [
      "Human approval must be explicit and Skagit-only.",
      "A backup snapshot of affected Skagit canonical rows must be captured before mutation.",
      "Execution must run in one bounded transaction.",
      "Post-repair duplicate groups must remain 0.",
      "Post-repair source-only and canonical-only counts must remain 0 under the approved shell policy.",
      "Rollback plan must remain available before execution."
    ],
    stopConditions: [
      "Stop if artifact hashes differ from this packet.",
      "Stop if source receipt is regenerated or stale.",
      "Stop if worktree is dirty with unrelated changes.",
      "Stop if tests fail.",
      "Stop if backup snapshot cannot be created.",
      "Stop if transaction verification does not project parity."
    ],
    blockers: state.blockers,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    runtimeClaimAllowed: false,
    certificationAllowed: false
  };
}

function renderMarkdown(packet) {
  const artifactRows = Object.entries(packet.artifacts)
    .map(([name, artifact]) => `| ${name} | ${artifact?.path ?? "-"} | ${artifact?.sha256 ?? "-"} |`)
    .join("\n");
  return `# Skagit Repair Authorization Packet

Generated: ${packet.generatedAt}

## Decision State

- State: ${packet.state}
- Execution enabled: ${packet.executionEnabled ? "yes" : "no"}
- Approval required: ${packet.approvalRequired ? "yes" : "no"}
- Database mutation attempted: ${packet.databaseMutationAttempted ? "yes" : "no"}
- Production binding allowed: ${packet.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${packet.certificationAllowed ? "yes" : "no"}

## Summary

- Source URL: ${packet.summary.sourceUrl}
- Source parcel ID field: ${packet.summary.sourceParcelIdField}
- Source artifact hash: ${packet.summary.sourceArtifactHash}
- Dry-run status: ${packet.summary.dryRunStatus}
- Proposed updates: ${packet.summary.updateTargets}
- Proposed supersedes: ${packet.summary.supersedeTargets}
- Proposed staged inserts: ${packet.summary.stageInsertTargets}
- Post-repair duplicate groups: ${packet.summary.postRepairDuplicateGroups}
- Post-repair source-only: ${packet.summary.postRepairSourceOnly}
- Post-repair canonical-only: ${packet.summary.postRepairCanonicalOnly}

## Artifacts

| Artifact | Path | SHA256 |
| --- | --- | --- |
${artifactRows}

## Forbidden Claims

${packet.forbiddenClaims.map((claim) => `- ${claim}`).join("\n")}

## Preconditions

${packet.preconditions.map((condition) => `- ${condition}`).join("\n")}

## Stop Conditions

${packet.stopConditions.map((condition) => `- ${condition}`).join("\n")}

## Blockers

${packet.blockers.length ? packet.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- None"}
`;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    dryRun: args.get("dry-run") ?? DEFAULT_DRY_RUN,
    sourceReceipt: args.get("source-receipt") ?? DEFAULT_SOURCE_RECEIPT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const packet = buildSkagitAuthorizationPacket({
    dryRun: readJson(paths.dryRun),
    sourceReceipt: readJson(paths.sourceReceipt)
  });
  writeJson(paths.outJson, packet);
  writeText(paths.outMd, renderMarkdown(packet));
  console.log(`Skagit repair authorization packet written: ${path.relative(repoRoot, paths.outJson).replaceAll(path.sep, "/")}`);
  console.log(`State: ${packet.state}`);
  console.log(`Execution enabled: ${packet.executionEnabled ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
