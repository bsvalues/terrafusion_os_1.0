/**
 * ForgeSuiteHome — Module List Contract Test
 *
 * These tests are a FREEZE GUARD. They will FAIL if anyone edits the
 * PRIMARY_MODULES array to the wrong apps.
 *
 * If this test fails: restore the file, don't edit the test.
 *   git checkout 8da26658a -- frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx
 *
 * Verified correct layout (2026-04-19 update):
 *   PRIMARY   : costforge, comps-forge, income-forge (queued), sales-forge
 *   GIS       : geo-forge (GeoForge — replaces queued specialist apps)
 *
 * NOTE: Secondary/specialist section removed 2026-04-19. GeoForge covers
 *       the analytics previously listed as queued specialist apps.
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ForgeSuiteHome from '../ForgeSuiteHome';

// ── Minimal mocks ──────────────────────────────────────────────────────────

vi.mock('../../../hooks/useCountyStats', () => ({
  useCountyStats: () => ({
    stats: null,
    loading: false,
    error: null,
    source: null,
    sourceDisclosure: null,
  }),
}));

vi.mock('../../../stores/propertyStore', () => ({
  usePropertyStore: (sel: (s: unknown) => unknown) =>
    sel({ activeParcel: null, recentParcels: [] }),
}));

vi.mock('../../../orchestration/moduleActivation', () => ({
  activateModule: vi.fn(),
}));

vi.mock('../../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => null,
}));

vi.mock('../SaleQualificationQueue', () => ({
  SaleQualificationQueue: () => null,
}));

vi.mock('../RatioStudyPanel', () => ({
  RatioStudyPanel: () => null,
}));

vi.mock('../CompsPoolBrowser', () => ({
  CompsPoolBrowser: () => null,
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function renderForge() {
  return render(
    <MemoryRouter>
      <ForgeSuiteHome />
    </MemoryRouter>,
  );
}

// ── Contract tests ─────────────────────────────────────────────────────────

describe('ForgeSuiteHome — frozen module list', () => {
  it('renders the four primary approach cards', () => {
    renderForge();
    expect(screen.getByText('CostForge')).toBeInTheDocument();
    expect(screen.getByText('CompsForge')).toBeInTheDocument();
    expect(screen.getByText('IncomeForge')).toBeInTheDocument();
    expect(screen.getByText('SalesForge')).toBeInTheDocument();
  });

  it('renders GeoForge in the GIS section', () => {
    renderForge();
    expect(screen.getByText('GeoForge')).toBeInTheDocument();
    const gisSection = screen.getByTestId('forge-gis-applications');
    expect(gisSection).toBeInTheDocument();
  });

  it('does NOT render removed specialist apps', () => {
    renderForge();
    expect(screen.queryByText('Regression Studio')).not.toBeInTheDocument();
    expect(screen.queryByText('TerraGAMA')).not.toBeInTheDocument();
    expect(screen.queryByText('Coefficient Preview')).not.toBeInTheDocument();
  });

  it('does NOT render fabricated apps that were never in v1 scope', () => {
    renderForge();
    // These appeared in bad merges — must never come back
    expect(screen.queryByText('Income Valuation')).not.toBeInTheDocument();
    expect(screen.queryByText('Comparable Sales')).not.toBeInTheDocument();
    expect(screen.queryByText('Reconciliation')).not.toBeInTheDocument();
    expect(screen.queryByText('Value Audit')).not.toBeInTheDocument();
    expect(screen.queryByText('Governed Run')).not.toBeInTheDocument();
    expect(screen.queryByText('Cost Manual')).not.toBeInTheDocument();
    expect(screen.queryByText('Value Audit Log')).not.toBeInTheDocument();
    expect(screen.queryByText('Appeals')).not.toBeInTheDocument();
  });

  it('IncomeForge button is disabled (queued)', () => {
    renderForge();
    const incomeBtn = screen.getByText('IncomeForge').closest('button');
    expect(incomeBtn).toBeDisabled();
  });

  it('CostForge and CompsForge buttons are enabled', () => {
    renderForge();
    const costBtn = screen.getByText('CostForge').closest('button');
    const compsBtn = screen.getByText('CompsForge').closest('button');
    expect(costBtn).not.toBeDisabled();
    expect(compsBtn).not.toBeDisabled();
  });

  it('all KPI values show — (never fake numbers)', () => {
    renderForge();
    const kpiSection = screen.getByTestId('forge-stats');
    const values = kpiSection.querySelectorAll('[class*="forge-kpi-cell__value"]');
    values.forEach((cell) => {
      expect(cell.textContent).toBe('—');
    });
  });

  it('primary section has exactly 4 cards', () => {
    renderForge();
    const primarySection = screen.getByTestId('forge-primary-applications');
    const cards = primarySection.querySelectorAll('button.forge-card');
    expect(cards).toHaveLength(4);
  });

  it('GIS section has exactly 1 card (GeoForge)', () => {
    renderForge();
    const gisSection = screen.getByTestId('forge-gis-applications');
    const cards = gisSection.querySelectorAll('button.forge-card');
    expect(cards).toHaveLength(1);
  });

  it('renders County Studio in the county-operations section', () => {
    renderForge();
    const countySection = screen.getByTestId('forge-county-applications');
    expect(countySection).toBeInTheDocument();
    expect(screen.getByText('County Studio')).toBeInTheDocument();
  });
});
