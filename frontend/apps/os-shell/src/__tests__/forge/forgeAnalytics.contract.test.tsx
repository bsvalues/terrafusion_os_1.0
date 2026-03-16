/**
 * ======================================================================
 * TERRAFUSION OS - PHASE 10 FORGE ANALYTICS CONTRACT TESTS
 * ADR: TerraForge Suite — Statistics, Ratio Study, Regression, Data Quality
 *
 * These tests define the Phase 10 contract for the Forge Analytics modules.
 * They codify:
 *   - Each component renders with a unique data-testid
 *   - Bento material governance on metric/table surfaces
 *   - Interactive elements have correct ARIA roles
 *   - Dark theme compliance (no hardcoded light-mode Tailwind classes)
 *
 * TDD-first: tests marked WILL FAIL are written before implementation.
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Light-mode pattern list (from Phase 9 convention)
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
];

/**
 * Scan rendered HTML for forbidden light-mode Tailwind classes.
 * Allows semantic variants (bg-destructive, bg-primary) and
 * Recharts SVG hex colours which are fine.
 */
function findLightModeViolations(html: string): string[] {
  const violations: string[] = [];
  for (const pattern of LIGHT_MODE_PATTERNS) {
    const match = html.match(pattern);
    if (match) {
      violations.push(match[0]);
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Mocks — shadcn/ui primitives (factories are hoisted — all data inline)
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
    <span data-slot="badge" data-component="badge" {...props}>{children}</span>
  ),
}));

vi.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => (
    <table data-component="table" {...props}>{children}</table>
  ),
  TableBody: ({ children, ...props }: any) => (
    <tbody {...props}>{children}</tbody>
  ),
  TableCell: ({ children, ...props }: any) => (
    <td {...props}>{children}</td>
  ),
  TableHead: ({ children, ...props }: any) => (
    <th {...props}>{children}</th>
  ),
  TableHeader: ({ children, ...props }: any) => (
    <thead {...props}>{children}</thead>
  ),
  TableRow: ({ children, ...props }: any) => (
    <tr {...props}>{children}</tr>
  ),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: (props: any) => <div data-component="skeleton" {...props} />,
}));

vi.mock('../../lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// ---------------------------------------------------------------------------
// Mocks — StatisticsStudio child components (simple stubs)
// ---------------------------------------------------------------------------

vi.mock('../../pages/forge/statistics/RatioStudyPanel', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="ratio-study-panel-stub" data-props={JSON.stringify(props)}>
      RatioStudyPanel stub
    </div>
  ),
  RatioStudyPanel: (props: any) => (
    <div data-testid="ratio-study-panel-stub" data-props={JSON.stringify(props)}>
      RatioStudyPanel stub
    </div>
  ),
}));

vi.mock('../../pages/forge/statistics/charts/CODTrendChart', () => ({
  __esModule: true,
  default: () => <div data-testid="cod-trend-chart-stub">CODTrendChart stub</div>,
}));

vi.mock('../../pages/forge/statistics/charts/PRDTrendChart', () => ({
  __esModule: true,
  default: () => <div data-testid="prd-trend-chart-stub">PRDTrendChart stub</div>,
}));

vi.mock('../../pages/forge/statistics/VEIDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="vei-dashboard-stub">VEIDashboard stub</div>,
}));

// ---------------------------------------------------------------------------
// Mocks — RegressionStudio child components
// ---------------------------------------------------------------------------

vi.mock('../../pages/forge/regression/RegressionControlPanel', () => ({
  RegressionControlPanel: (props: any) => (
    <div data-testid="regression-control-panel-stub">RegressionControlPanel stub</div>
  ),
}));

vi.mock('../../pages/forge/regression/charts', () => ({
  ResidualPlot: () => <div data-testid="residual-plot-stub">ResidualPlot</div>,
  CoefficientBarChart: () => <div data-testid="coefficient-bar-chart-stub">CoefficientBarChart</div>,
  PredictedVsActual: () => <div data-testid="predicted-vs-actual-stub">PredictedVsActual</div>,
  QQPlot: () => <div data-testid="qq-plot-stub">QQPlot</div>,
}));

// ---------------------------------------------------------------------------
// Mocks — DataQualityPage service dependency
// ---------------------------------------------------------------------------

vi.mock('@/services/forge/neighborhoodClientService', () => ({
  getDataQualityList: () =>
    Promise.resolve({
      items: [
        {
          parcelId: '10-0001-001',
          overallGrade: 'A',
          overallScore: 95.2,
          completeness: 98,
          accuracy: 94,
          consistency: 96,
          timeliness: 93,
          checks: [],
        },
        {
          parcelId: '10-0001-002',
          overallGrade: 'C',
          overallScore: 72.1,
          completeness: 80,
          accuracy: 68,
          consistency: 71,
          timeliness: 70,
          checks: [],
        },
      ],
      total: 2,
    }),
}));

// ---------------------------------------------------------------------------
// Mocks — Recharts (does not render in jsdom)
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="recharts-responsive">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="recharts-line">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="recharts-bar">{children}</div>,
  ScatterChart: ({ children }: any) => <div data-testid="recharts-scatter">{children}</div>,
  Line: () => null,
  Bar: () => null,
  Scatter: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceLine: () => null,
}));

// ---------------------------------------------------------------------------
// Import components under test
// ---------------------------------------------------------------------------

import { StatisticsStudio } from '../../pages/forge/statistics/StatisticsStudio';
import { RatioStudyPanel } from '../../components/forge/RatioStudyPanel';
import { RegressionStudio } from '../../pages/forge/regression/RegressionStudio';
import { DataQualityPage } from '../../pages/forge/quality/DataQualityPage';

// ---------------------------------------------------------------------------
// Mock data for RatioStudyPanel
// ---------------------------------------------------------------------------

const mockRatioData = {
  cod: 12.5,
  prd: 1.02,
  prb: -0.003,
  medianRatio: 0.95,
  meanRatio: 0.97,
  sampleSize: 450,
  period: 'Jan 2026 – Jun 2026',
  withinIAAO: {
    cod: true,
    prd: true,
    prb: true,
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 10: Forge Analytics Contract', () => {
  // =========================================================================
  // StatisticsStudio
  // =========================================================================
  describe('StatisticsStudio', () => {
    // WILL FAIL — component does not yet emit data-testid="statistics-studio"
    it('renders with data-testid="statistics-studio"', () => {
      render(<StatisticsStudio />);
      expect(screen.getByTestId('statistics-studio')).toBeInTheDocument();
    });

    // WILL FAIL — tab buttons do not yet have data-testid attributes
    it('tab buttons have data-testid attributes', () => {
      render(<StatisticsStudio />);
      expect(screen.getByTestId('tab-ratio-study')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trends')).toBeInTheDocument();
      expect(screen.getByTestId('tab-equity')).toBeInTheDocument();
    });

    it('no light-mode classes in rendered output', () => {
      const { container } = render(<StatisticsStudio />);
      const violations = findLightModeViolations(container.innerHTML);
      expect(violations).toEqual([]);
    });
  });

  // =========================================================================
  // RatioStudyPanel
  // =========================================================================
  describe('RatioStudyPanel', () => {
    // WILL FAIL — component does not yet emit data-testid="ratio-study-panel"
    it('renders with data-testid="ratio-study-panel"', () => {
      render(<RatioStudyPanel data={mockRatioData} loading={false} />);
      expect(screen.getByTestId('ratio-study-panel')).toBeInTheDocument();
    });

    // WILL FAIL — metric cards do not yet have data-material="bento"
    it('metric cards have data-material="bento"', () => {
      const { container } = render(
        <RatioStudyPanel data={mockRatioData} loading={false} />,
      );
      // Each metric row (COD, PRD, PRB) should be a bento surface
      const bentoElements = container.querySelectorAll('[data-material="bento"]');
      expect(bentoElements.length).toBeGreaterThanOrEqual(3);
    });

    it('no light-mode classes in rendered output', () => {
      const { container } = render(
        <RatioStudyPanel data={mockRatioData} loading={false} />,
      );
      const violations = findLightModeViolations(container.innerHTML);
      expect(violations).toEqual([]);
    });
  });

  // =========================================================================
  // RegressionStudio
  // =========================================================================
  describe('RegressionStudio', () => {
    // WILL FAIL — component does not yet emit data-testid="regression-studio"
    it('renders with data-testid="regression-studio"', () => {
      render(<RegressionStudio />);
      expect(screen.getByTestId('regression-studio')).toBeInTheDocument();
    });

    // WILL FAIL — model list items do not yet have data-material="bento"
    it('model list items have data-material="bento"', () => {
      const { container } = render(<RegressionStudio />);
      // Each saved model card should be a bento surface
      const bentoElements = container.querySelectorAll('[data-material="bento"]');
      expect(bentoElements.length).toBeGreaterThanOrEqual(3);
    });

    // WILL FAIL — clickable model items do not yet have role="link"
    it('clickable model items have role="link"', () => {
      render(<RegressionStudio />);
      // Each model in the saved models list should be navigable
      const modelName = screen.getByText('SFR Base Model');
      const modelRow = modelName.closest('[role="link"]');
      expect(modelRow).toBeInTheDocument();
    });

    // WILL FAIL — current implementation uses hover:bg-gray-50, bg-red-50,
    //             text-red-700, border-red-200
    it('no light-mode classes in rendered output', () => {
      const { container } = render(<RegressionStudio />);
      const violations = findLightModeViolations(container.innerHTML);
      expect(violations).toEqual([]);
    });
  });

  // =========================================================================
  // DataQualityPage
  // =========================================================================
  describe('DataQualityPage', () => {
    // WILL FAIL — component does not yet emit data-testid="data-quality"
    it('renders with data-testid="data-quality"', async () => {
      render(<DataQualityPage />);
      await waitFor(() => {
        expect(screen.getByTestId('data-quality')).toBeInTheDocument();
      });
    });

    // WILL FAIL — table does not yet have data-material="bento"
    it('table has data-material="bento"', async () => {
      const { container } = render(<DataQualityPage />);
      await waitFor(() => {
        expect(screen.getByText('10-0001-001')).toBeInTheDocument();
      });
      const bentoTable = container.querySelector(
        '[data-component="table"][data-material="bento"], table[data-material="bento"]',
      );
      expect(bentoTable).toBeInTheDocument();
    });

    // WILL FAIL — grade indicators should use Badge component instead of
    //             raw <span> with hardcoded bg-* classes
    it('grade indicators use Badge component', async () => {
      const { container } = render(<DataQualityPage />);
      await waitFor(() => {
        expect(screen.getByText('10-0001-001')).toBeInTheDocument();
      });
      // Badge stubs render with data-slot="badge"
      const badges = container.querySelectorAll('[data-slot="badge"]');
      // At least one badge per data row for the grade column
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });

    // WILL FAIL — current gradeColors map uses bg-green-600, bg-blue-600, etc.
    it('no light-mode classes in rendered output', async () => {
      const { container } = render(<DataQualityPage />);
      await waitFor(() => {
        expect(screen.getByText('10-0001-001')).toBeInTheDocument();
      });
      const violations = findLightModeViolations(container.innerHTML);
      expect(violations).toEqual([]);
    });
  });
});
