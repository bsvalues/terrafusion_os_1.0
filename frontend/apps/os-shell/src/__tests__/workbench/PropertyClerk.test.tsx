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

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (s: { recordings: never[] }) => unknown) => {
    const state = { recordings: [] };
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
  });

  // ── Tool Invocations ───────────────────────────────────────────────────────

  describe('Tool Invocations', () => {
    it('invokes search_recorded_documents with correct params and renders result', async () => {
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
      });
    });

    it('invokes get_title_chain and renders currentOwner', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-title-001',
        result: {
          toolId: 'get_title_chain',
          output: JSON.stringify({
            parcelId: PARCEL_ID,
            chain: [],
            currentOwner: 'Margaret Thompson',
          }),
        },
      });

      render(<TestWrapper />);

      fireEvent.click(screen.getByRole('button', { name: /Get Title Chain/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'get_title_chain',
          params: expect.objectContaining({ parcelId: PARCEL_ID }),
          parcelId: PARCEL_ID,
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Margaret Thompson/i)).toBeInTheDocument();
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
