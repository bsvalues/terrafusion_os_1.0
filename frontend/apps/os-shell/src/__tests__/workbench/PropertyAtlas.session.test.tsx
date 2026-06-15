/**
 * PropertyAtlas.session.test.tsx
 *
 * Behavioral contract: map state (center, zoom, basemap, boundary toggle)
 * persists to sessionStorage keyed by parcelId. Switching away from the
 * Atlas tab and back restores the map to where the user left it.
 *
 * Session key:  tf-atlas-session:{parcelId}
 * Stored shape: { center: [lng, lat], zoom: number, basemap: 'satellite'|'streets', showBoundary: boolean }
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import PropertyAtlas from '../../pages/workbench/tabs/PropertyAtlas';

vi.mock('../../api/pilotApi');

const mockUseParcelBoundary = vi.fn().mockReturnValue({
  data: null, loading: false, error: null, source: 'unavailable', refetch: vi.fn(),
});
const mockUseParcelLayers = vi.fn().mockReturnValue({
  data: null, loading: false, error: null, source: 'unavailable', refetch: vi.fn(),
});
vi.mock('../../hooks/useAtlasGis', () => ({
  useParcelBoundary: (...args: unknown[]) => mockUseParcelBoundary(...args),
  useParcelLayers:   (...args: unknown[]) => mockUseParcelLayers(...args),
}));

vi.mock('mapbox-gl', () => {
  const Map = vi.fn().mockImplementation(() => ({
    remove: vi.fn(),
    on: vi.fn(),
    addControl: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getCenter: vi.fn(() => ({ lng: -119.3, lat: 46.2 })),
    getZoom: vi.fn(() => 17),
  }));
  return {
    default: { Map, Marker: vi.fn(() => ({ setLngLat: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis(), setPopup: vi.fn() })), NavigationControl: vi.fn(), AttributionControl: vi.fn(), Popup: vi.fn(() => ({ setHTML: vi.fn().mockReturnThis() })), accessToken: '' },
    Map,
  };
});

const TestWrapper: React.FC<{ parcelId: string }> = ({ parcelId }) => (
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

const PARCEL = '09-123456-0';
const SESSION_KEY = `tf-atlas-session:${PARCEL}`;

interface MapSession {
  center: [number, number];
  zoom: number;
  basemap: 'satellite' | 'streets';
  showBoundary: boolean;
}

function readSession(): MapSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

describe('PropertyAtlas – map session persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('writes map state to sessionStorage after basemap change and boundary toggle', async () => {
    render(<TestWrapper parcelId={PARCEL} />);

    // Toggle basemap from default (satellite) to streets
    fireEvent.click(screen.getByTestId('basemap-streets'));

    // Toggle boundary on
    fireEvent.click(screen.getByTestId('boundary-toggle'));

    await waitFor(() => {
      const session = readSession();
      expect(session).not.toBeNull();
    });

    const session = readSession()!;
    expect(session.basemap).toBe('streets');
    expect(session.showBoundary).toBe(true);
    expect(session.center).toEqual(
      expect.arrayContaining([expect.any(Number), expect.any(Number)]),
    );
    expect(typeof session.zoom).toBe('number');
  });

  it('restores saved map state on remount', async () => {
    const saved: MapSession = {
      center: [-119.31, 46.25],
      zoom: 15,
      basemap: 'streets',
      showBoundary: true,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(saved));

    render(<TestWrapper parcelId={PARCEL} />);

    // The component should have read the saved state.
    // Verify the session was not clobbered by defaults.
    await waitFor(() => {
      const restored = readSession();
      expect(restored).toEqual(saved);
    });

    // UI should reflect the restored basemap and boundary state
    expect(screen.getByTestId('basemap-streets')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('boundary-toggle')).toHaveAttribute('aria-pressed', 'true');
  });

  it('round-trips: write → unmount → remount → same state', async () => {
    // First mount — change basemap + toggle boundary
    const { unmount } = render(<TestWrapper parcelId={PARCEL} />);

    fireEvent.click(screen.getByTestId('basemap-streets'));
    fireEvent.click(screen.getByTestId('boundary-toggle'));

    let snapshot: MapSession | null = null;
    await waitFor(() => {
      snapshot = readSession();
      expect(snapshot).not.toBeNull();
      expect(snapshot!.basemap).toBe('streets');
      expect(snapshot!.showBoundary).toBe(true);
    });

    // Unmount (user navigates away from Atlas tab)
    unmount();

    // Remount (user returns to Atlas tab)
    render(<TestWrapper parcelId={PARCEL} />);

    // sessionStorage should still hold the same values
    const restored = readSession();
    expect(restored).toEqual(snapshot);

    // UI should reflect the restored state
    expect(screen.getByTestId('basemap-streets')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('boundary-toggle')).toHaveAttribute('aria-pressed', 'true');
  });

  it('isolates sessions by parcelId', async () => {
    const otherKey = 'tf-atlas-session:OTHER-999';
    const otherSession: MapSession = {
      center: [-120.0, 47.0],
      zoom: 12,
      basemap: 'streets',
      showBoundary: false,
    };
    sessionStorage.setItem(otherKey, JSON.stringify(otherSession));

    render(<TestWrapper parcelId={PARCEL} />);

    await waitFor(() => {
      const session = readSession();
      // Should NOT have picked up the other parcel's session
      expect(session?.basemap).not.toBe('streets');
    });

    // Other parcel's session should be untouched
    expect(JSON.parse(sessionStorage.getItem(otherKey)!)).toEqual(otherSession);
  });
});
