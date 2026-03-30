/**
 * PropertyDais.test.tsx
 *
 * Phase 5.5: Property Dais Tab - Workflow MWUX Slice
 * Tests: workflow status → check_cert_status tool → correlationId UX
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import * as pilotApi from '../../api/pilotApi';
import PropertyDais from '../../pages/workbench/tabs/PropertyDais';
import { usePropertyStore } from '../../stores/propertyStore';

// Mock the pilotApi module
vi.mock('../../api/pilotApi');

const mockInvokeTool = pilotApi.invokeTool as vi.MockedFunction<typeof pilotApi.invokeTool>;

// Test wrapper providing parcel context via outlet
const TestWrapper: React.FC<{ parcelId: string }> = ({ parcelId }) => {
  return (
    <MemoryRouter initialEntries={[`/property/${parcelId}/dais`]}>
      <Routes>
        <Route
          path='/property/:parcelId'
          element={
            <div>
              <Outlet context={{ parcelId }} />
            </div>
          }
        >
          <Route path='dais' element={<PropertyDais />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('PropertyDais', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePropertyStore.setState({ appeals: [] });
  });

  describe('Rendering', () => {
    it('renders with parcel context', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByTestId('property-dais-tab')).toBeInTheDocument();
      expect(screen.getAllByText(/TerraDais/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/12345-001/).length).toBeGreaterThan(0);
    });

    it('displays certification status request controls', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed certification-status request for Benton County and the current tax year, then review the returned county, tax year, status, completed steps, remaining steps, and certified-at timestamp/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submit Certification Status Request/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/workflow type/i)).not.toBeInTheDocument();
    });

    it('shows loaded appeals disclosure for store-backed appeal records', () => {
      usePropertyStore.setState({
        appeals: [
          {
            appealId: 'APL-12345-001-2025',
            parcelId: '12345-001',
            appealYear: 2025,
            filingDate: '2025-05-20',
            hearingDate: '2025-07-15T09:00:00',
            status: 'scheduled',
            petitionerName: 'Jane Doe',
            currentAssessedValue: 325000,
            petitionedValue: 280000,
            reason: 'Market value exceeds comparable sales',
          },
        ],
      });

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Loaded Appeals/i)).toBeInTheDocument();
      expect(screen.getByText(/Shown from the appeal records currently loaded for this parcel\./i)).toBeInTheDocument();
      expect(screen.queryByText(/^Active Appeals$/i)).not.toBeInTheDocument();
    });

    it('does not show placeholder disclosure for the mounted appeal certification panel', () => {
      render(<TestWrapper parcelId='12345-001' />);

      const certificationPanel = screen.getByTestId('certification-panel');

      // Honest empty state — no placeholder cues
      expect(within(certificationPanel).queryByText(/Certification Readiness Placeholder/i)).not.toBeInTheDocument();
      expect(within(certificationPanel).queryByText(/Mounted parcel-scoped placeholder/i)).not.toBeInTheDocument();
      expect(within(certificationPanel).queryByText(/Placeholder only/i)).not.toBeInTheDocument();
      // Honest content present
      expect(within(certificationPanel).getByText('Certification Readiness')).toBeInTheDocument();
      expect(within(certificationPanel).getByText('No certification readiness data available for this parcel.')).toBeInTheDocument();
      // Pre-existing negative guards preserved
      expect(within(certificationPanel).queryByText(/Appeal outcome and certification status/i)).not.toBeInTheDocument();
      expect(within(certificationPanel).queryByText(/^Pending$/i)).not.toBeInTheDocument();
    });

    it('does not show placeholder disclosure for the mounted appeal deadline panel', () => {
      render(<TestWrapper parcelId='12345-001' />);

      const deadlinePanel = screen.getByTestId('deadline-panel');

      // Honest empty state — no placeholder cues
      expect(within(deadlinePanel).queryByText(/Appeal Deadline Placeholder/i)).not.toBeInTheDocument();
      expect(within(deadlinePanel).queryByText(/Mounted parcel-scoped placeholder/i)).not.toBeInTheDocument();
      expect(within(deadlinePanel).queryByText(/Placeholder only/i)).not.toBeInTheDocument();
      // Honest content present
      expect(within(deadlinePanel).getByText(/Appeal Filing Deadline/i)).toBeInTheDocument();
      expect(within(deadlinePanel).getByText(/No filing deadline data available for this parcel/i)).toBeInTheDocument();
      // Pre-existing negative guards preserved
      expect(within(deadlinePanel).queryByText(/Filing and hearing milestone tracking/i)).not.toBeInTheDocument();
      expect(within(deadlinePanel).queryByText(/No Active Appeals/i)).not.toBeInTheDocument();
    });

    it('does not show placeholder disclosure for the mounted appeal hearing panel', () => {
      render(<TestWrapper parcelId='12345-001' />);

      const hearingPanel = screen.getByTestId('hearing-panel');

      // Honest empty state — no placeholder cues
      expect(within(hearingPanel).queryByText(/Appeal Hearing Placeholder/i)).not.toBeInTheDocument();
      expect(within(hearingPanel).queryByText(/Mounted parcel-scoped placeholder/i)).not.toBeInTheDocument();
      expect(within(hearingPanel).queryByText(/Placeholder only/i)).not.toBeInTheDocument();
      // Honest content present
      expect(within(hearingPanel).getByText(/Board of Equalization Hearing/i)).toBeInTheDocument();
      expect(within(hearingPanel).getByText(/No hearing schedule data available for this parcel/i)).toBeInTheDocument();
      // Pre-existing negative guards preserved
      expect(within(hearingPanel).queryByText(/BOE hearing scheduling and tracking/i)).not.toBeInTheDocument();
      expect(within(hearingPanel).queryByText(/No Scheduled Hearings/i)).not.toBeInTheDocument();
    });

    it('does not show placeholder disclosure for the mounted appeal notice panel', () => {
      render(<TestWrapper parcelId='12345-001' />);

      const noticePanel = screen.getByTestId('notice-panel');

      // Honest empty state — no placeholder cues
      expect(within(noticePanel).queryByText(/Appeal Notice Placeholder/i)).not.toBeInTheDocument();
      expect(within(noticePanel).queryByText(/Mounted parcel-scoped placeholder/i)).not.toBeInTheDocument();
      expect(within(noticePanel).queryByText(/Placeholder only/i)).not.toBeInTheDocument();
      // Honest content present
      expect(within(noticePanel).getByText(/Appeal Notice/i)).toBeInTheDocument();
      expect(within(noticePanel).getByText(/No notice queue data available for this parcel/i)).toBeInTheDocument();
      // Pre-existing negative guards preserved
      expect(within(noticePanel).queryByText(/Hearing notice generation and queue status/i)).not.toBeInTheDocument();
      expect(within(noticePanel).queryByText(/No Pending Notices/i)).not.toBeInTheDocument();
    });
  });
  describe('Tool Invocation', () => {
    it('invokes check_cert_status with request wording and returned-status disclosure', async () => {
      const currentYear = new Date().getFullYear();
      const mockResponse = {
        success: true,
        correlationId: 'corr-dais-abc123',
        result: {
          toolId: 'check_cert_status',
          output: JSON.stringify({
            county: 'benton',
            taxYear: currentYear,
            status: 'pending_review',
            completedSteps: ['Intake', 'Data Verification'],
            remainingSteps: ['Supervisor Approval', 'Final Certification'],
            certifiedAt: '2026-02-05T10:30:00Z',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed certification-status request for Benton County and the current tax year, then review the returned county, tax year, status, completed steps, remaining steps, and certified-at timestamp/i)).toBeInTheDocument();
      expect(screen.queryByText(/Select workflow type and check status/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/View certification status, workflow steps, and assignments/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Submit Certification Status Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'check_cert_status',
          params: {
            county: 'benton',
            taxYear: currentYear,
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getAllByText(/pending_review/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/benton/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(new RegExp(`${currentYear}`, 'i')).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Final Certification/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/corr-dais/).length).toBeGreaterThan(0);
      });

      expect(screen.getByText(/Shows the returned county, tax year, status, completed steps, remaining steps, and certified-at timestamp for this certification-status request\./i)).toBeInTheDocument();
      expect(screen.getByText(/Certified at:/i)).toBeInTheDocument();
      expect(screen.queryByText(/^Reported Step$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Assigned To/i)).not.toBeInTheDocument();
    });

    it('surfaces tool error with correlationId', async () => {
      const mockError = {
        success: false,
        correlationId: 'corr-dais-error-789',
        error: {
          code: 'WORKFLOW_NOT_FOUND',
          message: 'No active workflow found for parcel',
          severity: 'high' as const,
        },
      };

      mockInvokeTool.mockResolvedValue(mockError);

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /Submit Certification Status Request/i }));

      await waitFor(() => {
        expect(screen.getByText(/No active workflow found/i)).toBeInTheDocument();
        expect(screen.getAllByText(/corr-dais-error/).length).toBeGreaterThan(0);
      });
    });

    it('handles network errors gracefully', async () => {
      mockInvokeTool.mockRejectedValue(new TypeError('Failed to fetch'));

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /Submit Certification Status Request/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error|failed to fetch/i)).toBeInTheDocument();
        const correlationTexts = screen.getAllByText(/net-/);
        expect(correlationTexts.length).toBeGreaterThan(0);
      });
    });

    it('invokes queue_notice_for_mailing and renders the returned queue result', async () => {
      const mockResponse = {
        success: true,
        correlationId: 'corr-queue-notice-001',
        result: {
          toolId: 'queue_notice_for_mailing',
          output: JSON.stringify({
            queued: 2,
            batchId: 'BATCH-2026-041',
            deliveryMethod: 'certified_mail',
            payloadRef: 'payload://notice-batch/BATCH-2026-041',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed notice-queue request for these notice IDs, then review the returned queued count, batch ID, and delivery method/i)).toBeInTheDocument();
      expect(screen.queryByText(/Queue generated notices for batch mailing with delivery tracking/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Queue for Mailing/i })).not.toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/Notice IDs \(comma-separated\)/i), {
        target: { value: 'NTC-001, NTC-002' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Submit Notice-Queue Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'queue_notice_for_mailing',
          params: { county: 'benton', noticeIds: ['NTC-001', 'NTC-002'] },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Returned queued count: 2/i)).toBeInTheDocument();
        expect(screen.getByText(/Batch ID: BATCH-2026-041 \| Delivery method: certified_mail/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned queued count, batch ID, and delivery method for this notice-queue request\./i)).toBeInTheDocument();
      });
    });

    describe('PropertyDais queue statistics honesty', () => {
      const mockQueueStatsResponse = {
        success: true,
        correlationId: 'corr-queue-stats-001',
        result: {
          toolId: 'get_queue_statistics',
          output: JSON.stringify({
            county: 'benton',
            period: '2026-Q1',
            totalTasks: 128,
            completedTasks: 96,
            slaCompliance: 92,
            overdueCount: 7,
          }),
        },
      };

      async function renderQueueStatisticsCard() {
        mockInvokeTool.mockResolvedValue(mockQueueStatsResponse);

        render(<TestWrapper parcelId='12345-001' />);
        fireEvent.click(screen.getByRole('button', { name: /Get Queue Statistics/i }));

        await waitFor(() => {
          expect(mockInvokeTool).toHaveBeenCalledWith({
            toolId: 'get_queue_statistics',
            params: { county: 'benton' },
            parcelId: '12345-001',
          });
        });
      }

      it('invokes get_queue_statistics for the user action', async () => {
        await renderQueueStatisticsCard();
      });

      it('renders request-returned queue totals rather than generic system-truth wording', async () => {
        await renderQueueStatisticsCard();

          expect(screen.getByText(/Request returned queue totals, completion count, overdue count, and SLA compliance for this request/i)).toBeInTheDocument();

        await waitFor(() => {
          expect(screen.getByText('128')).toBeInTheDocument();
          expect(screen.getByText('96')).toBeInTheDocument();
          expect(screen.getByText('92%')).toBeInTheDocument();
          expect(screen.getByText('7')).toBeInTheDocument();
        });
      });

      it('does not render old overclaim language such as SLA compliance metrics if unsupported', () => {
        render(<TestWrapper parcelId='12345-001' />);

        expect(screen.queryByText(/Task queue statistics with SLA compliance metrics/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/county-wide/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/official/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/live queue statistics/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/all queues/i)).not.toBeInTheDocument();
      });

      it('shows a success disclosure tied to the actual returned fields', async () => {
        await renderQueueStatisticsCard();

        await waitFor(() => {
          expect(screen.getByText(/Shows the total tasks, completed tasks, overdue count, and SLA compliance returned by this request\./i)).toBeInTheDocument();
        });
      });

      it('does not promote returned queue statistics to a live source badge after success', async () => {
        await renderQueueStatisticsCard();

        await waitFor(() => {
          expect(screen.queryByText(/^Live$/i)).not.toBeInTheDocument();
          expect(
            screen
              .queryAllByTestId('workbench-source-badge')
              .filter((badge) => badge.getAttribute('data-source') === 'live')
          ).toHaveLength(0);
        });
      });
    });

    it('invokes process_exemption_renewal and renders the returned renewal status', async () => {
      const currentYear = new Date().getFullYear();
      const mockResponse = {
        success: true,
        correlationId: 'corr-renewal-001',
        result: {
          toolId: 'process_exemption_renewal',
          output: JSON.stringify({
            exemptionId: 'EXM-2026-001',
            taxYear: currentYear,
            status: 'renewed',
            payloadRef: 'payload://exemptions/EXM-2026-001',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed exemption-renewal request for this exemption, then review the returned exemption ID, tax year, and renewal status/i)).toBeInTheDocument();
      expect(screen.queryByText(/Process annual exemption renewal with documentation verification/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Process Renewal/i })).not.toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/Exemption ID \(e\.g\. EXM-2026-001\)/i), {
        target: { value: 'EXM-2026-001' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Submit Renewal Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'process_exemption_renewal',
          params: { county: 'benton', exemptionId: 'EXM-2026-001', taxYear: currentYear },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Returned status: renewed/i)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`Exemption ID: EXM-2026-001 \\| Tax year: ${currentYear}`, 'i'))).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned exemption ID, tax year, and renewal status for this request\./i)).toBeInTheDocument();
      });
    });

    it('invokes schedule_boe_hearing and renders the returned hearing schedule details', async () => {
      const mockResponse = {
        success: true,
        correlationId: 'corr-hearing-001',
        result: {
          toolId: 'schedule_boe_hearing',
          output: JSON.stringify({
            hearingId: 'HEAR-2026-041',
            appealId: 'APL-2026-041',
            scheduledDate: '2026-08-14',
            panelSize: 3,
            payloadRef: 'payload://hearings/HEAR-2026-041',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

  const { container } = render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed BOE hearing request for this appeal, then review the returned hearing ID, scheduled date, and panel size/i)).toBeInTheDocument();
      expect(screen.queryByText(/Schedule a Board of Equalization hearing with panel assignment/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Schedule Hearing/i })).not.toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/^Appeal ID$/i), {
        target: { value: 'APL-2026-041' },
      });
      const hearingDateInput = container.querySelector("input[type='date']");
      expect(hearingDateInput).not.toBeNull();
      fireEvent.change(hearingDateInput as HTMLInputElement, {
        target: { value: '2026-08-14' },
      });
      fireEvent.click(screen.getByRole('checkbox', { name: /I confirm this BOE hearing request is ready for submission/i }));
      fireEvent.click(screen.getByRole('button', { name: /Submit Hearing Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'schedule_boe_hearing',
          params: { county: 'benton', appealId: 'APL-2026-041', requestedDate: '2026-08-14' },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Returned hearing ID: HEAR-2026-041/i)).toBeInTheDocument();
        expect(screen.getByText(/Scheduled date: .*\| Panel: 3 members/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned hearing ID, scheduled date, and panel size for this hearing request\./i)).toBeInTheDocument();
      });
    });

    it('invokes summarize_levy_rate_components with request wording and returned-summary disclosure', async () => {
      const currentYear = new Date().getFullYear();
      const mockResponse = {
        success: true,
        correlationId: 'corr-levy-summary-001',
        result: {
          toolId: 'summarize_levy_rate_components',
          output: JSON.stringify({
            components: [
              { name: 'Statutory Limit', rate: 50 },
              { name: 'AI Optimal Rate', rate: 29.85 },
              { name: 'Base Rate', rate: 25 },
            ],
            totalRate: 29.85,
            explanation: 'Levy calculation for 2026 returned AI optimal rate $29.85 per $1,000 AV with projected revenue $44770.',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed levy-summary request for Benton County and the current tax year, then review the returned rate components, total rate, and explanation/i)).toBeInTheDocument();
      expect(screen.queryByText(/Breakdown of levy rate by component \(state, school, local\)/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Submit Levy Summary Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'summarize_levy_rate_components',
          params: {
            county: 'benton',
            taxYear: currentYear,
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getAllByText(/AI Optimal Rate/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Base Rate/i)).toBeInTheDocument();
        expect(screen.getByText(/Statutory Limit/i)).toBeInTheDocument();
        expect(screen.getByText(/Levy calculation for 2026 returned AI optimal rate \$29\.85 per \$1,000 AV with projected revenue \$44770\./i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned rate components, total rate, and explanation for this levy-summary request\./i)).toBeInTheDocument();
      });
    });

    it('invokes generate_commissioner_memo with request wording and returned-memo disclosure', async () => {
      const currentYear = new Date().getFullYear();
      const mockResponse = {
        success: true,
        correlationId: 'corr-commissioner-memo-001',
        result: {
          toolId: 'generate_commissioner_memo',
          output: JSON.stringify({
            memo: {
              title: `Commissioner Briefing - Annual Revaluation Summary (${currentYear})`,
              body: `Summary of Annual Revaluation Summary for tax year ${currentYear}. Prepared for commissioner review.`,
            },
            payloadRef: 'dossier://benton/memos/memo-2026-001',
            wordCount: 14,
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed commissioner-memo draft request for the selected topic and current tax year, then review the returned memo title, body, and word count/i)).toBeInTheDocument();
      expect(screen.queryByText(/Generate a briefing memo for commissioner review/i)).not.toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/^Topic$/i), {
        target: { value: 'Annual Revaluation Summary' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Submit Commissioner Memo Draft Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'generate_commissioner_memo',
          params: {
            county: 'benton',
            topic: 'Annual Revaluation Summary',
            taxYear: currentYear,
            format: 'brief',
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`Commissioner Briefing - Annual Revaluation Summary \\(${currentYear}\\)`, 'i'))).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`Summary of Annual Revaluation Summary for tax year ${currentYear}\\. Prepared for commissioner review\\.`, 'i'))).toBeInTheDocument();
        expect(screen.getByText(/14 words/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned memo title, body, and word count for this commissioner-memo draft request\./i)).toBeInTheDocument();
      });
    });

    it('invokes calculate_pilt_payment with request wording, limited-applicability disclosure, and returned-summary-text disclosure', async () => {
      const currentYear = new Date().getFullYear();
      const mockResponse = {
        success: true,
        correlationId: 'corr-pilt-001',
        result: {
          toolId: 'calculate_pilt_payment',
          output: JSON.stringify({
            county: 'BENTON',
            fiscalYear: currentYear,
            totalAssessedValue: 845000000,
            totalPiltDue: 1234000,
            districtCount: 7,
            summary: `PILT calculation for FY${currentYear}: 7 districts, $1,234,000 total due on $845,000,000 assessed value (Hanford Nuclear Reservation, 586,000 federal acres).`,
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

    expect(screen.getByText(/Submit a governed PILT summary request for Benton County and the current fiscal year, then review the returned total due, district count, assessed value, and summary text/i)).toBeInTheDocument();
      expect(screen.getByText(/Limited applicability: this TerraPILT-style calculation does not apply to every parcel and is better treated as a standalone county or fiscal module when needed\./i)).toBeInTheDocument();
      expect(screen.queryByText(/Run PILT calculation to view district breakdown/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Applies to every parcel$/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Shows the returned total due, district count, assessed value, and summary for this PILT request\./i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Submit PILT Summary Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'calculate_pilt_payment',
          params: {
            county: 'benton',
            fiscalYear: currentYear,
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Returned summary text: PILT calculation for FY/i)).toBeInTheDocument();
        expect(screen.getByText(/County: BENTON/i)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`FY ${currentYear}`, 'i'))).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned total due, district count, assessed value, and summary text for this PILT request\./i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/^PILT Districts$/i)).not.toBeInTheDocument();
    });

    it('invokes explain_senior_exemption_impact with request wording and returned-summary disclosure', async () => {
      const currentYear = new Date().getFullYear();
      const mockResponse = {
        success: true,
        correlationId: 'corr-senior-exemption-001',
        result: {
          toolId: 'explain_senior_exemption_impact',
          output: JSON.stringify({
            summary: `Senior exemption impact estimate for tax year ${currentYear}.`,
            assumptions: [
              `Tax year ${currentYear}`,
              'Parcel 12345-001 provided',
              'Public-rate estimate only',
            ],
            impactBands: [
              { tier: 'Income up to $40,000', estTaxChange: 1200 },
              { tier: 'Income $40,001-$50,000', estTaxChange: 650 },
            ],
            payloadRef: `dais://benton/exemptions/12345-001/${currentYear}`,
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed senior-exemption impact request for this parcel and the current tax year, then review the returned summary text, assumptions, and impact bands/i)).toBeInTheDocument();
      expect(screen.queryByText(/RCW 84\.36\.381 exemption impact analysis by income band/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Senior\/Disabled Exemption Impact$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/returned summary, assumptions, and impact bands/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Submit Senior Exemption Impact Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'explain_senior_exemption_impact',
          params: {
            county: 'benton',
            parcelId: '12345-001',
            year: currentYear,
            exemptionProgram: 'senior',
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`Returned summary text: Senior exemption impact estimate for tax year ${currentYear}\.`, 'i'))).toBeInTheDocument();
        expect(screen.getAllByText(new RegExp(`Tax year ${currentYear}`, 'i')).length).toBeGreaterThan(0);
        expect(screen.getByText(/Parcel 12345-001 provided/i)).toBeInTheDocument();
        expect(screen.getByText(/Public-rate estimate only/i)).toBeInTheDocument();
        expect(screen.getByText(/Income up to \$40,000/i)).toBeInTheDocument();
        expect(screen.getByText(/Income \$40,001-\$50,000/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned summary text, assumptions, and impact bands for this senior-exemption impact request\./i)).toBeInTheDocument();
      });
    });

    it('invokes draft_value_change_notice with request wording and returned-draft disclosure', async () => {
      const currentYear = new Date().getFullYear();
      const mockResponse = {
        success: true,
        correlationId: 'corr-value-change-notice-001',
        result: {
          toolId: 'draft_value_change_notice',
          output: JSON.stringify({
            document: {
              title: `Notice of Value Change - ${currentYear}`,
              body: 'Reason:\n- revaluation, new_construction\nAppeal Rights:\n- You may request a review within the statutory window.',
            },
            payloadRef: `dossier://benton/notices/12345-001/${currentYear}/latest`,
            disclaimer: 'Draft for internal review only. Not a final notice.',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed value-change notice draft request for this parcel and selected reason codes, then review the returned draft title, body, and disclaimer/i)).toBeInTheDocument();
      expect(screen.queryByText(/Draft a value change notice for parcel 12345-001/i)).not.toBeInTheDocument();

      fireEvent.change(screen.getByTestId('notice-reasons-input'), {
        target: { value: 'revaluation, new_construction' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Submit Value-Change Notice Draft Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'draft_value_change_notice',
          params: {
            county: 'benton',
            parcelId: '12345-001',
            taxYear: currentYear,
            reasonCodes: ['revaluation', 'new_construction'],
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`Notice of Value Change - ${currentYear}`, 'i'))).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned draft title, body, and disclaimer for this value-change notice request\./i)).toBeInTheDocument();
        expect(screen.getByText(/Draft for internal review only\. Not a final notice\./i)).toBeInTheDocument();
      });
    });

    it('invokes draft_appeal_response with request wording and returned-draft-summary-text disclosure', async () => {
      const mockResponse = {
        success: true,
        correlationId: 'corr-appeal-response-001',
        result: {
          toolId: 'draft_appeal_response',
          output: JSON.stringify({
            appealId: 'APL-2026-001',
            payloadRef: 'dossier://benton/appeals/APL-2026-001/drafts/latest',
            draftSummary: 'After careful review of the appeal, a partial adjustment is recommended.',
            wordCount: 450,
            position: 'partial',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed appeal-response draft request for this parcel, appeal, and selected position, then review the returned appeal ID, position, draft summary text, and word count/i)).toBeInTheDocument();
      expect(screen.queryByText(/Draft an appeal response for parcel 12345-001/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/returned appeal ID, position, draft summary, and word count/i)).not.toBeInTheDocument();

      fireEvent.change(screen.getByTestId('appeal-id-input'), {
        target: { value: 'APL-2026-001' },
      });
      fireEvent.change(screen.getByDisplayValue(/Uphold/i), {
        target: { value: 'partial' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Submit Appeal Response Draft Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'draft_appeal_response',
          params: {
            parcelId: '12345-001',
            appealId: 'APL-2026-001',
            position: 'partial',
            tone: 'formal',
            includeEvidenceRefs: true,
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Returned appeal ID: APL-2026-001/i)).toBeInTheDocument();
        expect(screen.getByText(/Returned position: partial/i)).toBeInTheDocument();
        expect(screen.getByText(/Returned draft summary text: After careful review of the appeal, a partial adjustment is recommended\./i)).toBeInTheDocument();
        expect(screen.getByText(/Returned word count: 450 words/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned appeal ID, position, draft summary text, and word count for this appeal-response request\./i)).toBeInTheDocument();
      });
    });

    it('invokes draft_notice with request wording and returned-notice disclosure', async () => {
      const currentYear = new Date().getFullYear();
      const mockResponse = {
        success: true,
        correlationId: 'corr-draft-notice-001',
        result: {
          toolId: 'draft_notice',
          output: JSON.stringify({
            noticeId: 'NTC-2026-001',
            parcelId: '12345-001',
            noticeType: 'exemption',
            payloadRef: 'dossier://benton/notices/12345-001/NTC-2026-001',
            status: 'draft',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed notice-draft request for this parcel and selected notice type, then review the returned notice ID, notice type, and status/i)).toBeInTheDocument();
      expect(screen.queryByText(/Create a notice draft for parcel 12345-001/i)).not.toBeInTheDocument();

      fireEvent.change(screen.getByTestId('notice-type-select'), {
        target: { value: 'exemption' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Submit Notice Draft Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'draft_notice',
          params: {
            county: 'benton',
            parcelId: '12345-001',
            noticeType: 'exemption',
            taxYear: currentYear,
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/^draft$/i)).toBeInTheDocument();
        expect(screen.getByText(/Notice ID:/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned notice ID, notice type, and status for this notice-draft request\./i)).toBeInTheDocument();
      });
    });

    it('invokes assemble_boe_packet with request wording and returned-packet disclosure', async () => {
      const mockResponse = {
        success: true,
        correlationId: 'corr-boe-packet-001',
        result: {
          toolId: 'assemble_boe_packet',
          output: JSON.stringify({
            caseId: 'BOE-2026-001',
            sections: ['evidence', 'comps'],
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed BOE packet request for this case and selected sections, then review the returned case ID and section list/i)).toBeInTheDocument();
      expect(screen.queryByText(/Assemble a Board of Equalization evidence packet — requires confirmation/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/returned packet summary/i)).not.toBeInTheDocument();

      fireEvent.change(screen.getByTestId('boe-case-id'), {
        target: { value: 'BOE-2026-001' },
      });

      fireEvent.click(screen.getByLabelText(/I confirm this BOE packet request is ready for submission for case/i));
      fireEvent.click(screen.getByRole('button', { name: /Submit BOE Packet Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'assemble_boe_packet',
          params: { county: 'benton', caseId: 'BOE-2026-001', include: ['evidence'] },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Returned case ID: BOE-2026-001/i)).toBeInTheDocument();
        expect(screen.getByText(/Returned sections: 2/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned case ID and section list for this BOE packet request\./i)).toBeInTheDocument();
      });
    });

    it('invokes draft_boe_appeal_response with request wording and returned-draft disclosure', async () => {
      const mockResponse = {
        success: true,
        correlationId: 'corr-boe-response-001',
        result: {
          toolId: 'draft_boe_appeal_response',
          output: JSON.stringify({
            document: {
              title: 'BOE Appeal Response - Case BOE-2026-001',
              body: 'Position: balanced review.\nSummary of Points:\n- Comparable sales support the current value.',
            },
            payloadRef: 'dossier://benton/boe/BOE-2026-001/response/latest',
            citations: ['RCW-84.40', 'WAC-458-07'],
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed BOE appeal-response draft request for this case and position, then review the returned draft title, body, and citations/i)).toBeInTheDocument();
      expect(screen.queryByText(/Draft a formal BOE appeal response with legal citations/i)).not.toBeInTheDocument();

      fireEvent.change(screen.getByTestId('boe-appeal-case-id'), {
        target: { value: 'BOE-2026-001' },
      });
      fireEvent.change(screen.getByDisplayValue(/Support Assessor/i), {
        target: { value: 'balanced' },
      });
      fireEvent.change(screen.getByTestId('boe-appeal-points'), {
        target: { value: 'Comparable sales support the current value.' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Submit BOE Response Draft Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'draft_boe_appeal_response',
          params: {
            county: 'benton',
            caseId: 'BOE-2026-001',
            position: 'balanced',
            points: ['Comparable sales support the current value.'],
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/BOE Appeal Response - Case BOE-2026-001/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned draft title, body, and citations for this BOE appeal-response request\./i)).toBeInTheDocument();
      });
    });

    it('invokes sign_off_certification_step with request wording and returned-sign-off disclosure', async () => {
      const currentYear = new Date().getFullYear();
      const mockResponse = {
        success: true,
        correlationId: 'corr-sign-off-001',
        result: {
          toolId: 'sign_off_certification_step',
          output: JSON.stringify({
            stepId: 'step-review-001',
            signedBy: 'Jordan Lee',
            signedAt: '2026-03-22T14:30:00Z',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed certification sign-off request for this step, then review the returned step ID, signer, and signed-at timestamp/i)).toBeInTheDocument();
      expect(screen.queryByText(/Sign off a certification checklist step/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/returned signer and timestamp summary/i)).not.toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/Step ID \(e\.g\. step-review-001\)/i), {
        target: { value: 'step-review-001' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Signer name/i), {
        target: { value: 'Jordan Lee' },
      });

      expect(screen.getByText(/I confirm this certification sign-off request is ready for submission for step/i)).toBeInTheDocument();
      expect(screen.queryByText(/I confirm this write_high sign-off for step/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByLabelText(/I confirm this certification sign-off request is ready for submission for step/i));
      fireEvent.click(screen.getByRole('button', { name: /Submit Certification Sign-Off Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'sign_off_certification_step',
          params: {
            county: 'benton',
            taxYear: currentYear,
            stepId: 'step-review-001',
            signedBy: 'Jordan Lee',
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Returned step ID: step-review-001/i)).toBeInTheDocument();
        expect(screen.getByText(/Returned signer: Jordan Lee \| Returned signed-at:/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned step ID, signer, and signed-at timestamp for this certification sign-off request\./i)).toBeInTheDocument();
      });
    });

    it('invokes file_appeal with request wording and returned-appeal disclosure', async () => {
      const mockResponse = {
        success: true,
        correlationId: 'corr-file-appeal-001',
        result: {
          toolId: 'file_appeal',
          output: JSON.stringify({
            appealId: 'APL-2026-042',
            parcelId: '12345-001',
            status: 'filed',
            filedAt: '2026-03-22T16:10:00Z',
            payloadRef: 'dais://benton/appeals/APL-2026-042',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed Board of Equalization appeal request for this parcel, then review the returned appeal ID, status, and filed-at timestamp/i)).toBeInTheDocument();
      expect(screen.queryByText(/File a new Board of Equalization appeal for parcel 12345-001/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/returned appeal summary/i)).not.toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/Grounds for appeal/i), {
        target: { value: 'Comparable sales indicate a lower market value.' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Submit Appeal Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'file_appeal',
          params: {
            county: 'benton',
            parcelId: '12345-001',
            grounds: 'Comparable sales indicate a lower market value.',
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Returned appeal ID: APL-2026-042/i)).toBeInTheDocument();
        expect(screen.getByText(/Returned status: filed \| Filed at:/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned appeal ID, status, and filed-at timestamp for this appeal request\./i)).toBeInTheDocument();
      });
    });

    it('invokes escalate_task with request wording and returned-escalation disclosure', async () => {
      const mockResponse = {
        success: true,
        correlationId: 'corr-escalate-task-001',
        result: {
          toolId: 'escalate_task',
          output: JSON.stringify({
            taskId: 'TASK-404',
            escalatedTo: 'supervisor',
            status: 'escalated',
            payloadRef: 'dais://benton/queue/escalations/TASK-404',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed escalation request for this task, then review the returned task ID, escalation target, and status/i)).toBeInTheDocument();
      expect(screen.queryByText(/Escalate an overdue or high-priority task/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/returned escalation target and status summary/i)).not.toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/^Task ID$/i), {
        target: { value: 'TASK-404' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Escalation reason/i), {
        target: { value: 'SLA breach requires supervisor review.' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Submit Escalation Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'escalate_task',
          params: {
            county: 'benton',
            taskId: 'TASK-404',
            reason: 'SLA breach requires supervisor review.',
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Returned task ID: TASK-404/i)).toBeInTheDocument();
        expect(screen.getByText(/Returned escalation target: supervisor \| Returned status: escalated/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned task ID, escalation target, and status for this escalation request\./i)).toBeInTheDocument();
      });
    });

    it('invokes assign_task with request wording and returned-assignment disclosure', async () => {
      const mockResponse = {
        success: true,
        correlationId: 'corr-assign-task-001',
        result: {
          toolId: 'assign_task',
          output: JSON.stringify({
            taskId: 'TSK-2026-042',
            assignedTo: 'usr-jdoe',
            status: 'assigned',
            payloadRef: 'dais://benton/tasks/TSK-2026-042/assignment',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Submit a governed task-assignment request, then review the returned task ID, assignee ID, and status/i)).toBeInTheDocument();
      expect(screen.queryByText(/Assign a workflow task to a queue or user/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/returned assignee and status summary/i)).not.toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/Task ID \(e\.g\. TSK-2026-042\)/i), {
        target: { value: 'TSK-2026-042' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Assignee ID \(e\.g\. usr-jdoe\)/i), {
        target: { value: 'usr-jdoe' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Reason \(optional\)/i), {
        target: { value: 'Rebalanced assessor queue.' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Submit Assignment Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'assign_task',
          params: {
            county: 'benton',
            taskId: 'TSK-2026-042',
            assigneeId: 'usr-jdoe',
            reason: 'Rebalanced assessor queue.',
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Returned task ID: TSK-2026-042/i)).toBeInTheDocument();
        expect(screen.getByText(/Returned status: assigned/i)).toBeInTheDocument();
        expect(screen.getByText(/Returned assignee ID:/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned task ID, assigned-to value, and status for this assignment request\./i)).toBeInTheDocument();
      });
    });

    it('invokes check_exemption_eligibility with request wording and returned-eligibility disclosure', async () => {
      const mockResponse = {
        success: true,
        correlationId: 'corr-exemption-eligibility-001',
        result: {
          toolId: 'check_exemption_eligibility',
          output: JSON.stringify({
            eligible: true,
            program: 'senior',
            reason: 'Returned parcel summary indicates the applicant qualifies.',
            incomeThreshold: 40000,
            parcelId: '12345-001',
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Request the returned exemption eligibility fields for this parcel, then review the returned eligibility flag, program, reason, and income-threshold details/i)).toBeInTheDocument();
      expect(screen.queryByText(/Check senior\/disabled exemption eligibility per RCW 84\.36\.381/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/returned exemption eligibility summary/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Request Eligibility Summary/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'check_exemption_eligibility',
          params: {
            county: 'benton',
            parcelId: '12345-001',
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Returned eligibility flag: Eligible/i)).toBeInTheDocument();
        expect(screen.getByText(/Returned reason: Returned parcel summary indicates the applicant qualifies\./i)).toBeInTheDocument();
        expect(screen.getByText(/Returned program: senior \| Returned threshold: \$40,000/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned eligibility flag, program, reason, and income threshold for this parcel request\./i)).toBeInTheDocument();
      });
    });

    it('invokes get_certification_progress with request wording and returned-progress disclosure', async () => {
      const currentYear = new Date().getFullYear();
      const mockResponse = {
        success: true,
        correlationId: 'corr-cert-progress-001',
        result: {
          toolId: 'get_certification_progress',
          output: JSON.stringify({
            county: 'benton',
            taxYear: currentYear,
            percentComplete: 72,
            steps: [
              { id: 'step-1', name: 'Review parcel updates', complete: true },
              { id: 'step-2', name: 'Finalize levy imports', complete: false },
            ],
            blockers: ['Awaiting levy certification'],
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Request the returned certification progress fields, then review the returned percent complete, checklist steps, and blockers/i)).toBeInTheDocument();
      expect(screen.queryByText(/Assessment roll certification progress with checklist and blockers/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/returned certification progress summary/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Request Certification Progress/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'get_certification_progress',
          params: {
            county: 'benton',
            taxYear: currentYear,
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Returned percent complete: 72%/i)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`Returned tax year: ${currentYear}`, 'i'))).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned percent complete, checklist steps, and blockers for this certification progress request\./i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator during check', async () => {
      mockInvokeTool.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  correlationId: 'corr-loading-dais',
                  result: { toolId: 'check_cert_status', output: '{}' },
                }),
              100
            )
          )
      );

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /submit certification status request/i }));

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Status History', () => {
    it('tracks status check history', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-dais-hist',
        result: {
          toolId: 'check_cert_status',
          output: JSON.stringify({ parcelId: '12345-001', certificationStatus: 'pending' }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /submit certification status request/i }));

      await waitFor(() => {
        expect(screen.getAllByText(/corr-dais/).length).toBeGreaterThan(0);
      });

      expect(screen.getAllByText(/History/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/check_cert_status/i).length).toBeGreaterThan(0);

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      expect(copyButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Status Display', () => {
    it('displays workflow steps when available', async () => {
      const currentYear = new Date().getFullYear();
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-steps-test',
        result: {
          toolId: 'check_cert_status',
          output: JSON.stringify({
            county: 'benton',
            taxYear: currentYear,
            status: 'pending_review',
            completedSteps: ['Intake', 'Verification'],
            remainingSteps: ['Final Approval'],
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /Submit Certification Status Request/i }));

      await waitFor(() => {
        expect(screen.getAllByText(/Intake/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Verification/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Final Approval/i).length).toBeGreaterThan(0);
      });
    });

    it('does not render unsupported assignment fields for certification status results', async () => {
      const currentYear = new Date().getFullYear();
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-assign-test',
        result: {
          toolId: 'check_cert_status',
          output: JSON.stringify({
            county: 'benton',
            taxYear: currentYear,
            status: 'complete',
            completedSteps: ['Intake', 'Verification', 'Certification'],
            remainingSteps: [],
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByRole('button', { name: /Submit Certification Status Request/i }));

      await waitFor(() => {
        expect(screen.getByText('complete')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Assigned To/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Due Date/i)).not.toBeInTheDocument();
    });
  });
});
