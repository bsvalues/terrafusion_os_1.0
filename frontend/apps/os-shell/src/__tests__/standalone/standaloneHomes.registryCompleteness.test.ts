/**
 * TerraFusion OS Standalone Homes Registry Completeness Tests
 *
 * Tests that enforce registry-driven consistency for all standalone suites.
 * This prevents drift between the registry source of truth and runtime behavior.
 *
 * Completeness requirements:
 * - All standalone suites have homeMeta defined
 * - All standalone suites have routes defined
 * - All primary actions satisfy type guards
 * - Launcher items match registry routes
 * - ShellHome entrypoints derive from registry
 *
 * @module __tests__/standalone/standaloneHomes.registryCompleteness.test
 * @see Slice 7: Standalone Rollout + Contract Enforcement Across Registry
 */

import { getLauncherItems } from '../../components/launcher/launcherModel';
import {
    getStandaloneSuites,
    isStandaloneSuite,
    isValidPrimaryAction,
    OS_FEATURES,
    type OsFeatureDefinition,
} from '../../config/suiteRegistry';

// ============================================================================
// Registry Completeness Tests
// ============================================================================

describe('Standalone Registry Completeness', () => {
  // ==========================================================================
  // Helper Function Tests
  // ==========================================================================

  describe('getStandaloneSuites()', () => {
    it('returns non-empty array of standalone suites', () => {
      const suites = getStandaloneSuites();

      expect(Array.isArray(suites)).toBe(true);
      expect(suites.length).toBeGreaterThan(0);
    });

    it('all returned suites have required route', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        expect(suite.route).toBeDefined();
        expect(typeof suite.route).toBe('string');
        expect(suite.route.startsWith('/')).toBe(true);
      }
    });

    it('all returned suites have homeMeta with title', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        expect(suite.homeMeta).toBeDefined();
        expect(suite.homeMeta.title).toBeTruthy();
        expect(typeof suite.homeMeta.title).toBe('string');
      }
    });

    it('all returned suites have status live', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        expect(suite.status).toBe('live');
      }
    });

    it('excludes wip and planned suites', () => {
      const suites = getStandaloneSuites();
      const ids = suites.map((s) => s.id);

      // Verify we only get live suites (currently pilot and trace)
      const nonLiveFeatures = OS_FEATURES.filter((f) => f.status !== 'live');

      for (const feature of nonLiveFeatures) {
        expect(ids).not.toContain(feature.id);
      }
    });
  });

  describe('isStandaloneSuite()', () => {
    it('returns true for valid standalone features', () => {
      const validFeature: OsFeatureDefinition = {
        id: 'pilot',
        displayName: 'TerraPilot',
        shortName: 'Pilot',
        description: 'Test',
        iconName: 'Compass',
        route: '/pilot',
        status: 'live',
        homeMeta: {
          title: 'TerraPilot Console',
        },
      };

      expect(isStandaloneSuite(validFeature)).toBe(true);
    });

    it('returns false for features without route', () => {
      const noRouteFeature: OsFeatureDefinition = {
        id: 'test',
        displayName: 'Test',
        shortName: 'Test',
        description: 'Test',
        iconName: 'Test',
        status: 'live',
        homeMeta: { title: 'Test' },
      };

      expect(isStandaloneSuite(noRouteFeature)).toBe(false);
    });

    it('returns false for features without homeMeta', () => {
      const noMetaFeature: OsFeatureDefinition = {
        id: 'test',
        displayName: 'Test',
        shortName: 'Test',
        description: 'Test',
        iconName: 'Test',
        route: '/test',
        status: 'live',
      };

      expect(isStandaloneSuite(noMetaFeature)).toBe(false);
    });

    it('returns false for non-live features', () => {
      const wipFeature: OsFeatureDefinition = {
        id: 'test',
        displayName: 'Test',
        shortName: 'Test',
        description: 'Test',
        iconName: 'Test',
        route: '/test',
        status: 'wip',
        homeMeta: { title: 'Test' },
      };

      expect(isStandaloneSuite(wipFeature)).toBe(false);
    });
  });

  // ==========================================================================
  // Primary Actions Type Safety
  // ==========================================================================

  describe('Primary Actions Validation', () => {
    it('all standalone suite actions are type-safe', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        const actions = suite.homeMeta.primaryActions ?? [];

        for (const action of actions) {
          expect(isValidPrimaryAction(action)).toBe(true);
          expect(['workbench', 'standalone', 'system']).toContain(action.intent);
          expect(action.id).toBeTruthy();
          expect(action.label).toBeTruthy();
        }
      }
    });

    it('isValidPrimaryAction validates correctly', () => {
      expect(isValidPrimaryAction({ id: 'test', label: 'Test', intent: 'standalone' })).toBe(true);
      expect(isValidPrimaryAction({ id: 'test', label: 'Test', intent: 'workbench' })).toBe(true);
      expect(isValidPrimaryAction({ id: 'test', label: 'Test', intent: 'system' })).toBe(true);

      // @ts-expect-error - Testing invalid intent
      expect(isValidPrimaryAction({ id: 'test', label: 'Test', intent: 'invalid' })).toBe(false);

      // @ts-expect-error - Testing missing id
      expect(isValidPrimaryAction({ label: 'Test', intent: 'standalone' })).toBe(false);

      // @ts-expect-error - Testing missing label
      expect(isValidPrimaryAction({ id: 'test', intent: 'standalone' })).toBe(false);
    });
  });

  // ==========================================================================
  // Launcher Parity Tests
  // ==========================================================================

  describe('Launcher Parity', () => {
    it('all standalone suites appear in launcher', () => {
      const suites = getStandaloneSuites();
      const launcherItems = getLauncherItems();

      for (const suite of suites) {
        const launcherItem = launcherItems.find((item) => item.id === suite.id);
        expect(launcherItem).toBeDefined();
      }
    });

    it('launcher routes match registry routes for standalone features', () => {
      const suites = getStandaloneSuites();
      const launcherItems = getLauncherItems();

      for (const suite of suites) {
        const launcherItem = launcherItems.find((item) => item.id === suite.id);
        expect(launcherItem?.route).toBe(suite.route);
      }
    });

    it('launcher intent is standalone for all standalone suites', () => {
      const suites = getStandaloneSuites();
      const launcherItems = getLauncherItems();

      for (const suite of suites) {
        const launcherItem = launcherItems.find((item) => item.id === suite.id);
        expect(launcherItem?.intent).toBe('standalone');
      }
    });
  });

  // ==========================================================================
  // Known Standalone Suites (Regression Lock)
  // ==========================================================================

  describe('Regression Lock', () => {
    it('pilot and trace are standalone suites', () => {
      const suites = getStandaloneSuites();
      const ids = suites.map((s) => s.id);

      expect(ids).toContain('pilot');
      expect(ids).toContain('trace');
    });

    it('pilot has required homeMeta fields', () => {
      const suites = getStandaloneSuites();
      const pilot = suites.find((s) => s.id === 'pilot');

      expect(pilot).toBeDefined();
      expect(pilot?.homeMeta.title).toBe('TerraPilot Console');
      expect(pilot?.homeMeta.primaryActions?.length).toBeGreaterThan(0);
    });

    it('trace has required homeMeta fields', () => {
      const suites = getStandaloneSuites();
      const trace = suites.find((s) => s.id === 'trace');

      expect(trace).toBeDefined();
      expect(trace?.homeMeta.title).toBe('TerraTrace Console');
      expect(trace?.homeMeta.primaryActions?.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Stop Condition: Missing homeMeta Fails CI
  // ==========================================================================

  describe('CI Stop Condition', () => {
    it('no live OS feature with route lacks homeMeta (CI gate)', () => {
      // This is the enforcement gate: any live feature with a route MUST have homeMeta
      const liveWithRoutes = OS_FEATURES.filter((f) => f.status === 'live' && f.route);

      for (const feature of liveWithRoutes) {
        expect(feature.homeMeta).toBeDefined();
        expect(feature.homeMeta?.title).toBeTruthy();
      }
    });

    it('no standalone suite has empty primaryActions array', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        // primaryActions can be undefined (no actions) but if present must have content
        if (suite.homeMeta.primaryActions) {
          expect(suite.homeMeta.primaryActions.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
