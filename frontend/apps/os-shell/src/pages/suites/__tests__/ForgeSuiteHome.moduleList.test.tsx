/**
 * ForgeSuiteHome — Module List Contract Test
 *
 * These tests are a FREEZE GUARD. They will FAIL if anyone edits the
 * PRIMARY_MODULES array to the wrong apps.
 *
 * Verified correct layout (current HEAD):
 *   PRIMARY   : CostForge, CompsForge, IncomeForge, SalesForge, CUForge
 *   SECONDARY : Batch Cost Runs, Regression Studio (queued),
 *               TerraGAMA (queued), Coefficient Preview (queued)
 *   COUNTY    : County Studio (default analytics workbench + VEI exploration)
 *
 * GeoForge and Atlas Live View are not launcher products. Atlas is County
 * Studio's embedded/pop-out spatial surface; GeoForge is internal compatibility
 * infrastructure until retired.
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
  it('renders the five primary approach cards', () => {
    renderForge();
    expect(screen.getByText('CostForge')).toBeInTheDocument();
    expect(screen.getByText('CompsForge')).toBeInTheDocument();
    expect(screen.getByText('IncomeForge')).toBeInTheDocument();
    expect(screen.getByText('SalesForge')).toBeInTheDocument();
    expect(screen.getByText('CUForge')).toBeInTheDocument();
  });

  it('does not expose GeoForge or standalone Atlas as launcher products', () => {
    renderForge();
    expect(screen.queryByTestId('forge-gis-applications')).not.toBeInTheDocument();
    expect(screen.queryByText('GeoForge')).not.toBeInTheDocument();
    expect(screen.queryByText('Atlas Live View')).not.toBeInTheDocument();
  });

  it('does not expose Statistics Studio after County Studio owns the analytics workflow', () => {
    renderForge();
    const secondarySection = screen.getByTestId('forge-secondary-applications');
    expect(secondarySection).not.toHaveTextContent('Statistics Studio');
    expect(secondarySection).not.toHaveTextContent(/legacy specialist/i);
  });

  it('renders queued specialist apps in the secondary section', () => {
    // Regression Studio, TerraGAMA, Coefficient Preview are present as queued
    // secondary modules in the frozen component. They are disabled (truthState: 'queued').
    renderForge();
    expect(screen.getByText('Regression Studio')).toBeInTheDocument();
    expect(screen.getByText('TerraGAMA')).toBeInTheDocument();
    expect(screen.getByText('Coefficient Preview')).toBeInTheDocument();
    // All three must be disabled (queued state)
    expect(screen.getByText('Regression Studio').closest('button')).toBeDisabled();
    expect(screen.getByText('TerraGAMA').closest('button')).toBeDisabled();
    expect(screen.getByText('Coefficient Preview').closest('button')).toBeDisabled();
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

  it('IncomeForge button is enabled as a live standalone module', () => {
    renderForge();
    const incomeBtn = screen.getByText('IncomeForge').closest('button');
    expect(incomeBtn).not.toBeDisabled();
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

  it('primary section has exactly 5 cards', () => {
    renderForge();
    const primarySection = screen.getByTestId('forge-primary-applications');
    const cards = primarySection.querySelectorAll('button.forge-card');
    expect(cards).toHaveLength(5);
  });

  it('renders County Studio in the county-operations section', () => {
    renderForge();
    const countySection = screen.getByTestId('forge-county-applications');
    expect(countySection).toBeInTheDocument();
    expect(screen.getByText('County Studio')).toBeInTheDocument();
    expect(screen.getByText('Default analytics workbench')).toBeInTheDocument();
    expect(screen.getByText(/Operational Health, Statistics Compat/i)).toBeInTheDocument();
    expect(screen.getByText(/embedded spatial review/i)).toBeInTheDocument();
    expect(screen.getByText(/governed approval and publish remain downstream/i)).toBeInTheDocument();
  });
});
