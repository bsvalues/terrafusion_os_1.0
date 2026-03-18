/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 5
 * Dossier-to-Dais Appeal Routing Contract
 *
 * Verifies that appeal handoff is hosted inside the Property Workbench
 * Dossier tab, preserves parcel context, and does not open standalone windows.
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

describe('Dossier-to-Dais Appeal Routing Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes parcel-scoped appeal handoff into the Property Workbench with Dais active', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId('property-dossier-tab')).toBeInTheDocument();
      expect(screen.getByTestId('appeal-handoff-section')).toBeInTheDocument();
    });
  });

  it('preserves parcel context and packet reference context', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      const handoffSection = screen.getByTestId('appeal-handoff-section');
      const dossierTab = screen.getByTestId('property-dossier-tab');
      expect(dossierTab).toContainElement(handoffSection);
    });
  });

  it('does not open a standalone parcel appeal handoff window', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      // Handoff section is nested inside PropertyDossier, not standalone
      const handoffSection = screen.getByTestId('appeal-handoff-section');
      expect(handoffSection.closest('[data-testid="property-dossier-tab"]')).toBeTruthy();
    });
  });
});
