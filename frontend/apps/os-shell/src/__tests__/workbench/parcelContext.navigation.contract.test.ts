/**
 * TerraFusion OS Parcel Context Navigation Contract Tests
 *
 * Tests for parcel context propagation across navigation surfaces.
 * Enforces contract: workbench href generation is truthful with/without parcel context.
 *
 * Contract requirements:
 * - With parcel context: routes to /property/<parcelId>/<tab>
 * - Without parcel context: routes to /property/search?openTab=<tabId>
 * - Standalone CTA behavior matches contract (label + route)
 * - Launcher + ShellHome use same context-aware href generation
 *
 * @module __tests__/parcelContext.navigation.contract.test
 * @see Slice 9: Unified "Open Context" Contract
 */

import {
    getWorkbenchFallbackById,
    getWorkbenchFallbackRoute,
    getWorkbenchHref,
    getWorkbenchHrefByIdWithContext,
    getWorkbenchHrefWithContext,
    getWorkbenchSuites,
    WORKBENCH_FALLBACK_BASE,
} from '../../config/suiteRegistry';
import {
    clearParcelContext,
    getParcelContext,
    setParcelContext,
    useParcelContextStore,
    type ParcelContext,
} from '../../context/parcelContext';

// ============================================================================
// Test Constants
// ============================================================================

const TEST_PARCEL_ID = 'P-2024-TEST-001';
const TEST_PARCEL_NAME = 'Test Parcel';

// ============================================================================
// Helper: Reset Store
// ============================================================================

function resetStore() {
  useParcelContextStore.setState({ context: null });
  // Clear session storage
  try {
    sessionStorage.removeItem('tf:parcel-context');
  } catch {
    // Session storage might be unavailable in test env
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('Parcel Context Navigation Contract', () => {
  beforeEach(() => {
    resetStore();
  });

  // ==========================================================================
  // Context-Aware Href Generation
  // ==========================================================================

  describe('getWorkbenchHrefWithContext', () => {
    it('with parcel context: routes to /property/<parcelId>/<tab>', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        const result = getWorkbenchHrefWithContext(suite, TEST_PARCEL_ID);

        expect(result.hasParcelContext).toBe(true);
        expect(result.parcelId).toBe(TEST_PARCEL_ID);
        expect(result.isFallback).toBe(false);
        expect(result.href).toMatch(/^\/property\/P-2024-TEST-001\/[a-z]+$/);
      }
    });

    it('without parcel context: routes to /property/search?openTab=<tabId>', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        const result = getWorkbenchHrefWithContext(suite, null);

        expect(result.hasParcelContext).toBe(false);
        expect(result.parcelId).toBeNull();
        expect(result.isFallback).toBe(true);
        expect(result.href).toMatch(/^\/property\/search\?openTab=[a-z]+$/);
      }
    });

    it('returns correct href format for each suite', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        const withContext = getWorkbenchHrefWithContext(suite, 'P-123');
        const withoutContext = getWorkbenchHrefWithContext(suite, null);

        // With context: /property/<parcelId>/<tab>
        expect(withContext.href).toBe(getWorkbenchHref(suite, 'P-123'));

        // Without context: /property/search?openTab=<tab>
        expect(withoutContext.href).toBe(getWorkbenchFallbackRoute(suite));
      }
    });
  });

  describe('getWorkbenchHrefByIdWithContext', () => {
    it('returns correct result for valid workbench suite', () => {
      const result = getWorkbenchHrefByIdWithContext('forge', 'P-456');

      expect(result).not.toBeNull();
      expect(result?.href).toBe('/property/P-456/forge');
      expect(result?.hasParcelContext).toBe(true);
    });

    it('returns null for non-workbench features', () => {
      // Standalone features should not have workbench hrefs
      const result = getWorkbenchHrefByIdWithContext('pilot', 'P-456');
      expect(result).toBeNull();
    });

    it('returns fallback for valid suite without parcel', () => {
      const result = getWorkbenchHrefByIdWithContext('atlas', null);

      expect(result).not.toBeNull();
      expect(result?.isFallback).toBe(true);
      expect(result?.href).toBe('/property/search?openTab=atlas');
    });
  });

  // ==========================================================================
  // Fallback Route Generation
  // ==========================================================================

  describe('Fallback Route Contract', () => {
    it('fallback base is /property/search', () => {
      expect(WORKBENCH_FALLBACK_BASE).toBe('/property/search');
    });

    it('fallback routes preserve tab intent via query param', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        const fallback = getWorkbenchFallbackRoute(suite);
        const tabId = suite.workbenchTarget.tabId;

        expect(fallback).toBe(`/property/search?openTab=${tabId}`);
      }
    });

    it('getWorkbenchFallbackById returns correct fallback', () => {
      expect(getWorkbenchFallbackById('forge')).toBe('/property/search?openTab=forge');
      expect(getWorkbenchFallbackById('atlas')).toBe('/property/search?openTab=atlas');
      expect(getWorkbenchFallbackById('dais')).toBe('/property/search?openTab=dais');
      expect(getWorkbenchFallbackById('dossier')).toBe('/property/search?openTab=dossier');
      expect(getWorkbenchFallbackById('gpt')).toBe('/property/search?openTab=pilot');
    });

    it('getWorkbenchFallbackById returns null for non-workbench features', () => {
      expect(getWorkbenchFallbackById('pilot')).toBeNull();
      expect(getWorkbenchFallbackById('trace')).toBeNull();
    });
  });

  // ==========================================================================
  // Parcel Context Store
  // ==========================================================================

  describe('Parcel Context Store', () => {
    it('getParcelContext returns null when no context set', () => {
      expect(getParcelContext()).toBeNull();
    });

    it('setParcelContext updates store', () => {
      const context: ParcelContext = {
        parcelId: TEST_PARCEL_ID,
        parcelName: TEST_PARCEL_NAME,
        source: 'selection',
      };

      setParcelContext(context);

      const retrieved = getParcelContext();
      expect(retrieved?.parcelId).toBe(TEST_PARCEL_ID);
      expect(retrieved?.parcelName).toBe(TEST_PARCEL_NAME);
    });

    it('clearParcelContext clears store', () => {
      setParcelContext({ parcelId: 'P-123', source: 'route' });
      expect(getParcelContext()).not.toBeNull();

      clearParcelContext();
      expect(getParcelContext()).toBeNull();
    });

    it('preserves source metadata', () => {
      setParcelContext({ parcelId: 'P-route', source: 'route' });
      expect(getParcelContext()?.source).toBe('route');

      setParcelContext({ parcelId: 'P-session', source: 'session' });
      expect(getParcelContext()?.source).toBe('session');

      setParcelContext({ parcelId: 'P-selection', source: 'selection' });
      expect(getParcelContext()?.source).toBe('selection');
    });
  });

  // ==========================================================================
  // Navigation Parity
  // ==========================================================================

  describe('Navigation Parity', () => {
    it('all workbench suites have valid fallback routes', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        const fallback = getWorkbenchFallbackRoute(suite);

        // Should start with fallback base
        expect(fallback).toContain(WORKBENCH_FALLBACK_BASE);

        // Should have openTab query param
        expect(fallback).toContain('openTab=');

        // Tab should match suite's workbenchTarget
        const tabId = suite.workbenchTarget.tabId;
        expect(fallback).toContain(`openTab=${tabId}`);
      }
    });

    it('parcel ID is correctly interpolated in workbench href', () => {
      const suite = getWorkbenchSuites()[0];
      const testIds = ['P-12345', 'BENTON-2024-001', '1234567890'];

      for (const parcelId of testIds) {
        const result = getWorkbenchHrefWithContext(suite, parcelId);

        expect(result.href).toContain(parcelId);
        expect(result.parcelId).toBe(parcelId);
      }
    });

    it('gpt suite maps to pilot tab correctly', () => {
      const withParcel = getWorkbenchHrefByIdWithContext('gpt', 'P-123');
      const withoutParcel = getWorkbenchHrefByIdWithContext('gpt', null);

      // With parcel: /property/P-123/pilot (not /gpt)
      expect(withParcel?.href).toBe('/property/P-123/pilot');

      // Without parcel: /property/search?openTab=pilot
      expect(withoutParcel?.href).toBe('/property/search?openTab=pilot');
    });
  });

  // ==========================================================================
  // CI Stop Condition
  // ==========================================================================

  describe('CI Stop Condition', () => {
    it('context-aware href always returns WorkbenchHrefResult', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        const withContext = getWorkbenchHrefWithContext(suite, 'P-123');
        const withoutContext = getWorkbenchHrefWithContext(suite, null);

        // Both should return proper result objects
        expect(withContext).toHaveProperty('href');
        expect(withContext).toHaveProperty('hasParcelContext');
        expect(withContext).toHaveProperty('parcelId');
        expect(withContext).toHaveProperty('isFallback');

        expect(withoutContext).toHaveProperty('href');
        expect(withoutContext).toHaveProperty('hasParcelContext');
        expect(withoutContext).toHaveProperty('parcelId');
        expect(withoutContext).toHaveProperty('isFallback');
      }
    });

    it('no workbench navigation can produce empty href', () => {
      const suites = getWorkbenchSuites();

      for (const suite of suites) {
        const withContext = getWorkbenchHrefWithContext(suite, 'P-any');
        const withoutContext = getWorkbenchHrefWithContext(suite, null);

        expect(withContext.href).toBeTruthy();
        expect(withContext.href.length).toBeGreaterThan(0);

        expect(withoutContext.href).toBeTruthy();
        expect(withoutContext.href.length).toBeGreaterThan(0);
      }
    });
  });
});
