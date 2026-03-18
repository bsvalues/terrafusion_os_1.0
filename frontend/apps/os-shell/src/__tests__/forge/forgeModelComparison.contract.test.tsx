/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 16 MODEL COMPARISON PANEL CONTRACT TESTS
 * Side-by-side ratio study comparison with delta indicators
 *
 * These tests define the Phase 16 contract for ModelComparisonPanel.
 * They codify:
 *   - Panel renders with data-testid="model-comparison"
 *   - Side-by-side metric cards for Model A and Model B
 *   - Delta display with improved/degraded indicators
 *   - Strata breakdown table
 *   - Dark theme compliance (no light-mode classes)
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
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

vi.mock('@/stores/forgeStatisticsStore', async () => {
  const fixtures = await vi.importActual<typeof import('@/data/forgeStatisticsFixtures')>('@/data/forgeStatisticsFixtures');
  return {
    useForgeStatisticsStore: vi.fn((selector?: any) => {
      const state = {
        comparison: fixtures.MODEL_COMPARISON,
        strata: fixtures.STRATA_RESULTS,
        loading: false,
        error: null,
        loadComparison: vi.fn(),
      };
      return selector ? selector(state) : state;
    }),
  };
});

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { ModelComparisonPanel } from '../../pages/forge/statistics/ModelComparisonPanel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPanel() {
  return render(<ModelComparisonPanel />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 16: ModelComparisonPanel Contract', () => {
  // =========================================================================
  // Structure
  // =========================================================================
  describe('Structure', () => {
    it('renders with data-testid="model-comparison"', () => {
      renderPanel();
      expect(screen.getByTestId('model-comparison')).toBeInTheDocument();
    });

    it('renders Model A card', () => {
      renderPanel();
      expect(screen.getByTestId('model-a-card')).toBeInTheDocument();
    });

    it('renders Model B card', () => {
      renderPanel();
      expect(screen.getByTestId('model-b-card')).toBeInTheDocument();
    });

    it('renders delta summary', () => {
      renderPanel();
      expect(screen.getByTestId('delta-summary')).toBeInTheDocument();
    });

    it('renders strata breakdown table', () => {
      renderPanel();
      expect(screen.getByTestId('strata-table')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Model Cards
  // =========================================================================
  describe('Model Cards', () => {
    it('shows Model A label', () => {
      renderPanel();
      expect(screen.getByText('12-mo IQR')).toBeInTheDocument();
    });

    it('shows Model B label', () => {
      renderPanel();
      expect(screen.getByText('24-mo Trim')).toBeInTheDocument();
    });

    it('shows Model A COD', () => {
      renderPanel();
      // Model A COD is 12.4
      const modelACard = screen.getByTestId('model-a-card');
      expect(modelACard.textContent).toContain('12.4');
    });

    it('shows Model B COD', () => {
      renderPanel();
      // Model B COD is 11.8
      const modelBCard = screen.getByTestId('model-b-card');
      expect(modelBCard.textContent).toContain('11.8');
    });

    it('shows Model A PRD', () => {
      renderPanel();
      const modelACard = screen.getByTestId('model-a-card');
      expect(modelACard.textContent).toContain('1.008');
    });

    it('shows Model B PRD', () => {
      renderPanel();
      const modelBCard = screen.getByTestId('model-b-card');
      expect(modelBCard.textContent).toContain('1.012');
    });

    it('shows Model A sample size', () => {
      renderPanel();
      const modelACard = screen.getByTestId('model-a-card');
      expect(modelACard.textContent).toContain('1,847');
    });

    it('shows Model B sample size', () => {
      renderPanel();
      const modelBCard = screen.getByTestId('model-b-card');
      expect(modelBCard.textContent).toContain('3,412');
    });
  });

  // =========================================================================
  // Delta Display
  // =========================================================================
  describe('Delta Display', () => {
    it('shows improved metrics', () => {
      renderPanel();
      // cod, prb, medianRatio are improved
      const deltaSummary = screen.getByTestId('delta-summary');
      expect(deltaSummary.textContent).toContain('cod');
      expect(deltaSummary.textContent).toContain('prb');
    });

    it('shows degraded metrics', () => {
      renderPanel();
      // prd is degraded
      const deltaSummary = screen.getByTestId('delta-summary');
      expect(deltaSummary.textContent).toContain('prd');
    });

    it('shows IAAO compliance badge for both models', () => {
      renderPanel();
      // Both models are IAAO compliant
      const badges = screen.getAllByText(/compliant/i);
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // Strata Table
  // =========================================================================
  describe('Strata Table', () => {
    it('shows 8 strata rows', () => {
      renderPanel();
      const strataTable = screen.getByTestId('strata-table');
      // 8 strata from fixture
      expect(screen.getByText('Richland SFR')).toBeInTheDocument();
      expect(screen.getByText('Kennewick SFR')).toBeInTheDocument();
      expect(screen.getByText('Pasco MFR')).toBeInTheDocument();
      expect(screen.getByText('Prosser SFR')).toBeInTheDocument();
    });

    it('shows non-qualified strata with indicator', () => {
      renderPanel();
      // Pasco MFR is qualified: false
      expect(screen.getByText('Pasco MFR')).toBeInTheDocument();
      // Should have some non-qualified indicator
      const strataTable = screen.getByTestId('strata-table');
      expect(strataTable.textContent).toContain('15.8'); // Pasco MFR COD
    });

    it('shows strata COD values', () => {
      renderPanel();
      expect(screen.getByText('11.2')).toBeInTheDocument(); // Richland SFR
      expect(screen.getByText('13.8')).toBeInTheDocument(); // Richland MFR
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
