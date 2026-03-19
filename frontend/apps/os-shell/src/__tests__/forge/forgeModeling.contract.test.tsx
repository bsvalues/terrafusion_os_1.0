/**
 * Phase 10 Contract Tests — TerraForge Modeling Components
 * ===================================================================
 * TDD-first contract tests for CostForgeDashboard, AVMStudio,
 * PropertyValuationPage, MarketTrendsPage, and ForgeSuiteHome.
 *
 * These define the required contract: data-testid markers,
 * data-material attributes, semantic roles, no hardcoded light-mode
 * Tailwind classes, and centralized chart color constants.
 *
 * @module __tests__/forge/forgeModeling.contract.test
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Light-mode patterns — any hit means the component uses hardcoded color
// classes instead of design-token / tf-token CSS custom properties.
// ---------------------------------------------------------------------------

const LIGHT_MODE_PATTERNS = [
  /\bbg-gray-\d+\b/,
  /\bbg-red-\d+\b/,
  /\bbg-blue-\d+\b/,
  /\bbg-green-\d+\b/,
  /\bbg-yellow-\d+\b/,
  /\bbg-orange-\d+\b/,
  /\bhover:bg-gray-\d+\b/,
  /\btext-red-\d+\b/,
  /\bborder-red-\d+\b/,
  /\bring-blue-\d+\b/,
  /\bbg-gray-50\b/,
  /\bbg-green-300\b/,
  /\bbg-green-500\b/,
  /\bbg-blue-500\b/,
];

// ---------------------------------------------------------------------------
// Mocks — UI primitives
// ---------------------------------------------------------------------------

vi.mock('../../components/ui/card', () => ({
  Card: (props: any) => <div data-slot="card" {...props} />,
  CardContent: (props: any) => <div data-slot="card-content" {...props} />,
  CardHeader: (props: any) => <div data-slot="card-header" {...props} />,
  CardTitle: (props: any) => <div data-slot="card-title" {...props} />,
}));

vi.mock('../../components/ui/badge', () => ({
  Badge: (props: any) => <span data-slot="badge" {...props} />,
}));

vi.mock('../../components/ui/button', () => ({
  Button: (props: any) => <button data-slot="button" {...props} />,
}));

vi.mock('../../components/ui/input', () => ({
  Input: (props: any) => <input data-slot="input" {...props} />,
}));

vi.mock('../../components/ui/skeleton', () => ({
  Skeleton: (props: any) => <div data-slot="skeleton" {...props} />,
}));

// ---------------------------------------------------------------------------
// Mocks — Recharts (all chart components render as simple divs)
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-slot="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-slot="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-slot="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-slot="pie-chart">{children}</div>,
  Line: () => <div data-slot="line" />,
  Bar: () => <div data-slot="bar" />,
  Pie: ({ children }: any) => <div data-slot="pie">{children}</div>,
  Cell: () => <div data-slot="cell" />,
  XAxis: () => <div data-slot="x-axis" />,
  YAxis: () => <div data-slot="y-axis" />,
  CartesianGrid: () => <div data-slot="cartesian-grid" />,
  Tooltip: () => <div data-slot="tooltip" />,
}));

// ---------------------------------------------------------------------------
// Mocks — lib/utils
// ---------------------------------------------------------------------------

vi.mock('../../lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// ---------------------------------------------------------------------------
// Mocks — PropertyValuationPage dependencies
// ---------------------------------------------------------------------------

vi.mock('../../components/forge/PropertyValuationDisplay', () => ({
  PropertyValuationDisplay: () => <div data-testid="property-valuation-display" />,
}));

vi.mock('../../components/forge/IncomeApproachComponent', () => ({
  IncomeApproachComponent: () => <div data-testid="income-approach" />,
}));

vi.mock('../../components/forge/DepreciationCalcComponent', () => ({
  DepreciationCalcComponent: () => <div data-testid="depreciation-calc" />,
}));

vi.mock('../../components/forge/CostManualComponent', () => ({
  CostManualComponent: () => <div data-testid="cost-manual" />,
}));

vi.mock('../../components/forge/SalesCompGridComponent', () => ({
  SalesCompGridComponent: () => <div data-testid="sales-comp-grid" />,
}));

vi.mock('../../services/forge/propertyValuationClientService', () => ({
  getPropertyValuation: vi.fn().mockResolvedValue(null),
}));

// ---------------------------------------------------------------------------
// Mocks — MarketTrendsPage dependencies
// ---------------------------------------------------------------------------

vi.mock('../../components/forge/MarketMetricsChartComponent', () => ({
  MarketMetricsChartComponent: (props: any) => <div data-testid="market-metrics-chart" data-type={props.propertyType} />,
}));

vi.mock('../../components/forge/MarketAnalyticsDashboard', () => ({
  MarketAnalyticsDashboard: () => <div data-testid="market-analytics-dashboard" />,
}));

vi.mock('../../components/forge/MarketCyclePredictor', () => ({
  MarketCyclePredictor: () => <div data-testid="market-cycle-predictor" />,
}));

// Mock with both resolved forms to handle alias resolution
vi.mock('../../services/forge/marketTrendsClientService', () => ({
  getMarketSegments: vi.fn(() => Promise.resolve([
    { propertyType: 'Residential', segment: 'A' },
    { propertyType: 'Commercial', segment: 'B' },
    { propertyType: 'Industrial', segment: 'C' },
    { propertyType: 'Agricultural', segment: 'D' },
  ])),
  getMarketTrends: vi.fn(() => Promise.resolve([])),
  getMarketCycle: vi.fn(() => Promise.resolve({ phase: 'growth' })),
  getEconomicIndicators: vi.fn(() => Promise.resolve([])),
  getPriceHistory: vi.fn(() => Promise.resolve([])),
  getMarketMetrics: vi.fn(() => Promise.resolve([])),
}));

// ---------------------------------------------------------------------------
// Mocks — ForgeSuiteHome dependencies
// ---------------------------------------------------------------------------

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => ({
    stats: {
      totalParcels: 89247,
      averageAssessedValue: 285000,
      assessedThisYear: 45000,
      pendingAssessments: 1200,
      assessmentCompletionPercent: 87.3,
    },
    loading: false,
    error: null,
  }),
}));

vi.mock('../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: (props: any) => (
    <div data-accent={props.accentVar}>
      SuiteModuleGrid
    </div>
  ),
}));

vi.mock('../../components/suites/OperationalQueue', () => ({
  OperationalQueue: (props: any) => (
    <div data-accent={props.accentVar}>
      OperationalQueue
    </div>
  ),
}));

vi.mock('../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => null,
}));

vi.mock('lucide-react', () => {
  const Icon = (props: any) => <svg data-slot="icon" {...props} />;
  return {
    ArrowLeft: Icon,
    Hammer: Icon,
    Calculator: Icon,
    BarChart3: Icon,
    Scale: Icon,
    TrendingUp: Icon,
    FileSearch: Icon,
    Gavel: Icon,
    ShieldCheck: Icon,
    LineChart: Icon,
    PieChart: Icon,
    MapPin: Icon,
    DollarSign: Icon,
    Search: Icon,
  };
});

// ---------------------------------------------------------------------------
// Imports — after mocks are registered
// ---------------------------------------------------------------------------

import { CostForgeDashboard } from '../../pages/forge/cost/CostForgeDashboard';
import { AVMStudio } from '../../pages/forge/avm/AVMStudio';
import { PropertyValuationPage } from '../../pages/forge/valuation/PropertyValuationPage';
import { MarketTrendsPage } from '../../pages/forge/market/MarketTrendsPage';
import ForgeSuiteHome from '../../pages/suites/ForgeSuiteHome';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/**
 * Scans the rendered HTML for hardcoded light-mode Tailwind classes.
 * Returns all unique violations found.
 */
function findLightModeViolations(html: string): string[] {
  // Strip SVG chart elements — chart colors in SVG are acceptable
  const stripped = html.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  const violations: string[] = [];
  for (const pattern of LIGHT_MODE_PATTERNS) {
    const matches = stripped.match(new RegExp(pattern.source, 'g'));
    if (matches) {
      violations.push(...matches);
    }
  }
  return [...new Set(violations)];
}

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// ===========================================================================
// Phase 10: Forge Modeling Contract
// ===========================================================================

describe('Phase 10: Forge Modeling Contract', () => {
  // =========================================================================
  // CostForgeDashboard (6 tests)
  // =========================================================================

  describe('CostForgeDashboard', () => {
    it('1. renders with data-testid="cost-forge-dashboard"', () => {
      const { container } = render(<CostForgeDashboard />);
      const root = container.querySelector('[data-testid="cost-forge-dashboard"]');
      expect(root).toBeInTheDocument();
    });

    it('2. summary cards have data-material="bento"', () => {
      const { container } = render(<CostForgeDashboard />);
      // The 4 summary cards in the grid should carry data-material="bento"
      const bentoCards = container.querySelectorAll('[data-material="bento"]');
      expect(bentoCards.length).toBeGreaterThanOrEqual(4);
    });

    it('3. schedule table has data-material="bento"', () => {
      const { container } = render(<CostForgeDashboard />);
      // The schedule table (or its wrapping Card) should have data-material="bento"
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
      // Either the table itself or its parent Card should carry the attribute
      const tableParent = table!.closest('[data-material="bento"]');
      expect(tableParent).toBeInTheDocument();
    });

    it('4. schedule table rows have role="link"', () => {
      const { container } = render(<CostForgeDashboard />);
      const tbody = container.querySelector('tbody');
      expect(tbody).toBeInTheDocument();
      const rows = tbody!.querySelectorAll('tr');
      expect(rows.length).toBeGreaterThan(0);
      rows.forEach((row) => {
        expect(row).toHaveAttribute('role', 'link');
      });
    });

    it('5. no light-mode Tailwind classes (no hover:bg-gray-50 etc.)', () => {
      const { container } = render(<CostForgeDashboard />);
      const violations = findLightModeViolations(container.innerHTML);
      expect(violations).toEqual([]);
    });

    it('6. chart colors centralized (source code contains FORGE_CHART_COLORS constant)', () => {
      const src = readFileSync(
        resolve(__dirname, '../../pages/forge/cost/CostForgeDashboard.tsx'),
        'utf-8',
      );
      expect(src).toMatch(/FORGE_CHART_COLORS/);
    });
  });

  // =========================================================================
  // AVMStudio (5 tests)
  // =========================================================================

  describe('AVMStudio', () => {
    it('7. renders with data-testid="avm-studio"', () => {
      const { container } = render(<AVMStudio />);
      const root = container.querySelector('[data-testid="avm-studio"]');
      expect(root).toBeInTheDocument();
    });

    it('8. model cards have data-material="bento"', () => {
      const { container } = render(<AVMStudio />);
      // 4 model cards should carry data-material="bento"
      const bentoCards = container.querySelectorAll('[data-material="bento"]');
      expect(bentoCards.length).toBeGreaterThanOrEqual(4);
    });

    it('9. clickable model cards have role="link"', () => {
      const { container } = render(<AVMStudio />);
      // Model cards are clickable — they should have role="link"
      const cards = container.querySelectorAll('[data-material="bento"]');
      const clickableCards = Array.from(cards).filter(
        (el) => el.getAttribute('role') === 'link',
      );
      expect(clickableCards.length).toBeGreaterThanOrEqual(4);
    });

    it('10. no light-mode classes (no bg-gray-50, bg-green-300, bg-green-500, bg-blue-500, ring-blue-500)', () => {
      const { container } = render(<AVMStudio />);
      const violations = findLightModeViolations(container.innerHTML);
      expect(violations).toEqual([]);
    });

    it('11. pipeline status uses semantic classes (bg-primary, bg-destructive, bg-muted — not bg-green-500)', () => {
      const src = readFileSync(
        resolve(__dirname, '../../pages/forge/avm/AVMStudio.tsx'),
        'utf-8',
      );
      // The pipelineColor function should NOT contain hardcoded color classes
      expect(src).not.toMatch(/['"]bg-green-500['"]/);
      expect(src).not.toMatch(/['"]bg-blue-500 animate-pulse['"]/);
      expect(src).not.toMatch(/['"]bg-red-500['"]/);
      // Should use semantic tokens instead
      expect(src).toMatch(/bg-primary/);
      expect(src).toMatch(/bg-destructive/);
      expect(src).toMatch(/bg-muted/);
    });
  });

  // =========================================================================
  // PropertyValuationPage (2 tests)
  // =========================================================================

  describe('PropertyValuationPage', () => {
    it('12. renders with data-testid="property-valuation"', () => {
      const { container } = render(<PropertyValuationPage />);
      const root = container.querySelector('[data-testid="property-valuation"]');
      expect(root).toBeInTheDocument();
    });

    it('13. no light-mode classes', () => {
      const { container } = render(<PropertyValuationPage />);
      const violations = findLightModeViolations(container.innerHTML);
      expect(violations).toEqual([]);
    });
  });

  // =========================================================================
  // MarketTrendsPage (2 tests)
  // =========================================================================

  describe('MarketTrendsPage', () => {
    it('14. renders with data-testid="market-trends"', async () => {
      const { container } = render(<MarketTrendsPage />);
      // Wait for useEffect to settle
      await new Promise((r) => setTimeout(r, 0));
      const root = container.querySelector('[data-testid="market-trends"]');
      expect(root).toBeInTheDocument();
    });

    it('15. no light-mode classes', async () => {
      const { container } = render(<MarketTrendsPage />);
      await new Promise((r) => setTimeout(r, 0));
      const violations = findLightModeViolations(container.innerHTML);
      expect(violations).toEqual([]);
    });
  });

  // =========================================================================
  // ForgeSuiteHome (1 test)
  // =========================================================================

  describe('ForgeSuiteHome', () => {
    it('16. has data-testid on stats strip ("forge-stats"), module grid ("forge-modules"), and queue ("forge-queue")', () => {
      renderWithRouter(<ForgeSuiteHome />);

      expect(screen.getByTestId('suite-forge-root')).toBeInTheDocument();
      expect(screen.getByTestId('forge-stats')).toBeInTheDocument();
      expect(screen.getByTestId('forge-modules')).toBeInTheDocument();
      expect(screen.getByTestId('forge-queue')).toBeInTheDocument();
    });
  });
});
