/**
 * PropertyAtlas.session.test.tsx
 *
 * Contract test: Atlas tab persists map state (basemap, boundary toggle,
 * center, zoom) to sessionStorage keyed by parcelId. Switching away and
 * back restores the user's view.
 *
 * Session key: `tf-atlas-session:{parcelId}`
 * Stored shape: { center: [lng, lat], zoom: number, basemap: 'satellite'|'streets', showBoundary: boolean }
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';

// Mock pilotApi before importing component
vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn().mockResolvedValue({ success: false, error: { code: 'STUB' } }),
}));

// Provide boundary with centroid so the map + toolbar render
const mockBoundary = {
  data: {
    centroid: { lat: 46.2304, lng: -119.2117, derivedFrom: 'arcgis' },
    situsDisplay: '123 TEST ST',
    areaAcres: 0.25,
    areaSqFt: 10890,
    ringJson: JSON.stringify([[-119.212, 46.231], [-119.211, 46.231], [-119.211, 46.230], [-119.212, 46.230], [-119.212, 46.231]]),
    dimensions: null,
    ownerName: 'TEST OWNER',
  },
  loading: false,
  error: null,
  source: 'live' as const,
  refetch: vi.fn(),
};

const mockLayers = {
  data: null,
  loading: false,
  error: null,
  source: 'unavailable' as const,
  refetch: vi.fn(),
};

vi.mock('../../hooks/useAtlasGis', () => ({
  useParcelBoundary: () => mockBoundary,
  useParcelLayers: () => mockLayers,
}));

// Lazy-import component AFTER mocks are in place
const { PropertyAtlas } = await import('../../pages/workbench/tabs/PropertyAtlas');

const SESSION_KEY = 'tf-atlas-session';

function Wrapper({ parcelId }: { parcelId: string }) {
  return (
    <MemoryRouter initialEntries={[`/property/${parcelId}/atlas`]}>
      <Routes>
        <Route
          path="/property/:parcelId"
          element={<div><Outlet context={{ parcelId }} /></div>}
        >
          <Route path="atlas" element={<PropertyAtlas />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('PropertyAtlas — session persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('reflects basemap change in UI and restores it on remount', () => {
    // Basemap changes trigger a full map re-mount; session persistence fires
    // via the moveend handler (not the useEffect) in real MapLibre. In JSDOM
    // the mock map doesn't fire moveend, so we test the restore path instead:
    // seed the session, mount, verify UI matches.
    const seed = {
      center: [-119.5, 46.3],
      zoom: 15,
      basemap: 'streets',
      showBoundary: true,
    };
    sessionStorage.setItem(`${SESSION_KEY}:TEST-001`, JSON.stringify(seed));

    render(<Wrapper parcelId="TEST-001" />);

    const streetsBtn = screen.getByTestId('basemap-streets');
    expect(streetsBtn.className).toContain('font-semibold');

    const satBtn = screen.getByTestId('basemap-satellite');
    expect(satBtn.className).not.toContain('font-semibold');
  });

  it('writes session state when boundary is toggled off', () => {
    render(<Wrapper parcelId="TEST-002" />);

    const toggleBtn = screen.getByTestId('toggle-boundary');
    fireEvent.click(toggleBtn);

    const raw = sessionStorage.getItem(`${SESSION_KEY}:TEST-002`);
    expect(raw).toBeTruthy();

    const state = JSON.parse(raw!);
    expect(state.showBoundary).toBe(false);
  });

  it('restores saved basemap and boundary state on mount', () => {
    const seed = {
      center: [-119.5, 46.3],
      zoom: 14,
      basemap: 'streets',
      showBoundary: false,
    };
    sessionStorage.setItem(`${SESSION_KEY}:TEST-003`, JSON.stringify(seed));

    render(<Wrapper parcelId="TEST-003" />);

    // Streets button should be visually active (has font-semibold class)
    const streetsBtn = screen.getByTestId('basemap-streets');
    expect(streetsBtn.className).toContain('font-semibold');

    // Satellite button should NOT be active
    const satBtn = screen.getByTestId('basemap-satellite');
    expect(satBtn.className).not.toContain('font-semibold');

    // Boundary toggle should reflect OFF
    const toggleBtn = screen.getByTestId('toggle-boundary');
    expect(toggleBtn.textContent).toContain('OFF');
  });

  it('round-trips: write → unmount → remount → same state', () => {
    // Mount and change basemap to streets + toggle boundary off
    const { unmount } = render(<Wrapper parcelId="TEST-004" />);
    fireEvent.click(screen.getByTestId('basemap-streets'));
    fireEvent.click(screen.getByTestId('toggle-boundary'));

    const rawAfterWrite = sessionStorage.getItem(`${SESSION_KEY}:TEST-004`);
    expect(rawAfterWrite).toBeTruthy();
    const stateAfterWrite = JSON.parse(rawAfterWrite!);

    // Unmount (simulates tab switch)
    unmount();

    // Remount
    render(<Wrapper parcelId="TEST-004" />);

    // Storage unchanged
    const rawAfterRemount = sessionStorage.getItem(`${SESSION_KEY}:TEST-004`);
    expect(JSON.parse(rawAfterRemount!)).toMatchObject({
      basemap: stateAfterWrite.basemap,
      showBoundary: stateAfterWrite.showBoundary,
    });

    // UI reflects restored state
    expect(screen.getByTestId('basemap-streets').className).toContain('font-semibold');
    expect(screen.getByTestId('toggle-boundary').textContent).toContain('OFF');
  });

  it('isolates session state by parcelId', () => {
    // Seed state for a different parcel
    sessionStorage.setItem(
      `${SESSION_KEY}:OTHER-PARCEL`,
      JSON.stringify({ center: [-120, 47], zoom: 12, basemap: 'streets', showBoundary: false }),
    );

    render(<Wrapper parcelId="TEST-005" />);

    // Should NOT have loaded OTHER-PARCEL's state — satellite is the default
    const satBtn = screen.getByTestId('basemap-satellite');
    expect(satBtn.className).toContain('font-semibold');

    // Boundary default is ON
    const toggleBtn = screen.getByTestId('toggle-boundary');
    expect(toggleBtn.textContent).toContain('ON');

    // OTHER-PARCEL's storage is untouched
    const otherRaw = sessionStorage.getItem(`${SESSION_KEY}:OTHER-PARCEL`);
    expect(JSON.parse(otherRaw!).basemap).toBe('streets');
  });
});
