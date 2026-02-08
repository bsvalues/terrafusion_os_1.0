/**
 * TerraFusion OS Action Registry Completeness Tests
 *
 * Enforces that all module/header actions are "truthy":
 * - Every action has stable id/label/intent
 * - Navigation actions have valid href
 * - Handler actions reference registered handler keys (no inline closures in registry)
 * - All actions pass type guards
 *
 * Contract: CI fails if any action is malformed or unregistered.
 *
 * @module __tests__/osActions/osActions.registryCompleteness.test
 * @see Slice 15: Module Action Wiring + Telemetry Truth
 */

import { describe, expect, it } from 'vitest';

import { getQualifiedStandaloneSuites, OS_FEATURES } from '../../config/suiteRegistry';
import { isHandlerKeyAction, isNavigationAction, isValidOsAction } from '../../services/osActions';

// ============================================================================
// Action Registry Completeness
// ============================================================================

describe('OS Actions Registry Completeness', () => {
  describe('primary actions validation', () => {
    it('all primaryActions have stable id/label/intent', () => {
      const suites = getQualifiedStandaloneSuites();

      for (const suite of suites) {
        const actions = suite.homeMeta?.primaryActions ?? [];

        for (const action of actions) {
          expect(action.id, `Suite "${suite.id}" action missing id`).toBeTruthy();
          expect(action.id.length, `Suite "${suite.id}" action has empty id`).toBeGreaterThan(0);

          expect(
            action.label,
            `Suite "${suite.id}" action "${action.id}" missing label`
          ).toBeTruthy();
          expect(
            action.label.length,
            `Suite "${suite.id}" action "${action.id}" has empty label`
          ).toBeGreaterThan(0);

          const validIntents = ['workbench', 'standalone', 'system'];
          expect(
            validIntents.includes(action.intent),
            `Suite "${suite.id}" action "${action.id}" has invalid intent: ${action.intent}`
          ).toBe(true);
        }
      }
    });

    it('all navigation actions have valid href starting with /', () => {
      const suites = getQualifiedStandaloneSuites();

      for (const suite of suites) {
        const actions = suite.homeMeta?.primaryActions ?? [];

        for (const action of actions) {
          if (action.href !== undefined) {
            expect(
              typeof action.href,
              `Suite "${suite.id}" action "${action.id}" href is not string`
            ).toBe('string');
            expect(
              action.href.startsWith('/'),
              `Suite "${suite.id}" action "${action.id}" href must start with /: ${action.href}`
            ).toBe(true);
            expect(
              action.href.length,
              `Suite "${suite.id}" action "${action.id}" href is empty`
            ).toBeGreaterThan(1);
          }
        }
      }
    });

    it('actions are either navigation (href) or handler reference (handlerKey) - not both', () => {
      const suites = getQualifiedStandaloneSuites();

      for (const suite of suites) {
        const actions = suite.homeMeta?.primaryActions ?? [];

        for (const action of actions) {
          const hasHref = typeof action.href === 'string' && action.href.length > 0;
          const hasHandlerKey = typeof (action as any).handlerKey === 'string';
          const hasInlineHandler = typeof action.handler === 'function';

          // Must have exactly one of: href XOR handlerKey
          // Inline handlers are allowed during migration but should reference keys
          if (!hasInlineHandler) {
            expect(
              hasHref !== hasHandlerKey,
              `Suite "${suite.id}" action "${action.id}" must have exactly one of href or handlerKey`
            ).toBe(true);
          }
        }
      }
    });

    it('all actions pass isValidOsAction type guard', () => {
      const suites = getQualifiedStandaloneSuites();

      for (const suite of suites) {
        const actions = suite.homeMeta?.primaryActions ?? [];

        for (const action of actions) {
          expect(
            isValidOsAction(action),
            `Suite "${suite.id}" action "${action.id}" fails isValidOsAction`
          ).toBe(true);
        }
      }
    });
  });

  describe('no inline closures in registry', () => {
    it('registry actions do not contain inline handler functions', () => {
      // Registry data (OS_FEATURES) should NOT contain handler functions
      // Handlers should be registered in osActionRegistry and referenced by key

      for (const feature of OS_FEATURES) {
        if (!feature.homeMeta) continue;

        const actions = feature.homeMeta.primaryActions ?? [];
        for (const action of actions) {
          // Registry actions should use href OR handlerKey, not inline handler
          expect(
            typeof action.handler,
            `Feature "${feature.id}" action "${action.id}" has inline handler - use handlerKey instead`
          ).not.toBe('function');
        }
      }
    });
  });

  describe('action type categorization', () => {
    it('navigation actions are correctly identified', () => {
      const navAction = { id: 'test', label: 'Test', intent: 'standalone' as const, href: '/test' };
      expect(isNavigationAction(navAction)).toBe(true);
    });

    it('handler key actions are correctly identified', () => {
      const handlerAction = {
        id: 'test',
        label: 'Test',
        intent: 'system' as const,
        handlerKey: 'openSettings',
      };
      expect(isHandlerKeyAction(handlerAction)).toBe(true);
    });

    it('actions without href or handlerKey are invalid', () => {
      const invalidAction = { id: 'test', label: 'Test', intent: 'standalone' as const };
      // Should have either href or handlerKey
      expect(isNavigationAction(invalidAction as any)).toBe(false);
      expect(isHandlerKeyAction(invalidAction as any)).toBe(false);
    });
  });
});
