/**
 * Phase 9: Dais Audit & Suite Contract Tests
 * ===================================================================
 * TDD-first contract tests for AuditTrailPage and DaisSuiteHome.
 *
 * AuditTrailPage: verifies data-testid markers and absence of
 *   hardcoded light-mode color classes (CATEGORY_COLORS).
 *
 * DaisSuiteHome: verifies structural testids for stats strip,
 *   module grid, and absence of light-mode classes (already
 *   uses tf-tokens, so should pass).
 *
 * @module __tests__/dais/daisAuditSuite.contract.test
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Light-mode patterns — any hit means the component uses hardcoded color
// classes instead of design-token / tf-token CSS custom properties.
// ---------------------------------------------------------------------------

const LIGHT_MODE_PATTERNS = [
  /bg-gray-\d+/,
  /bg-blue-\d+/,
  /bg-green-\d+/,
  /bg-red-\d+/,
  /bg-yellow-\d+/,
  /bg-purple-\d+/,
  /border-gray-\d+/,
  /hover:bg-gray-\d+/,
  /text-gray-\d+/,
];

// ---------------------------------------------------------------------------
// Mocks — shared
// ---------------------------------------------------------------------------

// Mock UI primitives with simple pass-through elements
vi.mock('@/components/ui/card', () => ({
  Card: (props: any) => <div data-slot="card" {...props} />,
  CardContent: (props: any) => <div data-slot="card-content" {...props} />,
  CardHeader: (props: any) => <div data-slot="card-header" {...props} />,
  CardTitle: (props: any) => <div data-slot="card-title" {...props} />,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: (props: any) => <span data-slot="badge" {...props} />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: (props: any) => <button data-slot="button" {...props} />,
}));

// ---------------------------------------------------------------------------
// AuditTrailPage mocks
// ---------------------------------------------------------------------------

// Mock global fetch for AuditTrailPage's /api/audit/search calls
const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve([
        {
          eventId: 'evt-001',
          parcelId: '10-1234-001',
          timestamp: '2026-03-10T09:30:00Z',
          userId: 'u-001',
          userName: 'J. Doe',
          action: 'Value Change',
          category: 'assessment',
          details: 'Market value updated',
          previousValue: '$280,000',
          newValue: '$295,000',
        },
      ]),
  });
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// DaisSuiteHome mocks
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useCountyStats', () => ({
  useCountyStats: () => ({
    stats: {
      activeAppeals: 42,
      totalLevyRevenue: 125000000,
      pendingAssessments: 1200,
      assessmentCompletionPercent: 87.3,
    },
    loading: false,
    error: null,
  }),
}));

vi.mock('@/components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: (props: any) => (
    <div data-testid="suite-module-grid" data-accent={props.accentVar}>
      SuiteModuleGrid
    </div>
  ),
}));

vi.mock('@/components/suites/OperationalQueue', () => ({
  OperationalQueue: (props: any) => (
    <div data-testid="operational-queue" data-accent={props.accentVar}>
      OperationalQueue
    </div>
  ),
}));

vi.mock('@/components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => null,
}));

// ---------------------------------------------------------------------------
// Lazy imports — after mocks are registered
// ---------------------------------------------------------------------------

import AuditTrailPage from '../../pages/dais/AuditTrailPage';
import DaisSuiteHome from '../../pages/suites/DaisSuiteHome';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderAuditTrailPage() {
  return render(
    <MemoryRouter initialEntries={['/dais/audit']}>
      <AuditTrailPage />
    </MemoryRouter>,
  );
}

function renderDaisSuiteHome() {
  return render(
    <MemoryRouter initialEntries={['/dais']}>
      <DaisSuiteHome />
    </MemoryRouter>,
  );
}

/**
 * Scans the rendered container's full HTML for any of the LIGHT_MODE_PATTERNS.
 * Returns the first match (or null if clean).
 */
function findLightModeViolation(container: HTMLElement): string | null {
  const html = container.innerHTML;
  for (const pattern of LIGHT_MODE_PATTERNS) {
    const match = html.match(pattern);
    if (match) return match[0];
  }
  return null;
}

// ===========================================================================
// Tests
// ===========================================================================

describe('Phase 9: Dais Audit & Suite Contract', () => {
  // -------------------------------------------------------------------------
  // AuditTrailPage
  // -------------------------------------------------------------------------

  describe('AuditTrailPage', () => {
    it('renders with data-testid="audit-trail"', async () => {
      renderAuditTrailPage();

      await waitFor(() => {
        expect(screen.getByTestId('audit-trail')).toBeInTheDocument();
      });
    });

    it('filters panel has data-testid="audit-filters"', async () => {
      renderAuditTrailPage();

      await waitFor(() => {
        expect(screen.getByTestId('audit-filters')).toBeInTheDocument();
      });
    });

    it('has table or timeline view with data-testid', async () => {
      renderAuditTrailPage();

      // Wait for fetch to resolve and events to render
      await waitFor(() => {
        const tableView = screen.queryByTestId('audit-table');
        const timelineView = screen.queryByTestId('audit-timeline');
        expect(tableView || timelineView).toBeTruthy();
      });
    });

    it('does not use hardcoded light-mode color classes', async () => {
      const { container } = renderAuditTrailPage();

      // Wait for fetch to resolve so CATEGORY_COLORS badges render
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Allow render to settle with events
      await waitFor(() => {
        const violation = findLightModeViolation(container);
        expect(violation).toBeNull();
      });
    });
  });

  // -------------------------------------------------------------------------
  // DaisSuiteHome
  // -------------------------------------------------------------------------

  describe('DaisSuiteHome', () => {
    it('renders with data-testid="suite-dais-root"', () => {
      renderDaisSuiteHome();
      expect(screen.getByTestId('suite-dais-root')).toBeInTheDocument();
    });

    it('stats strip has data-testid="dais-stats"', () => {
      renderDaisSuiteHome();
      expect(screen.getByTestId('dais-stats')).toBeInTheDocument();
    });

    it('module grid area has data-testid="dais-modules"', () => {
      renderDaisSuiteHome();
      expect(screen.getByTestId('dais-modules')).toBeInTheDocument();
    });

    it('does not use hardcoded light-mode color classes', () => {
      const { container } = renderDaisSuiteHome();
      const violation = findLightModeViolation(container);
      expect(violation).toBeNull();
    });
  });
});
