/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 1
 * Dossier Tab Packet Routing Contract
 *
 * Verifies that the PropertyDossier workbench tab includes
 * the evidence packet assembly surface and receives parcel context.
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import PropertyDossier from '../../pages/workbench/tabs/PropertyDossier';

// Mock the read-side dossier service (used by PropertyDossier)
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

// Mock the write-side dossier service (used by ParcelEvidencePacket)
vi.mock('../../services/suites/dossierService', () => ({
  getDocuments: vi.fn().mockResolvedValue([]),
  getEvidence: vi.fn().mockResolvedValue([]),
  getPackets: vi.fn().mockResolvedValue([]),
  assemblePacket: vi.fn(),
  uploadDocument: vi.fn(),
  deleteDocument: vi.fn(),
  finalizePacket: vi.fn(),
  attachEvidence: vi.fn(),
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

describe('Dossier Tab Packet Routing Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('PropertyDossier renders with property-dossier-tab testid', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId('property-dossier-tab')).toBeInTheDocument();
    });
  });

  it('contains evidence-packet-section', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId('evidence-packet-section')).toBeInTheDocument();
    });
  });

  it('evidence packet section is inside dossier tab', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      const tabContent = screen.getByTestId('property-dossier-tab');
      const packetSection = screen.getByTestId('evidence-packet-section');
      expect(tabContent).toContainElement(packetSection);
    });
  });
});
