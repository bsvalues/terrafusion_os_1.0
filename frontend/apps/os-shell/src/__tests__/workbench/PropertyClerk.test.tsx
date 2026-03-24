/**
 * PropertyClerk.test.tsx
 *
 * Phase 5: Property Clerk Tab — TerraClerk MWUX Slice
 * Tests: 6 tool invocations — search, title chain, fees, record, release, summary
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import * as pilotApi from '../../api/pilotApi';
import PropertyClerk from '../../pages/workbench/tabs/PropertyClerk';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../api/pilotApi');

let clerkRecordings: Array<{
  recordingId: string;
  documentType: string;
  grantor?: string;
  grantee?: string;
  recordingDate: string;
}> = [];

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (s: { recordings: typeof clerkRecordings }) => unknown) => {
    const state = { recordings: clerkRecordings };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

vi.mock('../../runtime/env', () => ({
  getEnv: () => ({ VITE_API_URL: 'http://localhost:5000' }),
}));

// Capture the records passed to InvocationHistory for history tests
let capturedRecords: unknown[] = [];

vi.mock('../../components/workbench', () => ({
  ParcelContextHeader: ({
    title,
    parcelId,
    subtitle,
  }: {
    title: string;
    parcelId: string;
    subtitle?: string;
    icon?: string;
  }) => (
    <div>
      <h1>{title}</h1>
      <span>{parcelId}</span>
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
  InvocationHistory: ({ records }: { records: unknown[] }) => {
    capturedRecords = records;
    return (
      <div data-testid='invocation-history'>
        <h2>Invocation History</h2>
        {(records as Array<{ toolId: string; correlationId: string }>).map((r, i) => (
          <div key={i} data-testid='history-entry'>
            <span>{r.toolId}</span>
            <span>{r.correlationId}</span>
          </div>
        ))}
      </div>
    );
  },
  WorkbenchSourceBadge: ({ source }: any) => (
    <span data-testid='workbench-source-badge' data-source={source} />
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockInvokeTool = pilotApi.invokeTool as ReturnType<typeof vi.fn>;

const PARCEL_ID = 'BC-2026-001';

const TestWrapper: React.FC<{ parcelId?: string }> = ({ parcelId = PARCEL_ID }) => {
  return (
    <MemoryRouter initialEntries={[`/property/${parcelId}/clerk`]}>
      <Routes>
        <Route
          path='/property/:parcelId'
          element={
            <div>
              <Outlet context={{ parcelId, propertyData: {}, workMode: 'overview' }} />
            </div>
          }
        >
          <Route path='clerk' element={<PropertyClerk />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PropertyClerk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedRecords = [];
    clerkRecordings = [];
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders TerraClerk header with parcel ID', () => {
      render(<TestWrapper />);
      expect(screen.getByText(/TerraClerk/i)).toBeInTheDocument();
      expect(screen.getAllByText(new RegExp(PARCEL_ID)).length).toBeGreaterThan(0);
    });

    it('renders all 6 tool card titles', () => {
      render(<TestWrapper />);
      expect(screen.getAllByText(/Search Recorded Documents/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Title Chain/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Recording Fees/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Record Document/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Release Lien/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Recording Summary/i).length).toBeGreaterThan(0);
    });

    it('renders read_only and write badge labels', () => {
      render(<TestWrapper />);
      const readOnlyBadges = screen.getAllByText(/read_only/i);
      expect(readOnlyBadges.length).toBeGreaterThanOrEqual(4);
      expect(screen.getByText(/write_high/i)).toBeInTheDocument();
      expect(screen.getByText(/write_low/i)).toBeInTheDocument();
    });

    it('describes the recording action as a submission request until the tool confirms it', () => {
      render(<TestWrapper />);

      expect(
        screen.getByText(/Submit a governed recording request for county processing\. Official record status appears only after the tool returns a recording number and timestamp\./i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /I confirm this recording request is ready for submission/i })
      ).toBeInTheDocument();
      expect(screen.queryByText(/official county record/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/I confirm this official recording/i)).not.toBeInTheDocument();
    });

    it('renders loaded recording history wording when store recordings are present', () => {
      clerkRecordings = [
        {
          recordingId: 'REC-1',
          documentType: 'Warranty Deed',
          grantor: 'Alex Smith',
          grantee: 'Taylor Jones',
          recordingDate: '2024-01-15T00:00:00Z',
        },
      ];

      render(<TestWrapper />);

      expect(screen.getByText(/Loaded Recording History \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Shown from the recording history currently loaded for this parcel\./i)).toBeInTheDocument();
      expect(screen.queryByText(/Recent Recordings/i)).not.toBeInTheDocument();
    });

    it('describes the recording summary as returned totals plus preview entries', () => {
      render(<TestWrapper />);

      expect(screen.getByText(/Returned recording totals and preview entries for parcel BC-2026-001/i)).toBeInTheDocument();
      expect(screen.queryByText(/Summary of all recordings for parcel BC-2026-001/i)).not.toBeInTheDocument();
    });
  });

  // ── Tool Invocations ───────────────────────────────────────────────────────

  describe('Tool Invocations', () => {
    it('invokes search_recorded_documents with returned-query wording and preview disclosure', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-search-001',
        result: {
          toolId: 'search_recorded_documents',
          output: JSON.stringify({
            documents: [
              {
                documentId: 'DOC-1',
                type: 'Deed',
                recordedAt: '2024-01-15T00:00:00Z',
                grantor: 'Smith',
                grantee: 'Jones',
              },
            ],
            totalCount: 1,
          }),
        },
      });

      render(<TestWrapper />);

      expect(screen.getByText(/Search returned recorded-document preview entries for this parcel using the entered query/i)).toBeInTheDocument();
      expect(screen.queryByText(/Search recorded instruments by keyword, grantor, or type/i)).not.toBeInTheDocument();

      const input = screen.getByPlaceholderText(/Search query/i);
      fireEvent.change(input, { target: { value: 'deed' } });

      fireEvent.click(screen.getByRole('button', { name: /Search Documents/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'search_recorded_documents',
          params: expect.objectContaining({ parcelId: PARCEL_ID, query: 'deed' }),
          parcelId: PARCEL_ID,
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/1 document\(s\) found/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the returned document count and preview entries for this parcel query\./i)).toBeInTheDocument();
      });
    });

    it('invokes get_title_chain and renders returned title-chain preview wording', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-title-001',
        result: {
          toolId: 'get_title_chain',
          output: JSON.stringify({
            parcelId: PARCEL_ID,
            chain: [
              { documentId: 'DOC-001', type: 'Deed', grantor: 'Owner A', grantee: 'Owner B', date: '2020-01-01T00:00:00Z' },
              { documentId: 'DOC-002', type: 'Deed', grantor: 'Owner B', grantee: 'Owner C', date: '2021-01-01T00:00:00Z' },
              { documentId: 'DOC-003', type: 'Deed', grantor: 'Owner C', grantee: 'Owner D', date: '2022-01-01T00:00:00Z' },
              { documentId: 'DOC-004', type: 'Deed', grantor: 'Owner D', grantee: 'Owner E', date: '2023-01-01T00:00:00Z' },
              { documentId: 'DOC-005', type: 'Deed', grantor: 'Owner E', grantee: 'Owner F', date: '2024-01-01T00:00:00Z' },
              { documentId: 'DOC-006', type: 'Deed', grantor: 'Owner F', grantee: 'Owner G', date: '2025-01-01T00:00:00Z' },
            ],
            currentOwner: 'Margaret Thompson',
          }),
        },
      });

      render(<TestWrapper />);

      expect(screen.getByText(/Returned title-chain owner and preview entries for parcel/i)).toBeInTheDocument();
      expect(screen.queryByText(/Ownership chain of title for parcel/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Get Title Chain/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'get_title_chain',
          params: expect.objectContaining({ parcelId: PARCEL_ID }),
          parcelId: PARCEL_ID,
        });
      });

      await waitFor(() => {
        const ownerLine = screen.getByText(/Returned Title-Chain Owner:/i);
        const previewPanel = ownerLine.closest('div');

        expect(ownerLine).toBeInTheDocument();
        expect(previewPanel).not.toBeNull();
        expect(previewPanel).toHaveTextContent(/Returned Title-Chain Owner: Margaret Thompson/i);
        expect(previewPanel).toHaveTextContent(/Owner shown from the returned title chain\. This preview shows up to five returned chain entries\./i);
        expect(screen.queryByText(/Current Owner:/i)).not.toBeInTheDocument();
        expect(previewPanel).toHaveTextContent(/Owner A/i);
        expect(previewPanel).toHaveTextContent(/Owner F/i);
        expect(previewPanel).not.toHaveTextContent(/Owner F → Owner G/i);
      });
    });

    it('invokes explain_recording_fees and renders fee total', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-fees-001',
        result: {
          toolId: 'explain_recording_fees',
          output: JSON.stringify({
            feeSchedule: [
              { feeType: 'Base Fee', amount: 25.0, description: 'Standard recording fee' },
            ],
            totalEstimate: 25.0,
            effectiveDate: '2026-01-01T00:00:00Z',
          }),
        },
      });

      render(<TestWrapper />);

      fireEvent.click(screen.getByRole('button', { name: /Explain Fees/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'explain_recording_fees',
          params: expect.objectContaining({ parcelId: PARCEL_ID }),
          parcelId: PARCEL_ID,
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Total Estimate: \$25\.00/i)).toBeInTheDocument();
      });
    });

    it('invokes record_document with submission wording and renders confirmation', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-record-001',
        result: {
          toolId: 'record_document',
          output: JSON.stringify({
            documentId: 'DOC-2026-001',
            recordingNumber: 'REC-2026-0099',
            recordedAt: '2026-03-21T15:30:00Z',
            status: 'recorded',
          }),
        },
      });

      render(<TestWrapper />);

      fireEvent.change(screen.getByDisplayValue('Select document type'), { target: { value: 'deed' } });
      fireEvent.change(screen.getByPlaceholderText(/Grantor name/i), { target: { value: 'Smith Family Trust' } });
      fireEvent.change(screen.getByPlaceholderText(/Grantee name/i), { target: { value: 'Jones Holdings LLC' } });
      fireEvent.click(screen.getByRole('checkbox', { name: /I confirm this recording request is ready for submission/i }));

      fireEvent.click(screen.getByRole('button', { name: /Submit Recording Request/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'record_document',
          params: expect.objectContaining({
            parcelId: PARCEL_ID,
            documentType: 'deed',
            grantor: 'Smith Family Trust',
            grantee: 'Jones Holdings LLC',
            confirmed: true,
            reason: 'Recording request submission',
          }),
          parcelId: PARCEL_ID,
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Recording confirmed: REC-2026-0099/i)).toBeInTheDocument();
      });
    });

    it('invokes summarize_parcel_recordings and renders counts', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-summary-001',
        result: {
          toolId: 'summarize_parcel_recordings',
          output: JSON.stringify({
            parcelId: PARCEL_ID,
            totalRecordings: 12,
            recentRecordings: [
              { type: 'Deed', date: '2024-06-01T00:00:00Z', parties: 'Smith → Jones' },
            ],
            encumbrances: 2,
          }),
        },
      });

      render(<TestWrapper />);

      fireEvent.click(screen.getByRole('button', { name: /Get Recording Summary/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'summarize_parcel_recordings',
          params: expect.objectContaining({ parcelId: PARCEL_ID }),
          parcelId: PARCEL_ID,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText(/Previewing up to 3 recordings returned in this summary\./i)).toBeInTheDocument();
        expect(screen.queryByText(/Summary of all recordings for parcel/i)).not.toBeInTheDocument();
      });
    });
  });

  // ── Error / Loading ────────────────────────────────────────────────────────

  describe('Error and Loading States', () => {
    it('surfaces tool error for search_recorded_documents', async () => {
      mockInvokeTool.mockResolvedValue({
        success: false,
        correlationId: 'corr-search-err-001',
        error: {
          code: 'SEARCH_FAILED',
          message: 'Document index unavailable',
          severity: 'error',
        },
      });

      render(<TestWrapper />);

      const input = screen.getByPlaceholderText(/Search query/i);
      fireEvent.change(input, { target: { value: 'deed' } });
      fireEvent.click(screen.getByRole('button', { name: /Search Documents/i }));

      await waitFor(() => {
        expect(screen.getByText(/Document index unavailable/i)).toBeInTheDocument();
      });
    });

    it('handles network error gracefully for get_title_chain', async () => {
      mockInvokeTool.mockRejectedValue(new TypeError('Failed to fetch'));

      render(<TestWrapper />);

      fireEvent.click(screen.getByRole('button', { name: /Get Title Chain/i }));

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
      });
    });

    it('shows loading state for get_title_chain', async () => {
      mockInvokeTool.mockImplementation(
        () => new Promise(() => { /* never resolves */ })
      );

      render(<TestWrapper />);

      fireEvent.click(screen.getByRole('button', { name: /Get Title Chain/i }));

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  // ── History ────────────────────────────────────────────────────────────────

  describe('InvocationHistory', () => {
    it('tracks tool invocations after a successful call', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-hist-001',
        result: {
          toolId: 'summarize_parcel_recordings',
          output: JSON.stringify({
            parcelId: PARCEL_ID,
            totalRecordings: 5,
            recentRecordings: [],
            encumbrances: 0,
          }),
        },
      });

      render(<TestWrapper />);

      fireEvent.click(screen.getByRole('button', { name: /Get Recording Summary/i }));

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });

      // History section rendered via mock
      expect(screen.getByTestId('invocation-history')).toBeInTheDocument();
      expect(screen.getAllByText(/History/i).length).toBeGreaterThan(0);

      // The tool name should appear in history entries
      await waitFor(() => {
        expect(
          screen.getAllByText(/summarize_parcel_recordings/i).length
        ).toBeGreaterThan(0);
      });
    });
  });
});
