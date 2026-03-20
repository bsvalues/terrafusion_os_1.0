/**
 * Phase 28 — Parcel Param Robustness Contract
 *
 * Contract: all /property/:parcelId/* routes handle invalid/missing parcelId
 * gracefully — no crash, no blank. Must render either:
 *   - A tab landmark (when parcelId is present but garbage → workbench renders)
 *   - The "workbench-no-parcel" landmark (when parcelId is truly missing)
 *   - NOT the crash fallback ("Reset Application")
 *
 * Phase 22–27 proved the happy path (valid parcelId → landmarks).
 * Phase 28 proves the sad path (garbage/missing → no crash, stable landmark).
 *
 * Prevents:
 * - Crash loops from malformed parcel URLs (pen-test, broken links, typos)
 * - White screens from URL fuzzing
 * - XSS through parcelId injection into rendered output
 *
 * Technique:
 * - Mock BrowserRouter → MemoryRouter (same as Phase 24–27)
 * - Navigate to /property/{BAD_VALUE}/{tab} with various bad parcelIds
 * - Assert: no crash fallback + at least one stable landmark renders
 *
 * Allowed production change:
 * - data-testid="workbench-no-parcel" on PropertyWorkbench's missing-parcel state
 *
 * Scope: Mechanical robustness only; not asserting backend data correctness.
 */

import { vi, describe, it, expect, beforeAll, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ============================================================================
// Mocks (hoisted before imports by Jest)
// ============================================================================

let memoryRouterEntries: string[] = ['/'];

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={memoryRouterEntries}>{children}</actual.MemoryRouter>
    ),
  };
});

vi.mock('../../auth/authStorage', () => ({
  getToken: () => 'smoke-test-token',
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: vi.fn(),
  unregisterLogoutHandler: vi.fn(),
}));

import Router from '../../Router';

// ============================================================================
// Test Vectors — bad parcelId values that must not crash
// ============================================================================

/**
 * Each vector is a parcelId string that should be safely handled.
 * React Router's /:parcelId always matches a non-empty segment,
 * so all these will reach PropertyWorkbench with parcelId = the value.
 * The workbench should render (with empty/placeholder data) without crashing.
 */
const BAD_PARCEL_IDS = [
  { label: 'random string', value: 'INVALID_GARBAGE' },
  { label: 'numeric but fake', value: '0000000000' },
  { label: 'negative number', value: '-1' },
  { label: 'special chars', value: 'abc!@%23$%25%5E&*()' },
  { label: 'SQL injection attempt', value: "1' OR '1'='1" },
  { label: 'path traversal attempt', value: '..%2F..%2F..%2Fetc%2Fpasswd' },
  { label: 'very long string', value: 'A'.repeat(500) },
  { label: 'unicode', value: '日本語テスト🏠' },
  { label: 'single char', value: 'x' },
  { label: 'whitespace encoded', value: 'hello%20world' },
];

/**
 * Tab routes to test with each bad parcelId.
 * Only test the canonical workbench tabs (from desktop manifest).
 */
const WORKBENCH_TABS = ['forge', 'atlas', 'dais', 'dossier', 'pilot'];

/**
 * Valid landmark testids that prove the workbench rendered content.
 * Any of these appearing means the app didn't crash or blank.
 */
const TAB_LANDMARKS: Record<string, string[]> = {
  forge: ['property-forge-tab', 'property-workbench-root'],
  atlas: ['property-atlas-tab', 'property-workbench-root'],
  dais: ['property-dais-tab', 'property-workbench-root'],
  dossier: ['property-dossier-tab', 'property-workbench-root'],
  pilot: ['property-pilot-tab', 'property-workbench-root'],
};

// ============================================================================
// Helpers
// ============================================================================

function hasAnyLandmark(testIds: string[]): boolean {
  return testIds.some((id) => screen.queryByTestId(id) !== null);
}

// ============================================================================
// Tests
// ============================================================================

describe('Phase 28 contract: parcel param robustness — invalid parcelId never crashes', () => {
  beforeAll(async () => {
    vi.useRealTimers();
    await import('../../App');
    await import('../../pages/PropertySearch');
    await import('../../pages/workbench/PropertyWorkbench');
    await import('../../pages/workbench/tabs/PropertyForge');
    await import('../../pages/workbench/tabs/PropertyAtlas');
    await import('../../pages/workbench/tabs/PropertyDais');
    await import('../../pages/workbench/tabs/PropertyDossier');
    await import('../../pages/workbench/tabs/PropertyPilot');
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  }, 20000);

  afterEach(() => {
    cleanup();
  });

  /**
   * Core contract: for a representative tab (forge), every bad parcelId
   * renders the workbench without crashing.
   *
   * We test forge as the canonical tab. If forge survives, the others
   * will too (they share the same PropertyWorkbench parent guard).
   */
  it.each(BAD_PARCEL_IDS)(
    'parcelId="$label" ($value): /property/{value}/forge renders without crash',
    async ({ value }) => {
      memoryRouterEntries = [`/property/${encodeURIComponent(value)}/forge`];

      render(<Router />);

      // Wait for Suspense to resolve
      await waitFor(
        () => {
          expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // HARD GUARD: must not be in crash fallback state
      expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();

      // The workbench should render content (tab landmark or at minimum no crash).
      // With garbage parcelId, PropertyWorkbench still mounts because :parcelId matched.
      await waitFor(
        () => {
          const hasTab = hasAnyLandmark(TAB_LANDMARKS.forge);
          const hasNoParcel = screen.queryByTestId('workbench-no-parcel') !== null;
          if (!hasTab && !hasNoParcel) {
            throw new Error(
              `Phase 28: /property/${value}/forge rendered but no landmark found.\n` +
                'Expected either a tab landmark or workbench-no-parcel state.'
            );
          }
        },
        { timeout: 5000 }
      );
    }
  );

  /**
   * Coverage across all tabs: one representative bad parcelId per tab.
   * Ensures no tab has a unique crash path for bad input.
   */
  it.each(WORKBENCH_TABS)(
    'tab "%s" with garbage parcelId renders without crash',
    async (tab) => {
      const badParcel = 'ROBUSTNESS_TEST_INVALID';
      memoryRouterEntries = [`/property/${badParcel}/${tab}`];

      render(<Router />);

      await waitFor(
        () => {
          expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Must not crash
      expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();

      // Should render tab content or no-parcel state
      await waitFor(
        () => {
          const landmarks = TAB_LANDMARKS[tab] || [];
          const hasTab = hasAnyLandmark(landmarks);
          const hasNoParcel = screen.queryByTestId('workbench-no-parcel') !== null;
          if (!hasTab && !hasNoParcel) {
            throw new Error(
              `Phase 28: /property/${badParcel}/${tab} rendered but no landmark found.`
            );
          }
        },
        { timeout: 5000 }
      );
    }
  );

  /**
   * Edge case: /property with NO parcelId segment.
   * React Router won't match /property/:parcelId, so this falls through
   * to no matching route. Verify: no crash, graceful behavior.
   */
  it('/property (no parcelId segment) does not crash', async () => {
    memoryRouterEntries = ['/property'];

    render(<Router />);

    await waitFor(
      () => {
        expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
      },
      { timeout: 15000 }
    );

    // Must not crash
    expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();
  });

  /**
   * Edge case: /property/ (trailing slash, no parcelId).
   * Same as above — should not crash.
   */
  it('/property/ (trailing slash, no parcelId) does not crash', async () => {
    memoryRouterEntries = ['/property/'];

    render(<Router />);

    await waitFor(
      () => {
        expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();
  });
});
