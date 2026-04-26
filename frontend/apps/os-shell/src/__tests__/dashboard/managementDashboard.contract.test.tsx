/**
 * ======================================================================
 * TERRAFUSION OS - MANAGEMENT DASHBOARD CONTRACT TESTS
 * ADR-003: TerraDais Suite — Management Dashboard / Morning Briefing
 *
 * These tests enforce the live-data dashboard contract:
 *   - Dashboard renders with data-testid for automation
 *   - 4 tabs: Overview, Certification, Appeals, Workload
 *   - Data regions render from live service shapes, not seeded fixtures
 *   - Bento material governance on stat cards
 *   - Drill-through references remain stable
 *   - Dark theme compliance (no light-mode classes)
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getCertificationStatusMock,
  getAllAppealsMock,
  getQueueMetricsMock,
  getAppraiserProductivityMock,
  invokeToolMock,
} = vi.hoisted(() => ({
  getCertificationStatusMock: vi.fn(),
  getAllAppealsMock: vi.fn(),
  getQueueMetricsMock: vi.fn(),
  getAppraiserProductivityMock: vi.fn(),
  invokeToolMock: vi.fn(),
}));

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

const FRESH_UNAVAILABLE = {
  data: null, isLoading: false, error: null,
  lastUpdated: null, source: 'unavailable' as const, isStale: false,
};

vi.mock('../../hooks/useSwarmLive', () => ({ useSwarmLive: () => FRESH_UNAVAILABLE }));
vi.mock('../../hooks/usePacsStatus', () => ({ usePacsStatus: () => FRESH_UNAVAILABLE }));
vi.mock('../../hooks/useAppealsQueue', () => ({ useAppealsQueue: () => FRESH_UNAVAILABLE }));
vi.mock('../../hooks/useWorkloadSummary', () => ({ useWorkloadSummary: () => FRESH_UNAVAILABLE }));

vi.mock('@/services/suites/daisService', () => ({
  getCertificationStatus: (...args: unknown[]) => getCertificationStatusMock(...args),
  getAllAppeals: (...args: unknown[]) => getAllAppealsMock(...args),
}));
vi.mock('@/services/suites/queueService', () => ({
  getQueueMetrics: (...args: unknown[]) => getQueueMetricsMock(...args),
  getAppraiserProductivity: (...args: unknown[]) => getAppraiserProductivityMock(...args),
}));

vi.mock('@/auth/useSession', () => ({
  useSession: () => ({ user: { name: 'Test User' }, countyId: 'benton', role: 'supervisor' }),
}));

vi.mock('@/api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => invokeToolMock(...args),
}));

const CERTIFICATIONS = [
  {
    area: 'Benton County Residential',
    totalParcels: 10000,
    completedParcels: 8000,
    percentComplete: 80,
    deadline: '2026-05-01',
    status: 'at-risk',
  },
  {
    area: 'Benton County Commercial',
    totalParcels: 5000,
    completedParcels: 3250,
    percentComplete: 65,
    deadline: '2026-05-15',
    status: 'at-risk',
  },
] as const;

const APPEALS = [
  {
    appealId: 'AP-2026-101',
    parcelId: '100100100001',
    petitionerName: 'Northwest Homes LLC',
    status: 'filed',
    filedDate: '2026-03-25',
    currentValue: 500000,
    requestedValue: 450000,
  },
  {
    appealId: 'AP-2026-102',
    parcelId: '100100100002',
    petitionerName: 'Columbia Retail Partners',
    status: 'scheduled',
    filedDate: '2026-03-20',
    currentValue: 900000,
    requestedValue: 825000,
  },
  {
    appealId: 'AP-2026-103',
    parcelId: '100100100003',
    petitionerName: 'Riverfront Orchards',
    status: 'hearing',
    filedDate: '2026-03-18',
    currentValue: 320000,
    requestedValue: 300000,
  },
  {
    appealId: 'AP-2026-104',
    parcelId: '100100100004',
    petitionerName: 'Benton Storage LLC',
    status: 'decided',
    filedDate: '2026-03-10',
    currentValue: 760000,
    requestedValue: 710000,
  },
  {
    appealId: 'AP-2026-105',
    parcelId: '100100100005',
    petitionerName: 'Vista Family Holdings',
    status: 'withdrawn',
    filedDate: '2026-03-08',
    currentValue: 410000,
    requestedValue: 390000,
  },
] as const;

const PRODUCTIVITY = [
  { name: 'Sarah Mitchell', area: 'Residential', assigned: 120, completed: 114, avgDays: 3.1, reviewRejectRate: 0.04 },
  { name: 'David Park', area: 'Commercial', assigned: 100, completed: 80, avgDays: 4.2, reviewRejectRate: 0.08 },
] as const;

import { ManagementDashboard } from '../../pages/dais/ManagementDashboard';

function renderDashboard(onNavigate = vi.fn()) {
  return render(<ManagementDashboard onNavigate={onNavigate} />);
}

function clickTab(label: string) {
  fireEvent.click(screen.getByRole('button', { name: label }));
}

describe('Management Dashboard Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getCertificationStatusMock.mockResolvedValue([...CERTIFICATIONS]);
    getAllAppealsMock.mockResolvedValue([...APPEALS]);
    getQueueMetricsMock.mockResolvedValue({
      totalUnassigned: 14,
      totalInProgress: 9,
      totalPendingReview: 21,
      completedThisWeek: 33,
      slaViolations: 2,
      avgDaysToComplete: 4.6,
    });
    getAppraiserProductivityMock.mockResolvedValue([...PRODUCTIVITY]);
    invokeToolMock.mockResolvedValue({
      success: true,
      correlationId: 'corr-brief-001',
      result: {
        output: JSON.stringify({
          role: 'assessor_leadership',
          queueType: 'calibration_review',
          priority: 'high',
          dueWindow: 'today',
          blockingDependencies: [],
          recommendedTool: 'rerun_ratio_study',
          readyToAct: true,
          findings: [
            {
              findingType: 'ROLLUP_WARNING',
              severity: 'high',
              recommendedAction: 'Review open appeal concentration',
            },
          ],
        }),
      },
    });
  });

  describe('Structure', () => {
    it('renders with data-testid="management-dashboard"', async () => {
      renderDashboard();
      expect(screen.getByTestId('management-dashboard')).toBeInTheDocument();
      await screen.findByText('15,000');
    });

    it('renders all 4 tab buttons', async () => {
      renderDashboard();
      await screen.findByText('15,000');
      expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Certification' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Appeals' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Workload' })).toBeInTheDocument();
    });

    it('defaults to Overview tab and does not render a demo banner', async () => {
      renderDashboard();
      await screen.findByText('15,000');
      expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute('variant', 'default');
      expect(screen.queryByText(/DEMO DATA/i)).not.toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('shows 6 key metrics derived from live service data', async () => {
      renderDashboard();
      await screen.findByText('15,000');

      const expectedLabels = [
        'Total Parcels',
        'Assessment Completion',
        'Active Appeals',
        'Pending Reviews',
        'Days to Deadline',
        'Staff Utilization',
      ];

      for (const label of expectedLabels) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }

      expect(screen.getByText('15,000')).toBeInTheDocument();
      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('21')).toBeInTheDocument();
      expect(screen.getByText('88.2%')).toBeInTheDocument();
    });

    it('shows key deadlines derived from certification status rows', async () => {
      renderDashboard();
      await screen.findByText('Benton County Residential certification deadline');

      expect(screen.getByText('Key Deadlines')).toBeInTheDocument();
      expect(screen.getByText('Benton County Residential certification deadline')).toBeInTheDocument();
      expect(screen.getByText('Benton County Commercial certification deadline')).toBeInTheDocument();
    });

    it('stat cards use bento material', async () => {
      renderDashboard();
      await screen.findByText('15,000');
      const statCards = screen.getAllByText(/Total Parcels|Assessment Completion|Active Appeals|Pending Reviews|Days to Deadline|Staff Utilization/)
        .map((element) => element.closest('[data-component="card"]'));

      expect(statCards.length).toBe(6);
      for (const card of statCards) {
        expect(card).toHaveAttribute('data-material', 'bento');
      }
    });
  });

  describe('Certification Tab', () => {
    it('shows certification rows from live certification status', async () => {
      renderDashboard();
      await screen.findByText('15,000');
      clickTab('Certification');

      expect(screen.getByText('Benton County Residential')).toBeInTheDocument();
      expect(screen.getByText('Benton County Commercial')).toBeInTheDocument();
      expect(screen.getByText('80.0%')).toBeInTheDocument();
      expect(screen.getByText('65.0%')).toBeInTheDocument();
    });
  });

  describe('Appeals Tab', () => {
    it('shows appeal summary stats from live appeals data', async () => {
      renderDashboard();
      await screen.findByText('15,000');
      clickTab('Appeals');

      expect(screen.getByText('Total Filed')).toBeInTheDocument();
      expect(screen.getByText('Pending Hearing')).toBeInTheDocument();
      expect(screen.getByText('Decided')).toBeInTheDocument();
      expect(screen.getByText('Not reported')).toBeInTheDocument();
    });

    it('shows recent appeals table from live appeals data', async () => {
      renderDashboard();
      await screen.findByText('15,000');
      clickTab('Appeals');

      expect(screen.getByText('AP-2026-101')).toBeInTheDocument();
      expect(screen.getByText('AP-2026-102')).toBeInTheDocument();
      expect(screen.getByText('AP-2026-103')).toBeInTheDocument();
      expect(screen.getByText('AP-2026-104')).toBeInTheDocument();
      expect(screen.getByText('AP-2026-105')).toBeInTheDocument();
    });
  });

  describe('Workload Tab', () => {
    it('shows staff workload table from live productivity data', async () => {
      renderDashboard();
      clickTab('Workload');
      await screen.findByText('Sarah Mitchell');

      expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
      expect(screen.getByText('David Park')).toBeInTheDocument();
      expect(screen.getByText('95.0%')).toBeInTheDocument();
      expect(screen.getByText('80.0%')).toBeInTheDocument();
    });
  });

  describe('Routing & Interactivity', () => {
    it('clicking a certification row navigates to that area detail', async () => {
      const onNavigate = vi.fn();
      renderDashboard(onNavigate);
      await screen.findByText('15,000');
      clickTab('Certification');

      const residentialRow = screen.getByText('Benton County Residential').closest('tr')!;
      fireEvent.click(residentialRow);

      expect(residentialRow).toHaveAttribute('role', 'link');
      expect(onNavigate).toHaveBeenCalledWith({ type: 'area', id: 'benton-county-residential' });
    });

    it('clicking an appeal row navigates to the appeal detail', async () => {
      const onNavigate = vi.fn();
      renderDashboard(onNavigate);
      await screen.findByText('15,000');
      clickTab('Appeals');

      const appealRow = screen.getByText('AP-2026-101').closest('tr')!;
      fireEvent.click(appealRow);

      expect(appealRow).toHaveAttribute('role', 'link');
      expect(onNavigate).toHaveBeenCalledWith({ type: 'appeal', id: 'AP-2026-101' });
    });

    it('clicking an appraiser row navigates to the appraiser detail', async () => {
      const onNavigate = vi.fn();
      renderDashboard(onNavigate);
      clickTab('Workload');
      await screen.findByText('Sarah Mitchell');

      const appraiserRow = screen.getByText('Sarah Mitchell').closest('tr')!;
      fireEvent.click(appraiserRow);

      expect(appraiserRow).toHaveAttribute('role', 'link');
      expect(onNavigate).toHaveBeenCalledWith({ type: 'appraiser', id: 'sarah-mitchell' });
    });
  });

  describe('Theme Compliance', () => {
    it('no light-mode classes in rendered output', async () => {
      const { container } = renderDashboard();
      await screen.findByText('15,000');

      const allHtml: string[] = [container.innerHTML];
      clickTab('Certification');
      allHtml.push(container.innerHTML);
      clickTab('Appeals');
      allHtml.push(container.innerHTML);
      clickTab('Workload');
      allHtml.push(container.innerHTML);

      const combined = allHtml.join('');

      const forbiddenPatterns = [
        'bg-gray-50',
        'bg-gray-200',
        'text-gray-',
        'hover:bg-gray-50',
      ];

      for (const pattern of forbiddenPatterns) {
        expect(combined).not.toContain(pattern);
      }
    });
  });
});
