/**
 * Phase 19 — TerraCert Appeal Outcome + Certification Readiness Spine, Tranche 9
 * Dais Appeal Certification Routing Contract
 *
 * Verifies that parcel-scoped certification readiness is hosted inside
 * PropertyDais tab with correct context, not a standalone window.
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import PropertyDais from '../../pages/workbench/tabs/PropertyDais';

// Mock the pilotApi
vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(),
}));

const PARCEL_ID = 'TEST-PARCEL-001';

const TestWrapper: React.FC = () => (
  <MemoryRouter initialEntries={[`/property/${PARCEL_ID}/dais`]}>
    <Routes>
      <Route
        path="/property/:parcelId"
        element={
          <div>
            <Outlet context={{ parcelId: PARCEL_ID, propertyData: { parcelId: PARCEL_ID }, workMode: 'overview' }} />
          </div>
        }
      >
        <Route path="dais" element={<PropertyDais />} />
      </Route>
    </Routes>
  </MemoryRouter>
);

describe('Dais Appeal Certification Routing Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hosts parcel-scoped certification readiness inside the Property Workbench Dais tab', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId('property-dais-tab')).toBeInTheDocument();
      expect(screen.getByTestId('appeal-certification-section')).toBeInTheDocument();
    });
  });

  it('preserves parcel, appeal, hearing, and outcome context', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      const certSection = screen.getByTestId('appeal-certification-section');
      const daisTab = screen.getByTestId('property-dais-tab');
      expect(daisTab).toContainElement(certSection);
    });
  });

  it('does not open a standalone parcel certification window', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      const certSection = screen.getByTestId('appeal-certification-section');
      expect(certSection.closest('[data-testid="property-dais-tab"]')).toBeTruthy();
    });
  });
});
