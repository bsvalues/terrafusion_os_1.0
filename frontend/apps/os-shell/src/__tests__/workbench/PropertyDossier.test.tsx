/**
 * PropertyDossier.test.tsx
 *
 * Phase 5.2: Property Dossier Tab - Document Management MWUX Slice
 * Tests: list docs → view → summarize via tool → correlationId UX
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import * as pilotApi from '../../api/pilotApi';
import * as dossierServiceModule from '../../services/dossierService';
import PropertyDossier from '../../pages/workbench/tabs/PropertyDossier';

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (state: {
    documents: Array<{
      documentId: string;
      documentType: string;
      title: string;
      uploadedAt: string;
      mimeType: string;
    }>;
  }) => unknown) => selector({
    documents: [
      {
        documentId: 'DOC-STORE-001',
        documentType: 'deed',
        title: 'Loaded Warranty Deed',
        uploadedAt: '2026-03-04T18:30:00.000Z',
        mimeType: 'application/pdf',
      },
      {
        documentId: 'DOC-STORE-002',
        documentType: 'photo',
        title: 'Loaded Exterior Photo',
        uploadedAt: '2026-03-03T18:30:00.000Z',
        mimeType: 'image/jpeg',
      },
    ],
  }),
}));

// Mock the pilotApi module
vi.mock('../../api/pilotApi');
vi.mock('../../services/dossierService', () => ({
  dossierService: {
    getDetails: vi.fn(),
    getEvidenceSnapshot: vi.fn(),
    searchDocuments: vi.fn(),
    searchEvidence: vi.fn(),
    getChainOfCustody: vi.fn(),
    getStats: vi.fn(),
  },
}));

const mockGetDetails =
  dossierServiceModule.dossierService.getDetails as vi.MockedFunction<
    typeof dossierServiceModule.dossierService.getDetails
  >;

const mockGetEvidenceSnapshot =
  dossierServiceModule.dossierService.getEvidenceSnapshot as vi.MockedFunction<
    typeof dossierServiceModule.dossierService.getEvidenceSnapshot
  >;

const mockSearchDocuments =
  dossierServiceModule.dossierService.searchDocuments as vi.MockedFunction<
    typeof dossierServiceModule.dossierService.searchDocuments
  >;

const mockSearchEvidence =
  dossierServiceModule.dossierService.searchEvidence as vi.MockedFunction<
    typeof dossierServiceModule.dossierService.searchEvidence
  >;

const mockGetChainOfCustody =
  dossierServiceModule.dossierService.getChainOfCustody as vi.MockedFunction<
    typeof dossierServiceModule.dossierService.getChainOfCustody
  >;

const mockGetStats =
  dossierServiceModule.dossierService.getStats as vi.MockedFunction<
    typeof dossierServiceModule.dossierService.getStats
  >;

const mockInvokeTool = pilotApi.invokeTool as ReturnType<typeof vi.fn>;

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

    mockGetDetails.mockResolvedValue({
      data: {
        parcelId: '12345-001',
        countyId: 'benton-001',
        generatedAt: '2026-03-07T18:30:00.000Z',
        piiRedacted: true,
        correlationId: 'corr-dossier-001',
        links: {
          self: '/api/dossier/parcels/12345-001/details',
          summary: '/api/dossier/parcels/12345-001/summary',
          details: '/api/dossier/parcels/12345-001/details',
          notes: '/api/dossier/parcels/12345-001/notes',
          casefile: '/api/dossier/parcels/12345-001/casefile',
        },
        property: {
          propertyId: 'prop-12345-001',
          parcelNumber: '12345-001',
          address: '456 Oak Ave, Kennewick, WA',
          propertyType: 'Residential',
          yearBuilt: 2004,
          assessedValue: 250000,
          landValue: 80000,
          improvementValue: 170000,
          marketValue: 265000,
          taxYear: 2024,
          assessmentDate: '2024-01-02',
          classCode: null,
          useCode: null,
          neighborhood: null,
        },
        valuation: {
          totalValue: 250000,
          categoryCount: 2,
          categories: [
            { name: 'Land', amount: 80000, percentage: 32 },
            { name: 'Improvements', amount: 170000, percentage: 68 },
          ],
        },
        levies: {
          levyCountTotal: 2,
          levyCountReturned: 2,
          recent: [
            {
              taxLevyId: 'levy-001',
              taxingDistrict: 'Benton County',
              taxRate: 0.0123,
              levyAmount: 3075,
              taxYear: 2024,
              purpose: 'General Fund',
              effectiveDate: '2024-01-01',
            },
          ],
        },
        notes: {
          noteCountTotal: 1,
          noteCountReturned: 1,
          items: [
            {
              noteId: 'note-001',
              noteType: 'inspection',
              createdAt: '2026-03-06T18:30:00.000Z',
              authorKind: 'staff',
            },
          ],
        },
      },
      correlationId: 'corr-dossier-001',
    });

    mockSearchDocuments.mockResolvedValue({
      results: [
        {
          id: 'doc-001',
          name: 'Casefile summary - 12345-001',
          type: 'report',
          parcelId: '12345-001',
          uploadedBy: 'County Assessor',
          uploadedAt: '2026-03-06T18:30:00.000Z',
          size: '42 KB',
          status: 'active',
          custodyChain: 3,
          mimeType: 'application/pdf',
          hash: 'sha256-doc-001',
        },
      ],
      total: 1,
      hasMore: false,
    });

    mockSearchEvidence.mockResolvedValue({
      results: [
        {
          id: 'evid-001',
          title: 'Parcel evidence snapshot - 12345-001',
          parcelId: '12345-001',
          evidenceType: 'field-inspection',
          createdBy: 'Field Appraiser',
          createdAt: '2026-03-05T11:00:00.000Z',
          integrity: 'verified',
          chainLength: 4,
          lastAction: 'hash-verified',
        },
      ],
      total: 1,
      hasMore: false,
    });

    mockGetStats.mockResolvedValue({
      totalDocuments: 8,
      activeDocuments: 8,
      sealedRecords: 0,
      archivedDocuments: 0,
      documentTypes: 2,
      totalEvidence: 5,
      verifiedEvidence: 4,
      pendingEvidence: 1,
      disputedEvidence: 0,
    });

    mockGetChainOfCustody.mockResolvedValue([
      {
        timestamp: '2026-03-05T11:00:00.000Z',
        actor: 'Field Appraiser',
        action: 'Collected evidence',
        hash: 'sha256-chain-001',
      },
      {
        timestamp: '2026-03-05T12:15:00.000Z',
        actor: 'Evidence Clerk',
        action: 'Verified evidence hash',
        hash: 'sha256-chain-002',
      },
    ]);
  });

  describe('Rendering', () => {
    it('renders with parcel context', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByTestId('property-dossier-tab')).toBeInTheDocument();
      expect(screen.getByText(/TerraDossier/i)).toBeInTheDocument();
      expect(screen.getAllByText(/12345-001/).length).toBeGreaterThan(0);
    });

    it('uses loaded-documents wording for the store-backed document count', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Loaded Documents/i)).toBeInTheDocument();
      expect(screen.getByText(/Shown from the document entries currently loaded for this parcel\./i)).toBeInTheDocument();
      expect(screen.getByText('Loaded Warranty Deed')).toBeInTheDocument();
      expect(screen.queryByText(/^Documents on File$/i)).not.toBeInTheDocument();
    });

    it('shows the limited read-only registry view without live wording', async () => {
      render(<TestWrapper parcelId='12345-001' />);

      await screen.findByText('Casefile summary - 12345-001');
      expect(screen.getByText(/Read-only registry view/i)).toBeInTheDocument();
      expect(
        screen.getByText(/This route shows up to 5 parcel documents and 5 evidence records per refresh\./i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Visible parcel documents/i)).toBeInTheDocument();
      expect(screen.getByText(/Visible parcel evidence/i)).toBeInTheDocument();
      expect(screen.getByText('Casefile summary - 12345-001')).toBeInTheDocument();
      expect(screen.getByText('Parcel evidence snapshot - 12345-001')).toBeInTheDocument();
      expect(screen.queryByText(/Read-only live registry/i)).not.toBeInTheDocument();
    });

    it('loads and shows the evidence chain-of-custody on demand', async () => {
      render(<TestWrapper parcelId='12345-001' />);

      await screen.findByText('Parcel evidence snapshot - 12345-001');
      fireEvent.click(screen.getByTestId('evidence-chain-trigger-evid-001'));

      await waitFor(() => {
        expect(mockGetChainOfCustody).toHaveBeenCalledWith('evid-001');
      });

      await screen.findByText('Collected evidence');
      expect(screen.getByTestId('evidence-chain-panel')).toBeInTheDocument();
      expect(screen.getByText('Collected evidence')).toBeInTheDocument();
      expect(screen.getByText('Verified evidence hash')).toBeInTheDocument();
    });

    it('uses returned-synthesis wording for the evidence synthesis card', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-synth-001',
        result: {
          toolId: 'synthesize_evidence',
          output: JSON.stringify({
            parcelId: '12345-001',
            totalItems: 5,
            synthesisNarrative: 'Returned evidence categories are available for review.',
            categories: [
              {
                category: 'Documents',
                count: 2,
                items: ['Casefile summary', 'Inspection packet'],
              },
            ],
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Request returned evidence totals and categories for this parcel/i)).toBeInTheDocument();
      expect(screen.queryByText(/Aggregate and categorize all evidence items for this parcel/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Synthesize Evidence/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'synthesize_evidence',
          params: expect.objectContaining({ county: 'benton', parcelId: '12345-001' }),
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/5 total evidence items/i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the totals and categories returned by this synthesis request\./i)).toBeInTheDocument();
      });
    });

    it('uses returned-summary wording for the casefile summary card', async () => {
      mockInvokeTool.mockResolvedValue({
        success: true,
        correlationId: 'corr-casefile-001',
        result: {
          toolId: 'summarize_parcel_casefile',
          output: JSON.stringify({
            parcelId: '12345-001',
            summary: 'Returned casefile summary is available for the requested sections.',
            highlights: ['1 appeal returned', '2 permit entries returned'],
          }),
        },
      });

      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByText(/Request returned a casefile summary for notices, appeals, permits, and sales on 12345-001/i)).toBeInTheDocument();
      expect(screen.queryByText(/Comprehensive casefile overview for 12345-001/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Summarize Casefile/i }));

      await waitFor(() => {
        expect(mockInvokeTool).toHaveBeenCalledWith({
          toolId: 'summarize_parcel_casefile',
          params: {
            county: 'benton',
            parcelId: '12345-001',
            include: ['notices', 'appeals', 'permits', 'sales'],
          },
          parcelId: '12345-001',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Returned casefile summary is available for the requested sections\./i)).toBeInTheDocument();
        expect(screen.getByText(/Shows the summary and highlights returned for the requested casefile sections\./i)).toBeInTheDocument();
      });
    });
  });

  describe('CX-26: Evidence Snapshot', () => {
    const SNAPSHOT_RESULT: dossierServiceModule.EvidenceSnapshotResult = {
      snapshot: {
        parcelId: 'P-12345',
        countyId: 'benton-001',
        snapshotTimestamp: '2026-02-20T10:30:00.000Z',
        correlationId: 'corr-evidence-snap-001',
        contentHash: 'sha256-test-hash',
        property: {
          propertyId: 'prop-001',
          parcelNumber: '12345-001',
          address: '456 Oak Ave, Kennewick, WA',
          propertyType: 'Residential',
          assessedValue: 250000,
          landValue: 80000,
          improvementValue: 170000,
          marketValue: 265000,
          taxYear: 2024,
          assessmentDate: '2024-01-02',
        },
        valuation: { totalValue: 250000, categoryCount: 3 },
        levies: { totalCount: 5, includedCount: 4, totalLevyAmount: 3200 },
        notes: { totalCount: 2, includedCount: 2, noteTypes: ['inspection'] },
        links: {
          self: '/api/dossier/parcels/12345-001/evidence',
          summary: '/api/dossier/parcels/12345-001/summary',
          details: '/api/dossier/parcels/12345-001/details',
          notes: '/api/dossier/parcels/12345-001/notes',
          casefile: '/api/dossier/parcels/12345-001/casefile',
        },
      },
      headerCorrelationId: 'header-corr-snap-001',
    };

    it('shows Load Evidence Snapshot button initially', () => {
      render(<TestWrapper parcelId='12345-001' />);
      expect(screen.getByTestId('evidence-fetch-btn')).toBeInTheDocument();
      expect(screen.getByText(/Load Evidence Snapshot/i)).toBeInTheDocument();
    });

    it('loads and displays evidence snapshot on click', async () => {
      mockGetEvidenceSnapshot.mockResolvedValue(SNAPSHOT_RESULT);

      render(<TestWrapper parcelId='12345-001' />);

      fireEvent.click(screen.getByTestId('evidence-fetch-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('evidence-snapshot-panel')).toBeInTheDocument();
      });

      // Verify key data rendered
      expect(screen.getAllByText('456 Oak Ave, Kennewick, WA').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('corr-evidence-snap-001')).toBeInTheDocument();
    });

    it('shows snapshot hash warning text', async () => {
      mockGetEvidenceSnapshot.mockResolvedValue(SNAPSHOT_RESULT);

      render(<TestWrapper parcelId='12345-001' />);
      fireEvent.click(screen.getByTestId('evidence-fetch-btn'));

      await waitFor(() => {
        expect(screen.getByText(/Snapshot hash — includes timestamp/i)).toBeInTheDocument();
        expect(screen.getByText(/Not a content-only digest/i)).toBeInTheDocument();
      });
    });

    it('shows Refresh Snapshot button after load', async () => {
      mockGetEvidenceSnapshot.mockResolvedValue(SNAPSHOT_RESULT);

      render(<TestWrapper parcelId='12345-001' />);
      fireEvent.click(screen.getByTestId('evidence-fetch-btn'));

      await waitFor(() => {
        expect(screen.getByText(/Refresh Snapshot/i)).toBeInTheDocument();
      });
    });

    it('shows error state with retry button on failure', async () => {
      mockGetEvidenceSnapshot.mockRejectedValue(
        new Error('Dossier API error: 404 Not Found'),
      );

      render(<TestWrapper parcelId='12345-001' />);
      fireEvent.click(screen.getByTestId('evidence-fetch-btn'));

      await waitFor(() => {
        expect(screen.getByText(/404 Not Found/i)).toBeInTheDocument();
        // Multiple Retry buttons may render (dossierDetails + evidence);
        // verify at least one exists for the evidence error path.
        expect(screen.getAllByText(/Retry/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
