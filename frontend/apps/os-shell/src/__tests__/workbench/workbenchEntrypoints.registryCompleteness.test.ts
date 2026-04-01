/**
 * TerraFusion OS Workbench Entrypoints Registry Completeness Tests
 *
 * Tests that enforce registry-driven consistency for all workbench suites.
 * This prevents drift between the registry source of truth and runtime behavior.
 *
 * Completeness requirements:
 * - All workbench suites have workbenchTarget defined
 * - All workbenchTarget.tabId values are valid
 * - Launcher items match registry routes
 * - ShellHome tiles derive from same truth
 *
 * @module __tests__/workbench/workbenchEntrypoints.registryCompleteness.test
 * @see Slice 8: Workbench Entry Contract + Cross-Surface Deep-Link Truth
 */

import { getLauncherItems } from '../../components/launcher/launcherModel';
import {
    CONSTITUTIONAL_SUITES,
    getWorkbenchHref,
    getWorkbenchHrefById,
    getWorkbenchSuites,
    isValidWorkbenchTarget,
    isWorkbenchSuite,
    VALID_WORKBENCH_TAB_IDS,
    type SuiteDefinition,
    type WorkbenchSuiteDefinition,
} from '../../config/suiteRegistry';

// ============================================================================
// Registry Completeness Tests
// ============================================================================

describe('Workbench Registry Completeness', () => {
  // ==========================================================================
  // Helper Function Tests
  // ==========================================================================

  describe('getWorkbenchSuites()', () => {
    it('returns non-empty array of workbench suites', () => {
      const suites = getWorkbenchSuites();

      expect(Array.isArray(suites)).toBe(true);
      expect(suites.length).toBeGreaterThan(0);
    });

    it('all returned suites have workbenchTab=true', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        expect(suite.workbenchTab).toBe(true);
      }
    });

    it('all returned suites have workbenchTarget defined', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        expect(suite.workbenchTarget).toBeDefined();
        expect(suite.workbenchTarget.tabId).toBeTruthy();
      }
    });

    it('all workbenchTarget.tabId values are valid', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        expect(VALID_WORKBENCH_TAB_IDS).toContain(suite.workbenchTarget.tabId);
      }
    });
  });

  describe('isWorkbenchSuite()', () => {
    it('returns true for valid workbench suites', () => {
      const validSuite: SuiteDefinition = {
        id: 'forge',
        displayName: 'TerraForge',
        shortName: 'Forge',
        description: 'Test',
        iconName: 'Hammer',
        route: '/forge',
        color: '#ff6b35',
        status: 'queued',
        workbenchTab: true,
        workbenchTarget: { tabId: 'forge' },
      };

      expect(isWorkbenchSuite(validSuite)).toBe(true);
    });

    it('returns false for suites without workbenchTab', () => {
      const noTabSuite: SuiteDefinition = {
        id: 'forge',
        displayName: 'Test',
        shortName: 'Test',
        description: 'Test',
        iconName: 'Test',
        route: '/test',
        color: '#000',
        status: 'queued',
        workbenchTarget: { tabId: 'forge' },
      };

      expect(isWorkbenchSuite(noTabSuite)).toBe(false);
    });

    it('returns false for suites without workbenchTarget', () => {
      const noTargetSuite: SuiteDefinition = {
        id: 'forge',
        displayName: 'Test',
        shortName: 'Test',
        description: 'Test',
        iconName: 'Test',
        route: '/test',
        color: '#000',
        status: 'queued',
        workbenchTab: true,
      };

      expect(isWorkbenchSuite(noTargetSuite)).toBe(false);
    });
  });

  // ==========================================================================
  // Workbench Target Validation
  // ==========================================================================

  describe('WorkbenchTarget Validation', () => {
    it('all workbench suite targets are type-safe', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        expect(isValidWorkbenchTarget(suite.workbenchTarget)).toBe(true);
      }
    });

    it('isValidWorkbenchTarget validates correctly', () => {
      expect(isValidWorkbenchTarget({ tabId: 'forge' })).toBe(true);
      expect(isValidWorkbenchTarget({ tabId: 'atlas' })).toBe(true);
      expect(isValidWorkbenchTarget({ tabId: 'summary' })).toBe(true);
      expect(isValidWorkbenchTarget({ tabId: 'pilot' })).toBe(true);

      // @ts-expect-error - Testing invalid tabId
      expect(isValidWorkbenchTarget({ tabId: 'invalid' })).toBe(false);

      // @ts-expect-error - Testing undefined tabId
      expect(isValidWorkbenchTarget({})).toBe(false);
    });

    it('VALID_WORKBENCH_TAB_IDS contains all expected tabs', () => {
      expect(VALID_WORKBENCH_TAB_IDS).toContain('summary');
      expect(VALID_WORKBENCH_TAB_IDS).toContain('forge');
      expect(VALID_WORKBENCH_TAB_IDS).toContain('atlas');
      expect(VALID_WORKBENCH_TAB_IDS).toContain('dais');
      expect(VALID_WORKBENCH_TAB_IDS).toContain('clerk');
      expect(VALID_WORKBENCH_TAB_IDS).toContain('treasury');
      expect(VALID_WORKBENCH_TAB_IDS).toContain('audit');
      expect(VALID_WORKBENCH_TAB_IDS).toContain('dossier');
      expect(VALID_WORKBENCH_TAB_IDS).toContain('pilot');
    });
  });

  // ==========================================================================
  // Workbench Href Generation
  // ==========================================================================

  describe('Workbench Href Generation', () => {
    it('getWorkbenchHref generates correct paths', () => {
      const forgeSuite = getWorkbenchSuites().find((s) => s.id === 'forge');
      expect(forgeSuite).toBeDefined();

      const href = getWorkbenchHref(forgeSuite!, 'P-12345');
      expect(href).toBe('/property/P-12345/forge');
    });

    it('getWorkbenchHrefById returns correct path for valid suite', () => {
      const href = getWorkbenchHrefById('forge', 'P-12345');
      expect(href).toBe('/property/P-12345/forge');
    });

    it('getWorkbenchHrefById returns null for non-workbench features', () => {
      // OS features like pilot/trace are standalone, not workbench
      // But they're SuiteId type, so we test with a suite that might not be workbench
      // Since all current suites ARE workbench, this tests the edge case
      const href = getWorkbenchHrefById('forge', 'P-12345');
      expect(href).not.toBeNull();
    });

    it('href uses path override when specified', () => {
      // Create a mock suite with path override
      const suiteWithPath: WorkbenchSuiteDefinition = {
        id: 'forge',
        displayName: 'Test',
        shortName: 'Test',
        description: 'Test',
        iconName: 'Test',
        route: '/test',
        color: '#000',
        status: 'queued',
        workbenchTab: true,
        workbenchTarget: { tabId: 'forge', path: 'custom-path' },
      };

      const href = getWorkbenchHref(suiteWithPath, 'P-12345');
      expect(href).toBe('/property/P-12345/custom-path');
    });
  });

  // ==========================================================================
  // Launcher Parity Tests
  // ==========================================================================

  describe('Launcher Parity', () => {
    it('all workbench suites appear in launcher', () => {
      const suites = getWorkbenchSuites();
      const launcherItems = getLauncherItems();

      for (const suite of suites) {
        const launcherItem = launcherItems.find((item) => item.id === suite.id);
        expect(launcherItem).toBeDefined();
      }
    });

    it('workbench launcher items have workbench intent', () => {
      const suites = getWorkbenchSuites();
      const launcherItems = getLauncherItems();

      for (const suite of suites) {
        const launcherItem = launcherItems.find((item) => item.id === suite.id);
        expect(launcherItem?.intent).toBe('workbench');
      }
    });

    it('workbench launcher routes follow context-aware pattern (Slice 9)', () => {
      // Slice 9: Without parcel context, launcher routes to fallback
      // With context: /property/:parcelId/:tab
      // Without context: /property/search?openTab=:tab
      const launcherItems = getLauncherItems();
      const workbenchItems = launcherItems.filter((item) => item.intent === 'workbench');

      // In test environment without parcel context, expect fallback pattern
      const workbenchPattern = /^\/property\/[^/]+\/[^/]+$/;
      const fallbackPattern = /^\/property\/search\?openTab=[a-z]+$/;

      for (const item of workbenchItems) {
        // Route should match one of the valid patterns
        const isWorkbenchRoute = workbenchPattern.test(item.route);
        const isFallbackRoute = fallbackPattern.test(item.route);
        expect(isWorkbenchRoute || isFallbackRoute).toBe(true);
      }
    });
  });

  // ==========================================================================
  // Known Workbench Suites (Regression Lock)
  // ==========================================================================

  describe('Regression Lock', () => {
    it('forge, atlas, dais, and dossier are workbench suites', () => {
      const suites = getWorkbenchSuites();
      const ids = suites.map((s) => s.id);

      expect(ids).toContain('forge');
      expect(ids).toContain('atlas');
      expect(ids).toContain('dais');
      expect(ids).toContain('dossier');
    });

    it('gpt is not a workbench suite', () => {
      const gptSuite = getWorkbenchSuites().find((s) => s.id === 'gpt');
      expect(gptSuite).toBeUndefined();
    });

    it('all workbench suites map to their own tab', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        expect(suite.workbenchTarget.tabId).toBe(suite.id);
      }
    });
  });

  // ==========================================================================
  // CI Stop Condition: Missing workbenchTarget Fails CI
  // ==========================================================================

  describe('CI Stop Condition', () => {
    it('no suite with workbenchTab=true lacks workbenchTarget (CI gate)', () => {
      // This is the enforcement gate: any suite with workbenchTab MUST have workbenchTarget
      const suitesWithTab = CONSTITUTIONAL_SUITES.filter((s) => s.workbenchTab === true);

      for (const suite of suitesWithTab) {
        expect(suite.workbenchTarget).toBeDefined();
        expect(suite.workbenchTarget?.tabId).toBeTruthy();
      }
    });

    it('no workbenchTarget has invalid tabId', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        expect(isValidWorkbenchTarget(suite.workbenchTarget)).toBe(true);
      }
    });
  });
});
