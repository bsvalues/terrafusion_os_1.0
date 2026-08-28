#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DEFAULT_REGISTRY = "docs/brain/workorders/registry/work-order-registry.seed.json";
const DEFAULT_RULES = "docs/brain/workorders/scoring/next-work-order-scoring.rules.json";
const RISK_ORDER = ["R0", "R1", "R2", "R3", "R4", "R5"];
const COMPLETED_STATUSES = new Set(["complete", "merged"]);
const TERMINAL_STATUSES = new Set(["complete", "merged", "cancelled", "superseded"]);
const ACTIVE_STATUSES = new Set(["in_progress", "pr_open", "review"]);
const SELECTABLE_STATUSES = new Set(["ready", "proposed"]);
const BLOCKED_STATUSES = new Set(["blocked", "deferred"]);

function readOptionValue(argv, index, optionName) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${optionName}`);
  }
  return value;
}

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
      args.registry = readOptionValue(argv, index, arg);
      index += 1;
    } else if (arg === "--rules") {
      args.rules = readOptionValue(argv, index, arg);
      index += 1;
    } else if (arg === "--authority") {
      args.authority = readOptionValue(argv, index, arg);
      index += 1;
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

function hardExclusions(record, authority, options = {}) {
  const exclusions = [];
  if (TERMINAL_STATUSES.has(record.status)) exclusions.push("terminal-status");
  if (ACTIVE_STATUSES.has(record.status)) exclusions.push("active-work-order");
  if (BLOCKED_STATUSES.has(record.status)) exclusions.push("blocked-status");
  if (
    !TERMINAL_STATUSES.has(record.status) &&
    !ACTIVE_STATUSES.has(record.status) &&
    !SELECTABLE_STATUSES.has(record.status) &&
    !BLOCKED_STATUSES.has(record.status)
  ) {
    exclusions.push("unsupported-status");
  }
  if (riskRank(record.riskClass) > riskRank(authority)) exclusions.push("risk-exceeds-authority");
  if (dependencyReadiness(record) < 1) exclusions.push("dependency-not-cleared");
  if (record.dispatchGuard != null) {
    if (
      record.dispatchGuard.type !== "protected_ref_head" ||
      record.dispatchGuard.ref !== "refs/remotes/origin/main"
    ) {
      exclusions.push("invalid-dispatch-guard");
    } else if (!new Set(options.verifiedDispatchRefs ?? []).has(record.dispatchGuard.ref)) {
      exclusions.push(`dispatch-source-unverified:${record.dispatchGuard.ref}`);
    }
  }

  const allowedText = JSON.stringify(record.allowedSystems ?? []);
  if (
    /secret|credential|PACS|county|production|deploy|release|destructive|runtime|backend|frontend|tools.?sync|CI|workflow|branch.?protection/i.test(
      allowedText,
    )
  ) {
    exclusions.push("protected-system-required");
  }

  if (record.status === "unknown") exclusions.push("ambiguous-state");
  return exclusions;
}

function unresolvedBlockerCount(record) {
  const blockers = Array.isArray(record.blockers) ? record.blockers : [];
  return blockers.filter((blocker) => blocker.status !== "resolved").length;
}

function evidenceTimestamp(record) {
  const evidence = Array.isArray(record.evidenceProduced) ? record.evidenceProduced : [];
  const timestamps = evidence
    .flatMap((artifact) => [
      artifact.freshness?.observedAt,
      artifact.generatedAt,
      artifact.completedAt,
      artifact.createdAt,
    ])
    .filter(Boolean)
    .map((value) => Date.parse(value))
    .filter((value) => !Number.isNaN(value));
  return timestamps.length > 0 ? Math.max(...timestamps) : 0;
}

function topFactorSummary(score) {
  return [...score.factorBreakdown]
    .sort((a, b) => b.contribution - a.contribution || a.id.localeCompare(b.id))
    .slice(0, 3)
    .map((factor) => `${factor.id} ${factor.contribution}`)
    .join(", ");
}

function blockedSummary(exclusions) {
  if (exclusions.length === 0) return "No hard exclusions.";
  return `Hard exclusions: ${exclusions.join(", ")}.`;
}

function recommendationText(score, rank = null, activeLane = null) {
  if (score.verdict === "blocked") {
    return `Resolve before execution. ${blockedSummary(score.hardExclusions)}`;
  }
  const rankText = rank === null ? "Candidate" : `Rank ${rank}`;
  const laneText = activeLane && score.program === activeLane ? " Continues the active lane." : "";
  const blockerText = `${score.blockers.length} known blocker${score.blockers.length === 1 ? "" : "s"}.`;
  return `${rankText}: ${score.verdict} at ${score.score}. Top factors: ${topFactorSummary(score)}. ${blockerText}${laneText}`;
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

function scoreRecord(record, rules, authority, options = {}) {
  const exclusions = hardExclusions(record, authority, options);
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
    nextRecommendedAction: null,
  };
}

function compareByTieBreaker(a, b, tieBreaker, recordById, activeLane) {
  const aRecord = recordById.get(a.workOrderId) ?? {};
  const bRecord = recordById.get(b.workOrderId) ?? {};

  if (tieBreaker.id === "lower-risk-class") {
    return riskRank(a.riskClass) - riskRank(b.riskClass);
  }
  if (tieBreaker.id === "fewer-unresolved-blockers") {
    return unresolvedBlockerCount(aRecord) - unresolvedBlockerCount(bRecord);
  }
  if (tieBreaker.id === "newer-dependency-evidence") {
    return evidenceTimestamp(bRecord) - evidenceTimestamp(aRecord);
  }
  if (tieBreaker.id === "active-lane-closure") {
    const aActive = activeLane && a.program === activeLane ? 1 : 0;
    const bActive = activeLane && b.program === activeLane ? 1 : 0;
    return bActive - aActive;
  }
  if (tieBreaker.id === "lexicographic-work-order-id") {
    return a.workOrderId.localeCompare(b.workOrderId);
  }
  return 0;
}

function compareCandidates(a, b, rules, recordById, activeLane) {
  if (b.score !== a.score) return b.score - a.score;
  const tieBreakers = Array.isArray(rules.tieBreakers)
    ? [...rules.tieBreakers].sort(
        (left, right) => left.order - right.order || left.id.localeCompare(right.id),
      )
    : [];
  for (const tieBreaker of tieBreakers) {
    const result = compareByTieBreaker(a, b, tieBreaker, recordById, activeLane);
    if (result !== 0) return result;
  }
  return a.workOrderId.localeCompare(b.workOrderId);
}

function summarize(registry, rules, authority, options = {}) {
  const records = registry.records ?? [];
  const recordById = new Map(records.map((record) => [record.id, record]));
  const activeLane = records.find((record) => ACTIVE_STATUSES.has(record.status))?.program ?? null;
  const scored = records.map((record) => {
    const score = scoreRecord(record, rules, authority, options);
    score.nextRecommendedAction = recommendationText(score, null, activeLane);
    return score;
  });
  const completed = records.filter((record) => COMPLETED_STATUSES.has(record.status)).map((record) => record.id);
  const blocked = scored
    .filter((record) => record.verdict === "blocked")
    .filter((record) => !record.hardExclusions.includes("terminal-status") && !record.hardExclusions.includes("active-work-order"))
    .map((record) => ({
      id: record.workOrderId,
      reasons: record.hardExclusions,
    }));
  const ranked = scored
    .filter((record) => record.verdict !== "blocked" && SELECTABLE_STATUSES.has(record.status))
    .sort((a, b) => compareCandidates(a, b, rules, recordById, activeLane))
    .map((record, index) => {
      record.nextRecommendedAction = recommendationText(record, index + 1, activeLane);
      return record;
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

function verifiedDispatchRefs(root, registry, registryPath = DEFAULT_REGISTRY) {
  const requestedRefs = [
    ...new Set(
      (registry.records ?? [])
        .map((record) => record.dispatchGuard?.ref)
        .filter((ref) => typeof ref === "string"),
    ),
  ];
  if (requestedRefs.length === 0) return [];
  if (requestedRefs.some((ref) => ref !== "refs/remotes/origin/main")) return [];

  try {
    if (path.resolve(root, registryPath) !== path.resolve(root, DEFAULT_REGISTRY)) return [];
    const originUrl = execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (
      !/^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)bsvalues\/terrafusion_os_1\.0(?:\.git)?$/i.test(
        originUrl,
      )
    ) {
      return [];
    }
    execFileSync("git", ["ls-files", "--error-unmatch", "--", DEFAULT_REGISTRY], {
      cwd: root,
      stdio: "ignore",
    });
    const status = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (status) return [];
    const head = execFileSync("git", ["rev-parse", "HEAD^{commit}"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return requestedRefs.filter((ref) => {
      try {
        return (
          execFileSync("git", ["rev-parse", `${ref}^{commit}`], {
            cwd: root,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
          }).trim() === head
        );
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
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
  ACTIVE_STATUSES,
  BLOCKED_STATUSES,
  COMPLETED_STATUSES,
  RISK_ORDER,
  SELECTABLE_STATUSES,
  TERMINAL_STATUSES,
  compareCandidates,
  parseArgs,
  recommendationText,
  riskRank,
  summarize,
  scoreRecord,
  verdictFor,
  hardExclusions,
  verifiedDispatchRefs,
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
    const summary = summarize(registry, rules, args.authority, {
      verifiedDispatchRefs: verifiedDispatchRefs(root, registry, args.registry),
    });
    console.log(args.json ? JSON.stringify(summary, null, 2) : printText(summary));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
