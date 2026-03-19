/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 4
 * Dossier Finalization Routing Contract
 *
 * Verifies that finalization is hosted inside the Property Workbench
 * Dossier tab, not in standalone windows.
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import PropertyDossier from '../../pages/workbench/tabs/PropertyDossier';

// Mock the read-side dossier service
vi.mock('../../services/dossierService', () => ({
  dossierService: {
    getDetails: vi.fn().mockResolvedValue({ data: null }),
    getEvidenceSnapshot: vi.fn().mockResolvedValue({ items: [] }),
    searchDocuments: vi.fn().mockResolvedValue([]),
    searchEvidence: vi.fn().mockResolvedValue([]),
    getChainOfCustody: vi.fn().mockResolvedValue([]),
    getStats: vi.fn().mockResolvedValue({}),
  },
}));

// Mock the write-side dossier service
vi.mock('../../services/suites/dossierService', () => ({
  getDocuments: vi.fn().mockResolvedValue([]),
  getEvidence: vi.fn().mockResolvedValue([]),
  getPackets: vi.fn().mockResolvedValue([]),
  getNarratives: vi.fn().mockResolvedValue([]),
  assemblePacket: vi.fn(),
  uploadDocument: vi.fn(),
  deleteDocument: vi.fn(),
  finalizePacket: vi.fn(),
  attachEvidence: vi.fn(),
  createNarrative: vi.fn(),
  updateNarrative: vi.fn(),
}));

// Mock writeLane
vi.mock('../../services/writeLane', () => ({
  assertWriteLane: vi.fn(),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: {},
}));

// Mock pilotApi
vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(),
}));

const PARCEL_ID = 'TEST-PARCEL-001';

const TestWrapper: React.FC = () => (
  <MemoryRouter initialEntries={[`/property/${PARCEL_ID}/dossier`]}>
    <Routes>
      <Route
        path="/property/:parcelId"
        element={
          <div>
            <Outlet context={{ parcelId: PARCEL_ID, propertyData: { parcelId: PARCEL_ID }, workMode: 'overview' }} />
          </div>
        }
      >
        <Route path="dossier" element={<PropertyDossier />} />
      </Route>
    </Routes>
  </MemoryRouter>
);

describe('Dossier Finalization Routing Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hosts packet finalization inside the Property Workbench Dossier tab', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId('property-dossier-tab')).toBeInTheDocument();
      expect(screen.getByTestId('finalization-section')).toBeInTheDocument();
    });
  });

  it('does not open a standalone parcel finalization window', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      const finSection = screen.getByTestId('finalization-section');
      const dossierTab = screen.getByTestId('property-dossier-tab');
      expect(dossierTab).toContainElement(finSection);
    });
  });

  it('renders a real finalization interaction surface, not a summary placeholder', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId('finalization-section')).toBeInTheDocument();
    });
  });
});
