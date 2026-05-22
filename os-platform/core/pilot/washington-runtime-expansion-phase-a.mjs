#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_SYNC_OBSERVATION = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "sync-drain-observation.latest.json"
);
const DEFAULT_RUNTIME_DB_CONTENT = path.join(repoRoot, "generated", "truth", "runtime-db-content-audit.json");
const DEFAULT_PRODUCT_LOAD_LEDGER = path.join(repoRoot, "generated", "truth", "terrafusion-db-product-load-ledger.json");
const DEFAULT_PARCEL_SANITY = path.join(repoRoot, "generated", "truth", "benton-parcel-count-sanity.json");
const DEFAULT_RUNTIME_REGISTRATION = path.join(repoRoot, "generated", "truth", "county-runtime-registration-ledger.json");
const DEFAULT_ROW_PATH_PROOF = path.join(repoRoot, "generated", "truth", "runtime-row-path-proof.json");
const DEFAULT_WORKFLOW_PROOF = path.join(repoRoot, "generated", "truth", "benton-runtime-pilot-closure.json");
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "washington-runtime-expansion-phase-a.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "washington-runtime-expansion-phase-a.latest.md"
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function addBlocker(blockers, source, message, evidence = null) {
  blockers.push({ source, message, evidence });
}

function findLedgerRow(productLoadLedger, tableName) {
  const normalized = tableName.toLowerCase();
  return asArray(productLoadLedger?.rows).find((row) => String(row.tableName ?? "").toLowerCase() === normalized) ?? null;
}

function findBentonRegistration(runtimeRegistration) {
  return asArray(runtimeRegistration?.rows).find((row) => row.county === "Benton") ?? null;
}

function findBentonRowPath(rowPathProof) {
  return asArray(rowPathProof?.proofs).find((row) => row.county === "Benton") ?? null;
}

function isSyncTerminal(syncObservation) {
  const interpretation = syncObservation?.interpretation ?? {};
  return (
    interpretation.drainStillActive === false &&
    interpretation.safeToRegenerateRuntimeTruthPackets === true &&
    /^(COMPLETED|TERMINAL|SUCCEEDED|SUCCESS)$/i.test(String(interpretation.terminalStatus ?? ""))
  );
}

function productLoadLineageProven(productLoadLedger) {
  const parcel = findLedgerRow(productLoadLedger, "canonical_tf.tf_parcel");
  return Boolean(
    productLoadLedger?.passed === true &&
      parcel &&
      parcel.lineageStatus === "lineage_proven" &&
      asNumber(parcel.rowCount) > 0 &&
      asArray(parcel.blockers).length === 0
  );
}

function canonicalParcelProven({ runtimeDbContent, productLoadLedger }) {
  return Boolean(runtimeDbContent?.passed === true && productLoadLineageProven(productLoadLedger));
}

function activeCurrentParcelSemanticsProven(parcelSanity) {
  const behavior = parcelSanity?.endpointBehavior ?? {};
  return Boolean(
    parcelSanity?.passed === true &&
      parcelSanity?.distinctActiveParcelNumbers > 0 &&
      behavior.endpointStatus === 200 &&
      behavior.selectedCountyEchoed === true &&
      behavior.activeCurrentSemanticsProven === true &&
      behavior.appliesCountyFilter === true &&
      behavior.appliesActiveFilter === true &&
      behavior.appliesCurrentYearFilter === true &&
      behavior.collapsesParcelVersions === true
  );
}

function endpointRuntimeRegistrationProven({ runtimeRegistration, rowPathProof }) {
  const registration = findBentonRegistration(runtimeRegistration);
  const rowPath = findBentonRowPath(rowPathProof);

  return Boolean(
    registration?.readinessClass === "runtime_proven" &&
      registration?.selectedCountyEchoed === true &&
      registration?.silentBentonFallbackDetected === false &&
      asNumber(registration?.runtimeRows) > 0 &&
      rowPath?.passed === true &&
      rowPath?.endpointStatus === 200 &&
      rowPath?.selectedCountyEchoed === true &&
      rowPath?.silentBentonFallbackDetected === false &&
      asNumber(rowPath?.runtimeRowsReturned) > 0
  );
}

function workflowDomainUsabilityProven(workflowProof) {
  const benton = workflowProof?.benton ?? {};
  return Boolean(
    workflowProof?.status === "PASS" &&
      asArray(workflowProof?.blockers).length === 0 &&
      benton.saleQualificationClassification === "canonical_landing_backed" &&
      asNumber(benton.canonicalSaleQualifications) > 0 &&
      asNumber(benton.ratioStudyEffectiveQualified) > 0 &&
      asNumber(benton.ratioStudyDecisionQualified) > 0
  );
}

export function buildWashingtonRuntimeExpansionPhaseAReport({
  syncObservation,
  runtimeDbContent,
  productLoadLedger,
  parcelSanity,
  runtimeRegistration,
  rowPathProof,
  workflowProof,
  generatedAtUtc = new Date().toISOString()
}) {
  const blockers = [];
  const syncTerminal = isSyncTerminal(syncObservation);
  const canonicalParcel = canonicalParcelProven({ runtimeDbContent, productLoadLedger });
  const productLoadLineage = productLoadLineageProven(productLoadLedger);
  const parcelSemantics = activeCurrentParcelSemanticsProven(parcelSanity);
  const endpointRegistration = endpointRuntimeRegistrationProven({ runtimeRegistration, rowPathProof });
  const workflowDomain = workflowDomainUsabilityProven(workflowProof);

  if (!syncTerminal) {
    addBlocker(
      blockers,
      "sync_terminal",
      "TerraFusion Sync is not terminal; production DB mutation and promotion remain blocked.",
      `drainStillActive=${syncObservation?.interpretation?.drainStillActive ?? "unknown"}; terminalStatus=${syncObservation?.interpretation?.terminalStatus ?? "missing"}`
    );
  }

  if (!canonicalParcel) {
    addBlocker(blockers, "canonical_parcel", "Canonical Benton parcel table/projection is not proven.");
  }

  if (!parcelSemantics) {
    addBlocker(blockers, "parcel_semantics", "Active/current Benton parcel semantics are not proven.");
  }

  if (!productLoadLineage) {
    addBlocker(blockers, "product_load_lineage", "Benton product-load receipt lineage is not proven.");
  }

  if (!endpointRegistration) {
    addBlocker(blockers, "endpoint_runtime_registration", "Benton endpoint runtime registration is not proven.");
  }

  if (!workflowDomain) {
    addBlocker(
      blockers,
      "workflow_domain",
      "Benton workflow/domain usability is not proven.",
      asArray(workflowProof?.blockers).join("; ") || null
    );
  }

  const passed = blockers.length === 0;
  const status = !syncTerminal ? "WAITING_SYNC_TERMINAL" : passed ? "PASS" : "FAIL";
  const runtimeRows = asNumber(parcelSanity?.distinctActiveParcelNumbers);

  return {
    generatedAtUtc,
    slice: "Washington Runtime Expansion Phase A",
    targetCounty: "Benton",
    status,
    passed,
    runtimeMutationAllowed: false,
    doctrine: [
      "Target Benton only.",
      "Do not mutate production while Sync is active.",
      "Benton can become 1/39 full-data-ready only after terminal Sync and all runtime proof gates pass.",
      "38 remaining counties stay blocked until their own acquisition/load/runtime proof is complete."
    ],
    summary: {
      targetCounty: "Benton",
      syncTerminal,
      canonicalParcelProven: canonicalParcel,
      activeCurrentParcelSemanticsProven: parcelSemantics,
      productLoadLineageProven: productLoadLineage,
      endpointRuntimeRegistrationProven: endpointRegistration,
      workflowDomainUsabilityProven: workflowDomain,
      fullDataReadyCountiesAdded: passed ? 1 : 0
    },
    promotion: {
      county: "Benton",
      fullDataReady: passed,
      countyRow: passed
        ? {
            county: "Benton",
            state: "WA",
            classification: "runtime_proven",
            activationStatus: "runtime_proven",
            runtimeClass: "runtime_proven",
            runtimeRows,
            parcelSemanticsProven: true,
            blockers: []
          }
        : null
    },
    blockers,
    expectedFullProductionDataGateResultAfterPromotion: passed
      ? "1/39 ready, 38/39 blocked"
      : "0/39 ready until Benton Phase A passes"
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Washington Runtime Expansion Phase A",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Target: **${report.targetCounty}**`,
    `Verdict: **${report.status}**`,
    "",
    "## Summary",
    "",
    `- Sync terminal: ${report.summary.syncTerminal}`,
    `- Canonical parcel proven: ${report.summary.canonicalParcelProven}`,
    `- Active/current parcel semantics proven: ${report.summary.activeCurrentParcelSemanticsProven}`,
    `- Product-load lineage proven: ${report.summary.productLoadLineageProven}`,
    `- Endpoint runtime registration proven: ${report.summary.endpointRuntimeRegistrationProven}`,
    `- Workflow/domain usability proven: ${report.summary.workflowDomainUsabilityProven}`,
    `- Full-data-ready counties added: ${report.summary.fullDataReadyCountiesAdded}`,
    `- Expected full-production gate result: ${report.expectedFullProductionDataGateResultAfterPromotion}`,
    "",
    "## Doctrine",
    ""
  ];

  report.doctrine.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Blockers", "");
  if (report.blockers.length === 0) {
    lines.push("- None");
  } else {
    report.blockers.forEach((item) =>
      lines.push(`- **${item.source}**: ${item.message}${item.evidence ? ` (${item.evidence})` : ""}`)
    );
  }

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    syncObservationPath: DEFAULT_SYNC_OBSERVATION,
    runtimeDbContentPath: DEFAULT_RUNTIME_DB_CONTENT,
    productLoadLedgerPath: DEFAULT_PRODUCT_LOAD_LEDGER,
    parcelSanityPath: DEFAULT_PARCEL_SANITY,
    runtimeRegistrationPath: DEFAULT_RUNTIME_REGISTRATION,
    rowPathProofPath: DEFAULT_ROW_PATH_PROOF,
    workflowProofPath: DEFAULT_WORKFLOW_PROOF,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--sync-observation") args.syncObservationPath = path.resolve(argv[++i]);
    else if (arg === "--runtime-db-content") args.runtimeDbContentPath = path.resolve(argv[++i]);
    else if (arg === "--product-load-ledger") args.productLoadLedgerPath = path.resolve(argv[++i]);
    else if (arg === "--parcel-sanity") args.parcelSanityPath = path.resolve(argv[++i]);
    else if (arg === "--runtime-registration") args.runtimeRegistrationPath = path.resolve(argv[++i]);
    else if (arg === "--row-path-proof") args.rowPathProofPath = path.resolve(argv[++i]);
    else if (arg === "--workflow-proof") args.workflowProofPath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function runWashingtonRuntimeExpansionPhaseA(options = {}) {
  const args = {
    syncObservationPath: DEFAULT_SYNC_OBSERVATION,
    runtimeDbContentPath: DEFAULT_RUNTIME_DB_CONTENT,
    productLoadLedgerPath: DEFAULT_PRODUCT_LOAD_LEDGER,
    parcelSanityPath: DEFAULT_PARCEL_SANITY,
    runtimeRegistrationPath: DEFAULT_RUNTIME_REGISTRATION,
    rowPathProofPath: DEFAULT_ROW_PATH_PROOF,
    workflowProofPath: DEFAULT_WORKFLOW_PROOF,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true,
    ...options
  };

  const report = buildWashingtonRuntimeExpansionPhaseAReport({
    syncObservation: readJson(args.syncObservationPath),
    runtimeDbContent: readJson(args.runtimeDbContentPath),
    productLoadLedger: readJson(args.productLoadLedgerPath),
    parcelSanity: readJson(args.parcelSanityPath),
    runtimeRegistration: readJson(args.runtimeRegistrationPath),
    rowPathProof: readJson(args.rowPathProofPath),
    workflowProof: readJson(args.workflowProofPath)
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
  const report = runWashingtonRuntimeExpansionPhaseA(args);
  console.log(
    JSON.stringify(
      {
        status: report.status,
        passed: report.passed,
        fullDataReadyCountiesAdded: report.summary.fullDataReadyCountiesAdded,
        blockers: report.blockers.length
      },
      null,
      2
    )
  );
  if (!report.passed) process.exitCode = 1;
}
