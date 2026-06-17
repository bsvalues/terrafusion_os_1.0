/**
 * ForgeSuiteHome — Module List Contract Test
 *
 * These tests are a FREEZE GUARD. They will FAIL if anyone drifts /forge away
 * from the June 10 TerraForge canonical inventory.
 *
 * Canonical layout:
 *   PRIMARY : CostForge, CompsForge, SalesForge, IncomeForge, Reconciliation,
 *             Calibration / QC, CAMA Characteristics,
 *             Valuation Notes / Defensibility
 *   SUPPORT : Batch Cost Runs, Regression Studio, County Studio,
 *             Coefficient Preview, Current-use Support
 *
 * GeoForge and Atlas Live View are not launcher products. Atlas is County
 * Studio's embedded/pop-out spatial surface; GeoForge is internal compatibility
 * infrastructure until retired.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ForgeSuiteHome from '../ForgeSuiteHome';
import { getTerraForgeCanonicalInventory } from '../terraforgeCanonicalInventory';

const activateModuleMock = vi.hoisted(() => vi.fn());

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
  activateModule: activateModuleMock,
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
  beforeEach(() => {
    activateModuleMock.mockClear();
  });

  it('renders every June 10 primary capability card', () => {
    renderForge();
    const primarySection = screen.getByTestId('forge-primary-applications');
    const primaryLabels = getTerraForgeCanonicalInventory()
      .filter((capability) => capability.tier === 'primary')
      .map((capability) => capability.label);

    expect(within(primarySection).getAllByRole('button')).toHaveLength(8);
    for (const label of primaryLabels) {
      expect(within(primarySection).getByText(label)).toBeInTheDocument();
    }
  });

  it('does not expose GeoForge or standalone Atlas as launcher products', () => {
    renderForge();
    expect(screen.queryByTestId('forge-gis-applications')).not.toBeInTheDocument();
    expect(screen.queryByText('GeoForge')).not.toBeInTheDocument();
    expect(screen.queryByText('Atlas Live View')).not.toBeInTheDocument();
  });

  it('does not expose Statistics Studio or TerraGAMA after canon reclassification', () => {
    renderForge();
    const supportSection = screen.getByTestId('forge-support-applications');
    expect(supportSection).not.toHaveTextContent('Statistics Studio');
    expect(supportSection).not.toHaveTextContent('TerraGAMA');
    expect(supportSection).not.toHaveTextContent(/legacy specialist/i);
  });

  it('renders support and deferred tools outside primary suite proof', () => {
    renderForge();
    const supportSection = screen.getByTestId('forge-support-applications');
    const supportLabels = getTerraForgeCanonicalInventory()
      .filter((capability) => capability.tier !== 'primary')
      .map((capability) => capability.label);

    expect(within(supportSection).getAllByRole('button')).toHaveLength(5);
    for (const label of supportLabels) {
      expect(within(supportSection).getByText(label)).toBeInTheDocument();
    }
    expect(within(supportSection).getByText('County Studio').closest('button')).not.toBeDisabled();
    expect(within(supportSection).getByText('Regression Studio').closest('button')).toBeDisabled();
    expect(within(supportSection).getByText('Coefficient Preview').closest('button')).toBeDisabled();
  });

  it('does NOT render fabricated apps that were never in v1 scope', () => {
    renderForge();
    // These appeared in bad merges — must never come back
    expect(screen.queryByText('Income Valuation')).not.toBeInTheDocument();
    expect(screen.queryByText('Comparable Sales')).not.toBeInTheDocument();
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

  it('CompsForge launches the suite-level module, not parcel-scoped Workbench Forge', () => {
    renderForge();

    fireEvent.click(screen.getByText('CompsForge').closest('button')!);

    expect(activateModuleMock).toHaveBeenCalledWith('comps-forge', {
      source: 'system',
      metadata: expect.objectContaining({
        launchContext: 'terraforge-suite',
        runtimePath: 'compsforge-comps-pool',
      }),
    });
    expect(activateModuleMock).not.toHaveBeenCalledWith(
      'property-workbench',
      expect.anything(),
    );
  });

  it('runtime KPI strip does not show frozen fake county rollup numbers', () => {
    renderForge();
    const kpiSection = screen.getByTestId('forge-stats');
    expect(kpiSection).toHaveTextContent('SALE QUEUE');
    expect(kpiSection).toHaveTextContent('COMPS POOL');
    expect(kpiSection).toHaveTextContent('COST MATRIX');
    expect(kpiSection).toHaveTextContent('INCOME REFS');
    expect(kpiSection).toHaveTextContent('COUNTY ROLLUP');
    expect(kpiSection).not.toHaveTextContent('128,784');
    expect(kpiSection).not.toHaveTextContent('$469,565');
  });

  it('primary section has exactly 8 cards', () => {
    renderForge();
    const primarySection = screen.getByTestId('forge-primary-applications');
    const cards = primarySection.querySelectorAll('button.forge-card');
    expect(cards).toHaveLength(8);
  });

  it('renders County Studio as support, not primary TerraForge proof', () => {
    renderForge();
    const primarySection = screen.getByTestId('forge-primary-applications');
    const supportSection = screen.getByTestId('forge-support-applications');
    expect(within(primarySection).queryByText('County Studio')).not.toBeInTheDocument();
    expect(within(supportSection).getByText('County Studio')).toBeInTheDocument();
    expect(within(supportSection).getByText(/Countywide support workspace/i)).toBeInTheDocument();
  });
});
