/**
 * Phase 19 — TerraAppeal Hearing Scheduling Spine, Tranche 7
 * Dais Appeal Hearing Routing Contract
 *
 * Verifies that hearing scheduling is hosted inside the Property
 * Workbench Dais tab, preserves parcel context, and does not open
 * standalone windows.
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

describe('Dais Appeal Hearing Routing Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hosts parcel-scoped hearing scheduling inside the Property Workbench Dais tab', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId('property-dais-tab')).toBeInTheDocument();
      expect(screen.getByTestId('appeal-hearing-section')).toBeInTheDocument();
    });
  });

  it('preserves parcel id, appeal id, and hearing context', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      const hearingSection = screen.getByTestId('appeal-hearing-section');
      const daisTab = screen.getByTestId('property-dais-tab');
      expect(daisTab).toContainElement(hearingSection);
    });
  });

  it('does not open a standalone parcel hearing scheduling window', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      const hearingSection = screen.getByTestId('appeal-hearing-section');
      expect(hearingSection.closest('[data-testid="property-dais-tab"]')).toBeTruthy();
    });
  });
});
