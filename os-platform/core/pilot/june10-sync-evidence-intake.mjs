#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_PRODUCT_LOAD_LEDGER = path.join(
  repoRoot,
  "generated",
  "truth",
  "terrafusion-db-product-load-ledger.json"
);
const DEFAULT_BENTON_CORPUS = path.join(repoRoot, "evidence", "2026-05-13-benton-full-corpus-ATTEMPT.json");
const DEFAULT_DRAIN_OBSERVATION = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "sync-drain-observation.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-sync-evidence-intake.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-sync-evidence-intake.latest.md"
);

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function failedClauses(bentonCorpus) {
  return (bentonCorpus?.verdict?.clauses ?? []).filter((clause) => clause.pass !== true).map((clause) => clause.name);
}

function unprovenTables(productLoadLedger) {
  return (productLoadLedger?.rows ?? [])
    .filter((row) => row.lineageStatus !== "lineage_proven")
    .map((row) => ({
      tableName: row.tableName,
      productDomain: row.productDomain ?? "unknown",
      rowCount: row.rowCount ?? null,
      lineageStatus: row.lineageStatus ?? "unknown",
      blockers: row.blockers ?? []
    }));
}

function buildBlockers({ productLoadLedger, bentonCorpus, drainObservation }) {
  const blockers = [];

  if (!productLoadLedger) {
    blockers.push("Product-load ledger artifact is missing.");
  } else {
    if (productLoadLedger.passed !== true) blockers.push("Product-load ledger is not passing.");
    if (productLoadLedger.receiptEvidence?.exists !== true) blockers.push("ProductLoadReceipts evidence is missing.");
    if ((productLoadLedger.summary?.lineageProven ?? 0) <= 0) blockers.push("No product table has lineage-proven status.");
    for (const table of unprovenTables(productLoadLedger)) {
      blockers.push(`${table.tableName}: ${table.lineageStatus}.`);
    }
  }

  if (!bentonCorpus) {
    blockers.push("Benton full-corpus evidence artifact is missing.");
  } else {
    if (bentonCorpus.verdict?.sealed !== true) blockers.push("Benton full-corpus evidence is ATTEMPT or missing seal.");
    if (bentonCorpus.summary?.runStatus && bentonCorpus.summary.runStatus !== "Completed") {
      blockers.push(`Benton corpus run status is ${bentonCorpus.summary.runStatus}.`);
    }
    for (const clause of failedClauses(bentonCorpus)) {
      blockers.push(`Benton corpus clause failed: ${clause}.`);
    }
  }

  if (drainObservation?.interpretation?.drainStillActive === true) {
    blockers.push("Sync drain observation says drain is still active.");
  }
  if (drainObservation?.interpretation?.safeToRegenerateRuntimeTruthPackets === false) {
    blockers.push("Runtime truth packets are not safe to regenerate yet.");
  }

  return blockers;
}

function statusFor(blockers) {
  if (blockers.length === 0) return "ACCEPTED_FOR_BENTON_CLOSURE";
  return "WAITING_SYNC_DB_EVIDENCE";
}

export function buildJune10SyncEvidenceIntake({ productLoadLedger, bentonCorpus, drainObservation }) {
  const blockers = buildBlockers({ productLoadLedger, bentonCorpus, drainObservation });
  const intakeStatus = statusFor(blockers);
  const canRunBentonClosure = intakeStatus === "ACCEPTED_FOR_BENTON_CLOSURE";

  return {
    generatedAtUtc: new Date().toISOString(),
    intakeStatus,
    canRunBentonClosure,
    summary: {
      productLoadLedgerPassed: productLoadLedger?.passed ?? null,
      productLoadReceiptsExist: productLoadLedger?.receiptEvidence?.exists ?? null,
      productLoadReceiptRows: productLoadLedger?.receiptEvidence?.rowCount ?? null,
      lineageProvenTables: productLoadLedger?.summary?.lineageProven ?? null,
      unprovenTables: unprovenTables(productLoadLedger).length,
      bentonCorpusSealed: bentonCorpus?.verdict?.sealed ?? null,
      bentonCorpusRunStatus: bentonCorpus?.summary?.runStatus ?? null,
      failedCorpusClauses: failedClauses(bentonCorpus).length,
      drainStillActive: drainObservation?.interpretation?.drainStillActive ?? null,
      safeToRegenerateRuntimeTruthPackets:
        drainObservation?.interpretation?.safeToRegenerateRuntimeTruthPackets ?? null,
      blockers: blockers.length
    },
    blockers,
    unprovenTables: unprovenTables(productLoadLedger),
    failedCorpusClauses: failedClauses(bentonCorpus),
    nextCommands: canRunBentonClosure
      ? [
          "pnpm run truth:benton-runtime-pilot-closure",
          "pnpm run truth:june10-red-team",
          "pnpm run truth:june10-launch-control"
        ]
      : [
          "pnpm run truth:terrafusion-db-product-load-ledger",
          "pnpm run truth:june10-sync-evidence-intake",
          "pnpm run truth:june10-p0-burndown"
        ],
    rules: [
      "This gate accepts evidence artifacts only; it does not inspect upstream source systems.",
      "Benton closure may run only after product-load receipts and sealed corpus evidence pass.",
      "ATTEMPT artifacts are useful evidence, but they do not unblock launch-control closure.",
      "Runtime truth packets should not be regenerated while drain evidence says regeneration is unsafe."
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Sync Evidence Intake",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Intake status: ${report.intakeStatus}`,
    `Can run Benton closure: ${report.canRunBentonClosure}`,
    "",
    "## Summary",
    "",
    `- Product-load ledger passed: ${report.summary.productLoadLedgerPassed ?? "unknown"}`,
    `- ProductLoadReceipts exist: ${report.summary.productLoadReceiptsExist ?? "unknown"}`,
    `- ProductLoadReceipt rows: ${report.summary.productLoadReceiptRows ?? "unknown"}`,
    `- Lineage-proven tables: ${report.summary.lineageProvenTables ?? "unknown"}`,
    `- Unproven tables: ${report.summary.unprovenTables}`,
    `- Benton corpus sealed: ${report.summary.bentonCorpusSealed ?? "unknown"}`,
    `- Benton corpus run status: ${report.summary.bentonCorpusRunStatus ?? "unknown"}`,
    `- Failed corpus clauses: ${report.summary.failedCorpusClauses}`,
    `- Drain still active: ${report.summary.drainStillActive ?? "unknown"}`,
    `- Safe to regenerate runtime truth packets: ${report.summary.safeToRegenerateRuntimeTruthPackets ?? "unknown"}`,
    `- Blockers: ${report.summary.blockers}`,
    "",
    "## Blockers",
    ""
  ];

  if (report.blockers.length === 0) lines.push("- None");
  else report.blockers.forEach((blocker) => lines.push(`- ${blocker}`));

  lines.push("", "## Next Commands", "");
  report.nextCommands.forEach((command) => lines.push(`- \`${command}\``));

  lines.push("", "## Rules", "");
  report.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    productLoadLedgerPath: DEFAULT_PRODUCT_LOAD_LEDGER,
    bentonCorpusPath: DEFAULT_BENTON_CORPUS,
    drainObservationPath: DEFAULT_DRAIN_OBSERVATION,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--product-load-ledger") args.productLoadLedgerPath = path.resolve(argv[++i]);
    else if (arg === "--benton-corpus") args.bentonCorpusPath = path.resolve(argv[++i]);
    else if (arg === "--drain-observation") args.drainObservationPath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildJune10SyncEvidenceIntake({
    productLoadLedger: readJson(args.productLoadLedgerPath, null),
    bentonCorpus: readJson(args.bentonCorpusPath, null),
    drainObservation: readJson(args.drainObservationPath, null)
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(report));
  }

  console.log(
    JSON.stringify(
      {
        intakeStatus: report.intakeStatus,
        canRunBentonClosure: report.canRunBentonClosure,
        blockers: report.summary.blockers,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
