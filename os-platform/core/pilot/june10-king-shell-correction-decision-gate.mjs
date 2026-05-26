#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const APPROVAL_PHRASE = "I explicitly authorize the King shell identity correction transaction only.";
const DEFAULT_AUTHORIZATION_PACKET = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-shell-correction-authorization-packet.latest.json"
);
const DEFAULT_TRANSACTION_DRY_RUN = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-correction-transaction-dry-run.latest.json"
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
  "june10-king-shell-correction-decision-gate"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-shell-correction-decision-gate.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-shell-correction-decision-gate.latest.md"
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfPresent(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return readJson(filePath);
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

function hashOrNull(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return sha256File(filePath);
}

function sourceArtifactPathFromCompleteness(sourceCompleteness) {
  const rawPath = sourceCompleteness?.artifacts?.rawArtifactPath;
  if (!rawPath) return null;
  return path.isAbsolute(rawPath) ? rawPath : path.join(repoRoot, rawPath);
}

function allRequiredChecklistAccepted(packet, approval) {
  const accepted = new Set(approval?.acceptedChecklistIds ?? []);
  return (packet.humanApprovalChecklist ?? [])
    .filter((item) => item.required === true)
    .every((item) => accepted.has(item.id));
}

function buildApprovalToken({ enabled, state, authorizationPacketHash, dryRunHash, sourceArtifactHash }) {
  return {
    enabled,
    tokenFormat: "KING-SHELL-CORRECTION:<packet-sha256>:<dry-run-sha256>:<source-sha256>",
    token:
      enabled && authorizationPacketHash && dryRunHash && sourceArtifactHash
        ? `KING-SHELL-CORRECTION:${authorizationPacketHash}:${dryRunHash}:${sourceArtifactHash}`
        : null,
    state,
    unlocks: enabled ? ["bounded_king_shell_identity_correction"] : [],
    remainsForbidden: [
      "King certification",
      "workflow-complete claims",
      "owner/address/value claims",
      "placeholder/tract insertion",
      "production binding"
    ]
  };
}

export function buildKingShellCorrectionDecisionGate({
  authorizationPacket,
  expectedAuthorizationPacketHash,
  actualAuthorizationPacketHash,
  expectedDryRunHash,
  actualDryRunHash,
  expectedSourceArtifactHash,
  actualSourceArtifactHash,
  rollbackSqlExists,
  worktreeClean,
  latestTestsPassed,
  decision = "none",
  humanApproval = null
}) {
  const blockers = [];
  const staleReasons = [];

  if (expectedAuthorizationPacketHash !== actualAuthorizationPacketHash) {
    staleReasons.push("authorization packet hash changed");
  }
  if (expectedDryRunHash !== actualDryRunHash) {
    staleReasons.push("dry-run hash changed");
  }
  if (expectedSourceArtifactHash !== actualSourceArtifactHash) {
    staleReasons.push("source artifact hash changed");
  }
  for (const reason of staleReasons) blockers.push(`Stale evidence: ${reason}.`);
  if (!rollbackSqlExists) blockers.push("Rollback SQL does not exist.");
  if (!worktreeClean) blockers.push("Branch/worktree is not clean.");
  if (!latestTestsPassed) blockers.push("Latest tests have not passed.");

  const approvalPhraseMatches = humanApproval?.phrase === APPROVAL_PHRASE;
  const checklistAccepted = allRequiredChecklistAccepted(authorizationPacket, humanApproval);
  const preconditionsPass =
    blockers.length === 0 &&
    authorizationPacket.authorizationStatus === "READY_FOR_HUMAN_DECISION" &&
    authorizationPacket.certificationAllowed === false &&
    authorizationPacket.productionBindingAllowed === false;

  let state = "READY_FOR_HUMAN_DECISION";
  if (staleReasons.length > 0) {
    state = "EXPIRED_STALE_EVIDENCE";
  } else if (decision === "reject") {
    state = "REJECTED";
  } else if (decision === "approve") {
    if (preconditionsPass && approvalPhraseMatches && checklistAccepted) {
      state = "APPROVED_FOR_SHELL_CORRECTION";
    } else {
      state = "READY_FOR_HUMAN_DECISION";
      if (!approvalPhraseMatches) blockers.push("Human approval phrase did not match the required bounded authorization phrase.");
      if (!checklistAccepted) blockers.push("Human approval checklist was not fully accepted.");
    }
  } else if (!preconditionsPass && blockers.length > 0) {
    state = "READY_FOR_HUMAN_DECISION";
  }

  const executionEnabled = state === "APPROVED_FOR_SHELL_CORRECTION";
  return {
    generatedAt: new Date().toISOString(),
    gateType: "king_shell_correction_decision_gate",
    countyName: "King County",
    fips: "53033",
    state,
    decision,
    executionEnabled,
    databaseMutationAttempted: false,
    certificationAllowed: false,
    productionBindingAllowed: false,
    approvalToken: buildApprovalToken({
      enabled: executionEnabled,
      state,
      authorizationPacketHash: actualAuthorizationPacketHash,
      dryRunHash: actualDryRunHash,
      sourceArtifactHash: actualSourceArtifactHash
    }),
    evidenceHashes: {
      authorizationPacket: {
        expected: expectedAuthorizationPacketHash,
        actual: actualAuthorizationPacketHash,
        matches: expectedAuthorizationPacketHash === actualAuthorizationPacketHash
      },
      transactionDryRun: {
        expected: expectedDryRunHash,
        actual: actualDryRunHash,
        matches: expectedDryRunHash === actualDryRunHash
      },
      sourceArtifact: {
        expected: expectedSourceArtifactHash,
        actual: actualSourceArtifactHash,
        matches: expectedSourceArtifactHash === actualSourceArtifactHash
      }
    },
    approvalChecks: {
      rollbackSqlExists,
      worktreeClean,
      latestTestsPassed,
      humanApprovalPhraseMatches: approvalPhraseMatches,
      humanApprovalChecklistAccepted: checklistAccepted
    },
    allowedUnlocks: executionEnabled ? ["bounded_king_shell_identity_correction"] : [],
    forbiddenApprovals: [
      "King certification",
      "workflow-complete claims",
      "owner/address/value claims",
      "placeholder/tract insertion",
      "production binding"
    ],
    blockers
  };
}

function renderMarkdown(gate) {
  const blockers = gate.blockers.length ? gate.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  const forbidden = gate.forbiddenApprovals.map((item) => `- ${item}`).join("\n");
  return `# King Shell Correction Decision Gate

Generated: ${gate.generatedAt}

## Verdict

- State: ${gate.state}
- Decision input: ${gate.decision}
- Execution enabled: ${gate.executionEnabled ? "yes" : "no"}
- Database mutation attempted: ${gate.databaseMutationAttempted ? "yes" : "no"}
- Certification allowed: ${gate.certificationAllowed ? "yes" : "no"}
- Production binding allowed: ${gate.productionBindingAllowed ? "yes" : "no"}

## Evidence Hashes

| Evidence | Matches |
| --- | --- |
| Authorization packet | ${gate.evidenceHashes.authorizationPacket.matches ? "yes" : "no"} |
| Transaction dry-run | ${gate.evidenceHashes.transactionDryRun.matches ? "yes" : "no"} |
| Source artifact | ${gate.evidenceHashes.sourceArtifact.matches ? "yes" : "no"} |

## Approval Checks

| Check | Passed |
| --- | --- |
| Rollback SQL exists | ${gate.approvalChecks.rollbackSqlExists ? "yes" : "no"} |
| Worktree clean | ${gate.approvalChecks.worktreeClean ? "yes" : "no"} |
| Latest tests passed | ${gate.approvalChecks.latestTestsPassed ? "yes" : "no"} |
| Human approval phrase matches | ${gate.approvalChecks.humanApprovalPhraseMatches ? "yes" : "no"} |
| Human approval checklist accepted | ${gate.approvalChecks.humanApprovalChecklistAccepted ? "yes" : "no"} |

## Approval Token

- Enabled: ${gate.approvalToken.enabled ? "yes" : "no"}
- Format: ${gate.approvalToken.tokenFormat}

## Still Forbidden

${forbidden}

## Blockers

${blockers}
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

function parseBool(value) {
  return String(value).toLowerCase() === "true";
}

function parseHumanApproval(args) {
  const phrase = args.get("approval-phrase") ?? null;
  const acceptedChecklistIds = (args.get("accepted-checklist-ids") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return phrase || acceptedChecklistIds.length > 0 ? { phrase, acceptedChecklistIds } : null;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    authorizationPacket: args.get("authorization-packet") ?? DEFAULT_AUTHORIZATION_PACKET,
    transactionDryRun: args.get("transaction-dry-run") ?? DEFAULT_TRANSACTION_DRY_RUN,
    sourceCompleteness: args.get("source-completeness") ?? DEFAULT_SOURCE_COMPLETENESS,
    sourceArtifact: args.get("source-artifact") ?? null,
    rollbackSql: args.get("rollback-sql") ?? DEFAULT_ROLLBACK_SQL,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const authorizationPacket = readJson(paths.authorizationPacket);
  const sourceCompleteness = readJsonIfPresent(paths.sourceCompleteness);
  const sourceArtifactPath = paths.sourceArtifact ?? sourceArtifactPathFromCompleteness(sourceCompleteness);
  const authorizationPacketHash = hashOrNull(paths.authorizationPacket);
  const dryRunHash = hashOrNull(paths.transactionDryRun);
  const sourceArtifactHash = hashOrNull(sourceArtifactPath);
  const gate = buildKingShellCorrectionDecisionGate({
    authorizationPacket,
    expectedAuthorizationPacketHash: args.get("expected-authorization-packet-hash") ?? authorizationPacketHash,
    actualAuthorizationPacketHash: authorizationPacketHash,
    expectedDryRunHash: args.get("expected-dry-run-hash") ?? dryRunHash,
    actualDryRunHash: dryRunHash,
    expectedSourceArtifactHash: args.get("expected-source-artifact-hash") ?? sourceArtifactHash,
    actualSourceArtifactHash: sourceArtifactHash,
    rollbackSqlExists: fs.existsSync(paths.rollbackSql),
    worktreeClean: parseBool(args.get("worktree-clean") ?? "false"),
    latestTestsPassed: parseBool(args.get("latest-tests-passed") ?? "false"),
    decision: args.get("decision") ?? "none",
    humanApproval: parseHumanApproval(args)
  });

  writeJson(paths.outJson, gate);
  writeText(paths.outMd, renderMarkdown(gate));
  writeJson(path.join(paths.outRoot, "decision-gate-state.json"), gate);
  writeJson(path.join(paths.outRoot, "approval-token.disabled.json"), {
    ...gate.approvalToken,
    enabled: false,
    token: null,
    note: "Token is disabled by default; approval requires explicit human phrase and fresh precondition checks."
  });
  writeJson(path.join(paths.outRoot, "forbidden-approvals.json"), gate.forbiddenApprovals);

  console.log(`King shell correction decision gate written: ${repoRelative(paths.outJson)}`);
  console.log(`State: ${gate.state}`);
  console.log(`Execution enabled: ${gate.executionEnabled ? "yes" : "no"}`);
  console.log(`Certification allowed: ${gate.certificationAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
