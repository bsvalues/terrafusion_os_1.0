/**
 * Canon Runtime Risk (Core)
 *
 * Deterministic, read-only risk scoring for a source-code path. Risk derives
 * from the owning engineering write-lane, escalated by any matching
 * constitutional block-level rule. No agents, no commands, no network.
 *
 * @module canon/canon-risk
 */

import { getLaneForPath, getRulesForPath, getRequiredGatesForPath, normalizePath } from './canon-query.mjs';

/**
 * @typedef {'low' | 'medium' | 'high' | 'critical'} RiskLevel
 *
 * @typedef {Readonly<{
 *   level: RiskLevel,
 *   reasons: ReadonlyArray<string>,
 *   requiredGates: ReadonlyArray<string>,
 *   manualReviewRequired: boolean
 * }>} RiskAssessment
 */

/** @type {Record<RiskLevel, number>} */
const ORDER = { low: 0, medium: 1, high: 2, critical: 3 };
/** @type {ReadonlyArray<RiskLevel>} */
const BY_RANK = ['low', 'medium', 'high', 'critical'];

/** Conservative default when a path matches no write-lane. */
const DEFAULT_UNOWNED_LEVEL = /** @type {RiskLevel} */ ('medium');

/**
 * @param {RiskLevel} a
 * @param {RiskLevel} b
 * @returns {RiskLevel}
 */
function maxLevel(a, b) {
  return ORDER[a] >= ORDER[b] ? a : b;
}

/**
 * What risk level does this path carry?
 * @param {string} path
 * @returns {RiskAssessment}
 */
export function scorePathRisk(path) {
  const np = normalizePath(path);
  if (np.length === 0) {
    return Object.freeze({
      level: DEFAULT_UNOWNED_LEVEL,
      reasons: Object.freeze(['empty or invalid path — conservative default']),
      requiredGates: Object.freeze([]),
      manualReviewRequired: false,
    });
  }

  const lane = getLaneForPath(np);
  const rules = getRulesForPath(np);

  /** @type {RiskLevel} */
  let level = lane ? lane.lane.risk : DEFAULT_UNOWNED_LEVEL;
  /** @type {string[]} */
  const reasons = [];

  if (lane) {
    reasons.push(`owned by ${lane.lane.owner} (matched ${lane.pattern}; lane risk ${lane.lane.risk})`);
  } else {
    reasons.push('no write-lane match — conservative default (medium)');
  }

  let manualReviewRequired = lane ? lane.lane.manualReviewRequired : false;

  for (const rule of rules) {
    reasons.push(`rule ${rule.ruleId}: ${rule.title} [${rule.enforcement.level}]`);
    if (rule.enforcement.requiresManualReview) manualReviewRequired = true;
    // Constitutional, blocking rules escalate risk to at least high.
    if (rule.authority === 'constitutional' && rule.enforcement.level === 'block') {
      level = maxLevel(level, 'high');
      manualReviewRequired = true;
    }
  }

  // Keep level within the known scale.
  if (!BY_RANK.includes(level)) level = DEFAULT_UNOWNED_LEVEL;

  return Object.freeze({
    level,
    reasons: Object.freeze(reasons),
    requiredGates: getRequiredGatesForPath(np),
    manualReviewRequired,
  });
}
