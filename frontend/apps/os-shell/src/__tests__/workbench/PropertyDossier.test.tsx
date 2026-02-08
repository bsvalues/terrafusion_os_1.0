/**
 * PropertyDossier.test.tsx
 *
 * Phase 5.2: Property Dossier Tab - Document Management MWUX Slice
 * Tests: list docs → view → summarize via tool → correlationId UX
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { vi, type Mock } from 'vitest';
import * as pilotApi from '../../api/pilotApi';
import PropertyDossier from '../../pages/workbench/tabs/PropertyDossier';

// Mock the pilotApi module
vi.mock('../../api/pilotApi');

const mockInvokeTool = pilotApi.invokeTool as Mock<typeof pilotApi.invokeTool>;

// Test wrapper providing parcel context via outlet
const TestWrapper: React.FC<{ parcelId: string }> = ({ parcelId }) => {
  return (
    <MemoryRouter initialEntries={[`/property/${parcelId}/dossier`]}>
      <Routes>
        <Route
          path='/property/:parcelId'
          element={
            <div>
              <Outlet context={{ parcelId }} />
            </div>
          }
        >
          <Route path='dossier' element={<PropertyDossier />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('PropertyDossier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with parcel context', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByTestId('property-dossier-tab')).toBeInTheDocument();
      expect(screen.getByText(/TerraDossier/i)).toBeInTheDocument();
      expect(screen.getByText(/12345-001/)).toBeInTheDocument();
    });

    it('displays document categories', () => {
      render(<TestWrapper parcelId='12345-001' />);

      // Should show document type categories
      expect(screen.getByText(/Deeds & Titles/i)).toBeInTheDocument();
      expect(screen.getByText(/Permits/i)).toBeInTheDocument();
      expect(screen.getByText(/Correspondence/i)).toBeInTheDocument();
    });

    it('displays mock document list', () => {
      render(<TestWrapper parcelId='12345-001' />);

      // Should show sample documents (mock data)
      expect(screen.getByText(/Warranty Deed/i)).toBeInTheDocument();
      expect(screen.getByText(/Building Permit/i)).toBeInTheDocument();
    });
  });

  describe('Document Selection', () => {
    it('shows document details when selected', async () => {
      render(<TestWrapper parcelId='12345-001' />);

      const deedDoc = screen.getByText(/Warranty Deed/i);
      fireEvent.click(deedDoc);

      await waitFor(() => {
        expect(screen.getByTestId('document-detail')).toBeInTheDocument();
      });
    });

    it('enables summarize button when document is selected', async () => {
      render(<TestWrapper parcelId='12345-001' />);

      // Initially, summarize button should not be visible or disabled
      const summarizeBtn = screen.queryByRole('button', { name: /summarize/i });
      expect(summarizeBtn).toBeNull();

      // Select a document
      const deedDoc = screen.getByText(/Warranty Deed/i);
      fireEvent.click(deedDoc);

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /summarize/i });
        expect(btn).toBeInTheDocument();
        expect(btn).not.toBeDisabled();
      });
    });
  });

  describe('Summarize Tool Invocation', () => {
    it('invokes summarize_dossier tool successfully', async () => {
      const mockResponse = {
        success: true,
        correlationId: 'corr-dossier-abc123',
        result: {
          toolId: 'summarize_dossier',
          output: JSON.stringify({
            summary: 'This 3-bedroom residential property at 123 Main St was purchased in 2019...',
            keyFacts: ['Purchased: 2019', 'Type: Residential', 'Lot Size: 0.25 acres'],
          }),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      render(<TestWrapper parcelId='12345-001' />);

      // Select document
      fireEvent.click(screen.getByText(/Warranty Deed/i));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /summarize/i })).toBeInTheDocument();
      });

      // Click summarize
      fireEvent.click(screen.getByRole('button', { name: /summarize/i }));

      // Verify tool invoked with correct params
      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'summarize_dossier',
          params: expect.objectContaining({
            dossierId: expect.any(String),
          }),
          parcelId: '12345-001',
        });
      });

      // Verify success display
      await waitFor(() => {
        expect(screen.getByText(/3-bedroom residential property/i)).toBeInTheDocument();
        expect(screen.getAllByText(/corr-dossier-abc123/).length).toBeGreaterThan(0);
      });
    });

    it('surfaces tool error with correlationId', async () => {
      const mockError = {
        success: false,
        correlationId: 'corr-dossier-error-789',
        error: {
          code: 'DOSSIER_NOT_FOUND',
          message: 'No dossier found for parcel 12345-001',
          severity: 'error' as const,
        },
      };

      mockInvokeTool.mockResolvedValue(mockError);

      render(<TestWrapper parcelId='12345-001' />);

      // Select document and summarize
      fireEvent.click(screen.getByText(/Warranty Deed/i));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /summarize/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /summarize/i }));

      // Verify error display with correlationId
      await waitFor(() => {
        expect(screen.getByText(/No dossier found/i)).toBeInTheDocument();
        expect(screen.getAllByText(/corr-dossier-error-789/).length).toBeGreaterThan(0);
      });
    });

    it('handles network errors gracefully', async () => {
      mockInvokeTool.mockRejectedValue(new TypeError('Failed to fetch'));

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByText(/Warranty Deed/i));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /summarize/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /summarize/i }));

      // Should show error with client-generated correlationId
      await waitFor(() => {
        expect(screen.getByText(/network error|failed to fetch/i)).toBeInTheDocument();
        // Should have a net-* correlationId
        const correlationTexts = screen.getAllByText(/net-/);
        expect(correlationTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator during summarize', async () => {
      // Create a delayed response
      mockInvokeTool.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  correlationId: 'corr-loading-test',
                  result: { toolId: 'summarize_dossier', output: '{}' },
                }),
              100
            )
          )
      );

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByText(/Warranty Deed/i));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /summarize/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /summarize/i }));

      // Should show loading state
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Invocation History', () => {
    it('tracks summarization history', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-history-test-full-id',
        result: { toolId: 'summarize_dossier', output: '{"summary":"Test 1"}' },
      });

      render(<TestWrapper parcelId='12345-001' />);

      // First summarization
      fireEvent.click(screen.getByText(/Warranty Deed/i));
      await waitFor(() => screen.getByRole('button', { name: /summarize/i }));
      fireEvent.click(screen.getByRole('button', { name: /summarize/i }));

      // Wait for success - correlationId may appear multiple times (banner + history)
      await waitFor(() => {
        expect(screen.getAllByText(/corr-history-test/).length).toBeGreaterThan(0);
      });

      // Verify history section exists with entry
      expect(screen.getByText(/Summarization History/i)).toBeInTheDocument();
      expect(screen.getByText(/summarize_dossier/i)).toBeInTheDocument();

      // Verify there's a copy button in history (truncated correlationId present)
      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      expect(copyButtons.length).toBeGreaterThanOrEqual(1);
    });
  });
});
