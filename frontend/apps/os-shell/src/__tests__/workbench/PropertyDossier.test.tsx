/**
 * PropertyDossier.test.tsx
 *
 * Phase 5.2: Property Dossier Tab - Document Management MWUX Slice
 * Tests: list docs → view → summarize via tool → correlationId UX
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import * as dossierServiceModule from '../../services/dossierService';
import PropertyDossier from '../../pages/workbench/tabs/PropertyDossier';

// Mock the pilotApi module
jest.mock('../../api/pilotApi');
jest.mock('../../services/dossierService');

const mockGetEvidenceSnapshot =
  dossierServiceModule.dossierService.getEvidenceSnapshot as jest.MockedFunction<
    typeof dossierServiceModule.dossierService.getEvidenceSnapshot
  >;

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
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with parcel context', () => {
      render(<TestWrapper parcelId='12345-001' />);

      expect(screen.getByTestId('property-dossier-tab')).toBeInTheDocument();
      expect(screen.getByText(/TerraDossier/i)).toBeInTheDocument();
      expect(screen.getByText(/12345-001/)).toBeInTheDocument();
    });

    it('shows document management deferred to R2', () => {
      render(<TestWrapper parcelId='12345-001' />);

      // Document management is disabled pending R2 backend
      expect(screen.getAllByText(/Document Management/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/coming in R2/i)).toBeInTheDocument();
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
      expect(screen.getByText('456 Oak Ave, Kennewick, WA')).toBeInTheDocument();
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
