/**
 * TerraFusion OS Navigation Truth Tests
 *
 * Tests that enforce correct navigation behavior across the OS.
 * Ensures suite icons route to Workbench (real MWUX) not WIP suite homes.
 *
 * @module shell/desktop/__tests__/NavigationTruth.test
 * @vitest-environment jsdom
 * @see Phase B TDD - Navigation Truth
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React, { act } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import {
    CONSTITUTIONAL_SUITES,
    OS_FEATURES,
    isConstitutionalSuite,
} from '../../../config/suiteRegistry';
import { DesktopIconGrid } from '../DesktopIconGrid';

// Test helper to capture navigation
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid='current-location'>{location.pathname}</div>;
}

// Render helper with router
function renderWithRouter(ui: React.ReactElement, initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path='/' element={ui} />
        <Route path='/property/:parcelId/:tab' element={<LocationDisplay />} />
        <Route path='/property/:parcelId' element={<LocationDisplay />} />
        <Route path='/pilot' element={<LocationDisplay />} />
        <Route path='*' element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Navigation Truth Contracts', () => {
  describe('Desktop Icon Grid Routing', () => {
    it('suite_icons_route_to_workbench_tabs_not_wip_homes', () => {
      renderWithRouter(<DesktopIconGrid />);

      // Constitutional suites should route to /property/:parcelId/:tab
      const forgeIcon = screen.getByTestId('desktop-icon-forge');
      const atlasIcon = screen.getByTestId('desktop-icon-atlas');
      const daisIcon = screen.getByTestId('desktop-icon-dais');
      const dossierIcon = screen.getByTestId('desktop-icon-dossier');

      // Each icon should exist and have WB wiring status
      expect(forgeIcon).toBeInTheDocument();
      expect(atlasIcon).toBeInTheDocument();
      expect(daisIcon).toBeInTheDocument();
      expect(dossierIcon).toBeInTheDocument();

      // Verify WB badges are present (honest wiring)
      expect(forgeIcon.textContent).toContain('WB');
      expect(atlasIcon.textContent).toContain('WB');
      expect(daisIcon.textContent).toContain('WB');
      expect(dossierIcon.textContent).toContain('WB');
    });

    it('forge_icon_navigates_to_workbench_forge_tab', async () => {
      renderWithRouter(<DesktopIconGrid />);

      const forgeIcon = screen.getByTestId('desktop-icon-forge');

      // Double-click to launch
      await act(async () => {
        fireEvent.doubleClick(forgeIcon);
      });

      // Should navigate to Workbench with forge tab
      const location = screen.getByTestId('current-location');
      expect(location.textContent).toMatch(/\/property\/\d+\/forge/);
    });

    it('atlas_icon_navigates_to_workbench_atlas_tab', async () => {
      renderWithRouter(<DesktopIconGrid />);

      const atlasIcon = screen.getByTestId('desktop-icon-atlas');

      await act(async () => {
        fireEvent.doubleClick(atlasIcon);
      });

      const location = screen.getByTestId('current-location');
      expect(location.textContent).toMatch(/\/property\/\d+\/atlas/);
    });

    it('dais_icon_navigates_to_workbench_dais_tab', async () => {
      renderWithRouter(<DesktopIconGrid />);

      const daisIcon = screen.getByTestId('desktop-icon-dais');

      await act(async () => {
        fireEvent.doubleClick(daisIcon);
      });

      const location = screen.getByTestId('current-location');
      expect(location.textContent).toMatch(/\/property\/\d+\/dais/);
    });

    it('dossier_icon_navigates_to_workbench_dossier_tab', async () => {
      renderWithRouter(<DesktopIconGrid />);

      const dossierIcon = screen.getByTestId('desktop-icon-dossier');

      await act(async () => {
        fireEvent.doubleClick(dossierIcon);
      });

      const location = screen.getByTestId('current-location');
      expect(location.textContent).toMatch(/\/property\/\d+\/dossier/);
    });

    it('pilot_icon_navigates_to_standalone_pilot_route', async () => {
      renderWithRouter(<DesktopIconGrid />);

      const pilotIcon = screen.getByTestId('desktop-icon-pilot');

      await act(async () => {
        fireEvent.doubleClick(pilotIcon);
      });

      const location = screen.getByTestId('current-location');
      expect(location.textContent).toBe('/pilot');
    });

    it('no_desktop_icon_routes_to_wip_suite_home', () => {
      renderWithRouter(<DesktopIconGrid />);

      // Get all desktop icons
      const icons = screen.getAllByTestId(/^desktop-icon-/);

      // None of them should have routes that are just /forge, /atlas, etc.
      // (those are WIP suite homes)
      icons.forEach((icon) => {
        // Check via the icon's internal route (would need to expose it or test via navigation)
        // For now, verify WiringStatus is not WIP for constitutional suites
        const id = icon.getAttribute('data-testid')?.replace('desktop-icon-', '');
        if (isConstitutionalSuite(id || '')) {
          // Constitutional suites should have WB status (Workbench routing)
          expect(icon.textContent).toContain('WB');
          // And NOT WIP
          expect(icon.textContent).not.toMatch(/\bWIP\b/);
        }
      });
    });
  });

  describe('Constitutional Suite Registry Routing', () => {
    it('all_constitutional_suites_have_workbench_representation', () => {
      // Every constitutional suite with workbenchTab=true should route to workbench
      const workbenchSuites = CONSTITUTIONAL_SUITES.filter((s) => s.workbenchTab);

      expect(workbenchSuites.length).toBeGreaterThan(0);

      for (const suite of workbenchSuites) {
        // These suites should be accessible via /property/:parcelId/:suiteId
        expect(['forge', 'atlas', 'dais', 'dossier', 'gpt']).toContain(suite.id);
      }
    });

    it('os_features_have_standalone_routes', () => {
      // OS Features like Pilot should have their own routes (not nested in workbench)
      const pilot = OS_FEATURES.find((f) => f.id === 'pilot');

      expect(pilot).toBeDefined();
      expect(pilot?.route).toBe('/pilot');
      expect(pilot?.status).toBe('live');
    });
  });

  describe('Icon Selection and Launch', () => {
    it('single_click_selects_icon', async () => {
      renderWithRouter(<DesktopIconGrid />);

      const forgeIcon = screen.getByTestId('desktop-icon-forge');

      // Initially not selected
      expect(forgeIcon).toHaveAttribute('aria-selected', 'false');

      // Single click
      await act(async () => {
        fireEvent.click(forgeIcon);
      });

      // Should be selected
      expect(forgeIcon).toHaveAttribute('aria-selected', 'true');
    });

    it('double_click_launches_and_navigates', async () => {
      renderWithRouter(<DesktopIconGrid />);

      const forgeIcon = screen.getByTestId('desktop-icon-forge');

      await act(async () => {
        fireEvent.doubleClick(forgeIcon);
      });

      // Should have navigated
      const location = screen.getByTestId('current-location');
      expect(location.textContent).not.toBe('/');
    });

    it('keyboard_enter_launches_selected_icon', async () => {
      renderWithRouter(<DesktopIconGrid />);

      const forgeIcon = screen.getByTestId('desktop-icon-forge');

      // Focus and press Enter
      await act(async () => {
        forgeIcon.focus();
        fireEvent.keyDown(forgeIcon, { key: 'Enter' });
      });

      // Should have navigated
      const location = screen.getByTestId('current-location');
      expect(location.textContent).toMatch(/\/property\/\d+\/forge/);
    });

    it('clicking_grid_background_deselects_icon', async () => {
      renderWithRouter(<DesktopIconGrid />);

      const grid = screen.getByTestId('desktop-icon-grid');
      const forgeIcon = screen.getByTestId('desktop-icon-forge');

      // Select icon
      await act(async () => {
        fireEvent.click(forgeIcon);
      });

      expect(forgeIcon).toHaveAttribute('aria-selected', 'true');

      // Click grid background
      await act(async () => {
        fireEvent.click(grid);
      });

      expect(forgeIcon).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Wiring Status Badges', () => {
    it('workbench_routed_icons_show_WB_badge', () => {
      renderWithRouter(<DesktopIconGrid />);

      const forgeIcon = screen.getByTestId('desktop-icon-forge');
      const atlasIcon = screen.getByTestId('desktop-icon-atlas');

      // WB = Workbench routing (best UX)
      expect(forgeIcon.textContent).toContain('WB');
      expect(atlasIcon.textContent).toContain('WB');
    });

    it('standalone_os_routes_show_OS_badge', () => {
      renderWithRouter(<DesktopIconGrid />);

      const pilotIcon = screen.getByTestId('desktop-icon-pilot');

      // OS = Standalone OS route (live)
      expect(pilotIcon.textContent).toContain('OS');
    });

    it('no_constitutional_suite_shows_WIP_badge_on_desktop', () => {
      renderWithRouter(<DesktopIconGrid />);

      // Constitutional suites on desktop should NOT show WIP
      // (they route to Workbench which is live)
      const icons = screen.getAllByTestId(/^desktop-icon-/);

      for (const icon of icons) {
        const id = icon.getAttribute('data-testid')?.replace('desktop-icon-', '');
        if (isConstitutionalSuite(id || '')) {
          expect(icon.textContent).not.toMatch(/\bWIP\b/);
        }
      }
    });
  });
});
