/**
 * ForgeSuiteHome — Module List Contract Test
 *
 * These tests are a FREEZE GUARD. They will FAIL if anyone edits the
 * PRIMARY_MODULES or SECONDARY_MODULES arrays to the wrong apps.
 *
 * If this test fails: restore the file, don't edit the test.
 *   git checkout 8da26658a -- frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx
 *
 * Verified correct layout (2026-04-09 screenshot):
 *   PRIMARY   : costforge, comps-forge, income-forge (queued)
 *   SPECIALIST: statistics-studio, batch-cost-run,
 *               regression-studio (queued), terra-gama (queued), coefficient-preview (queued)
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
  it('renders the three primary approach cards', () => {
    renderForge();
    expect(screen.getByText('CostForge')).toBeInTheDocument();
    expect(screen.getByText('CompsForge')).toBeInTheDocument();
    expect(screen.getByText('IncomeForge')).toBeInTheDocument();
  });

  it('renders Statistics Studio and Batch Cost Runs as specialist apps', () => {
    renderForge();
    expect(screen.getByText('Statistics Studio')).toBeInTheDocument();
    expect(screen.getByText('Batch Cost Runs')).toBeInTheDocument();
  });

  it('renders the three queued specialist apps', () => {
    renderForge();
    expect(screen.getByText('Regression Studio')).toBeInTheDocument();
    expect(screen.getByText('TerraGAMA')).toBeInTheDocument();
    expect(screen.getByText('Coefficient Preview')).toBeInTheDocument();
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

  it('primary section has exactly 3 cards', () => {
    renderForge();
    const primarySection = screen.getByTestId('forge-primary-applications');
    const cards = primarySection.querySelectorAll('button.forge-card');
    expect(cards).toHaveLength(3);
  });

  it('specialist section has exactly 5 cards', () => {
    renderForge();
    const secondarySection = screen.getByTestId('forge-secondary-applications');
    const cards = secondarySection.querySelectorAll('button.forge-card');
    expect(cards).toHaveLength(5);
  });
});
