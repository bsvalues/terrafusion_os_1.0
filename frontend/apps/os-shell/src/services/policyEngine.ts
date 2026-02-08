/**
 * TerraFusion Policy Rules Engine
 *
 * Compiles policy rules into executable policy with deterministic precedence.
 * Rule specificity (most specific wins):
 *   - surface + suiteId + actionId (score 3)
 *   - suiteId + actionId (score 2)
 *   - surface + actionId (score 2)
 *   - surface + suiteId (score 2)
 *   - actionId only (score 1)
 *   - suiteId only (score 1)
 *   - surface only (score 1)
 *
 * @module services/policyEngine
 * @see Slice 23: Policy UI for Visual Rule Management
 */

import type { OsAction, OsActionContext, OsActionPolicy } from './osActions';

// ============================================================================
// Policy Rule Types
// ============================================================================

/**
 * Policy rule specification
 */
export interface PolicyRule {
  /** Unique rule identifier */
  id: string;

  /** Rule effect (only deny supported in v1) */
  effect: 'deny';

  /** Optional action ID selector */
  actionId?: string;

  /** Optional suite ID selector */
  suiteId?: string;

  /** Optional surface selector */
  surface?: 'launcher' | 'standalone_home' | 'shellhome' | 'module' | 'workbench' | 'trace';

  /** Human-readable reason for the rule */
  reason: string;
}

// ============================================================================
// Rule Validation
// ============================================================================

/**
 * Validates a policy rule has at least one selector
 */
function validateRule(rule: PolicyRule): void {
  if (!rule.actionId && !rule.suiteId && !rule.surface) {
    throw new Error(
      `Rule ${rule.id} must have at least one selector (actionId, suiteId, or surface)`
    );
  }
}

// ============================================================================
// Rule Matching and Precedence
// ============================================================================

/**
 * Calculates specificity score for a rule
 *
 * Higher score = more specific = higher precedence
 */
function calculateSpecificity(rule: PolicyRule): number {
  let score = 0;

  if (rule.surface) score += 1;
  if (rule.suiteId) score += 1;
  if (rule.actionId) score += 1;

  return score;
}

/**
 * Checks if a rule matches an action context
 */
function ruleMatches(rule: PolicyRule, context: OsActionContext): boolean {
  // All specified selectors must match
  if (rule.surface && rule.surface !== context.surface) {
    return false;
  }

  if (rule.suiteId && rule.suiteId !== context.suiteId) {
    return false;
  }

  if (rule.actionId && rule.actionId !== context.actionId) {
    return false;
  }

  return true;
}

/**
 * Finds the most specific matching rule for an action context
 */
function findMatchingRule(rules: PolicyRule[], context: OsActionContext): PolicyRule | null {
  // Rules are already sorted by specificity (descending)
  // Return first match (most specific)
  return rules.find((rule) => ruleMatches(rule, context)) || null;
}

// ============================================================================
// Policy Compilation
// ============================================================================

/**
 * Compiles policy rules into an executable policy
 *
 * @param rules - Array of policy rules to compile
 * @returns Compiled policy with deterministic canExecute() function
 *
 * @example
 * const rules: PolicyRule[] = [
 *   { id: '1', effect: 'deny', actionId: 'dangerous', reason: 'Disabled for safety' }
 * ];
 * const policy = compilePolicyRules(rules);
 * const result = policy.canExecute(
 *   { id: 'dangerous', label: 'Test', intent: 'standalone', href: '/test' },
 *   { actionId: 'dangerous', suiteId: 'test', surface: 'workbench', navigate: () => {} }
 * );
 * // result.allowed === false
 * // result.reason === 'Disabled for safety'
 */
export function compilePolicyRules(rules: PolicyRule[]): OsActionPolicy {
  // Validate all rules
  rules.forEach(validateRule);

  // Sort by specificity (descending) for deterministic matching
  const sortedRules = [...rules].sort((a, b) => {
    const scoreA = calculateSpecificity(a);
    const scoreB = calculateSpecificity(b);
    return scoreB - scoreA; // Descending order
  });

  // Return compiled policy
  return {
    canExecute: (action: OsAction, context: OsActionContext) => {
      // Build expanded context with actionId from action
      const expandedContext: OsActionContext & { actionId: string } = {
        ...context,
        actionId: action.id,
      };

      const matchingRule = findMatchingRule(sortedRules, expandedContext);

      if (matchingRule) {
        // Deny rule matched
        return {
          allowed: false,
          reason: matchingRule.reason,
        };
      }

      // No matching deny rule → default allow
      return {
        allowed: true,
      };
    },
  };
}
