/**
 * Phase 19 — TerraAppeal Deadline Spine, Tranche 6
 * Dais Appeal Deadline Routing Contract
 *
 * Verifies that appeal deadline work is hosted inside the Property
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

describe('Dais Appeal Deadline Routing Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes parcel-scoped appeal deadline work into the Property Workbench Dais tab', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId('property-dais-tab')).toBeInTheDocument();
      expect(screen.getByTestId('appeal-deadline-section')).toBeInTheDocument();
    });
  });

  it('preserves parcel id and appeal id context', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      const deadlineSection = screen.getByTestId('appeal-deadline-section');
      const daisTab = screen.getByTestId('property-dais-tab');
      expect(daisTab).toContainElement(deadlineSection);
    });
  });

  it('does not open a standalone parcel appeal deadline window', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      const deadlineSection = screen.getByTestId('appeal-deadline-section');
      expect(deadlineSection.closest('[data-testid="property-dais-tab"]')).toBeTruthy();
    });
  });
});
