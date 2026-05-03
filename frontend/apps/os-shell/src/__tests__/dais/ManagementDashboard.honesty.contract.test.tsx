/**
 * ManagementDashboard source-honesty contract test
 *
 * Ensures:
 *   1. WorkbenchSourceBadge is rendered on the dashboard
 *   2. Badges show unavailable when no live API is connected
 *   3. The dashboard does not regress to demo-banner disclosure
 *   4. No "AI-powered" fluff language appears in the component
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const invokeToolMock = vi.fn();

vi.mock('../../hooks/useSwarmLive', () => ({
  useSwarmLive: () => ({
    data: null, isLoading: false, error: null,
    lastUpdated: null, source: 'unavailable', isStale: false,
  }),
}));
vi.mock('../../hooks/usePacsStatus', () => ({
  usePacsStatus: () => ({
    data: null, isLoading: false, error: null,
    lastUpdated: null, source: 'unavailable', isStale: false,
  }),
}));
vi.mock('../../hooks/useAppealsQueue', () => ({
  useAppealsQueue: () => ({
    data: null, isLoading: false, error: null,
    lastUpdated: null, source: 'unavailable', isStale: false,
  }),
}));
vi.mock('../../hooks/useWorkloadSummary', () => ({
  useWorkloadSummary: () => ({
    data: null, isLoading: false, error: null,
    lastUpdated: null, source: 'unavailable', isStale: false,
  }),
}));

vi.mock('../../auth/useSession', () => ({
  useSession: () => ({
    userId: 'test-user',
    countyId: 'test-county',
    role: 'assessor',
    mode: 'dev',
  }),
}));

vi.mock('../../services/suites/daisService', () => ({
  getCertificationStatus: vi.fn().mockRejectedValue(new Error('offline')),
  getAllAppeals: vi.fn().mockRejectedValue(new Error('offline')),
}));
vi.mock('../../services/suites/queueService', () => ({
  getQueueMetrics: vi.fn().mockRejectedValue(new Error('offline')),
  getAppraiserProductivity: vi.fn().mockRejectedValue(new Error('offline')),
}));

vi.mock('../../api/pilotApi', () => ({
  invokeTool: (...args: unknown[]) => invokeToolMock(...args),
}));

vi.mock('../../auth/authStorage', () => ({
  getToken: () => null,
}));

import { ManagementDashboard } from '../../pages/dais/ManagementDashboard';

describe('ManagementDashboard source honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invokeToolMock.mockResolvedValue({
      success: true,
      correlationId: 'corr-brief-001',
      result: {
        output: JSON.stringify({
          role: 'chief_appraiser',
          queueType: 'calibration_review',
          priority: 'high',
          dueWindow: 'today',
          blockingDependencies: ['sales_sync'],
          recommendedTool: 'rerun_ratio_study',
          readyToAct: true,
          findings: [
            {
              findingType: 'RATE_PROBLEM',
              severity: 'high',
              recommendedAction: 'Review residential base rate',
            },
          ],
        }),
      },
    });
  });

  it('renders at least one WorkbenchSourceBadge', () => {
    render(<ManagementDashboard />);
    const badges = screen.getAllByTestId('workbench-source-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('badges show unavailable when backend is unavailable', () => {
    render(<ManagementDashboard />);
    const badges = screen.getAllByTestId('workbench-source-badge');
    for (const badge of badges) {
      expect(badge.getAttribute('data-source')).toBe('unavailable');
    }
  });

  it('shows explicit unavailable messages instead of fixture disclosure', () => {
    render(<ManagementDashboard />);
    expect(screen.queryByText(/DEMO DATA/i)).not.toBeInTheDocument();
    expect(screen.getByText('Certification deadlines unavailable.')).toBeInTheDocument();
  });

  it('does not contain "AI-powered" fluff language', () => {
    const { container } = render(<ManagementDashboard />);
    const text = container.textContent?.toLowerCase() ?? '';
    const fluffPhrases = [
      'ai-powered',
      'ai powered',
      'machine learning driven',
      'intelligent automation',
      'smart analytics',
      'predictive intelligence',
    ];
    for (const phrase of fluffPhrases) {
      expect(text).not.toContain(phrase);
    }
  });

  it('renders the management dashboard root element', () => {
    render(<ManagementDashboard />);
    expect(screen.getByTestId('management-dashboard')).toBeInTheDocument();
  });

  it('renders a governed staff queue panel with governed role briefing language', async () => {
    render(<ManagementDashboard />);

    expect(screen.getByTestId('management-governed-brief')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Governed Staff Queue/i)).toBeInTheDocument();
      expect(screen.getByText(/calibration_review/i)).toBeInTheDocument();
      expect(screen.getByText(/high \| due today/i)).toBeInTheDocument();
      expect(screen.getByText(/rerun_ratio_study/i)).toBeInTheDocument();
      expect(screen.getByText(/Top finding: RATE_PROBLEM -> Review residential base rate/i)).toBeInTheDocument();
    });
  });
});
