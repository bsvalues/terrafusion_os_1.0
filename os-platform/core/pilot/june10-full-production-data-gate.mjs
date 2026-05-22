#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const REQUIRED_COUNTIES = 39;
const DEFAULT_CROSSWALK = path.join(
  repoRoot,
  "generated",
  "truth",
  "washington-39-county-data-crosswalk.json"
);
const DEFAULT_PHASE_A = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "washington-runtime-expansion-phase-a.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-full-production-data-gate.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-full-production-data-gate.latest.md"
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

function blocker(source, message, evidence = null) {
  return { source, message, evidence };
}

export function evaluateCountyFullDataReadiness(row) {
  const blockers = [];
  const county = row?.county ?? "Unknown";
  const runtimeRows = asNumber(row?.runtimeRows);

  if (row?.classification !== "runtime_proven") {
    blockers.push(`County classification is ${row?.classification ?? "missing"}, not runtime_proven.`);
  }

  if (row?.activationStatus !== "runtime_proven") {
    blockers.push(`Activation status is ${row?.activationStatus ?? "missing"}, not runtime_proven.`);
  }

  if (row?.runtimeClass !== "runtime_proven") {
    blockers.push(`Runtime class is ${row?.runtimeClass ?? "missing"}, not runtime_proven.`);
  }

  if (runtimeRows <= 0) {
    blockers.push("Runtime returned zero rows.");
  }

  if (row?.parcelSemanticsProven !== true) {
    blockers.push("Parcel semantics are not proven.");
  }

  blockers.push(...asArray(row?.blockers).map((item) => String(item)));

  return {
    county,
    ready: blockers.length === 0,
    runtimeRows,
    blockers
  };
}

function applyPhaseAPromotion(rows, phaseA) {
  if (phaseA?.passed !== true || phaseA?.promotion?.fullDataReady !== true || !phaseA?.promotion?.countyRow) {
    return rows;
  }

  return rows.map((row) => (row.county === phaseA.promotion.county ? phaseA.promotion.countyRow : row));
}

export function buildFullProductionDataGateReport({
  crosswalk,
  phaseA = null,
  generatedAtUtc = new Date().toISOString()
}) {
  const rows = applyPhaseAPromotion(asArray(crosswalk?.rows), phaseA);
  const countyResults = rows.map(evaluateCountyFullDataReadiness);
  const fullDataReadyCounties = countyResults.filter((row) => row.ready).length;
  const notFullDataReadyCounties = countyResults.length - fullDataReadyCounties;
  const benton = countyResults.find((row) => row.county === "Benton");
  const bentonOnlyPilot = Boolean(benton?.ready === true && fullDataReadyCounties === 1);
  const blockers = [];

  if (rows.length !== REQUIRED_COUNTIES) {
    blockers.push(
      blocker(
        "county_count",
        `Full production requires ${REQUIRED_COUNTIES} Washington counties in the data gate; found ${rows.length}.`
      )
    );
  }

  if (fullDataReadyCounties !== REQUIRED_COUNTIES) {
    blockers.push(
      blocker(
        "full_county_data",
        `Full production requires full-data readiness for ${REQUIRED_COUNTIES} counties; ${fullDataReadyCounties} are ready and ${REQUIRED_COUNTIES - fullDataReadyCounties} are not ready.`,
        countyResults.filter((row) => !row.ready).slice(0, 12)
      )
    );
  }

  const summary = {
    countiesChecked: rows.length,
    requiredCounties: REQUIRED_COUNTIES,
    fullDataReadyCounties,
    notFullDataReadyCounties,
    bentonOnlyPilot,
    fullProductionDataReady: blockers.length === 0,
    prohibitFullProductionClaim: blockers.length > 0
  };

  return {
    generatedAtUtc,
    sourceCrosswalkGeneratedAt: crosswalk?.generatedAt ?? null,
    sourcePhaseAGeneratedAt: phaseA?.generatedAtUtc ?? null,
    passed: blockers.length === 0,
    summary,
    doctrine: [
      "Full production means full data, not proof scaffolding.",
      "Every Washington county must have TerraFusion DB-backed runtime rows before a 39-county production data claim.",
      "Registry presence, source intelligence, and acquisition work orders are not runtime data.",
      "Benton pilot readiness is useful but does not satisfy full production data readiness.",
      "Product runtime must continue through TerraFusion API over TerraFusion DB."
    ],
    claimRules: {
      allowedClaims:
        blockers.length === 0
          ? ["39-county full production data is ready subject to workflow and deployment gates"]
          : ["Benton runtime pilot may be discussed only if its separate Benton gates pass"],
      forbiddenClaims:
        blockers.length === 0
          ? []
          : [
              "full production data is ready",
              "39-county runtime data is ready",
              "all counties are loaded",
              "all counties can complete full workflows",
              "inventory proof equals production data"
            ]
    },
    countyResults,
    blockers
  };
}

function renderMarkdown(report) {
  const lines = [
    "# June 10 Full Production Data Gate",
    "",
    `Generated: ${report.generatedAtUtc}`,
    "",
    `Verdict: **${report.passed ? "PASS" : "FAIL"}**`,
    "",
    "## Summary",
    "",
    `- Counties checked: ${report.summary.countiesChecked}`,
    `- Required counties: ${report.summary.requiredCounties}`,
    `- Full-data-ready counties: ${report.summary.fullDataReadyCounties}`,
    `- Not-full-data-ready counties: ${report.summary.notFullDataReadyCounties}`,
    `- Benton-only pilot posture: ${report.summary.bentonOnlyPilot}`,
    `- Phase A full-data-ready counties added: ${report.sourcePhaseAGeneratedAt ? (report.summary.bentonOnlyPilot ? 1 : 0) : 0}`,
    `- Full production data ready: ${report.summary.fullProductionDataReady}`,
    `- Prohibit full production claim: ${report.summary.prohibitFullProductionClaim}`,
    "",
    "## Doctrine",
    ""
  ];

  report.doctrine.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Claim Rules", "");
  lines.push("Allowed:");
  report.claimRules.allowedClaims.forEach((item) => lines.push(`- ${item}`));
  lines.push("", "Forbidden:");
  if (report.claimRules.forbiddenClaims.length === 0) lines.push("- None");
  report.claimRules.forbiddenClaims.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## County Results", "");
  lines.push("| County | Ready | Runtime rows | Blockers |");
  lines.push("|---|---:|---:|---|");
  report.countyResults.forEach((row) => {
    lines.push(
      [
        row.county,
        row.ready ? "yes" : "no",
        String(row.runtimeRows),
        row.blockers.length ? row.blockers.join("<br>") : "-"
      ].join(" | ")
    );
  });

  if (report.blockers.length > 0) {
    lines.push("", "## Blockers", "");
    report.blockers.forEach((item) => {
      lines.push(`- ${item.source}: ${item.message}`);
    });
  }

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    crosswalkPath: DEFAULT_CROSSWALK,
    phaseAPath: DEFAULT_PHASE_A,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--crosswalk") args.crosswalkPath = path.resolve(argv[++i]);
    else if (arg === "--phase-a") args.phaseAPath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function runFullProductionDataGate(options = {}) {
  const args = {
    crosswalkPath: DEFAULT_CROSSWALK,
    phaseAPath: DEFAULT_PHASE_A,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true,
    ...options
  };
  const report = buildFullProductionDataGateReport({
    crosswalk: readJson(args.crosswalkPath),
    phaseA: fs.existsSync(args.phaseAPath) ? readJson(args.phaseAPath) : null
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
  const report = runFullProductionDataGate(args);
  console.log(JSON.stringify(report.summary, null, 2));
  if (!report.passed) process.exitCode = 1;
}
