/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 16B COEFFICIENT PANEL CONTRACT TESTS
 * Coefficient table with significance, model receipt, IAAO qualification
 *
 * These tests define the Phase 16B contract for CoefficientPanel.
 * They codify:
 *   - Panel renders with data-testid="coefficient-panel"
 *   - Coefficient table: variable, estimate, std error, t-stat, p-value, significance
 *   - Model receipt summary: R², adj-R², F-stat, MSE, AIC, BIC, observations
 *   - IAAO qualification badge
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

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span data-component="badge" {...props}>{children}</span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

// ---------------------------------------------------------------------------
// Mock Zustand store — hoisted for selected model
// ---------------------------------------------------------------------------

vi.mock('@/stores/forgeRegressionStore', async () => {
  const fixtures = await vi.importActual<typeof import('@/data/forgeRegressionFixtures')>('@/data/forgeRegressionFixtures');
  return {
    useForgeRegressionStore: vi.fn((selector?: any) => {
      const state = {
        models: fixtures.REGRESSION_MODELS,
        selectedModelId: 'm1-v2',
        loading: false,
        error: null,
      };
      return selector ? selector(state) : state;
    }),
  };
});

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { CoefficientPanel } from '../../pages/forge/regression/CoefficientPanel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPanel() {
  return render(<CoefficientPanel />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 16B: CoefficientPanel Contract', () => {
  // =========================================================================
  // Structure
  // =========================================================================
  describe('Structure', () => {
    it('renders with data-testid="coefficient-panel"', () => {
      renderPanel();
      expect(screen.getByTestId('coefficient-panel')).toBeInTheDocument();
    });

    it('renders model receipt summary', () => {
      renderPanel();
      expect(screen.getByTestId('model-receipt')).toBeInTheDocument();
    });

    it('renders coefficient table', () => {
      renderPanel();
      expect(screen.getByTestId('coefficient-table')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Model Receipt
  // =========================================================================
  describe('Model Receipt', () => {
    it('shows R-squared', () => {
      renderPanel();
      const receipt = screen.getByTestId('model-receipt');
      expect(receipt.textContent).toContain('0.8742');
    });

    it('shows adjusted R-squared', () => {
      renderPanel();
      const receipt = screen.getByTestId('model-receipt');
      expect(receipt.textContent).toContain('0.8730');
    });

    it('shows F-statistic', () => {
      renderPanel();
      const receipt = screen.getByTestId('model-receipt');
      expect(receipt.textContent).toContain('378.9');
    });

    it('shows observations', () => {
      renderPanel();
      const receipt = screen.getByTestId('model-receipt');
      expect(receipt.textContent).toContain('1,847');
    });

    it('shows AIC', () => {
      renderPanel();
      const receipt = screen.getByTestId('model-receipt');
      expect(receipt.textContent).toContain('24,320');
    });

    it('shows BIC', () => {
      renderPanel();
      const receipt = screen.getByTestId('model-receipt');
      expect(receipt.textContent).toContain('24,360');
    });

    it('shows IAAO qualification badge', () => {
      renderPanel();
      const qualBadges = screen.getAllByText(/qualified|pass/i);
      expect(qualBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // Coefficient Table
  // =========================================================================
  describe('Coefficient Table', () => {
    it('shows variable names', () => {
      renderPanel();
      expect(screen.getByText('sqft')).toBeInTheDocument();
      expect(screen.getByText('lot_size')).toBeInTheDocument();
      expect(screen.getByText('quality_grade')).toBeInTheDocument();
    });

    it('shows 6 coefficient rows for SFR Base v2', () => {
      renderPanel();
      const table = screen.getByTestId('coefficient-table');
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBe(6);
    });

    it('shows estimate values', () => {
      renderPanel();
      expect(screen.getByText('85.4000')).toBeInTheDocument();
    });

    it('shows p-values', () => {
      renderPanel();
      // All SFR v2 coefficients have pValue 0.0001
      const pValues = screen.getAllByText('0.0001');
      expect(pValues.length).toBe(6);
    });

    it('shows significance badges for significant coefficients', () => {
      renderPanel();
      // All 6 SFR v2 coefficients are significant — badge text is "Yes"
      const sigBadges = screen.getAllByText('Yes');
      expect(sigBadges.length).toBe(6);
    });
  });

  // =========================================================================
  // Theme Compliance
  // =========================================================================
  describe('Theme Compliance', () => {
    it('no light-mode classes in rendered output', () => {
      const { container } = renderPanel();
      const html = container.innerHTML;
      const forbidden = ['bg-gray-50', 'bg-gray-200', 'bg-red-50', 'text-red-700', 'text-green-600', 'border-gray-300'];
      for (const pattern of forbidden) {
        expect(html).not.toContain(pattern);
      }
    });
  });
});
