/**
 * TerraFusion OS Workbench Entrypoints Parity Tests
 *
 * Tests that ensure ShellHome and Launcher generate identical workbench hrefs
 * from the same registry truth. Prevents navigation drift between entry points.
 *
 * Parity requirements:
 * - ShellHome tile href === Launcher item route for same suite
 * - Both derive from getWorkbenchHref canonical generator
 * - No hardcoded tab mappings outside registry
 * - Slice 9: Context-aware navigation (fallback when no parcel context)
 *
 * @module __tests__/workbench/workbenchEntrypoints.parity.test
 * @see Slice 8: Workbench Entry Contract + Cross-Surface Deep-Link Truth
 * @see Slice 9: Unified "Open Context" Contract
 */

import { getLauncherItems } from '../../components/launcher/launcherModel';
import {
    getWorkbenchFallbackRoute,
    getWorkbenchHref,
    getWorkbenchSuites,
    WORKBENCH_FALLBACK_BASE
} from '../../config/suiteRegistry';
import { setParcelContext, useParcelContextStore } from '../../context/parcelContext';

// ============================================================================
// Test Constants
// ============================================================================

/**
 * Standard demo parcel ID used across all entry points.
 * This should be consistent between ShellHome and Launcher.
 */
const DEMO_PARCEL_ID = '1234567890';

// ============================================================================
// Test Helpers
// ============================================================================

function resetParcelContext() {
  useParcelContextStore.setState({ context: null });
}

function setTestParcelContext(parcelId: string) {
  setParcelContext({ parcelId, source: 'selection' });
}

// ============================================================================
// Parity Tests
// ============================================================================

describe('Workbench Entrypoints Parity', () => {
  // Reset parcel context between tests
  beforeEach(() => {
    resetParcelContext();
  });

  // ==========================================================================
  // Cross-Surface Href Parity
  // ==========================================================================

  describe('Launcher ↔ Registry Parity', () => {
    it('launcher routes use context-aware href generation (Slice 9)', () => {
      // Without parcel context, launcher uses fallback routes
      const suites = getWorkbenchSuites();
      const launcherItems = getLauncherItems();

      for (const suite of suites) {
        const launcherItem = launcherItems.find((item) => item.id === suite.id);
        expect(launcherItem).toBeDefined();

        // Slice 9: Without context, expect fallback route
        const expectedFallback = getWorkbenchFallbackRoute(suite);
        expect(launcherItem?.route).toBe(expectedFallback);
      }
    });

    it('launcher routes match registry when parcel context exists', () => {
      // With parcel context, launcher uses workbench routes
      setTestParcelContext(DEMO_PARCEL_ID);

      const suites = getWorkbenchSuites();
      const launcherItems = getLauncherItems();

      for (const suite of suites) {
        const launcherItem = launcherItems.find((item) => item.id === suite.id);
        expect(launcherItem).toBeDefined();

        const registryHref = getWorkbenchHref(suite, DEMO_PARCEL_ID);
        expect(launcherItem?.route).toBe(registryHref);
      }
    });
  });

  describe('Route Structure Consistency', () => {
    it('all workbench routes follow /property/:parcelId/:tab pattern', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        const href = getWorkbenchHref(suite, DEMO_PARCEL_ID);

        // Validate pattern
        const pattern = /^\/property\/[^/]+\/[^/]+$/;
        expect(href).toMatch(pattern);

        // Validate tab segment matches workbenchTarget
        const [, , , tabSegment] = href.split('/');
        const expectedTab = suite.workbenchTarget.path ?? suite.workbenchTarget.tabId;
        expect(tabSegment).toBe(expectedTab);
      }
    });

    it('tab segments are URL-safe', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        const href = getWorkbenchHref(suite, 'test-parcel-123');
        const [, , , tabSegment] = href.split('/');

        // Tab should be URL-safe (no spaces, special chars)
        expect(tabSegment).toMatch(/^[a-z0-9-]+$/);
      }
    });
  });

  describe('Parcel ID Handling', () => {
    it('parcel ID is correctly interpolated', () => {
      const suite = getWorkbenchSuites()[0];

      const testCases = [
        { parcelId: 'P-12345', expected: '/property/P-12345/' },
        { parcelId: '1234567890', expected: '/property/1234567890/' },
        { parcelId: 'benton-001', expected: '/property/benton-001/' },
      ];

      for (const { parcelId, expected } of testCases) {
        const href = getWorkbenchHref(suite, parcelId);
        expect(href.startsWith(expected)).toBe(true);
      }
    });

    it('parcel ID with special chars is preserved', () => {
      const suite = getWorkbenchSuites()[0];

      // Parcel IDs with dashes should work
      const href = getWorkbenchHref(suite, 'P-2024-0042-A');
      expect(href).toContain('P-2024-0042-A');
    });
  });

  // ==========================================================================
  // Context-Aware Demo Consistency (Slice 9)
  // ==========================================================================

  describe('Context-Aware Demo Consistency', () => {
    it('without context: launcher workbench items use fallback route', () => {
      // No parcel context set
      const launcherItems = getLauncherItems();
      const workbenchItems = launcherItems.filter((item) => item.intent === 'workbench');

      for (const item of workbenchItems) {
        // Fallback routes start with /property/search
        expect(item.route).toContain(WORKBENCH_FALLBACK_BASE);
      }
    });

    it('with context: launcher workbench items use parcel route', () => {
      // Set parcel context
      setTestParcelContext(DEMO_PARCEL_ID);

      const launcherItems = getLauncherItems();
      const workbenchItems = launcherItems.filter((item) => item.intent === 'workbench');

      for (const item of workbenchItems) {
        expect(item.route).toContain(DEMO_PARCEL_ID);
      }
    });
  });

  // ==========================================================================
  // Intent Alignment
  // ==========================================================================

  describe('Intent Alignment', () => {
    it('workbench suites have workbench intent in launcher', () => {
      const suites = getWorkbenchSuites();
      const launcherItems = getLauncherItems();

      for (const suite of suites) {
        const launcherItem = launcherItems.find((item) => item.id === suite.id);
        expect(launcherItem?.intent).toBe('workbench');
      }
    });

    it('standalone features have standalone intent in launcher', () => {
      const launcherItems = getLauncherItems();
      const standaloneItems = launcherItems.filter((item) => ['pilot', 'trace'].includes(item.id));

      for (const item of standaloneItems) {
        expect(item.intent).toBe('standalone');
      }
    });
  });

  // ==========================================================================
  // Bidirectional Truth (Registry → UI surfaces)
  // ==========================================================================

  describe('Bidirectional Truth', () => {
    it('every launcher workbench item has corresponding registry suite', () => {
      const launcherItems = getLauncherItems();
      const workbenchItems = launcherItems.filter((item) => item.intent === 'workbench');
      const suiteIds = getWorkbenchSuites().map((s) => s.id);

      for (const item of workbenchItems) {
        expect(suiteIds).toContain(item.id);
      }
    });

    it('every registry workbench suite has corresponding launcher item', () => {
      const suites = getWorkbenchSuites();
      const launcherIds = getLauncherItems().map((item) => item.id);

      for (const suite of suites) {
        expect(launcherIds).toContain(suite.id);
      }
    });
  });
});
