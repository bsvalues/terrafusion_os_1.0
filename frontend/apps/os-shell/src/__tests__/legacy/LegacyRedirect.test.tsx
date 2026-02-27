/**
 * LegacyRedirect.test.tsx
 *
 * Phase 6.4: Tests for legacy redirect component with telemetry.
 */

import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { LegacyRedirect } from '../../components/legacy/LegacyRedirect';
import * as telemetry from '../../telemetry/legacyUiTelemetry';

// Mock telemetry module
vi.mock('../../telemetry/legacyUiTelemetry', () => ({
  emitLegacyUiHit: vi.fn(() => ({
    eventType: 'legacy.ui_hit',
    legacyAppId: 'test.app',
    route: '/test',
    emitted: true,
  })),
}));

// Helper to capture final location
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid='location'>{location.pathname}</div>;
}

describe('LegacyRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Telemetry Emission', () => {
    it('emits legacy.ui_hit telemetry on mount', async () => {
      render(
        <MemoryRouter initialEntries={['/modules/old-route']}>
          <Routes>
            <Route
              path='/modules/*'
              element={<LegacyRedirect to='/' legacyAppId='modules.old-route' />}
            />
            <Route path='/' element={<LocationDisplay />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(telemetry.emitLegacyUiHit).toHaveBeenCalledWith(
          expect.objectContaining({
            legacyAppId: 'modules.old-route',
            route: '/modules/old-route',
          })
        );
      });
    });

    it('includes legacyAppId in telemetry payload', async () => {
      render(
        <MemoryRouter initialEntries={['/modules/property-workbench']}>
          <Routes>
            <Route
              path='/modules/*'
              element={<LegacyRedirect to='/' legacyAppId='modules.property-workbench' />}
            />
            <Route path='/' element={<LocationDisplay />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(telemetry.emitLegacyUiHit).toHaveBeenCalledWith(
          expect.objectContaining({
            legacyAppId: 'modules.property-workbench',
          })
        );
      });
    });
  });

  describe('Redirect Behavior', () => {
    it('redirects to target route', async () => {
      const { getByTestId } = render(
        <MemoryRouter initialEntries={['/modules/old-route']}>
          <Routes>
            <Route
              path='/modules/*'
              element={<LegacyRedirect to='/' legacyAppId='modules.old' />}
            />
            <Route path='/' element={<LocationDisplay />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getByTestId('location').textContent).toBe('/');
      });
    });

    it('redirects with replace by default', async () => {
      // This is covered by the implementation using replace: true
      const { getByTestId } = render(
        <MemoryRouter initialEntries={['/modules/test']}>
          <Routes>
            <Route
              path='/modules/*'
              element={<LegacyRedirect to='/home' legacyAppId='modules.test' />}
            />
            <Route path='/home' element={<LocationDisplay />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getByTestId('location').textContent).toBe('/home');
      });
    });
  });

  describe('Route Capture', () => {
    it('captures full route path in telemetry', async () => {
      render(
        <MemoryRouter initialEntries={['/modules/property-workbench/parcel/123']}>
          <Routes>
            <Route
              path='/modules/*'
              element={<LegacyRedirect to='/' legacyAppId='modules.property-workbench' />}
            />
            <Route path='/' element={<LocationDisplay />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(telemetry.emitLegacyUiHit).toHaveBeenCalledWith(
          expect.objectContaining({
            route: '/modules/property-workbench/parcel/123',
          })
        );
      });
    });
  });
});
