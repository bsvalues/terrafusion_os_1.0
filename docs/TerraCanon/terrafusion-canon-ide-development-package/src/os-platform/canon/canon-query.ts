import type { CanonAnswer, CanonIndex, CanonRule, CanonTask, EngineeringWriteLaneIndex, PathPolicy, RiskLevel } from './types.js';
import { matchesAny } from './path-match.js';

const RISK_WEIGHT: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export function getRulesForPath(index: CanonIndex, path: string): CanonRule[] {
  return index.rules.filter((rule) => matchesAny(path, rule.appliesTo.paths ?? []));
}

export function getRulesForTask(index: CanonIndex, task: Pick<CanonTask, 'intent' | 'surface'>): CanonRule[] {
  const intent = task.intent.toLowerCase();
  return index.rules.filter((rule) => {
    const intentMatch = (rule.appliesTo.taskIntents ?? []).some((term) => intent.includes(term.toLowerCase()));
    const surfaceMatch = (rule.appliesTo.surfaces ?? []).includes(task.surface);
    return intentMatch || surfaceMatch;
  });
}

export function getPathPoliciesForPath(writeLanes: EngineeringWriteLaneIndex, path: string): PathPolicy[] {
  return writeLanes.paths.filter((policy) => matchesAny(path, [policy.pattern]));
}

export function getAllowedPaths(task: CanonTask): string[] {
  return task.scope.allowedPaths;
}

export function getForbiddenPaths(task: CanonTask): string[] {
  return task.scope.forbiddenPaths;
}

export function riskMax(risks: RiskLevel[]): RiskLevel {
  const entries = Object.entries(RISK_WEIGHT) as [RiskLevel, number][];
  const max = Math.max(...risks.map((risk) => RISK_WEIGHT[risk]), 1);
  return entries.find(([, weight]) => weight === max)?.[0] ?? 'low';
}

export function queryCanon(index: CanonIndex, writeLanes: EngineeringWriteLaneIndex, task: CanonTask): CanonAnswer {
  const taskRules = getRulesForTask(index, task);
  const pathPolicies = [...task.scope.allowedPaths, ...task.scope.forbiddenPaths]
    .flatMap((path) => getPathPoliciesForPath(writeLanes, path));

  const requiredGates = Array.from(new Set([
    ...taskRules.flatMap((rule) => rule.enforcement.requiredGates ?? []),
    ...pathPolicies.flatMap((policy) => policy.requiredGates ?? []),
    ...task.requiredGates
  ]));

  const blockers = [
    ...taskRules.filter((rule) => rule.enforcement.level === 'block').map((rule) => rule.ruleId),
    ...pathPolicies.filter((policy) => policy.defaultAction === 'block').map((policy) => policy.pattern)
  ];

  const risk = riskMax([task.risk, ...pathPolicies.map((policy) => policy.risk)]);

  return {
    summary: `Loaded ${taskRules.length} Canon rules and ${pathPolicies.length} path policies for ${task.taskId}.`,
    rules: taskRules,
    requiredGates,
    risk,
    blockers
  };
}
