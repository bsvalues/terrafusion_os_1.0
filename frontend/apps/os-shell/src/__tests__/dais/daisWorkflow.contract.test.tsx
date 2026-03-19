/**
 * Phase 9 Contract Tests — Dais Workflow Components
 * ===================================================================
 * TDD-first contract tests for AppealsWorkflow and WorkflowComponents.
 * These define the required contract (data-testids, no light-mode classes).
 * Some tests will fail until implementation adds testids and removes
 * hardcoded light-mode color classes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/services/suites/daisService', () => ({
  getAllAppeals: vi.fn().mockResolvedValue([]),
  getAppeals: vi.fn().mockResolvedValue([]),
  createAppeal: vi.fn().mockResolvedValue({}),
  updateAppealStatus: vi.fn().mockResolvedValue(undefined),
  getPermits: vi.fn().mockResolvedValue([]),
  updatePermitStatus: vi.fn().mockResolvedValue(undefined),
  getExemptions: vi.fn().mockResolvedValue([]),
  processExemption: vi.fn().mockResolvedValue(undefined),
  getNotices: vi.fn().mockResolvedValue([]),
  getCertificationStatus: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import AppealsWorkflow from '../../pages/dais/AppealsWorkflow';
import {
  PermitsWorkflow,
  ExemptionsWorkflow,
  NoticesPanel,
  CertificationDashboard,
} from '../../pages/dais/WorkflowComponents';

// ---------------------------------------------------------------------------
// Light-mode pattern detector
// ---------------------------------------------------------------------------

const LIGHT_MODE_PATTERNS = [
  /bg-gray-\d+/,
  /bg-blue-\d+/,
  /bg-green-\d+/,
  /bg-red-\d+/,
  /bg-yellow-\d+/,
  /border-gray-\d+/,
  /hover:bg-gray-\d+/,
  /text-gray-\d+/,
];

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
// Tests
// ---------------------------------------------------------------------------

describe('Phase 9: Dais Workflow Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // AppealsWorkflow
  // =========================================================================

  describe('AppealsWorkflow', () => {
    it('renders with data-testid="appeals-workflow"', async () => {
      render(<AppealsWorkflow />);

      await waitFor(() => {
        expect(screen.getByTestId('appeals-workflow')).toBeInTheDocument();
      });
    });

    it('shows appeals table with data-testid="appeals-table"', async () => {
      const { getAllAppeals } = await import('@/services/suites/daisService');
      (getAllAppeals as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        {
          appealId: 'APL-001',
          parcelId: '1-0234-100-0001-000',
          status: 'filed',
          filedDate: '2026-01-15T00:00:00Z',
          petitionerName: 'Jane Doe',
          currentValue: 350000,
          requestedValue: 300000,
        },
      ]);

      render(<AppealsWorkflow />);

      await waitFor(() => {
        expect(screen.getByTestId('appeals-table')).toBeInTheDocument();
      });
    });

    it('shows appeal form with data-testid="appeal-form"', async () => {
      render(<AppealsWorkflow />);

      // Click the "File New Appeal" button to show the form
      const fileButton = await waitFor(() =>
        screen.getByRole('button', { name: /file new appeal/i })
      );
      fileButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('appeal-form')).toBeInTheDocument();
      });
    });

    it('has no light-mode classes in rendered HTML', async () => {
      const { getAllAppeals } = await import('@/services/suites/daisService');
      (getAllAppeals as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        {
          appealId: 'APL-002',
          parcelId: '1-0234-100-0002-000',
          status: 'scheduled',
          filedDate: '2026-02-01T00:00:00Z',
          hearingDate: '2026-03-15T00:00:00Z',
          petitionerName: 'John Smith',
          currentValue: 500000,
          requestedValue: 420000,
          outcome: 'sustained',
        },
      ]);

      const { container } = render(<AppealsWorkflow />);

      await waitFor(() => {
        const violations = findLightModeViolations(container.innerHTML);
        expect(violations).toEqual([]);
      });
    });
  });

  // =========================================================================
  // WorkflowComponents
  // =========================================================================

  describe('WorkflowComponents', () => {
    it('PermitsWorkflow renders with data-testid="permits-workflow"', async () => {
      render(<PermitsWorkflow parcelId="1-0234-100-0001-000" />);

      await waitFor(() => {
        expect(screen.getByTestId('permits-workflow')).toBeInTheDocument();
      });
    });

    it('ExemptionsWorkflow renders with data-testid="exemptions-workflow"', async () => {
      render(<ExemptionsWorkflow parcelId="1-0234-100-0001-000" />);

      await waitFor(() => {
        expect(screen.getByTestId('exemptions-workflow')).toBeInTheDocument();
      });
    });

    it('NoticesPanel renders with data-testid="notices-panel"', async () => {
      render(<NoticesPanel parcelId="1-0234-100-0001-000" />);

      await waitFor(() => {
        expect(screen.getByTestId('notices-panel')).toBeInTheDocument();
      });
    });

    it('CertificationDashboard renders with data-testid="certification-dashboard"', async () => {
      render(<CertificationDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('certification-dashboard')).toBeInTheDocument();
      });
    });

    it('has no light-mode classes in any WorkflowComponent', async () => {
      const {
        getPermits,
        getExemptions,
        getNotices,
        getCertificationStatus,
      } = await import('@/services/suites/daisService');

      (getPermits as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        {
          permitId: 'PRM-001',
          parcelId: '1-0234-100-0001-000',
          type: 'Building',
          status: 'approved',
          issuedDate: '2026-01-10T00:00:00Z',
        },
      ]);

      (getExemptions as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        {
          exemptionId: 'EXM-001',
          parcelId: '1-0234-100-0001-000',
          type: 'Senior',
          tier: 'Tier 1',
          status: 'active',
          renewalDate: '2027-01-01T00:00:00Z',
        },
      ]);

      (getNotices as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        {
          noticeId: 'NTC-001',
          parcelId: '1-0234-100-0001-000',
          type: 'Assessment Change',
          status: 'sent',
          generatedAt: '2026-02-15T00:00:00Z',
        },
      ]);

      (getCertificationStatus as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        {
          area: 'Kennewick',
          totalParcels: 30000,
          completedParcels: 28500,
          percentComplete: 95.0,
          deadline: '2026-07-01T00:00:00Z',
          status: 'on-track',
        },
      ]);

      const containers: string[] = [];

      const { container: c1 } = render(
        <PermitsWorkflow parcelId="1-0234-100-0001-000" />
      );
      const { container: c2 } = render(
        <ExemptionsWorkflow parcelId="1-0234-100-0001-000" />
      );
      const { container: c3 } = render(
        <NoticesPanel parcelId="1-0234-100-0001-000" />
      );
      const { container: c4 } = render(<CertificationDashboard />);

      await waitFor(() => {
        containers.push(c1.innerHTML, c2.innerHTML, c3.innerHTML, c4.innerHTML);
        const allHtml = containers.join(' ');
        const violations = findLightModeViolations(allHtml);
        expect(violations).toEqual([]);
      });
    });
  });
});
