/**
 * W7B — ManagementDashboard Read-Lane Honesty Contract Tests
 *
 * Verifies that ManagementDashboard exposes lane-level provenance for:
 *   - certification
 *   - appeals
 *   - queue metrics
 *   - productivity
 *
 * The dashboard must not rely on a single coarse fixture banner as the only
 * truth signal for mixed live and fallback-backed read lanes.
 */

import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

const mockGetCertificationStatus = vi.fn();
const mockGetAllAppeals = vi.fn();
const mockGetQueueMetrics = vi.fn();
const mockGetAppraiserProductivity = vi.fn();

vi.mock('../../components/ui/card', () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => React.createElement('div', props, children),
  CardContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => React.createElement('div', props, children),
  CardHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => React.createElement('div', props, children),
  CardTitle: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => React.createElement('div', props, children),
}));

vi.mock('../../components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    React.createElement('button', { ...props, onClick }, children)
  ),
}));

vi.mock('../../components/ui/badge', () => ({
  Badge: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => React.createElement('span', props, children),
}));

vi.mock('../../components/governance/DemoDataBanner', () => ({
  DemoDataBanner: ({ module }: { module: string }) => React.createElement('div', { 'data-testid': 'demo-data-banner' }, `DEMO DATA ${module}`),
}));

vi.mock('../../auth/useSession', () => ({
  useSession: () => ({
    userId: 'test-user',
    countyId: 'benton',
    role: 'assessor',
    mode: 'pilot',
  }),
}));

vi.mock('../../services/suites/daisService', () => ({
  getCertificationStatus: (...args: unknown[]) => mockGetCertificationStatus(...args),
  getAllAppeals: (...args: unknown[]) => mockGetAllAppeals(...args),
}));

vi.mock('../../services/suites/queueService', () => ({
  getQueueMetrics: (...args: unknown[]) => mockGetQueueMetrics(...args),
  getAppraiserProductivity: (...args: unknown[]) => mockGetAppraiserProductivity(...args),
}));

import { ManagementDashboard } from '../../pages/dais/ManagementDashboard';

describe('Gate 1 — ManagementDashboard provenance is lane-level in source', () => {
  const src = readSrc('pages/dais/ManagementDashboard.tsx');

  it('defines explicit lane provenance seams instead of only an umbrella fixture signal', () => {
    expect(src).toContain('type LaneStatus =');
    expect(src).toContain('type LaneKey =');
    expect(src).toContain('management-dashboard-provenance');
    expect(src).toContain('management-dashboard-lane-${lane.testId}');
    expect(src).toContain('management-dashboard-lane-${lane.testId}-status');
    expect(src).toContain('management-dashboard-lane-${lane.testId}-detail');
  });

  it('tracks queue metrics and productivity as independent lanes', () => {
    expect(src).toContain("queueMetrics: {");
    expect(src).toContain("productivity: {");
    expect(src).toContain('getQueueMetrics({ throwOnError: true })');
    expect(src).toContain('getAppraiserProductivity({ throwOnError: true })');
  });
});

describe('Gate 2 — ManagementDashboard exposes runtime lane provenance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows lane-level loading state while live reads are in flight', () => {
    const cert = createDeferred<unknown[]>();
    const appeals = createDeferred<unknown[]>();
    const metrics = createDeferred<unknown>();
    const productivity = createDeferred<unknown[]>();

    mockGetCertificationStatus.mockReturnValueOnce(cert.promise);
    mockGetAllAppeals.mockReturnValueOnce(appeals.promise);
    mockGetQueueMetrics.mockReturnValueOnce(metrics.promise);
    mockGetAppraiserProductivity.mockReturnValueOnce(productivity.promise);

    render(React.createElement(ManagementDashboard));

    expect(screen.getByTestId('management-dashboard-lane-certification-status')).toHaveTextContent('Loading');
    expect(screen.getByTestId('management-dashboard-lane-appeals-status')).toHaveTextContent('Loading');
    expect(screen.getByTestId('management-dashboard-lane-queue-metrics-status')).toHaveTextContent('Loading');
    expect(screen.getByTestId('management-dashboard-lane-productivity-status')).toHaveTextContent('Loading');
  });

  it('shows degraded certification, appeals, queue metrics, and productivity lanes when live reads fail', async () => {
    mockGetCertificationStatus.mockRejectedValueOnce(new Error('cert down'));
    mockGetAllAppeals.mockRejectedValueOnce(new Error('appeals down'));
    mockGetQueueMetrics.mockRejectedValueOnce(new Error('metrics down'));
    mockGetAppraiserProductivity.mockRejectedValueOnce(new Error('productivity down'));

    render(React.createElement(ManagementDashboard));

    await waitFor(() => {
      expect(screen.getByTestId('management-dashboard-lane-certification-status')).toHaveTextContent('Degraded');
      expect(screen.getByTestId('management-dashboard-lane-appeals-status')).toHaveTextContent('Degraded');
      expect(screen.getByTestId('management-dashboard-lane-queue-metrics-status')).toHaveTextContent('Degraded');
      expect(screen.getByTestId('management-dashboard-lane-productivity-status')).toHaveTextContent('Degraded');
    });

    expect(screen.getByTestId('management-dashboard-lane-certification-detail')).toHaveTextContent('cert down');
    expect(screen.getByTestId('management-dashboard-lane-appeals-detail')).toHaveTextContent('appeals down');
    expect(screen.getByTestId('management-dashboard-lane-queue-metrics-detail')).toHaveTextContent('metrics down');
    expect(screen.getByTestId('management-dashboard-lane-productivity-detail')).toHaveTextContent('productivity down');
    expect(screen.getByTestId('demo-data-banner')).toBeInTheDocument();
  });

  it('shows live lane provenance when the read lanes resolve with endpoint data', async () => {
    mockGetCertificationStatus.mockResolvedValueOnce([
      {
        area: 'North Richland',
        totalParcels: 100,
        completedParcels: 91,
        percentComplete: 91,
        deadline: '2026-04-01',
        status: 'on-track',
      },
    ]);
    mockGetAllAppeals.mockResolvedValueOnce([
      {
        appealId: 'API-AP-1',
        parcelId: 'P-100',
        status: 'scheduled',
        filedDate: '2026-03-10',
        petitionerName: 'API Owner',
        currentValue: 100000,
        requestedValue: 90000,
      },
    ]);
    mockGetQueueMetrics.mockResolvedValueOnce({
      totalUnassigned: 1,
      totalInProgress: 2,
      totalPendingReview: 3,
      completedThisWeek: 4,
      slaViolations: 0,
      avgDaysToComplete: 2,
    });
    mockGetAppraiserProductivity.mockResolvedValueOnce([
      {
        name: 'API Appraiser',
        area: 'North Richland',
        assigned: 10,
        completed: 8,
        avgDays: 3,
        reviewRejectRate: 1,
      },
    ]);

    render(React.createElement(ManagementDashboard));

    await waitFor(() => {
      expect(screen.getByTestId('management-dashboard-lane-certification-status')).toHaveTextContent('Live');
    });

    expect(screen.getByTestId('management-dashboard-lane-appeals-status')).toHaveTextContent('Live');
    expect(screen.getByTestId('management-dashboard-lane-queue-metrics-status')).toHaveTextContent('Live');
    expect(screen.getByTestId('management-dashboard-lane-productivity-status')).toHaveTextContent('Live');
    expect(screen.getByTestId('management-dashboard-lane-certification-detail')).toHaveTextContent('Live county certification endpoint resolved.');
    expect(screen.getByTestId('management-dashboard-lane-appeals-detail')).toHaveTextContent('Live county appeals endpoint resolved.');
    expect(screen.getByTestId('management-dashboard-lane-queue-metrics-detail')).toHaveTextContent('Live county queue metrics endpoint resolved.');
    expect(screen.getByTestId('management-dashboard-lane-productivity-detail')).toHaveTextContent('Live county productivity endpoint resolved.');
    expect(screen.queryByTestId('demo-data-banner')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Certification' }));
    expect(screen.getByText('North Richland')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Workload' }));
    expect(screen.getByText('API Appraiser')).toBeInTheDocument();
  });
});