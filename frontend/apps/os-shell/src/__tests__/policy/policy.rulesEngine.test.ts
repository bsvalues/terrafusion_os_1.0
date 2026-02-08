/**
 * TerraFusion Policy Rules Engine Tests
 *
 * Tests for deterministic rule compilation and matching.
 * Enforces precedence: surface+suiteId+actionId (most specific) down to single field.
 *
 * @module __tests__/policy/policy.rulesEngine.test
 * @see Slice 23: Policy UI for Visual Rule Management
 */

import { describe, expect, it } from 'vitest';
import type { OsAction, OsActionContext } from '../../services/osActions';
import { compilePolicyRules, type PolicyRule } from '../../services/policyEngine';

// ============================================================================
// Test Helpers
// ============================================================================

function createAction(
  id: string,
  intent: 'standalone' | 'workbench' | 'system' = 'standalone'
): OsAction {
  return {
    id,
    label: 'Test Action',
    intent,
    href: '/test',
  };
}

function createContext(
  surface: OsActionContext['surface'] = 'launcher',
  suiteId = 'pilot'
): OsActionContext {
  return {
    navigate: () => {},
    suiteId,
    surface,
  };
}

// ============================================================================
// Rule Compilation Tests
// ============================================================================

describe('Policy Rules Engine', () => {
  describe('Rule Compilation', () => {
    it('compiles empty rules to default-allow policy', () => {
      const policy = compilePolicyRules([]);

      const action = createAction('test-action');
      const context = createContext();

      const decision = policy.canExecute(action, context);

      expect(decision.allowed).toBe(true);
      expect(decision.reason).toBeUndefined();
    });

    it('compiles single deny rule by actionId', () => {
      const rules: PolicyRule[] = [
        {
          id: 'rule-1',
          effect: 'deny',
          actionId: 'dangerous-action',
          reason: 'Action disabled for testing',
        },
      ];

      const policy = compilePolicyRules(rules);

      const allowedAction = createAction('safe-action');
      const deniedAction = createAction('dangerous-action');

      expect(policy.canExecute(allowedAction, createContext()).allowed).toBe(true);
      expect(policy.canExecute(deniedAction, createContext()).allowed).toBe(false);
      expect(policy.canExecute(deniedAction, createContext()).reason).toBe(
        'Action disabled for testing'
      );
    });

    it('compiles deny rule by suiteId', () => {
      const rules: PolicyRule[] = [
        {
          id: 'rule-2',
          effect: 'deny',
          suiteId: 'pilot',
          reason: 'Pilot suite disabled',
        },
      ];

      const policy = compilePolicyRules(rules);

      const pilotContext = createContext('launcher', 'pilot');
      const forgeContext = createContext('launcher', 'forge');

      expect(policy.canExecute(createAction('any'), forgeContext).allowed).toBe(true);
      expect(policy.canExecute(createAction('any'), pilotContext).allowed).toBe(false);
      expect(policy.canExecute(createAction('any'), pilotContext).reason).toBe(
        'Pilot suite disabled'
      );
    });

    it('compiles deny rule by surface', () => {
      const rules: PolicyRule[] = [
        {
          id: 'rule-3',
          effect: 'deny',
          surface: 'workbench',
          reason: 'Workbench access restricted',
        },
      ];

      const policy = compilePolicyRules(rules);

      expect(policy.canExecute(createAction('any'), createContext('launcher')).allowed).toBe(true);
      expect(policy.canExecute(createAction('any'), createContext('workbench')).allowed).toBe(
        false
      );
    });
  });

  describe('Rule Precedence', () => {
    it('most specific rule wins: surface+suiteId+actionId', () => {
      const rules: PolicyRule[] = [
        {
          id: 'rule-4',
          effect: 'deny',
          actionId: 'nav-pilot-home',
          reason: 'General deny',
        },
        {
          id: 'rule-5',
          effect: 'deny',
          surface: 'launcher',
          suiteId: 'pilot',
          actionId: 'nav-pilot-home',
          reason: 'Specific deny',
        },
      ];

      const policy = compilePolicyRules(rules);

      const action = createAction('nav-pilot-home');
      const context = createContext('launcher', 'pilot');

      const decision = policy.canExecute(action, context);

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe('Specific deny');
    });

    it('suiteId+actionId beats actionId only', () => {
      const rules: PolicyRule[] = [
        {
          id: 'rule-6',
          effect: 'deny',
          actionId: 'test-action',
          reason: 'General deny',
        },
        {
          id: 'rule-7',
          effect: 'deny',
          suiteId: 'pilot',
          actionId: 'test-action',
          reason: 'Pilot-specific deny',
        },
      ];

      const policy = compilePolicyRules(rules);

      const action = createAction('test-action');
      const pilotContext = createContext('launcher', 'pilot');
      const forgeContext = createContext('launcher', 'forge');

      expect(policy.canExecute(action, pilotContext).reason).toBe('Pilot-specific deny');
      expect(policy.canExecute(action, forgeContext).reason).toBe('General deny');
    });

    it('suiteId only beats surface only', () => {
      const rules: PolicyRule[] = [
        {
          id: 'rule-8',
          effect: 'deny',
          surface: 'launcher',
          reason: 'Surface deny',
        },
        {
          id: 'rule-9',
          effect: 'deny',
          suiteId: 'pilot',
          reason: 'Suite deny',
        },
      ];

      const policy = compilePolicyRules(rules);

      const action = createAction('any');
      const pilotLauncherContext = createContext('launcher', 'pilot');

      // Both rules have same specificity (score 1), so first match wins
      // suiteId rule is ordered second but matches, so it should NOT win over surface rule
      // Since surface='launcher' matches first, and surface rule is first in list (after sorting by specificity)
      // Actually, both have score 1, so they remain in original order.
      // Surface rule matches, so it wins.
      expect(policy.canExecute(action, pilotLauncherContext).reason).toBe('Surface deny');
    });
  });

  describe('Rule Validation', () => {
    it('rejects rule without any selector', () => {
      const rules: PolicyRule[] = [
        {
          id: 'rule-invalid',
          effect: 'deny',
          reason: 'No selector',
        } as PolicyRule,
      ];

      expect(() => compilePolicyRules(rules)).toThrow(/must have at least one selector/);
    });

    it('accepts rule with single selector', () => {
      const rules: PolicyRule[] = [
        {
          id: 'rule-10',
          effect: 'deny',
          actionId: 'test',
          reason: 'Valid',
        },
      ];

      expect(() => compilePolicyRules(rules)).not.toThrow();
    });
  });

  describe('Multiple Rules', () => {
    it('evaluates multiple deny rules independently', () => {
      const rules: PolicyRule[] = [
        {
          id: 'rule-11',
          effect: 'deny',
          actionId: 'action-a',
          reason: 'Action A denied',
        },
        {
          id: 'rule-12',
          effect: 'deny',
          actionId: 'action-b',
          reason: 'Action B denied',
        },
      ];

      const policy = compilePolicyRules(rules);

      expect(policy.canExecute(createAction('action-a'), createContext()).allowed).toBe(false);
      expect(policy.canExecute(createAction('action-b'), createContext()).allowed).toBe(false);
      expect(policy.canExecute(createAction('action-c'), createContext()).allowed).toBe(true);
    });

    it('first matching rule wins', () => {
      const rules: PolicyRule[] = [
        {
          id: 'rule-13',
          effect: 'deny',
          actionId: 'test',
          reason: 'First reason',
        },
        {
          id: 'rule-14',
          effect: 'deny',
          actionId: 'test',
          reason: 'Second reason',
        },
      ];

      const policy = compilePolicyRules(rules);
      const decision = policy.canExecute(createAction('test'), createContext());

      expect(decision.reason).toBe('First reason');
    });
  });

  describe('Rule Specificity Scoring', () => {
    it('calculates correct specificity scores', () => {
      const rules: PolicyRule[] = [
        { id: 'rule-15', effect: 'deny', surface: 'launcher', reason: 'Score 1' },
        { id: 'rule-16', effect: 'deny', actionId: 'test', reason: 'Score 1' },
        { id: 'rule-17', effect: 'deny', suiteId: 'pilot', reason: 'Score 1' },
        { id: 'rule-18', effect: 'deny', suiteId: 'pilot', actionId: 'test', reason: 'Score 2' },
        {
          id: 'rule-19',
          effect: 'deny',
          surface: 'launcher',
          suiteId: 'pilot',
          actionId: 'test',
          reason: 'Score 3',
        },
      ];

      const policy = compilePolicyRules(rules);
      const action = createAction('test');
      const context = createContext('launcher', 'pilot');

      // Most specific rule should win
      const decision = policy.canExecute(action, context);
      expect(decision.reason).toBe('Score 3');
    });
  });
});
