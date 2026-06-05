import type { CanonIndex, CanonRiskReport, CanonTask, EngineeringWriteLaneIndex, GitDiff, RiskLevel } from './types.js';
import { getPathPoliciesForPath, getRulesForPath, riskMax } from './canon-query.js';

const SCORE: Record<RiskLevel, number> = {
  low: 10,
  medium: 35,
  high: 70,
  critical: 95
};

export function scoreDiff(
  index: CanonIndex,
  writeLanes: EngineeringWriteLaneIndex,
  diff: GitDiff,
  task: CanonTask
): CanonRiskReport {
  const touchedRules = new Set<string>();
  const requiredGates = new Set<string>(task.requiredGates);
  const blockers: string[] = [];
  const risks: RiskLevel[] = [task.risk];
  let manualReviewRequired = false;

  for (const file of diff.files) {
    const rules = getRulesForPath(index, file.path);
    for (const rule of rules) {
      touchedRules.add(rule.ruleId);
      for (const gate of rule.enforcement.requiredGates ?? []) requiredGates.add(gate);
      if (rule.enforcement.level === 'block') blockers.push(rule.ruleId);
      if (rule.enforcement.requiresManualReview) manualReviewRequired = true;
    }

    const policies = getPathPoliciesForPath(writeLanes, file.path);
    for (const policy of policies) {
      risks.push(policy.risk);
      for (const gate of policy.requiredGates) requiredGates.add(gate);
      if (policy.manualReview) manualReviewRequired = true;
      if (policy.defaultAction === 'block') blockers.push(policy.pattern);
    }

    if (task.scope.forbiddenPaths.some((pattern) => file.path.includes(pattern.replace('/**', '')))) {
      blockers.push(`forbidden-path:${file.path}`);
    }
  }

  const risk = riskMax(risks);
  return {
    risk,
    score: SCORE[risk],
    touchedRules: Array.from(touchedRules),
    requiredGates: Array.from(requiredGates),
    blockers: Array.from(new Set(blockers)),
    manualReviewRequired
  };
}
