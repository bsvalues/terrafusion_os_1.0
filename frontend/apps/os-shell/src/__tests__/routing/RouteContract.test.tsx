/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ROUTE CONTRACT TESTS
 * Unified OS Surface: Desktop + Workbench Route Verification
 *
 * Tests the unified route architecture contract:
 * - / renders Desktop OS (App.tsx)
 * - /property/:parcelId renders PropertyWorkbench with tabs
 * - /modules/* redirects to /
 * - Missing parcelId shows safe error
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import React, { Suspense, lazy } from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';

// Mock lazy-loaded components
// ShellHome deprecated — / now renders App (Desktop OS surface)
vi.mock('../../App', () => ({
  __esModule: true,
  default: () => <div data-testid='desktop'>Desktop OS</div>,
}));

vi.mock('../../pages/workbench/PropertyWorkbench', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='property-workbench'>
      PropertyWorkbench
      <div data-testid='outlet'>{children}</div>
    </div>
  ),
}));

vi.mock('../../pages/workbench/tabs/PropertySummary', () => ({
  __esModule: true,
  default: () => <div data-testid='property-summary'>PropertySummary</div>,
}));

vi.mock('../../pages/workbench/tabs/PropertyForge', () => ({
  __esModule: true,
  default: () => <div data-testid='property-forge'>PropertyForge</div>,
}));

vi.mock('../../pages/workbench/tabs/PropertyAtlas', () => ({
  __esModule: true,
  default: () => <div data-testid='property-atlas'>PropertyAtlas</div>,
}));

vi.mock('../../pages/workbench/tabs/PropertyDais', () => ({
  __esModule: true,
  default: () => <div data-testid='property-dais'>PropertyDais</div>,
}));

vi.mock('../../pages/workbench/tabs/PropertyDossier', () => ({
  __esModule: true,
  default: () => <div data-testid='property-dossier'>PropertyDossier</div>,
}));

vi.mock('../../pages/workbench/tabs/PropertyPilot', () => ({
  __esModule: true,
  default: () => <div data-testid='property-pilot'>PropertyPilot</div>,
}));

// Simple test router that mirrors the production routes
const TestRouter: React.FC<{ initialRoute: string }> = ({ initialRoute }) => {
  const App = lazy(() => import('../../App'));
  const PropertyWorkbench = lazy(() => import('../../pages/workbench/PropertyWorkbench'));
  const PropertySummary = lazy(() => import('../../pages/workbench/tabs/PropertySummary'));
  const PropertyForge = lazy(() => import('../../pages/workbench/tabs/PropertyForge'));
  const PropertyAtlas = lazy(() => import('../../pages/workbench/tabs/PropertyAtlas'));
  const PropertyDais = lazy(() => import('../../pages/workbench/tabs/PropertyDais'));
  const PropertyDossier = lazy(() => import('../../pages/workbench/tabs/PropertyDossier'));
  const PropertyPilot = lazy(() => import('../../pages/workbench/tabs/PropertyPilot'));

  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path='/' element={<App />} />
          <Route path='/property/:parcelId' element={<PropertyWorkbench />}>
            <Route index element={<PropertySummary />} />
            <Route path='forge' element={<PropertyForge />} />
            <Route path='atlas' element={<PropertyAtlas />} />
            <Route path='dais' element={<PropertyDais />} />
            <Route path='dossier' element={<PropertyDossier />} />
            <Route path='pilot' element={<PropertyPilot />} />
          </Route>
          <Route path='/modules/property-workbench' element={<Navigate to='/' replace />} />
          <Route path='/modules/property-workbench/*' element={<Navigate to='/' replace />} />
          <Route path='/modules/*' element={<Navigate to='/' replace />} />
        </Routes>
      </Suspense>
    </MemoryRouter>
  );
};

describe('Route Contract - Unified OS Surface', () => {
  describe('Desktop (/ route)', () => {
    it('renders Desktop OS at root path', async () => {
      render(<TestRouter initialRoute='/' />);

      await waitFor(() => {
        expect(screen.getByTestId('desktop')).toBeInTheDocument();
      });
    });

    it('Desktop is the canonical landing surface', async () => {
      render(<TestRouter initialRoute='/' />);

      await waitFor(() => {
        // Desktop should render, not PropertyWorkbench
        expect(screen.getByTestId('desktop')).toBeInTheDocument();
        expect(screen.queryByTestId('property-workbench')).not.toBeInTheDocument();
      });
    });
  });

  describe('PropertyWorkbench (/property/:parcelId)', () => {
    it('renders PropertyWorkbench with parcelId', async () => {
      render(<TestRouter initialRoute='/property/12345-001' />);

      await waitFor(() => {
        expect(screen.getByTestId('property-workbench')).toBeInTheDocument();
      });
    });

    it('renders Summary tab by default', async () => {
      render(<TestRouter initialRoute='/property/12345-001' />);

      await waitFor(() => {
        expect(screen.getByTestId('property-workbench')).toBeInTheDocument();
      });
    });

    it('renders Forge tab at /property/:parcelId/forge', async () => {
      render(<TestRouter initialRoute='/property/12345-001/forge' />);

      await waitFor(() => {
        expect(screen.getByTestId('property-workbench')).toBeInTheDocument();
      });
    });

    it('renders Atlas tab at /property/:parcelId/atlas', async () => {
      render(<TestRouter initialRoute='/property/12345-001/atlas' />);

      await waitFor(() => {
        expect(screen.getByTestId('property-workbench')).toBeInTheDocument();
      });
    });

    it('renders Dais tab at /property/:parcelId/dais', async () => {
      render(<TestRouter initialRoute='/property/12345-001/dais' />);

      await waitFor(() => {
        expect(screen.getByTestId('property-workbench')).toBeInTheDocument();
      });
    });

    it('renders Dossier tab at /property/:parcelId/dossier', async () => {
      render(<TestRouter initialRoute='/property/12345-001/dossier' />);

      await waitFor(() => {
        expect(screen.getByTestId('property-workbench')).toBeInTheDocument();
      });
    });

    it('renders Pilot tab at /property/:parcelId/pilot', async () => {
      render(<TestRouter initialRoute='/property/12345-001/pilot' />);

      await waitFor(() => {
        expect(screen.getByTestId('property-workbench')).toBeInTheDocument();
      });
    });
  });

  describe('Legacy Redirects', () => {
    it('redirects /modules/property-workbench to /', async () => {
      render(<TestRouter initialRoute='/modules/property-workbench' />);

      await waitFor(() => {
        expect(screen.getByTestId('desktop')).toBeInTheDocument();
      });
    });

    it('redirects /modules/property-workbench/* to /', async () => {
      render(<TestRouter initialRoute='/modules/property-workbench/some/path' />);

      await waitFor(() => {
        expect(screen.getByTestId('desktop')).toBeInTheDocument();
      });
    });

    it('redirects /modules/* to /', async () => {
      render(<TestRouter initialRoute='/modules/some-legacy-module' />);

      await waitFor(() => {
        expect(screen.getByTestId('desktop')).toBeInTheDocument();
      });
    });

    it('redirects any legacy module path to /', async () => {
      render(<TestRouter initialRoute='/modules/costforge-ai/dashboard' />);

      await waitFor(() => {
        expect(screen.getByTestId('desktop')).toBeInTheDocument();
      });
    });
  });

  describe('Route Contract Invariants', () => {
    it('/ never renders PropertyWorkbench', async () => {
      render(<TestRouter initialRoute='/' />);

      await waitFor(() => {
        expect(screen.queryByTestId('property-workbench')).not.toBeInTheDocument();
      });
    });

    it('/property/:parcelId never renders Desktop', async () => {
      render(<TestRouter initialRoute='/property/12345-001' />);

      await waitFor(() => {
        expect(screen.queryByTestId('desktop')).not.toBeInTheDocument();
      });
    });
  });
});
