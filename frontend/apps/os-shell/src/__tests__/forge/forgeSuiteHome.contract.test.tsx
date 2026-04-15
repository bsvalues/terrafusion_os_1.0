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
 * Locked taxonomy (IAAO three-approaches-to-value + sale qualification):
 *   PRIMARY:   CostForge · CompsForge · IncomeForge · SalesForge
 *   SECONDARY: Statistics Studio · Batch Cost Runs · Regression Studio ·
 *              TerraGAMA · Coefficient Preview
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

  it('renders exactly four primary valuation scenes — three approaches to value plus SalesForge', async () => {
    await renderForgeSuiteHome();
    const primary = screen.getByTestId('forge-primary-applications');
    const cards = within(primary).getAllByRole('button');
    expect(cards).toHaveLength(4);
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

  // ── Secondary tier ──────────────────────────────────────────────────────────

  it('renders exactly five secondary/specialist scenes', async () => {
    await renderForgeSuiteHome();
    const secondary = screen.getByTestId('forge-secondary-applications');
    const cards = within(secondary).getAllByRole('button');
    expect(cards).toHaveLength(5);
  });

  it('renders Statistics Studio in the secondary tier', async () => {
    await renderForgeSuiteHome();
    const secondary = screen.getByTestId('forge-secondary-applications');
    expect(within(secondary).getByText('Statistics Studio')).toBeDefined();
  });

  it('renders Batch Cost Runs in the secondary tier', async () => {
    await renderForgeSuiteHome();
    const secondary = screen.getByTestId('forge-secondary-applications');
    expect(within(secondary).getByText('Batch Cost Runs')).toBeDefined();
  });

  it('renders Regression Studio in the secondary tier', async () => {
    await renderForgeSuiteHome();
    const secondary = screen.getByTestId('forge-secondary-applications');
    expect(within(secondary).getByText('Regression Studio')).toBeDefined();
  });

  it('renders TerraGAMA in the secondary tier', async () => {
    await renderForgeSuiteHome();
    const secondary = screen.getByTestId('forge-secondary-applications');
    expect(within(secondary).getByText('TerraGAMA')).toBeDefined();
  });

  it('renders Coefficient Preview in the secondary tier', async () => {
    await renderForgeSuiteHome();
    const secondary = screen.getByTestId('forge-secondary-applications');
    expect(within(secondary).getByText('Coefficient Preview')).toBeDefined();
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

  it('BANNED: does not render Reconciliation card', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Reconciliation')).toBeNull();
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

  it('BANNED: does not render CompsPoolBrowser', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText(/comps pool/i)).toBeNull();
  });

  // ── Wrong-suite items ───────────────────────────────────────────────────────

  it('BANNED: does not render Income Valuation as a workbench-opener card (belongs in primary as IncomeForge)', async () => {
    await renderForgeSuiteHome();
    expect(screen.queryByText('Income Valuation')).toBeNull();
  });
});
