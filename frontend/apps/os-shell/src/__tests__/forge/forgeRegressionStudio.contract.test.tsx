/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 16B REGRESSION STUDIO CONTRACT TESTS
 * Landing page with Models/New Run/Compare tabs, store-driven
 *
 * These tests define the Phase 16B contract for RegressionStudio.
 * They codify:
 *   - Panel renders with data-testid="regression-studio"
 *   - 4 view tabs: Models, New Run, Compare, Detail
 *   - Models tab shows saved models from store (not hardcoded)
 *   - Run history table from store
 *   - Compare tab renders VersionComparePanel
 *   - Dark theme compliance (no light-mode classes)
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
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
// Mock Zustand store — hoisted
// ---------------------------------------------------------------------------

const { mockFns } = vi.hoisted(() => ({
  mockFns: {
    fetchModels: vi.fn(),
    selectModel: vi.fn(),
    promoteModel: vi.fn(),
    compareVersions: vi.fn(),
    runRegression: vi.fn(),
  },
}));

vi.mock('@/stores/forgeRegressionStore', async () => {
  const fixtures = await vi.importActual<typeof import('@/data/forgeRegressionFixtures')>('@/data/forgeRegressionFixtures');
  return {
    useForgeRegressionStore: vi.fn((selector?: any) => {
      const state = {
        models: fixtures.REGRESSION_MODELS,
        runs: fixtures.REGRESSION_RUNS,
        selectedModelId: null,
        comparison: null,
        loading: false,
        error: null,
        fetchModels: mockFns.fetchModels,
        selectModel: mockFns.selectModel,
        promoteModel: mockFns.promoteModel,
        compareVersions: mockFns.compareVersions,
        runRegression: mockFns.runRegression,
      };
      return selector ? selector(state) : state;
    }),
  };
});

// Mock sub-panels to keep tests focused on Studio orchestration
vi.mock('../../pages/forge/regression/CoefficientPanel', () => ({
  CoefficientPanel: () => <div data-testid="coefficient-panel">CoefficientPanel</div>,
}));

vi.mock('../../pages/forge/regression/VersionComparePanel', () => ({
  VersionComparePanel: () => <div data-testid="version-compare-panel">VersionComparePanel</div>,
}));

vi.mock('../../pages/forge/regression/RegressionControlPanel', () => ({
  RegressionControlPanel: ({ onRunComplete }: any) => (
    <div data-testid="regression-control-panel">RegressionControlPanel</div>
  ),
  default: ({ onRunComplete }: any) => (
    <div data-testid="regression-control-panel">RegressionControlPanel</div>
  ),
}));

vi.mock('../../pages/forge/regression/charts', () => ({
  ResidualPlot: () => <div>ResidualPlot</div>,
  CoefficientBarChart: () => <div>CoefficientBarChart</div>,
  PredictedVsActual: () => <div>PredictedVsActual</div>,
  QQPlot: () => <div>QQPlot</div>,
}));

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { RegressionStudio } from '../../pages/forge/regression/RegressionStudio';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderStudio() {
  return render(<RegressionStudio />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 16B: RegressionStudio Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Structure
  // =========================================================================
  describe('Structure', () => {
    it('renders with data-testid="regression-studio"', () => {
      renderStudio();
      expect(screen.getByTestId('regression-studio')).toBeInTheDocument();
    });

    it('renders Models tab button', () => {
      renderStudio();
      expect(screen.getByRole('button', { name: /models/i })).toBeInTheDocument();
    });

    it('renders New Run tab button', () => {
      renderStudio();
      expect(screen.getByRole('button', { name: /new run/i })).toBeInTheDocument();
    });

    it('renders Compare tab button', () => {
      renderStudio();
      expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
    });

    it('calls fetchModels on mount', () => {
      renderStudio();
      expect(mockFns.fetchModels).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Models Tab
  // =========================================================================
  describe('Models Tab', () => {
    it('shows saved model names from store', () => {
      renderStudio();
      expect(screen.getByText('SFR Base Model')).toBeInTheDocument();
      expect(screen.getByText('Commercial GWR')).toBeInTheDocument();
      expect(screen.getByText('Multi-Family Quantile')).toBeInTheDocument();
    });

    it('shows R-squared values', () => {
      renderStudio();
      expect(screen.getByText('0.8742')).toBeInTheDocument();
      expect(screen.getByText('0.9103')).toBeInTheDocument();
    });

    it('shows status badges', () => {
      renderStudio();
      expect(screen.getByText('production')).toBeInTheDocument();
      expect(screen.getByText('validated')).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
    });

    it('shows run history entries', () => {
      renderStudio();
      expect(screen.getByText('2026-03-14 14:30')).toBeInTheDocument();
      expect(screen.getByText('2026-03-14 10:15')).toBeInTheDocument();
    });

    it('calls selectModel when model row is clicked', () => {
      renderStudio();
      const sfrRow = screen.getByText('SFR Base Model').closest('[role="link"], [data-model-id]') ||
                      screen.getByText('SFR Base Model').closest('div[class]');
      if (sfrRow) fireEvent.click(sfrRow);
      expect(mockFns.selectModel).toHaveBeenCalledWith('m1-v2');
    });
  });

  // =========================================================================
  // New Run Tab
  // =========================================================================
  describe('New Run Tab', () => {
    it('renders RegressionControlPanel when New Run tab active', () => {
      renderStudio();
      fireEvent.click(screen.getByRole('button', { name: /new run/i }));
      expect(screen.getByTestId('regression-control-panel')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Compare Tab
  // =========================================================================
  describe('Compare Tab', () => {
    it('renders VersionComparePanel when Compare tab active', () => {
      renderStudio();
      fireEvent.click(screen.getByRole('button', { name: /compare/i }));
      expect(screen.getByTestId('version-compare-panel')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Theme Compliance
  // =========================================================================
  describe('Theme Compliance', () => {
    it('no light-mode classes in rendered output', () => {
      const { container } = renderStudio();
      const html = container.innerHTML;
      const forbidden = ['bg-gray-50', 'bg-gray-200', 'bg-red-50', 'text-red-700', 'text-green-600', 'border-gray-300'];
      for (const pattern of forbidden) {
        expect(html).not.toContain(pattern);
      }
    });
  });
});
