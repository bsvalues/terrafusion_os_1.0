/**
 * forgeSuiteHome.contract.test.tsx
 *
 * REGRESSION LOCK — TerraForge Suite Home taxonomy contract.
 *
 * This test file exists because the legacy card matrix has crawled back from
 * the dead twice. Every test here is a tombstone. If you're reading this
 * because a test failed, the zombie is back. Find the wrong component source
 * and kill it again.
 *
 * Locked taxonomy (June 10 TerraForge canonical inventory):
 *   PRIMARY:   CostForge · CompsForge · SalesForge · IncomeForge ·
 *              Reconciliation · Calibration / QC · CAMA Characteristics ·
 *              Valuation Notes / Defensibility
 *   SUPPORT:   Batch Cost Runs · Regression Studio · County Studio ·
 *              Coefficient Preview · Current-use Support
 *   QUEUE:     SaleQualificationQueue (the only panel surface)
 *
 * BANNED from suite home:
 *   - Governed Run, Cost Manual, Value Audit Log (reference/legacy cards)
 *   - ComparableSales, Reconciliation, Appeals, Value Audit (workbench openers)
 *   - RatioStudyPanel (removed surface)
 *   - "Parcel adapters, references, and planned scenes" heading
 *   - Any card that opens a property workbench from suite home
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTerraForgeCanonicalInventory } from '../../pages/suites/terraforgeCanonicalInventory';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => ({
    stats: null,
    loading: false,
    error: null,
    sourceDisclosure: null,
  }),
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector?: (s: unknown) => unknown) => {
    const state = { recentParcels: [] as unknown[], activeParcel: null };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: vi.fn(),
}));

vi.mock('../../pages/suites/SaleQualificationQueue', () => ({
  SaleQualificationQueue: () => (
    <div data-testid="mock-sale-qualification-queue" />
  ),
}));

vi.mock('../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => null,
}));

// CompsPoolBrowser is imported from './CompsPoolBrowser' in ForgeSuiteHome —
// rendered in Slice 1.6. Mock to null so it doesn't surface "/comps pool/i" text.
vi.mock('../../pages/suites/CompsPoolBrowser', () => ({
  CompsPoolBrowser: () => null,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

async function renderForgeSuiteHome() {
  const { default: ForgeSuiteHome } = await import(
    '../../pages/suites/ForgeSuiteHome'
  );
  return render(
    <MemoryRouter>
      <ForgeSuiteHome />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TerraForge suite home — taxonomy contract', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // ── Primary tier ────────────────────────────────────────────────────────────

  it('renders every June 10 primary capability', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    const cards = within(primary).getAllByRole('button');
    expect(cards).toHaveLength(8);
  });

  it('renders CostForge in the primary tier', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    expect(within(primary).getByText('CostForge')).toBeDefined();
  });

  it('renders CompsForge in the primary tier', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    expect(within(primary).getByText('CompsForge')).toBeDefined();
  });

  it('renders IncomeForge in the primary tier', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    expect(within(primary).getByText('IncomeForge')).toBeDefined();
  });

  it('renders SalesForge in the primary tier', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    expect(within(primary).getByText('SalesForge')).toBeDefined();
  });

  it('renders Reconciliation, Calibration / QC, CAMA Characteristics, and Valuation Notes as primary capability lanes', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');

    expect(within(primary).getByText('Reconciliation')).toBeDefined();
    expect(within(primary).getByText('Calibration / QC')).toBeDefined();
    expect(within(primary).getByText('CAMA Characteristics')).toBeDefined();
    expect(within(primary).getByText('Valuation Notes / Defensibility')).toBeDefined();
  });

  // ── Support / deferred tier ────────────────────────────────────────────────

  it('renders exactly five support/deferred tools outside primary proof', async () => {
    await renderForgeSuiteHome();
    const support = screen.getByTestId('forge-support-applications');
    const cards = within(support).getAllByRole('button');
    expect(cards).toHaveLength(5);
  });

  it('does not render Statistics Studio or TerraGAMA in support/deferred tools', async () => {
    await renderForgeSuiteHome();
    const support = screen.getByTestId('forge-support-applications');
    expect(within(support).queryByText('Statistics Studio')).toBeNull();
    expect(within(support).queryByText('TerraGAMA')).toBeNull();
    expect(within(support).queryByText(/legacy specialist/i)).toBeNull();
  });

  it('renders Batch Cost Runs in the support/deferred tier', async () => {
    await renderForgeSuiteHome();
    const support = screen.getByTestId('forge-support-applications');
    expect(within(support).getByText('Batch Cost Runs')).toBeDefined();
  });

  it('renders Regression Studio in the support/deferred tier', async () => {
    await renderForgeSuiteHome();
    const support = screen.getByTestId('forge-support-applications');
    expect(within(support).getByText('Regression Studio')).toBeDefined();
  });

  it('renders County Studio, Coefficient Preview, and Current-use Support in the support/deferred tier', async () => {
    await renderForgeSuiteHome();
    const support = screen.getByTestId('forge-support-applications');
    expect(within(support).getByText('County Studio')).toBeDefined();
    expect(within(support).getByText('Coefficient Preview')).toBeDefined();
    expect(within(support).getByText('Current-use Support')).toBeDefined();
  });

  it('matches the canonical inventory labels rendered on /forge', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    const support = screen.getByTestId('forge-support-applications');

    for (const capability of getTerraForgeCanonicalInventory()) {
      const surface = capability.tier === 'primary' ? primary : support;
      expect(within(surface).getByText(capability.label)).toBeDefined();
    }
  });

  // ── Queue / panel surface ───────────────────────────────────────────────────

  it('renders SaleQualificationQueue as the only panel surface', async () => {
    await renderForgeSuiteHome();
    expect(screen.getByTestId('mock-sale-qualification-queue')).toBeDefined();
  });

  // ── Banned cards (legacy resurrection tests) ────────────────────────────────

  it('BANNED: does not render Governed Run', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Governed Run')).toBeNull();
  });

  it('BANNED: does not render Cost Manual card on suite home', async () => {
    await renderForgeSuiteHome();
    // Cost Manual is a standalone page — it must not appear as a suite home card
    expect(screen.queryByText('Cost Manual')).toBeNull();
  });

  it('BANNED: does not render Value Audit Log', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Value Audit Log')).toBeNull();
  });

  it('BANNED: does not render ComparableSales as a standalone card', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Comparable Sales')).toBeNull();
  });

  it('renders Reconciliation only as a primary canonical lane, not as a workbench-opener card', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    expect(within(primary).getByText('Reconciliation')).toBeDefined();
    expect(screen.queryByText('Open Property Workbench')).toBeNull();
  });

  it('BANNED: does not render Appeals card', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Appeals')).toBeNull();
  });

  it('BANNED: does not render Value Audit card', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Value Audit')).toBeNull();
  });

  it('BANNED: does not render the legacy "Parcel adapters, references, and planned scenes" section heading', async () => {
    await renderForgeSuiteHome();
    expect(
      screen.queryByText(/parcel adapters, references, and planned scenes/i)
    ).toBeNull();
  });

  it('BANNED: does not render RatioStudyPanel', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText(/ratio study/i)).toBeNull();
  });

  it('BANNED: does not render CompsPoolBrowser as a suite proof card', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    const support = screen.getByTestId('forge-support-applications');

    expect(within(primary).queryByText(/comps pool/i)).toBeNull();
    expect(within(support).queryByText(/comps pool/i)).toBeNull();
  });

  // ── Wrong-suite items ───────────────────────────────────────────────────────

  it('BANNED: does not render Income Valuation as a workbench-opener card (belongs in primary as IncomeForge)', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Income Valuation')).toBeNull();
  });
});
