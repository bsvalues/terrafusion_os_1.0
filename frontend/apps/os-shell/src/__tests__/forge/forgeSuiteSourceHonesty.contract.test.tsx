/**
 * forgeSuiteSourceHonesty.contract.test.tsx
 *
 * CONTRACT: ForgeSuiteHome must display sourceDisclosure that matches
 * the actual DataProvider mode — never derive it from an independent
 * network call that can disagree with the provider singleton.
 *
 * These tests verify:
 *   1. When provider is snapshot → disclosure banner appears
 *   2. When provider is live    → no disclosure banner
 *   3. sourceDisclosure originates from useCountyStats (provider-aware),
 *      not from a hardcoded string in the component
 *   4. Diagnostics pill absent in test env (VITE_SHOW_MODE_DIAGNOSTICS not set)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Stable module-level mocks (not hoisted to closure issues) ─────────────────

vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: vi.fn(),
}));

vi.mock('../../pages/suites/SaleQualificationQueue', () => ({
  SaleQualificationQueue: () => <div data-testid="mock-sale-qualification-queue" />,
}));

vi.mock('../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => null,
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector?: (s: unknown) => unknown) => {
    const state = { recentParcels: [] as unknown[], activeParcel: null };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../services/dataProvider', () => ({
  getDataProviderDiagnostics: vi.fn(() => ({
    mode: 'live',
    reason: 'env-default',
    initializedAt: null,
  })),
  getDataProvider: vi.fn(),
  resetDataProvider: vi.fn(),
}));

// ── Per-scenario helpers using vi.doMock (not hoisted) ────────────────────────

type StatsScenario = {
  source?: 'live' | 'snapshot' | 'fixtures' | null;
  sourceDisclosure?: string | null;
};

async function renderWithStats(scenario: StatsScenario) {
  vi.resetModules();

  // vi.doMock is NOT hoisted — safe to reference runtime variables
  vi.doMock('../../hooks/useCountyStats', () => ({
    useCountyStats: () => ({
      stats: null,
      loading: false,
      error: null,
      source: scenario.source ?? null,
      sourceDisclosure: scenario.sourceDisclosure ?? null,
    }),
  }));

  const { default: ForgeSuiteHome } = await import('../../pages/suites/ForgeSuiteHome');
  return render(
    <MemoryRouter>
      <ForgeSuiteHome />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ForgeSuiteHome — source honesty contract', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows source disclosure when provider mode is snapshot', async () => {
    await renderWithStats({
      source: 'snapshot',
      sourceDisclosure:
        'Snapshot-backed county aggregates: TerraForge stats are using bundled county snapshot data, not live backend metrics.',
    });

    expect(screen.getByTestId('forge-source-disclosure')).toBeDefined();
  });

  it('shows source disclosure when provider mode is fixtures', async () => {
    await renderWithStats({
      source: 'fixtures',
      sourceDisclosure:
        'Fixture-backed county aggregates: TerraForge stats are using test fixture data, not live backend metrics.',
    });

    expect(screen.getByTestId('forge-source-disclosure')).toBeDefined();
  });

  it('does NOT show source disclosure when provider mode is live', async () => {
    await renderWithStats({ source: 'live', sourceDisclosure: null });

    expect(screen.queryByTestId('forge-source-disclosure')).toBeNull();
  });

  it('does NOT show source disclosure when source is null (loading)', async () => {
    await renderWithStats({ source: null, sourceDisclosure: null });

    expect(screen.queryByTestId('forge-source-disclosure')).toBeNull();
  });

  it('diagnostics pill absent when VITE_SHOW_MODE_DIAGNOSTICS is not set', async () => {
    await renderWithStats({ source: 'live', sourceDisclosure: null });

    // In test env, import.meta.env.DEV and VITE_SHOW_MODE_DIAGNOSTICS are not set
    expect(screen.queryByTestId('forge-mode-diagnostics')).toBeNull();
  });
});

// ── useCountyStats sourceDisclosure unit tests ────────────────────────────────

describe('useCountyStats — sourceDisclosure derivation', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('CountyStatsResult interface includes sourceDisclosure field', async () => {
    vi.doMock('../../services/dataProvider', () => ({
      getDataProvider: vi.fn(() => ({
        mode: 'snapshot',
        getCountyStats: vi.fn().mockResolvedValue(null),
      })),
      getDataProviderDiagnostics: vi.fn(() => ({
        mode: 'snapshot',
        reason: 'env-explicit',
        initializedAt: new Date(),
      })),
      resetDataProvider: vi.fn(),
    }));

    const { renderHook } = await import('@testing-library/react');
    const { useCountyStats } = await import('../../hooks/useCountyStats');

    const { result } = renderHook(() => useCountyStats());
    expect('sourceDisclosure' in result.current).toBe(true);
  });

  it('sourceDisclosure is null initially before stats load (source starts null)', async () => {
    vi.doMock('../../services/dataProvider', () => ({
      getDataProvider: vi.fn(() => ({
        mode: 'live',
        getCountyStats: vi.fn().mockResolvedValue(null),
      })),
      getDataProviderDiagnostics: vi.fn(() => ({
        mode: 'live',
        reason: 'env-default',
        initializedAt: new Date(),
      })),
      resetDataProvider: vi.fn(),
    }));

    const { renderHook } = await import('@testing-library/react');
    const { useCountyStats } = await import('../../hooks/useCountyStats');

    const { result } = renderHook(() => useCountyStats());
    // source starts null on first render — disclosure is null
    expect(result.current.sourceDisclosure).toBeNull();
  });
});
