/**
 * TerraFusion OS Standalone Homes Navigation Tests
 *
 * Tests for navigation parity between ShellHome, Launcher, and standalone routes.
 *
 * Navigation requirements:
 * - ShellHome tile → standalone route works
 * - Launcher item → standalone route works
 * - Routes match between all entry points
 * - Back/forward preserves state
 * - Workbench CTA works when parcel context exists
 *
 * @module __tests__/standalone/standaloneHomes.navigation.test
 * @vitest-environment jsdom
 * @see Slice 6.1: Unskip + Harden Standalone Contract Suite
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { getLauncherItems } from '../../components/launcher/launcherModel';
import { StandaloneHomeShell } from '../../components/standalone';
import { OS_FEATURES } from '../../config/suiteRegistry';
import { resetMaterialQualityGate } from '../../ui/materials/materialQualityGate';

import { createParcelContext, mockMatchMedia } from './testUtils';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Component that displays current location for testing navigation.
 */
function LocationDisplay() {
  const location = useLocation();
  return (
    <div>
      <div data-testid='current-path'>{location.pathname}</div>
      <div data-testid='current-state'>{JSON.stringify(location.state)}</div>
    </div>
  );
}

/**
 * Mock standalone home that displays route info.
 */
function MockStandaloneHome({ name }: { name: string }) {
  return (
    <div data-testid='standalone-home'>
      <h1>{name}</h1>
      <LocationDisplay />
    </div>
  );
}

/**
 * Real standalone with parcel context for CTA tests.
 */
function RealStandalonePilot() {
  return (
    <StandaloneHomeShell
      featureId='pilot'
      meta={{
        title: 'TerraPilot Console',
        showWorkbenchCta: true,
      }}
    >
      <div data-testid='pilot-content'>Pilot Content</div>
      <LocationDisplay />
    </StandaloneHomeShell>
  );
}

/**
 * Test router with all standalone routes.
 */
function TestRouter({
  initialRoute = '/',
  initialState,
}: {
  initialRoute?: string;
  initialState?: unknown;
}) {
  return (
    <MemoryRouter initialEntries={[{ pathname: initialRoute, state: initialState }]}>
      <Routes>
        <Route path='/' element={<div data-testid='shell-home'>Shell Home</div>} />
        <Route path='/pilot' element={<RealStandalonePilot />} />
        <Route path='/pilot/dashboard' element={<MockStandaloneHome name='Pilot Dashboard' />} />
        <Route path='/pilot/api' element={<MockStandaloneHome name='Pilot API Demo' />} />
        <Route
          path='/property/:parcelId/:suiteId'
          element={
            <div data-testid='workbench-view'>
              <LocationDisplay />
            </div>
          }
        />
        <Route path='*' element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );
}

// ============================================================================
// Test Setup
// ============================================================================

describe('Standalone Homes Navigation', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  afterEach(() => {
    cleanup();
    resetMaterialQualityGate();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Route Parity Tests
  // ==========================================================================

  describe('Route Parity', () => {
    it('launcher_items_match_os_feature_routes', () => {
      const launcherItems = getLauncherItems();
      const standaloneItems = launcherItems.filter((item) => item.intent === 'standalone');

      // Each standalone launcher item should correspond to an OS feature
      for (const item of standaloneItems) {
        const osFeature = OS_FEATURES.find((f) => f.id === item.id);

        // If it's an OS feature, routes should match
        if (osFeature && osFeature.route) {
          expect(item.route).toBe(osFeature.route);
        }
      }
    });

    it('all_os_features_with_routes_are_in_launcher', () => {
      const launcherItems = getLauncherItems();
      const osWithRoutes = OS_FEATURES.filter((f) => f.route);

      for (const feature of osWithRoutes) {
        const launcherItem = launcherItems.find((item) => item.id === feature.id);
        expect(launcherItem).toBeDefined();
        expect(launcherItem?.route).toBe(feature.route);
      }
    });
  });

  // ==========================================================================
  // Navigation Flow Tests
  // ==========================================================================

  describe('Navigation Flow', () => {
    it('launcher_to_standalone_route_works', () => {
      // Verify routes are correctly defined in launcher
      const launcherItems = getLauncherItems();
      const pilotItem = launcherItems.find((item) => item.id === 'pilot');

      expect(pilotItem).toBeDefined();
      expect(pilotItem?.route).toBe('/pilot');
      expect(pilotItem?.intent).toBe('standalone');
    });

    it('standalone_routes_resolve_without_redirect', () => {
      render(<TestRouter initialRoute='/pilot' />);

      // Should be at /pilot, not redirected elsewhere
      expect(screen.getByTestId('current-path')).toHaveTextContent('/pilot');
      expect(screen.getByTestId('standalone-shell')).toBeInTheDocument();
    });

    it('nested_standalone_routes_resolve', () => {
      render(<TestRouter initialRoute='/pilot/dashboard' />);

      expect(screen.getByTestId('current-path')).toHaveTextContent('/pilot/dashboard');
    });
  });

  // ==========================================================================
  // History State Tests
  // ==========================================================================

  describe('History State', () => {
    it('navigation_preserves_location_state', () => {
      // When navigating to standalone with state, state should be preserved
      const state = { fromDashboard: true, selectedParcel: 'P-123' };
      render(<TestRouter initialRoute='/pilot' initialState={state} />);

      const stateElement = screen.getByTestId('current-state');
      expect(stateElement).toHaveTextContent('fromDashboard');
      expect(stateElement).toHaveTextContent('selectedParcel');
    });

    it('parcel_context_preserved_in_location_state', () => {
      const parcelState = createParcelContext('P-99999', 'Test Parcel');

      render(<TestRouter initialRoute='/pilot' initialState={parcelState} />);

      const stateElement = screen.getByTestId('current-state');
      expect(stateElement).toHaveTextContent('P-99999');
      expect(stateElement).toHaveTextContent('parcelId');
    });
  });

  // ==========================================================================
  // Workbench CTA Tests
  // ==========================================================================

  describe('Workbench CTA', () => {
    it('workbench_cta_appears_when_parcel_context_exists', async () => {
      // Pass parcel context directly in location state (not nested)
      const parcelState = createParcelContext('P-12345');

      render(<TestRouter initialRoute='/pilot' initialState={parcelState} />);

      // With parcel context, should show CTA
      const cta = screen.getByRole('button', { name: /open.*workbench/i });
      expect(cta).toBeInTheDocument();
    });

    it('workbench_cta_hidden_when_no_parcel_context', async () => {
      // No parcel context in location state
      render(<TestRouter initialRoute='/pilot' />);

      // No parcel context = no CTA
      const cta = screen.queryByRole('button', { name: /open.*workbench/i });
      expect(cta).not.toBeInTheDocument();
    });

    it('workbench_cta_navigates_to_correct_parcel_route', async () => {
      const user = userEvent.setup();
      const parcelState = createParcelContext('P-12345');

      render(<TestRouter initialRoute='/pilot' initialState={parcelState} />);

      const cta = screen.getByRole('button', { name: /open.*workbench/i });
      await user.click(cta);

      // Should navigate to workbench route with parcel + suite
      expect(screen.getByTestId('current-path')).toHaveTextContent('/property/P-12345/pilot');
    });
  });
});
