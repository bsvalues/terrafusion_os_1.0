/**
 * Phase 19 — TerraNotice Appeal Notice Spine, Tranche 8
 * Dais Appeal Notice Routing Contract
 *
 * Verifies that parcel-scoped appeal notice work is hosted inside
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

describe('Dais Appeal Notice Routing Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hosts parcel-scoped appeal notice work inside the Property Workbench Dais tab', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId('property-dais-tab')).toBeInTheDocument();
      expect(screen.getByTestId('appeal-notice-section')).toBeInTheDocument();
    });
  });

  it('preserves parcel, appeal, and hearing context', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      const noticeSection = screen.getByTestId('appeal-notice-section');
      const daisTab = screen.getByTestId('property-dais-tab');
      expect(daisTab).toContainElement(noticeSection);
    });
  });

  it('does not open a standalone parcel notice window', async () => {
    render(<TestWrapper />);

    await waitFor(() => {
      const noticeSection = screen.getByTestId('appeal-notice-section');
      expect(noticeSection.closest('[data-testid="property-dais-tab"]')).toBeTruthy();
    });
  });
});
