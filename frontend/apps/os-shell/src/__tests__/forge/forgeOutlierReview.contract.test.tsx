/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 16 OUTLIER REVIEW PANEL CONTRACT TESTS
 * Flagged-parcel table with IQR/trim indicators, confirm/dismiss, drill-through
 *
 * These tests define the Phase 16 contract for OutlierReviewPanel.
 * They codify:
 *   - Panel renders with data-testid="outlier-review"
 *   - Flagged parcels table shows parcel ID, address, ratio, deviation, flag reason, confidence
 *   - Confirm/dismiss buttons per row
 *   - Drill-through button fires navigation to Property Workbench
 *   - Filter by outlier method and review status
 *   - Dark theme compliance (no light-mode classes)
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — shadcn/ui primitives
// ---------------------------------------------------------------------------

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-component="card" {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-component="card-content" {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-component="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <div data-component="card-title" {...props}>{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span data-component="badge" {...props}>{children}</span>
  ),
}));

// ---------------------------------------------------------------------------
// Mock Zustand store — hoisted for shared state
// ---------------------------------------------------------------------------

const { mockFns } = vi.hoisted(() => ({
  mockFns: {
    reviewOutlier: vi.fn(),
    setFilter: vi.fn(),
  },
}));

vi.mock('@/stores/forgeStatisticsStore', async () => {
  const fixtures = await vi.importActual<typeof import('@/data/forgeStatisticsFixtures')>('@/data/forgeStatisticsFixtures');
  return {
    useForgeStatisticsStore: vi.fn((selector?: any) => {
      const state = {
        outliers: fixtures.OUTLIER_RECORDS,
        filters: fixtures.STUDY_FILTER_DEFAULT,
        loading: false,
        error: null,
        reviewOutlier: mockFns.reviewOutlier,
        setFilter: mockFns.setFilter,
      };
      return selector ? selector(state) : state;
    }),
  };
});

// Mock module activation for drill-through
vi.mock('@/orchestration/moduleActivation', () => ({
  activateModule: vi.fn(),
  default: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { OutlierReviewPanel } from '../../pages/forge/statistics/OutlierReviewPanel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPanel() {
  return render(<OutlierReviewPanel />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 16: OutlierReviewPanel Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Structure
  // =========================================================================
  describe('Structure', () => {
    it('renders with data-testid="outlier-review"', () => {
      renderPanel();
      expect(screen.getByTestId('outlier-review')).toBeInTheDocument();
    });

    it('renders outlier count summary', () => {
      renderPanel();
      // 15 total outliers in fixture
      expect(screen.getByTestId('outlier-summary')).toBeInTheDocument();
    });

    it('renders flagged parcels table', () => {
      renderPanel();
      expect(screen.getByTestId('outlier-table')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Table Content
  // =========================================================================
  describe('Table Content', () => {
    it('shows parcel IDs from fixture data', () => {
      renderPanel();
      expect(screen.getByText('1-0529-100-0042')).toBeInTheDocument();
      expect(screen.getByText('1-0833-200-0018')).toBeInTheDocument();
      expect(screen.getByText('1-0422-300-0055')).toBeInTheDocument();
    });

    it('shows addresses', () => {
      renderPanel();
      expect(screen.getByText('1245 George Washington Way')).toBeInTheDocument();
      expect(screen.getByText('502 W Canal Dr')).toBeInTheDocument();
    });

    it('shows ratios', () => {
      renderPanel();
      expect(screen.getByText('0.774')).toBeInTheDocument();
      expect(screen.getByText('1.344')).toBeInTheDocument();
    });

    it('shows flag reasons', () => {
      renderPanel();
      const lowFlags = screen.getAllByText(/ratio < Q1 - 1\.5\*IQR/);
      const highFlags = screen.getAllByText(/ratio > Q3 \+ 1\.5\*IQR/);
      expect(lowFlags.length).toBeGreaterThanOrEqual(1);
      expect(highFlags.length).toBeGreaterThanOrEqual(1);
    });

    it('shows confidence scores', () => {
      renderPanel();
      // 94% appears on multiple rows, 97% is unique
      const scores94 = screen.getAllByText('94%');
      expect(scores94.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('97%')).toBeInTheDocument();
    });

    it('shows outlier method badges', () => {
      renderPanel();
      const iqrBadges = screen.getAllByText('iqr');
      const trimBadges = screen.getAllByText('trim');
      expect(iqrBadges.length).toBeGreaterThanOrEqual(1);
      expect(trimBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('shows review status badges', () => {
      renderPanel();
      const pendingBadges = screen.getAllByText('pending');
      const confirmedBadges = screen.getAllByText('confirmed');
      expect(pendingBadges.length).toBeGreaterThanOrEqual(1);
      expect(confirmedBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // Actions
  // =========================================================================
  describe('Actions', () => {
    it('shows confirm button for pending outliers', () => {
      renderPanel();
      const confirmButtons = screen.getAllByRole('button', { name: /confirm/i });
      // 12 pending outliers in fixture
      expect(confirmButtons.length).toBe(12);
    });

    it('shows dismiss button for pending outliers', () => {
      renderPanel();
      const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
      expect(dismissButtons.length).toBe(12);
    });

    it('shows drill-through button per row', () => {
      renderPanel();
      const drillButtons = screen.getAllByRole('button', { name: /view parcel|drill/i });
      expect(drillButtons.length).toBe(15); // All 15 outliers
    });

    it('calls reviewOutlier on confirm click', () => {
      renderPanel();
      const confirmButtons = screen.getAllByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButtons[0]);
      expect(mockFns.reviewOutlier).toHaveBeenCalledWith('1-0529-100-0042', 'confirmed');
    });

    it('calls reviewOutlier on dismiss click', () => {
      renderPanel();
      const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButtons[0]);
      expect(mockFns.reviewOutlier).toHaveBeenCalledWith('1-0529-100-0042', 'dismissed');
    });
  });

  // =========================================================================
  // Theme Compliance
  // =========================================================================
  describe('Theme Compliance', () => {
    it('no light-mode classes in rendered output', () => {
      const { container } = renderPanel();
      const html = container.innerHTML;
      const forbidden = ['bg-gray-50', 'bg-gray-200', 'text-gray-', 'hover:bg-gray-50'];
      for (const pattern of forbidden) {
        expect(html).not.toContain(pattern);
      }
    });
  });
});
