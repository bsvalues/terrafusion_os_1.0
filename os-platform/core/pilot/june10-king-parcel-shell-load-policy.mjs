#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_SOURCE_COMPLETENESS = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-source-completeness-capture.latest.json"
);
const DEFAULT_STAGE_ROWS = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-source-completeness-capture",
  "king-source-only-runtime-shell-stage-list.json"
);
const DEFAULT_OUT_ROOT = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-load-policy"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-load-policy.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-king-parcel-shell-load-policy.latest.md"
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

function isLoadableShellRow(row) {
  return row.loadableAsRuntimeParcelShell === true && row.placeholderReviewRequired !== true;
}

function isPlaceholderReviewRow(row) {
  return row.placeholderReviewRequired === true;
}

function blockedActions() {
  return [
    "owner_address_value_dependent_workflows",
    "valuation_or_cost_claims",
    "appeal_defense_packet_generation",
    "taxpayer_notice_or_official_explanation",
    "sales_ratio_or_assessment_analytics",
    "workflow_certification_or_county_readiness_claim"
  ];
}

function allowedActions() {
  return [
    "parcel_identity_context_representation",
    "county_scoped_parcel_lookup",
    "source_lineage_review",
    "future_enrichment_queueing"
  ];
}

function receiptLanguage({ sourceCompleteness, shellLoadCandidates, placeholderReviewQueue }) {
  return [
    "King source-only rows loaded under this policy are KING_PUBLIC_PARCEL_SHELL rows.",
    "KING_PUBLIC_PARCEL_SHELL means source-backed parcel identity/context only, not certified workflow-complete parcel data.",
    "Owner, situs address, assessed value, valuation, sales, appeal, and official workflow claims remain blocked until a future enrichment receipt proves those fields.",
    `${shellLoadCandidates} normal source-only PINs may be treated as shell-load candidates if a future authorized load transaction preserves this policy.`,
    `${placeholderReviewQueue} placeholder/tract-style PINs remain in review queue unless explicitly approved by a separate load policy.`,
    `Source artifact SHA256: ${sourceCompleteness.artifacts?.rawArtifactSha256 ?? "unknown"}`
  ];
}

export function buildKingParcelShellLoadPolicy({ sourceCompleteness, stageRows }) {
  const runtimeShellEvidenceComplete =
    sourceCompleteness.validation?.allSourceOnlyPinsAccountedFor === true &&
    sourceCompleteness.validation?.runtimeShellFieldsComplete === true &&
    sourceCompleteness.validation?.noDatabaseWrites === true;
  const ownerAddressValueWorkflowComplete =
    sourceCompleteness.validation?.ownerAddressValueWorkflowComplete === true;
  const placeholderRows = stageRows.filter(isPlaceholderReviewRow);
  const normalRows = stageRows.filter(isLoadableShellRow);
  const shellLoadCandidates = runtimeShellEvidenceComplete ? normalRows.length : 0;
  const placeholderReviewQueue = placeholderRows.length;
  const blockers = [];

  if (!runtimeShellEvidenceComplete) {
    blockers.push("King source completeness capture does not prove all required runtime shell fields.");
  }
  if (!ownerAddressValueWorkflowComplete) {
    blockers.push("King parcel shell rows lack owner/address/value fields; workflow-complete certification is blocked.");
  }
  if (placeholderReviewQueue > 0) {
    blockers.push(`${placeholderReviewQueue} King source-only PINs are placeholder/tract-style rows and remain in review queue.`);
  }

  return {
    generatedAt: new Date().toISOString(),
    countyName: "King County",
    fips: "53033",
    scope: "King parcel shell load policy",
    trustLabel: "KING_PUBLIC_PARCEL_SHELL",
    databaseMutationAllowed: false,
    databaseMutationAttempted: false,
    productionBindingAllowed: false,
    certificationAllowed: false,
    policy: {
      allowParcelShellRowsInCanonicalRuntime: runtimeShellEvidenceComplete,
      shellRowsAreWorkflowComplete: false,
      normalSourceOnlyDisposition: runtimeShellEvidenceComplete ? "shell_load_candidate" : "blocked_missing_shell_evidence",
      placeholderTractDisposition: "hold_in_review_queue",
      requiredFutureReceipt: "king_public_parcel_shell_enrichment_receipt",
      requiredFutureFields: ["owner name", "situs address", "assessed value"],
      allowedActions: allowedActions(),
      blockedActions: blockedActions()
    },
    loadabilityMatrix: {
      sourceOnlyPins: sourceCompleteness.summary?.requestedSourceOnlyPins ?? stageRows.length,
      presentInRicherSourceArtifact: sourceCompleteness.summary?.presentInRicherSourceArtifact ?? 0,
      loadableAsRuntimeParcelShell: sourceCompleteness.summary?.loadableAsRuntimeParcelShell ?? 0,
      shellLoadCandidates,
      placeholderReviewQueue,
      workflowCompleteRows: ownerAddressValueWorkflowComplete ? shellLoadCandidates : 0,
      certificationRows: 0
    },
    shellLoadCandidates: normalRows,
    placeholderReviewQueue: placeholderRows,
    blockedActions: blockedActions(),
    allowedActions: allowedActions(),
    receiptLanguage: receiptLanguage({
      sourceCompleteness,
      shellLoadCandidates,
      placeholderReviewQueue
    }),
    artifacts: {
      sourceCompleteness: sourceCompleteness.artifacts ?? {},
      sourceCompletenessReport: "os-platform/core/pilot/evidence/june10-king-source-completeness-capture.latest.json"
    },
    blockers
  };
}

function renderMarkdown(policy) {
  const blockers = policy.blockers.length ? policy.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none";
  const blocked = policy.blockedActions.map((action) => `- ${action}`).join("\n");
  const allowed = policy.allowedActions.map((action) => `- ${action}`).join("\n");
  const receipt = policy.receiptLanguage.map((line) => `- ${line}`).join("\n");
  return `# King Parcel Shell Load Policy

Generated: ${policy.generatedAt}

## Verdict

- Trust label: ${policy.trustLabel}
- Parcel shell rows allowed in canonical runtime: ${policy.policy.allowParcelShellRowsInCanonicalRuntime ? "yes" : "no"}
- Shell rows workflow complete: ${policy.policy.shellRowsAreWorkflowComplete ? "yes" : "no"}
- Production binding allowed: ${policy.productionBindingAllowed ? "yes" : "no"}
- Certification allowed: ${policy.certificationAllowed ? "yes" : "no"}
- Database mutation attempted: ${policy.databaseMutationAttempted ? "yes" : "no"}

## Loadability Matrix

| Metric | Count |
| --- | ---: |
| Source-only PINs | ${policy.loadabilityMatrix.sourceOnlyPins} |
| Present in richer source artifact | ${policy.loadabilityMatrix.presentInRicherSourceArtifact} |
| Loadable as runtime parcel shell | ${policy.loadabilityMatrix.loadableAsRuntimeParcelShell} |
| Shell-load candidates | ${policy.loadabilityMatrix.shellLoadCandidates} |
| Placeholder review queue | ${policy.loadabilityMatrix.placeholderReviewQueue} |
| Workflow-complete rows | ${policy.loadabilityMatrix.workflowCompleteRows} |
| Certification rows | ${policy.loadabilityMatrix.certificationRows} |

## Allowed Actions

${allowed}

## Blocked Actions

${blocked}

## Receipt Language

${receipt}

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

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const paths = {
    sourceCompleteness: args.get("source-completeness") ?? DEFAULT_SOURCE_COMPLETENESS,
    stageRows: args.get("stage-rows") ?? DEFAULT_STAGE_ROWS,
    outRoot: args.get("out-root") ?? DEFAULT_OUT_ROOT,
    outJson: args.get("out-json") ?? DEFAULT_OUT_JSON,
    outMd: args.get("out-md") ?? DEFAULT_OUT_MD
  };
  const policy = buildKingParcelShellLoadPolicy({
    sourceCompleteness: readJson(paths.sourceCompleteness),
    stageRows: readJson(paths.stageRows)
  });

  writeJson(paths.outJson, policy);
  writeText(paths.outMd, renderMarkdown(policy));
  writeJson(path.join(paths.outRoot, "king-parcel-shell-load-policy.json"), policy.policy);
  writeJson(path.join(paths.outRoot, "king-parcel-shell-loadability-matrix.json"), policy.loadabilityMatrix);
  writeJson(path.join(paths.outRoot, "king-parcel-shell-load-candidates.json"), policy.shellLoadCandidates);
  writeJson(path.join(paths.outRoot, "king-placeholder-review-queue.json"), policy.placeholderReviewQueue);

  console.log(`King parcel shell load policy written: ${repoRelative(paths.outJson)}`);
  console.log(`Shell-load candidates: ${policy.loadabilityMatrix.shellLoadCandidates}`);
  console.log(`Placeholder review queue: ${policy.loadabilityMatrix.placeholderReviewQueue}`);
  console.log(`Certification allowed: ${policy.certificationAllowed ? "yes" : "no"}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
