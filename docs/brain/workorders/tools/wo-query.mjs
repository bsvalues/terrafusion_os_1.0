#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_REGISTRY = "docs/brain/workorders/registry/work-order-registry.seed.json";
const DEFAULT_RULES = "docs/brain/workorders/scoring/next-work-order-scoring.rules.json";
const RISK_ORDER = ["R0", "R1", "R2", "R3", "R4", "R5"];
const TERMINAL_STATUSES = new Set(["complete", "merged", "cancelled", "superseded"]);
const ACTIVE_STATUSES = new Set(["in_progress", "pr_open"]);
const SELECTABLE_STATUSES = new Set(["ready", "planned", "proposed"]);
const BLOCKED_STATUSES = new Set(["blocked", "failed", "needs_human", "deferred"]);

function parseArgs(argv) {
  const args = {
    registry: DEFAULT_REGISTRY,
    rules: DEFAULT_RULES,
    authority: "R2",
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      args.json = true;
    } else if (arg === "--registry") {
      args.registry = argv[++index];
    } else if (arg === "--rules") {
      args.rules = argv[++index];
    } else if (arg === "--authority") {
      args.authority = argv[++index];
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!RISK_ORDER.includes(args.authority)) {
    throw new Error(`Unsupported authority risk class: ${args.authority}`);
  }

  return args;
}

function usage() {
  return [
    "Usage: node docs/brain/workorders/tools/wo-query.mjs [options]",
    "",
    "Options:",
    "  --json                  Print machine-readable JSON.",
    `  --registry <path>       Registry JSON path. Default: ${DEFAULT_REGISTRY}`,
    `  --rules <path>          Scoring rules JSON path. Default: ${DEFAULT_RULES}`,
    "  --authority <R0-R5>     Current authority boundary. Default: R2",
    "  --help                  Show this help.",
  ].join("\n");
}

function repoRoot() {
  const current = path.dirname(fileURLToPath(import.meta.url));
  let dir = current;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate repo root from wo-query.mjs");
}

function readJson(root, relativePath) {
  const fullPath = path.resolve(root, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function riskRank(riskClass) {
  const rank = RISK_ORDER.indexOf(riskClass);
  return rank === -1 ? Number.POSITIVE_INFINITY : rank;
}

function dependencyReadiness(record) {
  const dependencies = Array.isArray(record.dependencies) ? record.dependencies : [];
  if (dependencies.length === 0) return 1;
  const satisfied = dependencies.filter((dependency) =>
    ["satisfied", "complete", "merged", "waived", "superseded"].includes(dependency.status),
  ).length;
  return satisfied / dependencies.length;
}

function evidenceReadiness(record) {
  const required = Array.isArray(record.evidenceRequired) ? record.evidenceRequired : [];
  const produced = Array.isArray(record.evidenceProduced) ? record.evidenceProduced : [];
  if (required.length === 0) return produced.length > 0 ? 1 : 0.75;
  return Math.min(1, produced.length / required.length);
}

function operationalValue(record) {
  const nextCandidates = Array.isArray(record.nextCandidates) ? record.nextCandidates.length : 0;
  const programBonus = record.program === "Work Order Engine" ? 0.2 : 0;
  const statusBonus = SELECTABLE_STATUSES.has(record.status) ? 0.2 : ACTIVE_STATUSES.has(record.status) ? 0.1 : 0;
  return Math.min(1, 0.5 + programBonus + statusBonus + Math.min(nextCandidates * 0.1, 0.2));
}

function scopeReversibility(record) {
  const allowedFiles = Array.isArray(record.allowedFiles) ? record.allowedFiles.length : 0;
  const allowedSystems = Array.isArray(record.allowedSystems) ? record.allowedSystems.length : 0;
  const size = allowedFiles + allowedSystems;
  if (size === 0) return 0.7;
  if (size <= 3) return 1;
  if (size <= 6) return 0.8;
  return 0.5;
}

function safetyMargin(record) {
  const blockedSystems = Array.isArray(record.blockedSystems) ? record.blockedSystems : [];
  const stopConditions = Array.isArray(record.stopConditions) ? record.stopConditions : [];
  const hasProtectedBlock = JSON.stringify(blockedSystems).match(/secret|credential|PACS|county|production|deploy/i);
  const stopGateBonus = stopConditions.length > 0 ? 0.2 : 0;
  return Math.min(1, (hasProtectedBlock ? 0.8 : 0.6) + stopGateBonus);
}

function blockerPressure(record) {
  const blockers = Array.isArray(record.blockers) ? record.blockers : [];
  if (blockers.length === 0) return 1;
  if (blockers.length === 1) return 0.75;
  if (blockers.length === 2) return 0.5;
  return 0.25;
}

function hardExclusions(record, authority) {
  const exclusions = [];
  if (TERMINAL_STATUSES.has(record.status)) exclusions.push("terminal-status");
  if (ACTIVE_STATUSES.has(record.status)) exclusions.push("active-work-order");
  if (!TERMINAL_STATUSES.has(record.status) && !ACTIVE_STATUSES.has(record.status) && !SELECTABLE_STATUSES.has(record.status)) {
    exclusions.push("unsupported-status");
  }
  if (riskRank(record.riskClass) > riskRank(authority)) exclusions.push("risk-exceeds-authority");
  if (dependencyReadiness(record) < 1) exclusions.push("dependency-not-cleared");

  const blockedText = JSON.stringify(record.blockedSystems ?? []);
  const allowedText = JSON.stringify(record.allowedSystems ?? []);
  if (/secret|credential|PACS|county SQL|production deployment|release|destructive/i.test(`${blockedText} ${allowedText}`)) {
    if (riskRank(record.riskClass) >= riskRank("R3")) exclusions.push("protected-system-required");
  }

  if (record.status === "unknown") exclusions.push("ambiguous-state");
  return exclusions;
}

function factorValues(record, authority) {
  return {
    "dependency-readiness": dependencyReadiness(record),
    "risk-authority-fit": riskRank(record.riskClass) <= riskRank(authority) ? 1 : 0,
    "evidence-readiness": evidenceReadiness(record),
    "operational-value": operationalValue(record),
    "scope-reversibility": scopeReversibility(record),
    "safety-margin": safetyMargin(record),
    "blocker-pressure": blockerPressure(record),
  };
}

function verdictFor(score, bands) {
  const match = bands.find((band) => {
    const minOk = band.minimumInclusive ? score >= band.minimumScore : score > band.minimumScore;
    const maxOk = band.maximumInclusive ? score <= band.maximumScore : score < band.maximumScore;
    return minOk && maxOk;
  });
  if (!match) throw new Error(`No scoring band matched score ${score}`);
  return match.verdict;
}

function scoreRecord(record, rules, authority) {
  const exclusions = hardExclusions(record, authority);
  const values = factorValues(record, authority);
  const factorBreakdown = rules.factors.map((factor) => {
    const value = values[factor.id] ?? 0;
    return {
      id: factor.id,
      value,
      weight: factor.weight,
      contribution: Number((value * factor.weight).toFixed(3)),
    };
  });
  const score = Number(factorBreakdown.reduce((sum, factor) => sum + factor.contribution, 0).toFixed(3));
  return {
    workOrderId: record.id,
    title: record.title,
    program: record.program,
    riskClass: record.riskClass,
    status: record.status,
    verdict: exclusions.length > 0 ? "blocked" : verdictFor(score, rules.decisionBands),
    score,
    factorBreakdown,
    hardExclusions: exclusions,
    blockers: record.blockers ?? [],
    evidenceReferences: (record.evidenceProduced ?? []).map((evidence) => evidence.location ?? evidence.description),
    nextRecommendedAction: exclusions.length > 0 ? "Resolve hard exclusions before execution." : "Eligible for Goal + Loop selection.",
  };
}

function summarize(registry, rules, authority) {
  const records = registry.records ?? [];
  const scored = records.map((record) => scoreRecord(record, rules, authority));
  const completed = records.filter((record) => TERMINAL_STATUSES.has(record.status)).map((record) => record.id);
  const blocked = scored.filter((record) => record.verdict === "blocked").map((record) => ({
    id: record.workOrderId,
    reasons: record.hardExclusions,
  }));
  const activeLane = records.find((record) => ACTIVE_STATUSES.has(record.status))?.program ?? null;
  const ranked = scored
    .filter((record) => record.verdict !== "blocked" && SELECTABLE_STATUSES.has(record.status))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (riskRank(a.riskClass) !== riskRank(b.riskClass)) return riskRank(a.riskClass) - riskRank(b.riskClass);
      return a.workOrderId.localeCompare(b.workOrderId);
    });
  const next = ranked[0] ?? null;

  return {
    schemaVersion: "0.1.0",
    mode: "read-only",
    authority,
    registry: {
      schemaVersion: registry.schemaVersion,
      generatedBy: registry.generatedBy,
      recordCount: records.length,
    },
    scoringPolicy: {
      policyId: rules.policyId,
      schemaVersion: rules.schemaVersion,
    },
    activeLane,
    completedWorkOrders: completed,
    blockedWorkOrders: blocked,
    nextRecommendedWorkOrder: next,
    rankedCandidates: ranked,
  };
}

function printText(summary) {
  const lines = [
    "WORK ORDER QUERY",
    `Mode: ${summary.mode}`,
    `Authority: ${summary.authority}`,
    `Registry records: ${summary.registry.recordCount}`,
    `Active lane: ${summary.activeLane ?? "none"}`,
    `Completed WOs: ${summary.completedWorkOrders.length ? summary.completedWorkOrders.join(", ") : "none"}`,
    `Blocked WOs: ${summary.blockedWorkOrders.length}`,
    "",
    "Next recommended WO:",
  ];

  if (summary.nextRecommendedWorkOrder) {
    const next = summary.nextRecommendedWorkOrder;
    lines.push(`- ${next.workOrderId}: ${next.title}`);
    lines.push(`- Program: ${next.program}`);
    lines.push(`- Risk: ${next.riskClass}`);
    lines.push(`- Score: ${next.score}`);
    lines.push(`- Verdict: ${next.verdict}`);
    lines.push(`- Why: ${next.nextRecommendedAction}`);
  } else {
    lines.push("- none");
  }

  return lines.join("\n");
}

export {
  parseArgs,
  summarize,
  scoreRecord,
  verdictFor,
  hardExclusions,
};

if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? "")) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log(usage());
      process.exit(0);
    }
    const root = repoRoot();
    const registry = readJson(root, args.registry);
    const rules = readJson(root, args.rules);
    const summary = summarize(registry, rules, args.authority);
    console.log(args.json ? JSON.stringify(summary, null, 2) : printText(summary));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
